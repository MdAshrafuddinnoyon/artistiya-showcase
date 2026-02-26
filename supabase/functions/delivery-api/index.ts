import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENCRYPTION_PREFIX = "enc:";

// ─── Provider URLs ───
const URLS = {
  pathao: { sandbox: "https://hermes-api.pathao.com", live: "https://api-hermes.pathao.com" },
  redx: { sandbox: "https://sandbox.redx.com.bd/v1.0.0-beta", live: "https://openapi.redx.com.bd/v1.0.0-beta" },
  paperfly: { base: "https://api.paperfly.com.bd" },
  steadfast: { sandbox: "https://portal.packzy.com/api/v1", live: "https://portal.steadfast.com.bd/api/v1" },
  ecourier: { sandbox: "https://staging.ecourier.com.bd/api", live: "https://backoffice.ecourier.com.bd/api" },
  deliverytiger: { base: "https://api.deliverytiger.com.bd/api" },
};

// ─── Helpers ───
async function decryptCredential(encryptedText: string): Promise<string> {
  if (!encryptedText || !encryptedText.startsWith(ENCRYPTION_PREFIX)) return encryptedText || "";
  const encryptionKey = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY");
  if (!encryptionKey) return "";
  try {
    const base64 = encryptedText.slice(ENCRYPTION_PREFIX.length);
    const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const salt = combined.slice(0, 16), iv = combined.slice(16, 28), ciphertext = combined.slice(28);
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(encryptionKey), { name: "PBKDF2" }, false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext));
  } catch { return ""; }
}

function sanitize(str: string, maxLen = 300): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

function isValidPhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""));
}

async function verifyAdmin(req: Request, supabaseUrl: string, anonKey: string): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await client.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims?.sub) return null;
  const userId = data.claims.sub as string;
  // Check admin role
  const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: role } = await serviceClient.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").single();
  return role ? userId : null;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Main Handler ───
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const adminId = await verifyAdmin(req, supabaseUrl, supabaseAnonKey);
    if (!adminId) {
      return jsonResponse({ error: "Unauthorized - admin access required" }, 401);
    }

    const body = await req.json();
    const { provider_type, action, provider_id, ...params } = body;

    if (!provider_type || !action) {
      return jsonResponse({ error: "provider_type and action are required" }, 400);
    }

    // Get & decrypt provider config
    const { data: provider } = await supabase
      .from("delivery_providers")
      .select("*")
      .eq("id", provider_id)
      .single();

    if (!provider) {
      return jsonResponse({ error: "Provider not found" }, 404);
    }

    const config = provider.config || {};
    const isSandbox = config.is_sandbox !== false;
    const apiKey = await decryptCredential(provider.api_key || "");
    const apiSecret = await decryptCredential(provider.api_secret || "");

    // Route to provider handler
    switch (provider_type) {
      case "pathao": return await handlePathao(action, params, config, apiKey, apiSecret, isSandbox);
      case "redx": return await handleRedX(action, params, apiKey, isSandbox);
      case "paperfly": return await handlePaperfly(action, params, config, apiKey, apiSecret);
      case "steadfast": return await handleSteadfast(action, params, apiKey, apiSecret, isSandbox);
      case "ecourier": return await handleECourier(action, params, config, apiKey, apiSecret, isSandbox);
      case "deliverytiger": return await handleDeliveryTiger(action, params, apiKey, apiSecret);
      default: return jsonResponse({ error: `Unsupported provider: ${provider_type}` }, 400);
    }
  } catch (error: any) {
    console.error("Delivery API error:", error);
    return jsonResponse({ error: "Delivery API processing failed" }, 500);
  }
});

