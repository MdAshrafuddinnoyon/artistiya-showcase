import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SURJOPAY_SANDBOX_URL = "https://sandbox.shurjopayment.com/api";
const SURJOPAY_LIVE_URL = "https://engine.shurjopayment.com/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, orderId, provider_id } = await req.json();
    console.log(`SurjoPay action: ${action}`);

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

    const baseUrl = provider.is_sandbox ? SURJOPAY_SANDBOX_URL : SURJOPAY_LIVE_URL;
    const username = provider.store_id || (provider.is_sandbox ? "sp_sandbox" : "");
    const password = provider.store_password || (provider.is_sandbox ? "pyaborern" : "");

    if (action === "init") {
      // Step 1: Get token
      const tokenResponse = await fetch(`${baseUrl}/get_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const tokenResult = await tokenResponse.json();
      console.log("SurjoPay token response:", tokenResult.token ? "received" : "failed");

      if (!tokenResult.token) {
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Step 2: Get order
      const { data: order } = await supabase
        .from("orders")
        .select("*, address:addresses(*)")
        .eq("id", orderId)
        .single();

      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--');

      // Step 3: Create payment
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
          amount: order.total,
          order_id: order.order_number,
          currency: "BDT",
          customer_name: order.address?.full_name || "Customer",
          customer_phone: order.address?.phone || "N/A",
          customer_email: "customer@example.com",
          customer_address: order.address?.address_line || "N/A",
          customer_city: order.address?.district || "Dhaka",
          customer_post_code: "1000",
          client_ip: "127.0.0.1",
          value1: orderId,
        }),
      });

      const paymentResult = await paymentResponse.json();
      console.log("SurjoPay checkout:", paymentResult.checkout_url ? "success" : "failed");

      if (paymentResult.checkout_url) {
        return new Response(JSON.stringify({
          success: true,
          gatewayUrl: paymentResult.checkout_url,
          sp_order_id: paymentResult.sp_order_id,
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: "Payment creation failed",
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (action === "verify") {
      const { sp_order_id } = await req.json();

      // Get token first
      const tokenResponse = await fetch(`${baseUrl}/get_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const tokenResult = await tokenResponse.json();

      // Verify
      const verifyResponse = await fetch(`${baseUrl}/verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${tokenResult.token_type} ${tokenResult.token}`,
        },
        body: JSON.stringify({ order_id: sp_order_id }),
      });

      const verifyResult = await verifyResponse.json();
      return new Response(JSON.stringify(verifyResult), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Handle return callback
    if (!action) {
      const url = new URL(req.url);
      const spOrderId = url.searchParams.get("order_id") || "";
      
      // Verify the payment
      const tokenResponse = await fetch(`${baseUrl}/get_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const tokenResult = await tokenResponse.json();

      const verifyResponse = await fetch(`${baseUrl}/verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${tokenResult.token_type} ${tokenResult.token}`,
        },
        body: JSON.stringify({ order_id: spOrderId }),
      });
      const verifyResult = await verifyResponse.json();

      const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--');

      if (verifyResult?.[0]?.sp_code === 1000) {
        const orderId = verifyResult[0]?.value1;
        await supabase.from("orders").update({
          status: "confirmed",
          payment_transaction_id: spOrderId,
        }).eq("id", orderId);

        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, "Location": `${appUrl}/order-success?orderId=${orderId}` },
        });
      }

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": `${appUrl}/checkout?error=failed` },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("SurjoPay error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
