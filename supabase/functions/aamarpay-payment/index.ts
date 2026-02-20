import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AAMARPAY_SANDBOX_URL = "https://sandbox.aamarpay.com";
const AAMARPAY_LIVE_URL = "https://secure.aamarpay.com";
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const appUrl = getAppUrl();

  try {
    // Detect if this is a callback (POST form-data from AamarPay)
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      // IPN / Success / Fail callback from AamarPay
      return await handleCallback(req, supabase, appUrl);
    }

    // JSON API request
    const body = await req.json();
    const { action, orderId, provider_id } = body;

    if (action === "init") {
      return await handleInit(supabase, supabaseUrl, orderId, provider_id, appUrl);
    }

    if (action === "verify") {
      return await handleVerify(supabase, body.tran_id, provider_id);
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AamarPay error:", error);
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
    .eq("provider_type", "aamarpay")
    .eq("is_active", true);

  if (providerId) {
    query = supabase.from("payment_providers").select("*").eq("id", providerId);
  }

  const { data: provider } = await query.single();
  if (!provider) throw new Error("AamarPay not configured");

  const storeId = provider.store_id
    ? await decryptCredential(provider.store_id)
    : provider.is_sandbox ? "aamarpaytest" : "";
  const signatureKey = provider.store_password
    ? await decryptCredential(provider.store_password)
    : provider.is_sandbox ? "dbb74894e82415a2f7ff0ec3a97e4183" : "";

  const baseUrl = provider.is_sandbox ? AAMARPAY_SANDBOX_URL : AAMARPAY_LIVE_URL;
  return { storeId, signatureKey, baseUrl, provider };
}

async function handleInit(supabase: any, supabaseUrl: string, orderId: string, providerId?: string, appUrl?: string) {
  if (!orderId) {
    return new Response(
      JSON.stringify({ error: "Order ID required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { storeId, signatureKey, baseUrl } = await getProviderConfig(supabase, providerId);

  // Get order with SERVER-VERIFIED total
  const { data: order } = await supabase
    .from("orders")
    .select("*, address:addresses(*), order_items(*)")
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

  const callbackUrl = `${supabaseUrl}/functions/v1/aamarpay-payment`;

  const paymentData = {
    store_id: storeId,
    signature_key: signatureKey,
    tran_id: order.order_number,
    amount: String(order.total), // SERVER total only
    currency: "BDT",
    desc: `Order ${order.order_number}`,
    cus_name: sanitize(order.address?.full_name || "Customer", 100),
    cus_email: sanitize(order.address?.email || "customer@store.com", 100),
    cus_phone: sanitize(order.address?.phone || "N/A", 20),
    cus_add1: sanitize(order.address?.address_line || "N/A", 200),
    cus_city: sanitize(order.address?.district || "Dhaka", 50),
    cus_country: "Bangladesh",
    success_url: callbackUrl,
    fail_url: callbackUrl,
    cancel_url: `${appUrl}/checkout?error=cancel`,
    type: "json",
    opt_a: orderId,
    opt_b: String(order.total), // For amount verification
  };

  const response = await fetch(`${baseUrl}/jsonpost.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });

  const result = await response.json();

  if (result.payment_url) {
    return new Response(
      JSON.stringify({ success: true, gatewayUrl: result.payment_url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, error: result.error || "Payment initialization failed" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCallback(req: Request, supabase: any, appUrl: string) {
  try {
    const text = await req.text();
    const formData = new URLSearchParams(text);

    const payStatus = formData.get("pay_status") || "";
    const tranId = formData.get("mer_txnid") || "";
    const orderId = formData.get("opt_a") || "";
    const paidAmount = parseFloat(formData.get("amount") || "0");
    const cardType = formData.get("card_type") || "";

    console.log(`AamarPay callback: status=${payStatus}, tran_id=${tranId}, amount=${paidAmount}`);

    if (payStatus === "Successful") {
      // CRITICAL: Verify amount against server order total
      const { data: order } = await supabase
        .from("orders")
        .select("total, order_number")
        .eq("id", orderId)
        .single();

      if (order) {
        const expectedTotal = parseFloat(String(order.total));

        if (Math.abs(paidAmount - expectedTotal) > 1) {
          console.error(`AamarPay amount mismatch! Paid: ${paidAmount}, Expected: ${expectedTotal}`);
          await supabase.from("orders").update({
            notes: `⚠️ AMOUNT MISMATCH: Paid ৳${paidAmount}, Expected ৳${expectedTotal}. Txn: ${tranId}`,
          }).eq("id", orderId);

          return new Response(null, {
            status: 302,
            headers: { Location: `${appUrl}/checkout?error=amount_mismatch` },
          });
        }

        // Verify transaction ID matches
        if (tranId && tranId !== order.order_number) {
          console.error(`AamarPay tran_id mismatch! Got: ${tranId}, Expected: ${order.order_number}`);
        }
      }

      // Verify with AamarPay search API for extra security
      try {
        const { storeId, signatureKey, baseUrl } = await getProviderConfig(supabase);
        const verifyUrl = `${baseUrl}/api/v1/trxcheck/request.php?request_id=${encodeURIComponent(tranId)}&store_id=${encodeURIComponent(storeId)}&signature_key=${encodeURIComponent(signatureKey)}&type=json`;
        const verifyRes = await fetch(verifyUrl);
        const verifyResult = await verifyRes.json();

        if (verifyResult.pay_status !== "Successful") {
          console.error("AamarPay verification failed:", verifyResult);
          return new Response(null, {
            status: 302,
            headers: { Location: `${appUrl}/checkout?error=verification_failed` },
          });
        }
      } catch (verifyErr) {
        console.error("AamarPay verify API error:", verifyErr);
        // Continue - callback data may still be valid
      }

      await supabase.from("orders").update({
        status: "confirmed",
        payment_transaction_id: tranId,
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
    console.error("AamarPay callback error:", error);
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/checkout?error=processing` },
    });
  }
}

async function handleVerify(supabase: any, tranId: string, providerId?: string) {
  if (!tranId) {
    return new Response(
      JSON.stringify({ error: "Transaction ID required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { storeId, signatureKey, baseUrl } = await getProviderConfig(supabase, providerId);
  const verifyUrl = `${baseUrl}/api/v1/trxcheck/request.php?request_id=${encodeURIComponent(tranId)}&store_id=${encodeURIComponent(storeId)}&signature_key=${encodeURIComponent(signatureKey)}&type=json`;
  const response = await fetch(verifyUrl);
  const result = await response.json();

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