// ==================== PATHAO ====================
async function handlePathao(action: string, params: any, config: any, apiKey: string, apiSecret: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? URLS.pathao.sandbox : URLS.pathao.live;

  if (action === "auth") {
    const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: apiKey || config.client_id,
        client_secret: apiSecret || config.client_secret,
        username: config.username,
        password: config.password,
        grant_type: "password",
      }),
    });
    return jsonResponse(await response.json(), response.ok ? 200 : 400);
  }

  let accessToken = config.access_token || params.access_token;
  
  // Auto-authenticate if no access token is available
  if (!accessToken) {
    try {
      const authResponse = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: apiKey || config.client_id,
          client_secret: apiSecret || config.client_secret,
          username: config.username,
          password: config.password,
          grant_type: "password",
        }),
      });
      const authData = await authResponse.json();
      accessToken = authData?.access_token || authData?.token;
      if (!accessToken) {
        return jsonResponse({ error: "Pathao authentication failed. Please configure valid credentials in Delivery Providers settings." }, 400);
      }
    } catch (e) {
      return jsonResponse({ error: "Failed to authenticate with Pathao API" }, 500);
    }
  }

  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` };

  const endpoints: Record<string, { method: string; url: string; body?: any }> = {
    cities: { method: "GET", url: `${baseUrl}/aladdin/api/v1/countries/1/city-list` },
    zones: { method: "GET", url: `${baseUrl}/aladdin/api/v1/cities/${params.city_id}/zone-list` },
    areas: { method: "GET", url: `${baseUrl}/aladdin/api/v1/zones/${params.zone_id}/area-list` },
    stores: { method: "GET", url: `${baseUrl}/aladdin/api/v1/stores` },
    price: {
      method: "POST",
      url: `${baseUrl}/aladdin/api/v1/merchant/price-plan`,
      body: {
        store_id: params.store_id,
        item_type: params.item_type || 2,
        delivery_type: params.delivery_type || 48,
        item_weight: params.weight || 0.5,
        recipient_city: params.recipient_city,
        recipient_zone: params.recipient_zone,
      },
    },
    create_order: {
      method: "POST",
      url: `${baseUrl}/aladdin/api/v1/orders`,
      body: {
        store_id: params.store_id,
        merchant_order_id: sanitize(params.order_number, 50),
        recipient_name: sanitize(params.recipient_name, 100),
        recipient_phone: sanitize(params.recipient_phone, 20),
        recipient_address: sanitize(params.recipient_address, 300),
        recipient_city: params.recipient_city,
        recipient_zone: params.recipient_zone,
        recipient_area: params.recipient_area,
        delivery_type: params.delivery_type || 48,
        item_type: params.item_type || 2,
        item_quantity: Math.min(100, Math.max(1, params.quantity || 1)),
        item_weight: Math.min(50, Math.max(0.1, params.weight || 0.5)),
        amount_to_collect: Math.max(0, params.amount_to_collect || 0),
        special_instruction: sanitize(params.notes || "", 500),
      },
    },
    track: { method: "GET", url: `${baseUrl}/aladdin/api/v1/orders/${params.consignment_id}` },
  };

  const endpoint = endpoints[action];
  if (!endpoint) return jsonResponse({ error: `Invalid Pathao action: ${action}` }, 400);

  // Validate phone for order creation
  if (action === "create_order" && params.recipient_phone && !isValidPhone(params.recipient_phone)) {
    return jsonResponse({ error: "Invalid recipient phone number" }, 400);
  }

  const fetchOpts: RequestInit = { method: endpoint.method, headers };
  if (endpoint.body) fetchOpts.body = JSON.stringify(endpoint.body);

  const response = await fetch(endpoint.url, fetchOpts);
  return jsonResponse(await response.json(), response.ok ? 200 : 400);
}

// ==================== REDX ====================
async function handleRedX(action: string, params: any, apiKey: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? URLS.redx.sandbox : URLS.redx.live;
  const headers = { "Content-Type": "application/json", "API-ACCESS-TOKEN": `Bearer ${apiKey}` };

  if (action === "areas") {
    const response = await fetch(`${baseUrl}/areas`, { headers });
    return jsonResponse(await response.json());
  }

  if (action === "create_parcel") {
    if (params.customer_phone && !isValidPhone(params.customer_phone)) {
      return jsonResponse({ error: "Invalid customer phone number" }, 400);
    }

    const response = await fetch(`${baseUrl}/parcel`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer_name: sanitize(params.customer_name, 100),
        customer_phone: sanitize(params.customer_phone, 20),
        delivery_area: sanitize(params.delivery_area, 100),
        delivery_area_id: params.delivery_area_id,
        customer_address: sanitize(params.customer_address, 300),
        merchant_invoice_id: sanitize(params.order_number, 50),
        cash_collection_amount: String(Math.max(0, params.cash_collection || 0)),
        parcel_weight: Math.min(50000, Math.max(100, params.weight || 500)),
        instruction: sanitize(params.notes || "", 500),
        value: String(Math.max(0, params.value || 0)),
      }),
    });
    return jsonResponse(await response.json(), response.ok ? 200 : 400);
  }

  if (action === "track") {
    const response = await fetch(`${baseUrl}/parcel/track/${encodeURIComponent(params.tracking_id)}`, { headers });
    return jsonResponse(await response.json());
  }

  return jsonResponse({ error: `Invalid RedX action: ${action}` }, 400);
}

// ==================== PAPERFLY ====================
async function handlePaperfly(action: string, params: any, config: any, apiKey: string, apiSecret: string) {
  const username = apiKey || config.username;
  const password = apiSecret || config.password;
  const paperflyKey = config.paperfly_key || "Paperfly_~La?Rj73FcLm";

  const headers = {
    "Content-Type": "application/json",
    "paperflykey": paperflyKey,
    "Authorization": "Basic " + btoa(`${username}:${password}`),
  };

  if (action === "create_order") {
    if (params.customer_phone && !isValidPhone(params.customer_phone)) {
      return jsonResponse({ error: "Invalid customer phone number" }, 400);
    }

    const response = await fetch(`${URLS.paperfly.base}/merchant/api/service/new_order.php`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        merOrderRef: sanitize(params.order_number, 50),
        pickMerchantName: sanitize(params.merchant_name || config.merchant_name || "Shop", 100),
        pickMerchantAddress: sanitize(params.pickup_address || config.pickup_address || "", 300),
        pickMerchantThana: sanitize(params.pickup_thana || config.pickup_thana || "", 50),
        pickMerchantDistrict: sanitize(params.pickup_district || config.pickup_district || "", 50),
        pickupMerchantPhone: sanitize(params.pickup_phone || config.pickup_phone || "", 20),
        productSizeWeight: params.weight || "standard",
        productBrief: sanitize(params.product_brief || "Package", 200),
        packagePrice: String(Math.max(0, params.package_price || 0)),
        max_weight: String(params.max_weight || "0.5"),
        deliveryOption: params.delivery_option || "regular",
        custname: sanitize(params.customer_name, 100),
        custaddress: sanitize(params.customer_address, 300),
        customerThana: sanitize(params.customer_thana || "", 50),
        customerDistrict: sanitize(params.customer_district || "", 50),
        custPhone: sanitize(params.customer_phone, 20),
        custcity: sanitize(params.customer_city || "Dhaka", 50),
      }),
    });
    return jsonResponse(await response.json(), response.ok ? 200 : 400);
  }

  if (action === "track") {
    const response = await fetch(`${URLS.paperfly.base}/merchant/api/service/tracking.php`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ReferenceNumber: sanitize(params.tracking_id, 50) }),
    });
    return jsonResponse(await response.json());
  }

  return jsonResponse({ error: `Invalid Paperfly action: ${action}` }, 400);
}

// ==================== STEADFAST ====================
async function handleSteadfast(action: string, params: any, apiKey: string, apiSecret: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? URLS.steadfast.sandbox : URLS.steadfast.live;
  const headers = {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "Secret-Key": apiSecret,
  };

  if (action === "create_order") {
    if (params.recipient_phone && !isValidPhone(params.recipient_phone)) {
      return jsonResponse({ error: "Invalid recipient phone number" }, 400);
    }

    const response = await fetch(`${baseUrl}/create_order`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        invoice: sanitize(params.order_number, 50),
        recipient_name: sanitize(params.recipient_name, 100),
        recipient_phone: sanitize(params.recipient_phone, 20),
        recipient_address: sanitize(params.recipient_address, 300),
        cod_amount: Math.max(0, params.cod_amount || 0),
        note: sanitize(params.notes || "", 500),
      }),
    });
    return jsonResponse(await response.json(), response.ok ? 200 : 400);
  }

  if (action === "track") {
    // Steadfast uses consignment_id or invoice for tracking
    const trackId = encodeURIComponent(params.tracking_id || params.consignment_id || "");
    const response = await fetch(`${baseUrl}/status_by_cid/${trackId}`, { headers });
    return jsonResponse(await response.json());
  }

  if (action === "track_by_invoice") {
    const invoice = encodeURIComponent(params.invoice || "");
    const response = await fetch(`${baseUrl}/status_by_invoice/${invoice}`, { headers });
    return jsonResponse(await response.json());
  }

  if (action === "balance") {
    const response = await fetch(`${baseUrl}/get_balance`, { headers });
    return jsonResponse(await response.json());
  }

  if (action === "bulk_create") {
    if (!Array.isArray(params.orders) || params.orders.length === 0) {
      return jsonResponse({ error: "orders array required" }, 400);
    }
    if (params.orders.length > 500) {
      return jsonResponse({ error: "Max 500 orders per bulk request" }, 400);
    }

    const sanitizedOrders = params.orders.map((o: any) => ({
      invoice: sanitize(o.invoice || o.order_number, 50),
      recipient_name: sanitize(o.recipient_name, 100),
      recipient_phone: sanitize(o.recipient_phone, 20),
      recipient_address: sanitize(o.recipient_address, 300),
      cod_amount: Math.max(0, o.cod_amount || 0),
      note: sanitize(o.note || "", 500),
    }));

    const response = await fetch(`${baseUrl}/create_order/bulk-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ data: sanitizedOrders }),
    });
    return jsonResponse(await response.json(), response.ok ? 200 : 400);
  }

  return jsonResponse({ error: `Invalid Steadfast action: ${action}` }, 400);
}

