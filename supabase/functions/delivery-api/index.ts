import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// API URLs
const PATHAO_SANDBOX_URL = "https://hermes-api.pathao.com";
const PATHAO_LIVE_URL = "https://api-hermes.pathao.com";

const REDX_SANDBOX_URL = "https://sandbox.redx.com.bd/v1.0.0-beta";
const REDX_LIVE_URL = "https://openapi.redx.com.bd/v1.0.0-beta";

const PAPERFLY_URL = "https://api.paperfly.com.bd";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { provider_type, action, provider_id, ...params } = body;
    console.log(`Delivery API: provider=${provider_type}, action=${action}`);

    // Get provider config
    const { data: provider } = await supabase
      .from("delivery_providers")
      .select("*")
      .eq("id", provider_id)
      .single();

    if (!provider) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const config = provider.config || {};
    const isSandbox = config.is_sandbox !== false;

    // ==================== PATHAO ====================
    if (provider_type === "pathao") {
      const baseUrl = isSandbox ? PATHAO_SANDBOX_URL : PATHAO_LIVE_URL;

      if (action === "auth") {
        // Get access token
        const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: provider.api_key || config.client_id,
            client_secret: provider.api_secret || config.client_secret,
            username: config.username,
            password: config.password,
            grant_type: "password",
          }),
        });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: response.ok ? 200 : 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // For all other actions, use access token
      const accessToken = config.access_token || params.access_token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      };

      if (action === "cities") {
        const response = await fetch(`${baseUrl}/aladdin/api/v1/countries/1/city-list`, { headers });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "zones") {
        const response = await fetch(`${baseUrl}/aladdin/api/v1/cities/${params.city_id}/zone-list`, { headers });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "areas") {
        const response = await fetch(`${baseUrl}/aladdin/api/v1/zones/${params.zone_id}/area-list`, { headers });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "price") {
        const response = await fetch(`${baseUrl}/aladdin/api/v1/merchant/price-plan`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            store_id: params.store_id,
            item_type: params.item_type || 2,
            delivery_type: params.delivery_type || 48,
            item_weight: params.weight || 0.5,
            recipient_city: params.recipient_city,
            recipient_zone: params.recipient_zone,
          }),
        });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "create_order") {
        const response = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            store_id: params.store_id,
            merchant_order_id: params.order_number,
            recipient_name: params.recipient_name,
            recipient_phone: params.recipient_phone,
            recipient_address: params.recipient_address,
            recipient_city: params.recipient_city,
            recipient_zone: params.recipient_zone,
            recipient_area: params.recipient_area,
            delivery_type: params.delivery_type || 48,
            item_type: params.item_type || 2,
            item_quantity: params.quantity || 1,
            item_weight: params.weight || 0.5,
            amount_to_collect: params.amount_to_collect || 0,
            special_instruction: params.notes || "",
          }),
        });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: response.ok ? 200 : 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "stores") {
        const response = await fetch(`${baseUrl}/aladdin/api/v1/stores`, { headers });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==================== REDX ====================
    if (provider_type === "redx") {
      const baseUrl = isSandbox ? REDX_SANDBOX_URL : REDX_LIVE_URL;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "API-ACCESS-TOKEN": `Bearer ${provider.api_key}`,
      };

      if (action === "areas") {
        const response = await fetch(`${baseUrl}/areas`, { headers });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "create_parcel") {
        const response = await fetch(`${baseUrl}/parcel`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            customer_name: params.customer_name,
            customer_phone: params.customer_phone,
            delivery_area: params.delivery_area,
            delivery_area_id: params.delivery_area_id,
            customer_address: params.customer_address,
            merchant_invoice_id: params.order_number,
            cash_collection_amount: params.cash_collection || "0",
            parcel_weight: params.weight || 500,
            instruction: params.notes || "",
            value: params.value || "0",
          }),
        });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: response.ok ? 200 : 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "track") {
        const response = await fetch(`${baseUrl}/parcel/track/${params.tracking_id}`, { headers });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==================== PAPERFLY ====================
    if (provider_type === "paperfly") {
      const username = provider.api_key || config.username;
      const password = provider.api_secret || config.password;
      const paperflyKey = config.paperfly_key || "Paperfly_~La?Rj73FcLm";
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "paperflykey": paperflyKey,
        "Authorization": "Basic " + btoa(`${username}:${password}`),
      };

      if (action === "create_order") {
        const response = await fetch(`${PAPERFLY_URL}/merchant/api/service/new_order.php`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            merOrderRef: params.order_number,
            pickMerchantName: params.merchant_name || config.merchant_name || "Shop",
            pickMerchantAddress: params.pickup_address || config.pickup_address || "",
            pickMerchantThana: params.pickup_thana || config.pickup_thana || "",
            pickMerchantDistrict: params.pickup_district || config.pickup_district || "",
            pickupMerchantPhone: params.pickup_phone || config.pickup_phone || "",
            productSizeWeight: params.weight || "standard",
            productBrief: params.product_brief || "Package",
            packagePrice: String(params.package_price || 0),
            max_weight: params.max_weight || "0.5",
            deliveryOption: params.delivery_option || "regular",
            custname: params.customer_name,
            custaddress: params.customer_address,
            customerThana: params.customer_thana || "",
            customerDistrict: params.customer_district || "",
            custPhone: params.customer_phone,
            custcity: params.customer_city || "Dhaka",
          }),
        });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: response.ok ? 200 : 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (action === "track") {
        const response = await fetch(`${PAPERFLY_URL}/merchant/api/service/tracking.php`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ReferenceNumber: params.tracking_id }),
        });
        const result = await response.json();
        return new Response(JSON.stringify(result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid provider or action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Delivery API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
