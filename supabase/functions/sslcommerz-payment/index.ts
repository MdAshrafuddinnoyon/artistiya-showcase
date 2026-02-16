import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SSLCommerz API URLs
const SSLCOMMERZ_SANDBOX_URL = "https://sandbox.sslcommerz.com";
const SSLCOMMERZ_LIVE_URL = "https://securepay.sslcommerz.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, orderId, provider_id } = await req.json();
    console.log(`SSLCommerz action: ${action}, orderId: ${orderId}`);

    // Get provider config
    const { data: provider, error: providerError } = await supabase
      .from("payment_providers")
      .select("*")
      .eq("id", provider_id)
      .single();

    if (providerError || !provider) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const baseUrl = provider.is_sandbox ? SSLCOMMERZ_SANDBOX_URL : SSLCOMMERZ_LIVE_URL;
    const storeId = provider.store_id;
    const storePass = provider.store_password;

    if (!storeId || !storePass) {
      return new Response(JSON.stringify({ error: "Store credentials not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "init") {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*, address:addresses(*), order_items(*)")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const successUrl = `${supabaseUrl}/functions/v1/sslcommerz-payment?action=success`;
      const failUrl = `${supabaseUrl}/functions/v1/sslcommerz-payment?action=fail`;
      const cancelUrl = `${supabaseUrl}/functions/v1/sslcommerz-payment?action=cancel`;
      const ipnUrl = `${supabaseUrl}/functions/v1/sslcommerz-payment?action=ipn`;

      const postData = new URLSearchParams({
        store_id: storeId,
        store_passwd: storePass,
        total_amount: String(order.total),
        currency: "BDT",
        tran_id: order.order_number,
        success_url: successUrl,
        fail_url: failUrl,
        cancel_url: cancelUrl,
        ipn_url: ipnUrl,
        cus_name: order.address?.full_name || "Customer",
        cus_email: "customer@example.com",
        cus_add1: order.address?.address_line || "N/A",
        cus_city: order.address?.district || "Dhaka",
        cus_country: "Bangladesh",
        cus_phone: order.address?.phone || "N/A",
        shipping_method: "Courier",
        product_name: "Order " + order.order_number,
        product_category: "General",
        product_profile: "general",
        num_of_item: String(order.order_items?.length || 1),
        value_a: orderId, // Store order ID for callback
      });

      const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: postData.toString(),
      });

      const result = await response.json();
      console.log("SSLCommerz init response:", result.status);

      if (result.status === "SUCCESS") {
        return new Response(JSON.stringify({
          success: true,
          gatewayUrl: result.GatewayPageURL,
          sessionKey: result.sessionkey,
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: result.failedreason || "Payment initialization failed",
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (action === "success" || action === "fail" || action === "cancel" || action === "ipn") {
      // Handle callback - parse form data from SSLCommerz
      const url = new URL(req.url);
      const formData = await req.formData?.() || new URLSearchParams(await req.text());
      
      const tranId = formData.get("tran_id")?.toString() || "";
      const valId = formData.get("val_id")?.toString() || "";
      const amount = formData.get("amount")?.toString() || "";
      const status = formData.get("status")?.toString() || "";
      const orderId = formData.get("value_a")?.toString() || "";

      console.log(`SSLCommerz callback: action=${action}, tran_id=${tranId}, status=${status}`);

      if (action === "success" && status === "VALID") {
        // Validate transaction
        const validateUrl = `${baseUrl}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePass}&format=json`;
        const valResponse = await fetch(validateUrl);
        const valResult = await valResponse.json();

        if (valResult.status === "VALID" || valResult.status === "VALIDATED") {
          // Update order
          await supabase.from("orders").update({
            status: "confirmed",
            payment_transaction_id: valId,
          }).eq("id", orderId);

          console.log(`Order ${orderId} payment confirmed via SSLCommerz`);
        }
      }

      // Redirect to frontend
      const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app').replace('https://', 'https://id-preview--');
      const redirectUrl = action === "success" 
        ? `${appUrl}/order-success?orderId=${orderId}` 
        : `${appUrl}/checkout?error=${action}`;

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, "Location": redirectUrl },
      });
    }

    if (action === "validate") {
      const { val_id } = await req.json();
      const validateUrl = `${baseUrl}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${storeId}&store_passwd=${storePass}&format=json`;
      const response = await fetch(validateUrl);
      const result = await response.json();

      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("SSLCommerz error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
