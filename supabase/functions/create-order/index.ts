import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// Input validation helpers
const sanitizeString = (str: string, maxLen = 500): string => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
};

const isValidPhone = (phone: string): boolean => {
  return /^01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""));
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Parse auth header for optional user auth
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await userClient.auth.getClaims(
        authHeader.replace("Bearer ", "")
      );
      if (!error && data?.claims?.sub) {
        userId = data.claims.sub as string;
      }
    }

    const body = await req.json();

    // ─── Input Validation ───
    const {
      items,
      address,
      payment_method,
      transaction_id,
      promo_code,
      notes,
      shipping_method,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (items.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate address
    if (!address || !address.full_name || !address.phone) {
      return new Response(
        JSON.stringify({ error: "Name and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = address.phone.replace(/[\s-]/g, "");
    if (!isValidPhone(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (address.email && !isValidEmail(address.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validPaymentMethods = ["cod", "bkash", "nagad", "bank_transfer"];
    if (!validPaymentMethods.includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Server-Side Price Verification ───
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limiting - max orders per phone in 24h
    const { data: fraudSettings } = await adminClient
      .from("checkout_fraud_settings")
      .select("*")
      .limit(1)
      .single();

    const maxOrdersPerPhone = fraudSettings?.max_orders_per_phone_24h || 5;
    const rateLimitSeconds = fraudSettings?.order_rate_limit_seconds || 30;

    // Rate limit: check recent orders from this phone
    const { count: recentPhoneOrders } = await adminClient
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .eq("address_id", "placeholder"); // We'll check via addresses below

    // Check if phone is blocked
    const { data: blocked } = await adminClient
      .from("blocked_customers")
      .select("id")
      .eq("phone", cleanPhone)
      .eq("is_active", true)
      .limit(1);

    if (blocked && blocked.length > 0) {
      return new Response(
        JSON.stringify({ error: "Order cannot be processed. Please contact support." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check blocked by user_id
    if (userId) {
      const { data: blockedUser } = await adminClient
        .from("blocked_customers")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1);

      if (blockedUser && blockedUser.length > 0) {
        return new Response(
          JSON.stringify({ error: "Order cannot be processed. Please contact support." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Rate limit by phone (check via addresses joined with recent orders)
    const { data: recentAddresses } = await adminClient
      .from("addresses")
      .select("id")
      .eq("phone", cleanPhone);

    if (recentAddresses && recentAddresses.length > 0) {
      const addressIds = recentAddresses.map((a: any) => a.id);
      const { count: phoneOrderCount } = await adminClient
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("address_id", addressIds)
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      if (phoneOrderCount && phoneOrderCount >= maxOrdersPerPhone) {
        return new Response(
          JSON.stringify({ error: "Too many orders from this phone number. Please try later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Recent order rate limit (seconds)
      if (rateLimitSeconds > 0) {
        const { count: veryRecentOrders } = await adminClient
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("address_id", addressIds)
          .gte(
            "created_at",
            new Date(Date.now() - rateLimitSeconds * 1000).toISOString()
          );

        if (veryRecentOrders && veryRecentOrders > 0) {
          return new Response(
            JSON.stringify({ error: "Please wait before placing another order." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ─── Fetch REAL product prices from database ───
    const productIds = items.map((i: any) => i.product_id);
    const uniqueProductIds = [...new Set(productIds)];

    const { data: products, error: productsError } = await adminClient
      .from("products")
      .select("id, name, price, stock_quantity, is_preorderable, is_active")
      .in("id", uniqueProductIds);

    if (productsError || !products) {
      return new Response(
        JSON.stringify({ error: "Failed to verify products" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Verify all products exist and are active
    let serverSubtotal = 0;
    const verifiedItems: Array<{
      product_id: string;
      product_name: string;
      product_price: number;
      quantity: number;
      is_preorder: boolean;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!product.is_active) {
        return new Response(
          JSON.stringify({ error: `Product "${product.name}" is no longer available` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const qty = Math.max(1, Math.min(100, Math.floor(Number(item.quantity) || 1)));

      // Check stock (allow preorder if enabled)
      const isPreorder = product.stock_quantity < qty && product.is_preorderable;
      if (product.stock_quantity < qty && !product.is_preorderable) {
        return new Response(
          JSON.stringify({
            error: `"${product.name}" has only ${product.stock_quantity} in stock`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use SERVER price, not client price
      serverSubtotal += product.price * qty;
      verifiedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: qty,
        is_preorder: isPreorder,
      });
    }

    // ─── Server-side shipping cost calculation ───
    let shippingCost = 0;
    if (shipping_method !== "pickup") {
      const { data: zone } = await adminClient
        .from("delivery_zones")
        .select("shipping_cost")
        .eq("district", address.district || "")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (zone) {
        shippingCost = zone.shipping_cost;
      } else {
        // Fallback: default shipping from checkout settings
        const { data: checkoutSettings } = await adminClient
          .from("checkout_settings")
          .select("default_shipping_cost, free_shipping_threshold")
          .limit(1)
          .single();

        shippingCost = checkoutSettings?.default_shipping_cost || 120;

        if (
          checkoutSettings?.free_shipping_threshold &&
          serverSubtotal >= checkoutSettings.free_shipping_threshold
        ) {
          shippingCost = 0;
        }
      }
    }

    // ─── Server-side promo code validation ───
    let promoDiscount = 0;
    let promoId: string | null = null;

    if (promo_code && typeof promo_code === "string" && promo_code.trim()) {
      const { data: promo } = await adminClient
        .from("promo_codes")
        .select("*")
        .eq("code", promo_code.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (promo) {
        const now = new Date();
        const notExpired = !promo.expires_at || new Date(promo.expires_at) > now;
        const notStarted = !promo.starts_at || new Date(promo.starts_at) <= now;
        const withinUsageLimit =
          !promo.usage_limit || promo.used_count < promo.usage_limit;
        const meetsMinOrder =
          !promo.min_order_amount || serverSubtotal >= promo.min_order_amount;

        if (notExpired && notStarted && withinUsageLimit && meetsMinOrder) {
          if (promo.discount_type === "percentage") {
            promoDiscount = Math.round(
              serverSubtotal * (promo.discount_value / 100)
            );
            if (promo.max_discount_amount && promoDiscount > promo.max_discount_amount) {
              promoDiscount = promo.max_discount_amount;
            }
          } else {
            promoDiscount = promo.discount_value;
          }
          promoId = promo.id;
        }
      }
    }

    // ─── COD extra charge ───
    let codCharge = 0;
    if (payment_method === "cod") {
      const { data: checkoutSettings } = await adminClient
        .from("checkout_settings")
        .select("cod_extra_charge")
        .limit(1)
        .single();

      codCharge = checkoutSettings?.cod_extra_charge || 0;
    }

    // ─── Calculate VERIFIED total ───
    const serverTotal = Math.max(0, serverSubtotal + shippingCost + codCharge - promoDiscount);

    // ─── Create address ───
    const guestPlaceholder = "00000000-0000-0000-0000-000000000001";
    const { data: savedAddress, error: addressError } = await adminClient
      .from("addresses")
      .insert({
        user_id: userId || guestPlaceholder,
        full_name: sanitizeString(address.full_name, 100),
        phone: cleanPhone,
        division: sanitizeString(address.division || "N/A", 50),
        district: sanitizeString(address.district || "N/A", 50),
        thana: sanitizeString(address.thana || "N/A", 50),
        address_line: sanitizeString(address.address_line || "Store Pickup", 300),
        is_default: !!userId,
      })
      .select()
      .single();

    if (addressError) {
      console.error("Address error:", addressError);
      return new Response(
        JSON.stringify({ error: "Failed to save address" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Build sanitized notes ───
    const noteParts = [
      notes ? sanitizeString(notes, 500) : null,
      !userId && address.email ? `Guest Email: ${sanitizeString(address.email, 100)}` : null,
      transaction_id ? `Txn: ${sanitizeString(transaction_id, 50)}` : null,
    ].filter(Boolean);
    const orderNotes = noteParts.length > 0 ? noteParts.join(" | ") : null;

    // ─── Create order with SERVER-VERIFIED totals ───
    const { data: orderData, error: orderError } = await adminClient
      .from("orders")
      .insert({
        user_id: userId,
        address_id: savedAddress.id,
        payment_method,
        payment_transaction_id: transaction_id
          ? sanitizeString(transaction_id, 50)
          : null,
        subtotal: serverSubtotal,
        shipping_cost: shippingCost,
        total: serverTotal,
        is_preorder: verifiedItems.some((i) => i.is_preorder),
        notes: orderNotes,
        promo_code_id: promoId,
        discount_amount: promoDiscount,
      } as any)
      .select()
      .single();

    if (orderError) {
      console.error("Order error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Create order items ───
    const orderItems = verifiedItems.map((item) => ({
      order_id: orderData.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: item.quantity,
      is_preorder: item.is_preorder,
    }));

    const { error: itemsError } = await adminClient
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      // Rollback order
      await adminClient.from("orders").delete().eq("id", orderData.id);
      return new Response(
        JSON.stringify({ error: "Failed to save order items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Update promo code usage ───
    if (promoId) {
      await adminClient.rpc("increment_promo_usage" as any, {
        promo_id: promoId,
      }).catch(() => {
        // Fallback: direct update
        adminClient
          .from("promo_codes")
          .update({ used_count: (body.promo_used_count || 0) + 1 } as any)
          .eq("id", promoId!)
          .then(() => {});
      });

      // Record usage
      await adminClient.from("promo_code_usage").insert({
        promo_code_id: promoId,
        order_id: orderData.id,
        user_id: userId,
        discount_amount: promoDiscount,
      } as any).catch(() => {});
    }

    // ─── Clear user's cart if logged in ───
    if (userId) {
      await adminClient.from("cart_items").delete().eq("user_id", userId);
    }

    // ─── Send order confirmation email (async, don't block) ───
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          orderId: orderData.id,
          type: "confirmation",
        }),
      });
    } catch {
      // Don't fail order for email issues
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderData.id,
        order_number: orderData.order_number,
        total: serverTotal,
        subtotal: serverSubtotal,
        shipping_cost: shippingCost,
        discount: promoDiscount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Order processing error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
