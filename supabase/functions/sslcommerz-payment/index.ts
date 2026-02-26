import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SSLCOMMERZ_SANDBOX_URL = "https://sandbox.sslcommerz.com";
const SSLCOMMERZ_LIVE_URL = "https://securepay.sslcommerz.com";

const ENCRYPTION_PREFIX = "enc:";

async function decryptCredential(encryptedText: string): Promise<string> {
  if (!encryptedText || encryptedText.trim() === "") return encryptedText;
  if (!encryptedText.startsWith(ENCRYPTION_PREFIX)) return encryptedText;

  const encryptionKey = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY");
  if (!encryptionKey) return "";

  try {
    const base64 = encryptedText.slice(ENCRYPTION_PREFIX.length);
    const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return "";
  }
}

// Get frontend redirect URL
function getAppUrl(): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  // Try to use a configured frontend URL, fallback to preview
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || "";
  return `https://id-preview--${projectId}.lovable.app`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const urlAction = url.searchParams.get("action");

    // Handle GET callbacks from SSLCommerz (success/fail/cancel/ipn)
    if (urlAction && (req.method === "GET" || req.method === "POST")) {
      return await handleCallback(req, supabase, supabaseUrl, urlAction);
    }

    // Handle JSON API calls
    const body = await req.json();
    const { action, orderId, provider_id } = body;

    if (action === "init") {
      return await handleInit(supabase, supabaseUrl, orderId, provider_id);
    }

    if (action === "validate") {
      return await handleValidate(supabase, body.val_id, provider_id);
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("SSLCommerz error:", error);
    return new Response(
      JSON.stringify({ error: "Payment processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function getProviderConfig(supabase: any, providerId?: string) {
  let query = supabase
    .from("payment_providers")
    .select("*")
    .eq("provider_type", "sslcommerz")
    .eq("is_active", true);

  if (providerId) {
    query = supabase.from("payment_providers").select("*").eq("id", providerId);
  }

  const { data: provider } = await query.single();
  if (!provider) throw new Error("SSLCommerz not configured");

  const storeId = provider.store_id
    ? await decryptCredential(provider.store_id)
    : provider.is_sandbox ? "testbox" : "";
  const storePass = provider.store_password
    ? await decryptCredential(provider.store_password)
    : provider.is_sandbox ? "qwerty" : "";

  const baseUrl = provider.is_sandbox ? SSLCOMMERZ_SANDBOX_URL : SSLCOMMERZ_LIVE_URL;
  return { storeId, storePass, baseUrl, provider };
}

async function handleInit(supabase: any, supabaseUrl: string, orderId: string, providerId?: string) {
  if (!orderId) {
    return new Response(
      JSON.stringify({ error: "Order ID required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { storeId, storePass, baseUrl } = await getProviderConfig(supabase, providerId);

  if (!storeId || !storePass) {
    return new Response(
      JSON.stringify({ error: "Store credentials not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get order with SERVER-VERIFIED total
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, address:addresses(*), order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return new Response(
      JSON.stringify({ error: "Order not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Prevent duplicate payment for already paid orders
  if (order.status !== "pending") {
    return new Response(
      JSON.stringify({ error: "Order already processed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const callbackBase = `${supabaseUrl}/functions/v1/sslcommerz-payment`;

  const postData = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePass,
    total_amount: String(order.total), // Always use server-side total
    currency: "BDT",
    tran_id: order.order_number,
    success_url: `${callbackBase}?action=success`,
    fail_url: `${callbackBase}?action=fail`,
    cancel_url: `${callbackBase}?action=cancel`,
    ipn_url: `${callbackBase}?action=ipn`,
    cus_name: sanitize(order.address?.full_name || "Customer", 100),
    cus_email: sanitize(order.address?.email || "customer@store.com", 100),
    cus_add1: sanitize(order.address?.address_line || "N/A", 200),
    cus_city: sanitize(order.address?.district || "Dhaka", 50),
    cus_country: "Bangladesh",
    cus_phone: sanitize(order.address?.phone || "N/A", 20),
    shipping_method: "Courier",
    product_name: `Order ${order.order_number}`,
    product_category: "General",
    product_profile: "general",
    num_of_item: String(order.order_items?.length || 1),
    value_a: orderId, // Secure: server-side order ID
    value_b: String(order.total), // Store expected amount for verification
  });

  const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: postData.toString(),
  });

  const result = await response.json();

  if (result.status === "SUCCESS") {
    return new Response(
      JSON.stringify({
        success: true,
        gatewayUrl: result.GatewayPageURL,
        sessionKey: result.sessionkey,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: result.failedreason || "Payment initialization failed",
    }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCallback(req: Request, supabase: any, supabaseUrl: string, action: string) {
  const appUrl = getAppUrl();

  try {
    let formData: URLSearchParams;
    if (req.method === "POST") {
      const text = await req.text();
      formData = new URLSearchParams(text);
    } else {
      formData = new URL(req.url).searchParams;
    }

    const tranId = formData.get("tran_id") || "";
    const valId = formData.get("val_id") || "";
    const amount = formData.get("amount") || "";
    const status = formData.get("status") || "";
    const orderId = formData.get("value_a") || "";
    const expectedAmount = formData.get("value_b") || "";

    console.log(`SSLCommerz callback: action=${action}, tran_id=${tranId}, status=${status}`);

    if ((action === "success" || action === "ipn") && (status === "VALID" || status === "VALIDATED")) {
      // CRITICAL: Validate with SSLCommerz Validation API
      const { storeId, storePass, baseUrl } = await getProviderConfig(supabase);

      const validateUrl = `${baseUrl}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePass)}&format=json`;
      const valResponse = await fetch(validateUrl);
      const valResult = await valResponse.json();

      if (valResult.status === "VALID" || valResult.status === "VALIDATED") {
        // CRITICAL: Verify amount matches to prevent partial payment fraud
        const { data: order } = await supabase
          .from("orders")
          .select("total, order_number")
          .eq("id", orderId)
          .single();

        if (order) {
          const paidAmount = parseFloat(valResult.amount || amount);
          const expectedTotal = parseFloat(String(order.total));

          // Allow 1 BDT tolerance for rounding
          if (Math.abs(paidAmount - expectedTotal) > 1) {
            console.error(`Amount mismatch! Paid: ${paidAmount}, Expected: ${expectedTotal}, Order: ${orderId}`);
            // Flag order but don't confirm
            await supabase.from("orders").update({
              notes: `⚠️ AMOUNT MISMATCH: Paid ৳${paidAmount}, Expected ৳${expectedTotal}. Val ID: ${valId}`,
            }).eq("id", orderId);

            return new Response(null, {
              status: 302,
              headers: { Location: `${appUrl}/checkout?error=amount_mismatch` },
            });
          }

          // Verify tran_id matches order_number
          if (valResult.tran_id !== order.order_number) {
            console.error(`Transaction ID mismatch! Got: ${valResult.tran_id}, Expected: ${order.order_number}`);
            return new Response(null, {
              status: 302,
              headers: { Location: `${appUrl}/checkout?error=invalid` },
            });
          }
        }

        // All verification passed - confirm order
        await supabase.from("orders").update({
          status: "confirmed",
          payment_transaction_id: valId,
        }).eq("id", orderId);

        console.log(`Order ${orderId} payment confirmed via SSLCommerz`);
      }

      if (action === "ipn") {
        return new Response("IPN_RECEIVED", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }

      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/order-success?orderId=${orderId}` },
      });
    }

    // Failed or cancelled
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/checkout?error=${action}` },
    });
  } catch (error) {
    console.error("SSLCommerz callback error:", error);
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/checkout?error=processing` },
    });
  }
}

async function handleValidate(supabase: any, valId: string, providerId?: string) {
  if (!valId) {
    return new Response(
      JSON.stringify({ error: "val_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { storeId, storePass, baseUrl } = await getProviderConfig(supabase, providerId);
  const validateUrl = `${baseUrl}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(storePass)}&format=json`;
  const response = await fetch(validateUrl);
  const result = await response.json();

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitize(str: string, maxLen: number): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}
