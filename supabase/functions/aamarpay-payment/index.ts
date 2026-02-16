import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AAMARPAY_SANDBOX_URL = "https://sandbox.aamarpay.com";
const AAMARPAY_LIVE_URL = "https://secure.aamarpay.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, orderId, provider_id } = await req.json();
    console.log(`AamarPay action: ${action}, orderId: ${orderId}`);

    const { data: provider } = await supabase
      .from("payment_providers")
      .select("*")
      .eq("id", provider_id)
      .single();

    if (!provider) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const baseUrl = provider.is_sandbox ? AAMARPAY_SANDBOX_URL : AAMARPAY_LIVE_URL;
    const storeId = provider.store_id || (provider.is_sandbox ? "aamarpaytest" : "");
    const signatureKey = provider.store_password || (provider.is_sandbox ? "dbb74894e82415a2f7ff0ec3a97e4183" : "");

    if (action === "init") {
      const { data: order } = await supabase
        .from("orders")
        .select("*, address:addresses(*), order_items(*)")
        .eq("id", orderId)
        .single();

      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--');

      const paymentData = {
        store_id: storeId,
        signature_key: signatureKey,
        tran_id: order.order_number,
        amount: String(order.total),
        currency: "BDT",
        desc: "Order " + order.order_number,
        cus_name: order.address?.full_name || "Customer",
        cus_email: "customer@example.com",
        cus_phone: order.address?.phone || "N/A",
        cus_add1: order.address?.address_line || "N/A",
        cus_city: order.address?.district || "Dhaka",
        cus_country: "Bangladesh",
        success_url: `${supabaseUrl}/functions/v1/aamarpay-payment`,
        fail_url: `${supabaseUrl}/functions/v1/aamarpay-payment`,
        cancel_url: `${appUrl}/checkout?error=cancel`,
        type: "json",
        opt_a: orderId,
      };

      const response = await fetch(`${baseUrl}/jsonpost.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      console.log("AamarPay init response:", result);

      if (result.payment_url) {
        return new Response(JSON.stringify({
          success: true,
          gatewayUrl: result.payment_url,
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: result.error || "Payment initialization failed",
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // Handle IPN callback
    if (action === "ipn" || !action) {
      const formData = await req.formData?.() || {};
      const payStatus = formData.get?.("pay_status")?.toString() || "";
      const tranId = formData.get?.("mer_txnid")?.toString() || "";
      const orderId = formData.get?.("opt_a")?.toString() || "";

      if (payStatus === "Successful") {
        await supabase.from("orders").update({
          status: "confirmed",
          payment_transaction_id: tranId,
        }).eq("id", orderId);
      }

      const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--');
      const redirectUrl = payStatus === "Successful"
        ? `${appUrl}/order-success?orderId=${orderId}`
        : `${appUrl}/checkout?error=failed`;

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": redirectUrl },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("AamarPay error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
