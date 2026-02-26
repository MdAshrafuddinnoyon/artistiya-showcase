import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  orderId?: string;
  to?: string;
  subject?: string;
  type: "confirmation" | "shipped" | "delivered" | "test";
  data?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Auth verification
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: EmailRequest = await req.json();
    console.log(`Processing ${body.type} email request`);

    // Fetch email settings from DB
    const { data: emailSettings } = await supabaseService
      .from("email_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!emailSettings?.is_enabled) {
      return new Response(
        JSON.stringify({ error: "Email notifications are disabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine provider and credentials
    const provider = emailSettings.provider || "resend";
    let result;

    if (body.type === "test") {
      // Test email
      const testTo = body.to;
      if (!testTo) {
        return new Response(
          JSON.stringify({ error: "Test email address required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const testHtml = buildTestEmailHtml(body.data?.order_number || "TEST-001", body.data?.customer_name || "Test Customer");

      if (provider === "smtp" || provider === "hostinger") {
        result = await sendViaSMTP(emailSettings, testTo, body.subject || "Test Email", testHtml);
      } else if (provider === "sendgrid") {
        result = await sendViaSendGrid(emailSettings, testTo, body.subject || "Test Email", testHtml);
      } else if (provider === "mailgun") {
        result = await sendViaMailgun(emailSettings, testTo, body.subject || "Test Email", testHtml);
      } else {
        result = await sendViaResend(emailSettings, testTo, body.subject || "Test Email", testHtml);
      }
    } else {
      // Order-based email
      const orderId = body.orderId;
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: "Order ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify order access
      const { data: isAdmin } = await supabaseService.rpc("is_admin", { check_user_id: user.id });
      const { data: order } = await supabaseService
        .from("orders")
        .select("*, addresses(*), order_items(*)")
        .eq("id", orderId)
        .single();

      if (!order) {
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (order.user_id !== user.id && !isAdmin) {
        return new Response(
          JSON.stringify({ error: "Unauthorized access" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check notification type enabled
      if (body.type === "confirmation" && !emailSettings.send_order_confirmation) {
        return new Response(JSON.stringify({ success: false, message: "Order confirmation emails disabled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (body.type === "shipped" && !emailSettings.send_shipping_update) {
        return new Response(JSON.stringify({ success: false, message: "Shipping update emails disabled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (body.type === "delivered" && !emailSettings.send_delivery_notification) {
        return new Response(JSON.stringify({ success: false, message: "Delivery notification emails disabled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get customer email
      let customerEmail = "";
      if (order.user_id) {
        const { data: customer } = await supabaseService
          .from("customers")
          .select("email")
          .eq("user_id", order.user_id)
          .maybeSingle();
        customerEmail = customer?.email || "";
      }

      if (!customerEmail) {
        return new Response(
          JSON.stringify({ error: "Customer email not found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const customerName = order.addresses?.full_name || "Customer";
      const subject = getSubject(body.type, order.order_number);
      const html = buildOrderEmailHtml(body.type, order, customerName);

      if (provider === "smtp" || provider === "hostinger") {
        result = await sendViaSMTP(emailSettings, customerEmail, subject, html);
      } else if (provider === "sendgrid") {
        result = await sendViaSendGrid(emailSettings, customerEmail, subject, html);
      } else if (provider === "mailgun") {
        result = await sendViaMailgun(emailSettings, customerEmail, subject, html);
      } else {
        result = await sendViaResend(emailSettings, customerEmail, subject, html);
      }
    }

    console.log("Email result:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Email error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Provider Functions ──

async function sendViaResend(settings: any, to: string, subject: string, html: string) {
  const apiKey = settings.resend_api_key;
  if (!apiKey) throw new Error("Resend API key not configured");

  const fromName = settings.from_name || "Artistiya";
  const fromEmail = settings.from_email || "onboarding@resend.dev";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
      reply_to: settings.reply_to_email || fromEmail,
    }),
  });

  return await res.json();
}

async function sendViaSMTP(settings: any, to: string, subject: string, html: string) {
  // For Hostinger SMTP, we use a lightweight HTTP-to-SMTP bridge approach
  // Since Deno doesn't have native SMTP, we fall back to Resend if available
  // In production PHP environment, PHPMailer handles this directly
  
  // Try Resend as fallback for edge function context
  if (settings.resend_api_key) {
    console.log("SMTP selected but running in edge function - using Resend fallback");
    return await sendViaResend(settings, to, subject, html);
  }

  throw new Error(
    "SMTP/Hostinger email requires the PHP backend. " +
    "In the current edge function environment, please configure Resend as the provider, " +
    "or migrate to the PHP backend where PHPMailer handles Hostinger SMTP directly."
  );
}

async function sendViaSendGrid(settings: any, to: string, subject: string, html: string) {
  const config = settings.config || {};
  const apiKey = config.sendgrid_api_key;
  if (!apiKey) throw new Error("SendGrid API key not configured");

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: settings.from_email || "noreply@artistiya.store",
        name: settings.from_name || "Artistiya",
      },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SendGrid error: ${errText}`);
  }
  return { provider: "sendgrid", status: "sent" };
}

async function sendViaMailgun(settings: any, to: string, subject: string, html: string) {
  const config = settings.config || {};
  const apiKey = config.mailgun_api_key;
  const domain = config.mailgun_domain;
  if (!apiKey || !domain) throw new Error("Mailgun API key or domain not configured");

  const formData = new FormData();
  formData.append("from", `${settings.from_name || "Artistiya"} <${settings.from_email || `noreply@${domain}`}>`);
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("html", html);

  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: formData,
  });

  return await res.json();
}

// ── Email HTML Builders ──

function getSubject(type: string, orderNumber: string): string {
  switch (type) {
    case "confirmation": return `Order Confirmed - #${orderNumber}`;
    case "shipped": return `Order Shipped - #${orderNumber}`;
    case "delivered": return `Order Delivered - #${orderNumber}`;
    default: return `Order Update - #${orderNumber}`;
  }
}

function buildTestEmailHtml(orderNumber: string, customerName: string): string {
  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;">
      <div style="background:#1a1a2e;padding:24px;text-align:center;">
        <h1 style="color:#C9A961;margin:0;font-size:24px;">Artistiya</h1>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#1a1a2e;">Test Email Successful ✅</h2>
        <p style="color:#333;line-height:1.6;">Hello <strong>${customerName}</strong>,</p>
        <p style="color:#333;line-height:1.6;">This is a test email from your store. If you received this, your email configuration is working correctly!</p>
        <div style="background:#f0f8ff;border-left:4px solid #2196F3;padding:12px 16px;margin:20px 0;border-radius:4px;">
          <strong>Test Order:</strong> #${orderNumber}<br>
          <strong>Status:</strong> Email delivery confirmed
        </div>
      </div>
      <div style="background:#f5f5f5;padding:16px 24px;text-align:center;color:#999;font-size:12px;">
        <p>&copy; ${new Date().getFullYear()} Artistiya. All rights reserved.</p>
      </div>
    </div>`;
}

function buildOrderEmailHtml(type: string, order: any, customerName: string): string {
  const items = (order.order_items || []).map((item: any) =>
    `<tr><td style="padding:8px;border:1px solid #ddd;">${item.product_name}</td>
     <td style="padding:8px;text-align:center;border:1px solid #ddd;">${item.quantity}</td>
     <td style="padding:8px;text-align:right;border:1px solid #ddd;">৳${(item.product_price * item.quantity).toLocaleString()}</td></tr>`
  ).join("");

  const statusTitle = type === "confirmation" ? "Order Confirmed ✅" :
                      type === "shipped" ? "Order Shipped 🚚" :
                      "Order Delivered 📦";

  const statusMessage = type === "confirmation"
    ? `Your order <strong>#${order.order_number}</strong> has been successfully placed.`
    : type === "shipped"
    ? `Your order <strong>#${order.order_number}</strong> has been shipped.${order.tracking_number ? ` Tracking: ${order.tracking_number}` : ""}`
    : `Your order <strong>#${order.order_number}</strong> has been delivered. Thank you for shopping with us!`;

  return `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;">
      <div style="background:#1a1a2e;padding:24px;text-align:center;">
        <h1 style="color:#C9A961;margin:0;font-size:24px;">Artistiya</h1>
      </div>
      <div style="padding:32px 24px;">
        <h2 style="color:#1a1a2e;">${statusTitle}</h2>
        <p style="color:#333;line-height:1.6;">Dear <strong>${customerName}</strong>,</p>
        <p style="color:#333;line-height:1.6;">${statusMessage}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="background:#f5f5f5;">
            <th style="padding:8px;text-align:left;border:1px solid #ddd;">Product</th>
            <th style="padding:8px;text-align:center;border:1px solid #ddd;">Qty</th>
            <th style="padding:8px;text-align:right;border:1px solid #ddd;">Price</th>
          </tr>
          ${items}
        </table>
        <table style="width:100%;margin:16px 0;">
          <tr><td style="padding:4px 0;color:#666;">Subtotal:</td><td style="text-align:right;">৳${Number(order.subtotal).toLocaleString()}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Shipping:</td><td style="text-align:right;">৳${Number(order.shipping_cost).toLocaleString()}</td></tr>
          <tr style="border-top:2px solid #1a1a2e;"><td style="padding:8px 0;font-weight:bold;font-size:18px;">Total:</td><td style="text-align:right;font-weight:bold;font-size:18px;color:#1a1a2e;">৳${Number(order.total).toLocaleString()}</td></tr>
        </table>
      </div>
      <div style="background:#f5f5f5;padding:16px 24px;text-align:center;color:#999;font-size:12px;">
        <p>&copy; ${new Date().getFullYear()} Artistiya. All rights reserved.</p>
      </div>
    </div>`;
}