// ==================== eCourier ====================
async function handleECourier(action: string, params: any, config: any, apiKey: string, apiSecret: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? URLS.ecourier.sandbox : URLS.ecourier.live;
  const headers = {
    "Content-Type": "application/json",
    "API-KEY": apiKey,
    "API-SECRET": apiSecret,
    "USER-ID": config.user_id || "",
  };

  if (action === "city_list") {
    const response = await fetch(`${baseUrl}/city-list`, { method: "POST", headers });
    return jsonResponse(await response.json());
  }

  if (action === "thana_list") {
    const response = await fetch(`${baseUrl}/thana-list`, {
      method: "POST",
      headers,
      body: JSON.stringify({ city: params.city }),
    });
    return jsonResponse(await response.json());
  }

  if (action === "area_list") {
    const response = await fetch(`${baseUrl}/area-list`, {
      method: "POST",
      headers,
      body: JSON.stringify({ postcode: params.postcode }),
    });
    return jsonResponse(await response.json());
  }

  if (action === "packages") {
    const response = await fetch(`${baseUrl}/packages`, { method: "POST", headers });
    return jsonResponse(await response.json());
  }

  if (action === "price") {
    const response = await fetch(`${baseUrl}/price-calculate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        recipient_city: params.recipient_city,
        recipient_thana: params.recipient_thana,
        recipient_area: params.recipient_area,
        package_code: params.package_code,
        product_price: params.product_price,
      }),
    });
    return jsonResponse(await response.json());
  }

  if (action === "create_order") {
    if (params.recipient_mobile && !isValidPhone(params.recipient_mobile)) {
      return jsonResponse({ error: "Invalid recipient phone number" }, 400);
    }

    const response = await fetch(`${baseUrl}/order-place`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        recipient_name: sanitize(params.recipient_name, 100),
        recipient_mobile: sanitize(params.recipient_mobile, 20),
        recipient_city: sanitize(params.recipient_city, 50),
        recipient_thana: sanitize(params.recipient_thana, 50),
        recipient_area: sanitize(params.recipient_area, 50),
        recipient_address: sanitize(params.recipient_address, 300),
        package_code: params.package_code,
        product_price: Math.max(0, params.product_price || 0),
        payment_method: params.payment_method || "COD",
        recipient_postcode: params.recipient_postcode || "",
        parcel_type: params.parcel_type || "BOX",
        requested_delivery_time: params.delivery_time || "",
        pick_hub: params.pick_hub || "",
        comments: sanitize(params.notes || "", 500),
        number_of_item: Math.min(100, Math.max(1, params.quantity || 1)),
        actual_product_price: Math.max(0, params.actual_price || params.product_price || 0),
      }),
    });
    return jsonResponse(await response.json(), response.ok ? 200 : 400);
  }

  if (action === "track") {
    const response = await fetch(`${baseUrl}/track`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ecr: params.tracking_id }),
    });
    return jsonResponse(await response.json());
  }

  if (action === "cancel") {
    const response = await fetch(`${baseUrl}/cancel-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ecr: params.tracking_id, comment: sanitize(params.reason || "Cancelled", 200) }),
    });
    return jsonResponse(await response.json());
  }

  return jsonResponse({ error: `Invalid eCourier action: ${action}` }, 400);
}

