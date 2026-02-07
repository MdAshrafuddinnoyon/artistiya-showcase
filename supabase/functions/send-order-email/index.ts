import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  orderId: string;
  type: "confirmation" | "shipped" | "delivered";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured. Please add it in admin settings.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create service client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create anon client for auth verification
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { orderId, type }: OrderEmailRequest = await req.json();
    console.log(`Processing ${type} email for order: ${orderId}`);

    // Authenticate user
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Fetch order
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select(`*, address:addresses (*), order_items (*)`)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify order ownership OR admin access
    const { data: isAdmin } = await supabaseService.rpc("is_admin", { check_user_id: userId });
    
    if (order.user_id !== userId && !isAdmin) {
      console.error("Order ownership mismatch:", { orderUserId: order.user_id, requestUserId: userId });
      return new Response(
        JSON.stringify({ error: "Unauthorized access to order" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerName = order.address?.full_name || "Customer";
    
    // Build email via Resend API directly
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "artistiya.store <onboarding@resend.dev>",
        to: ["orders@artistiya.store"],
        subject: `Order ${type === "confirmation" ? "Confirmed" : type === "shipped" ? "Shipped" : "Delivered"} - #${order.order_number}`,
        html: `<h1>Order ${type}</h1><p>Order #${order.order_number} for ${customerName}</p><p>Total: ৳${order.total}</p>`,
      }),
    });

    const emailData = await emailRes.json();
    console.log("Email response:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
