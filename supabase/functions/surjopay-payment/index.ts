import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SURJOPAY_SANDBOX_URL = "https://sandbox.shurjopayment.com/api";
const SURJOPAY_LIVE_URL = "https://engine.shurjopayment.com/api";
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
      "raw", new TextEncoder().encode(encryptionKey),
      { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch { return ""; }
}

function getAppUrl(): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || "";
  return `https://id-preview--${projectId}.lovable.app`;
}

function sanitize(str: string, maxLen: number): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const appUrl = getAppUrl();

    // Check if this is a return callback (GET with order_id param)
    const url = new URL(req.url);
    if (req.method === "GET" && url.searchParams.has("order_id")) {
      return await handleReturnCallback(supabase, url, appUrl);
    }

    const body = await req.json();
    const { action, orderId, provider_id } = body;

    if (action === "init") {
      return await handleInit(supabase, supabaseUrl, orderId, provider_id, appUrl);
    }

    if (action === "verify") {
      return await handleVerify(supabase, body.sp_order_id, provider_id);
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("SurjoPay error:", error);
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
    .eq("provider_type", "surjopay")
    .eq("is_active", true);

  if (providerId) {
    query = supabase.from("payment_providers").select("*").eq("id", providerId);
  }

  const { data: provider } = await query.single();
  if (!provider) throw new Error("SurjoPay not configured");

  const username = provider.store_id
    ? await decryptCredential(provider.store_id)
    : provider.is_sandbox ? "sp_sandbox" : "";
  const password = provider.store_password
    ? await decryptCredential(provider.store_password)
    : provider.is_sandbox ? "pyaborern" : "";

  const baseUrl = provider.is_sandbox ? SURJOPAY_SANDBOX_URL : SURJOPAY_LIVE_URL;
  return { username, password, baseUrl, provider };
}

async function getToken(baseUrl: string, username: string, password: string) {
  const response = await fetch(`${baseUrl}/get_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const result = await response.json();
  if (!result.token) throw new Error("SurjoPay authentication failed");
  return result;
}

async function handleInit(supabase: any, supabaseUrl: string, orderId: string, providerId?: string, appUrl?: string) {
  if (!orderId) {
    return new Response(
      JSON.stringify({ error: "Order ID required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { username, password, baseUrl } = await getProviderConfig(supabase, providerId);
  const tokenResult = await getToken(baseUrl, username, password);

  // Get order with SERVER total
  const { data: order } = await supabase
    .from("orders")
    .select("*, address:addresses(*)")
    .eq("id", orderId)
    .single();

  if (!order) {
    return new Response(
      JSON.stringify({ error: "Order not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (order.status !== "pending") {
    return new Response(
      JSON.stringify({ error: "Order already processed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const paymentResponse = await fetch(tokenResult.execute_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${tokenResult.token_type} ${tokenResult.token}`,
    },
    body: JSON.stringify({
      prefix: "ART",
      token: tokenResult.token,
      store_id: tokenResult.store_id,
      return_url: `${supabaseUrl}/functions/v1/surjopay-payment`,
      cancel_url: `${appUrl}/checkout?error=cancel`,
      amount: order.total, // SERVER total only
      order_id: order.order_number,
      currency: "BDT",
      customer_name: sanitize(order.address?.full_name || "Customer", 100),
      customer_phone: sanitize(order.address?.phone || "N/A", 20),
      customer_email: sanitize(order.address?.email || "customer@store.com", 100),
      customer_address: sanitize(order.address?.address_line || "N/A", 200),
      customer_city: sanitize(order.address?.district || "Dhaka", 50),
      customer_post_code: "1000",
      client_ip: "127.0.0.1",
      value1: orderId,
      value2: String(order.total), // For amount verification
    }),
  });

  const paymentResult = await paymentResponse.json();

  if (paymentResult.checkout_url) {
    return new Response(
      JSON.stringify({
        success: true,
        gatewayUrl: paymentResult.checkout_url,
        sp_order_id: paymentResult.sp_order_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, error: "Payment creation failed" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleReturnCallback(supabase: any, url: URL, appUrl: string) {
  const spOrderId = url.searchParams.get("order_id") || "";

  try {
    const { username, password, baseUrl } = await getProviderConfig(supabase);
    const tokenResult = await getToken(baseUrl, username, password);

    // Verify payment with SurjoPay
    const verifyResponse = await fetch(`${baseUrl}/verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `${tokenResult.token_type} ${tokenResult.token}`,
      },
      body: JSON.stringify({ order_id: spOrderId }),
    });
    const verifyResult = await verifyResponse.json();

    if (verifyResult?.[0]?.sp_code === 1000) {
      const orderId = verifyResult[0]?.value1;
      const paidAmount = parseFloat(verifyResult[0]?.amount || "0");

      // CRITICAL: Verify amount
      const { data: order } = await supabase
        .from("orders")
        .select("total")
        .eq("id", orderId)
        .single();

      if (order) {
        const expectedTotal = parseFloat(String(order.total));
        if (Math.abs(paidAmount - expectedTotal) > 1) {
          console.error(`SurjoPay amount mismatch! Paid: ${paidAmount}, Expected: ${expectedTotal}`);
          await supabase.from("orders").update({
            notes: `⚠️ AMOUNT MISMATCH: Paid ৳${paidAmount}, Expected ৳${expectedTotal}. SP: ${spOrderId}`,
          }).eq("id", orderId);
          return new Response(null, {
            status: 302,
            headers: { Location: `${appUrl}/checkout?error=amount_mismatch` },
          });
        }
      }

      await supabase.from("orders").update({
        status: "confirmed",
        payment_transaction_id: spOrderId,
      }).eq("id", orderId);

      return new Response(null, {
        status: 302,
        headers: { Location: `${appUrl}/order-success?orderId=${orderId}` },
      });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/checkout?error=failed` },
    });
  } catch (error) {
    console.error("SurjoPay callback error:", error);
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/checkout?error=processing` },
    });
  }
}

async function handleVerify(supabase: any, spOrderId: string, providerId?: string) {
  if (!spOrderId) {
    return new Response(
      JSON.stringify({ error: "SP order ID required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { username, password, baseUrl } = await getProviderConfig(supabase, providerId);
  const tokenResult = await getToken(baseUrl, username, password);

  const verifyResponse = await fetch(`${baseUrl}/verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${tokenResult.token_type} ${tokenResult.token}`,
    },
    body: JSON.stringify({ order_id: spOrderId }),
  });
  const result = await verifyResponse.json();

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