// ==================== Delivery Tiger ====================
async function handleDeliveryTiger(action: string, params: any, apiKey: string, _apiSecret: string) {
  const baseUrl = URLS.deliverytiger.base;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };

  if (action === "districts") {
    const response = await fetch(`${baseUrl}/District/GetDistricts`, { headers });
    return jsonResponse(await response.json());
  }

  if (action === "thanas") {
    const response = await fetch(`${baseUrl}/District/GetThana/${params.district_id}`, { headers });
    return jsonResponse(await response.json());
  }

  if (action === "areas") {
    const response = await fetch(`${baseUrl}/District/GetArea/${params.thana_id}`, { headers });
    return jsonResponse(await response.json());
  }

  if (action === "price") {
    const response = await fetch(`${baseUrl}/Pricing/GetPrice`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        deliveryRangeId: params.delivery_range_id,
        weight: Math.min(50, Math.max(0.1, params.weight || 0.5)),
        collectionAmount: Math.max(0, params.collection_amount || 0),
      }),
    });
    return jsonResponse(await response.json());
  }

  if (action === "create_order") {
    if (params.mobile && !isValidPhone(params.mobile)) {
      return jsonResponse({ error: "Invalid customer phone number" }, 400);
    }

    const response = await fetch(`${baseUrl}/Order/PlaceOrder`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customerName: sanitize(params.customer_name, 100),
        mobile: sanitize(params.mobile, 20),
        otherMobile: sanitize(params.other_mobile || "", 20),
        address: sanitize(params.address, 300),
        districtId: params.district_id,
        thanaId: params.thana_id,
        areaId: params.area_id,
        collectionAmount: Math.max(0, params.collection_amount || 0),
        productPrice: Math.max(0, params.product_price || 0),
        weight: Math.min(50, Math.max(0.1, params.weight || 0.5)),
        orderType: params.order_type || "Delivery",
        deliveryRangeId: params.delivery_range_id,
        merchantOrderId: sanitize(params.order_number, 50),
        note: sanitize(params.notes || "", 500),
      }),
    });
    return jsonResponse(await response.json(), response.ok ? 200 : 400);
  }

  if (action === "track") {
    const response = await fetch(`${baseUrl}/Order/GetOrderTracking/${encodeURIComponent(params.tracking_id)}`, { headers });
    return jsonResponse(await response.json());
  }

  return jsonResponse({ error: `Invalid Delivery Tiger action: ${action}` }, 400);
}
