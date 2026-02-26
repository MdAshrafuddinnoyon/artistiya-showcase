import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SMSRequest {
  phone: string;
  message: string;
  type: "order_confirmation" | "shipping_update" | "delivery_notification" | "otp" | "test" | "custom";
  orderId?: string;
  otp_code?: string;
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

    const body: SMSRequest = await req.json();
    const { phone, message, type } = body;

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "Phone and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch SMS settings
    const { data: smsSettings } = await supabaseService
      .from("sms_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!smsSettings?.is_enabled) {
      return new Response(
        JSON.stringify({ error: "SMS notifications are disabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification type is enabled
    if (type === "order_confirmation" && !smsSettings.send_order_confirmation) {
      return new Response(JSON.stringify({ success: false, message: "Order SMS disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (type === "shipping_update" && !smsSettings.send_shipping_update) {
      return new Response(JSON.stringify({ success: false, message: "Shipping SMS disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (type === "delivery_notification" && !smsSettings.send_delivery_notification) {
      return new Response(JSON.stringify({ success: false, message: "Delivery SMS disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (type === "otp" && !smsSettings.send_otp) {
      return new Response(JSON.stringify({ success: false, message: "OTP SMS disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const provider = smsSettings.provider || "twilio";
    const config = (smsSettings.config || {}) as Record<string, string>;
    let result: any;

    switch (provider) {
      case "twilio":
        result = await sendViaTwilio(smsSettings, phone, message);
        break;
      case "firebase":
        result = await sendViaFirebase(smsSettings, config, phone, message);
        break;
      case "bulksmsbd":
        result = await sendViaBulkSMSBD(smsSettings, phone, message);
        break;
      case "smsq":
        result = await sendViaSMSQ(smsSettings, phone, message);
        break;
      case "greenweb":
        result = await sendViaGreenWeb(smsSettings, phone, message);
        break;
      case "infobip":
        result = await sendViaInfobip(smsSettings, phone, message);
        break;
      case "nexmo":
        result = await sendViaNexmo(smsSettings, phone, message);
        break;
      case "custom":
        result = await sendViaCustom(smsSettings, config, phone, message);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${provider}`);
    }

    // Log the SMS
    await supabaseService.from("sms_log").insert({
      phone,
      message,
      sms_type: type,
      provider,
      status: result.success ? "sent" : "failed",
      response_data: result,
      order_id: body.orderId || null,
    }).catch((err: any) => console.error("SMS log error:", err));

    console.log(`SMS [${type}] via ${provider} to ${phone}: ${result.success ? "OK" : "FAIL"}`);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("SMS error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send SMS" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Provider Implementations ──

async function sendViaTwilio(settings: any, phone: string, message: string) {
  const accountSid = settings.api_key;
  const authToken = settings.api_secret;
  const from = settings.sender_id;

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio credentials not configured (Account SID, Auth Token, From Number)");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({ To: phone, From: from, Body: message });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio error: ${data.message || JSON.stringify(data)}`);
  return { success: true, provider: "twilio", sid: data.sid };
}

async function sendViaFirebase(settings: any, config: Record<string, string>, phone: string, message: string) {
  // Firebase Cloud Messaging (FCM) for SMS via Firebase Auth or a custom Cloud Function
  // This sends via a Firebase Cloud Function endpoint that handles SMS dispatch
  const firebaseProjectId = config.firebase_project_id;
  const firebaseFunctionUrl = config.firebase_function_url;
  const firebaseApiKey = settings.api_key;

  if (!firebaseApiKey) {
    throw new Error("Firebase API key not configured");
  }

  if (firebaseFunctionUrl) {
    // Custom Firebase Cloud Function endpoint
    const res = await fetch(firebaseFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firebaseApiKey}`,
      },
      body: JSON.stringify({ phone, message }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Firebase SMS error [${res.status}]: ${JSON.stringify(data)}`);
    return { success: true, provider: "firebase", data };
  }

  // Firebase Identity Platform - send verification code (OTP only)
  if (!firebaseProjectId) {
    throw new Error("Firebase project ID or function URL required");
  }

  const identityUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${firebaseApiKey}`;
  const res = await fetch(identityUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: phone }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Firebase Identity error [${res.status}]: ${JSON.stringify(data)}`);
  return { success: true, provider: "firebase", sessionInfo: data.sessionInfo };
}

async function sendViaBulkSMSBD(settings: any, phone: string, message: string) {
  const apiKey = settings.api_key;
  const senderId = settings.sender_id || "BulkSMS";
  if (!apiKey) throw new Error("BulkSMSBD API key not configured");

  const url = `https://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(apiKey)}&type=text&number=${encodeURIComponent(phone)}&senderid=${encodeURIComponent(senderId)}&message=${encodeURIComponent(message)}`;

  const res = await fetch(url);
  const data = await res.json();
  return { success: true, provider: "bulksmsbd", data };
}

async function sendViaSMSQ(settings: any, phone: string, message: string) {
  const apiKey = settings.api_key;
  const senderId = settings.sender_id || "SMSQ";
  if (!apiKey) throw new Error("SMSQ API key not configured");

  const res = await fetch("https://api.smsq.global/api/v2/SendSMS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      SenderId: senderId,
      MobileNumbers: phone,
      Message: message,
      ApiKey: apiKey,
    }),
  });

  const data = await res.json();
  return { success: true, provider: "smsq", data };
}

async function sendViaGreenWeb(settings: any, phone: string, message: string) {
  const token = settings.api_key;
  if (!token) throw new Error("Green Web token not configured");

  const res = await fetch("http://api.greenweb.com.bd/api.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token,
      to: phone,
      message,
    }).toString(),
  });

  const text = await res.text();
  return { success: true, provider: "greenweb", response: text };
}

async function sendViaInfobip(settings: any, phone: string, message: string) {
  const apiKey = settings.api_key;
  const baseUrl = (settings.config as any)?.infobip_base_url || "https://api.infobip.com";
  if (!apiKey) throw new Error("Infobip API key not configured");

  const res = await fetch(`${baseUrl}/sms/2/text/advanced`, {
    method: "POST",
    headers: {
      Authorization: `App ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [{
        from: settings.sender_id || "Artistiya",
        destinations: [{ to: phone }],
        text: message,
      }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Infobip error: ${JSON.stringify(data)}`);
  return { success: true, provider: "infobip", data };
}

async function sendViaNexmo(settings: any, phone: string, message: string) {
  const apiKey = settings.api_key;
  const apiSecret = settings.api_secret;
  if (!apiKey || !apiSecret) throw new Error("Vonage API key/secret not configured");

  const res = await fetch("https://rest.nexmo.com/sms/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      api_secret: apiSecret,
      from: settings.sender_id || "Artistiya",
      to: phone,
      text: message,
    }),
  });

  const data = await res.json();
  return { success: true, provider: "nexmo", data };
}

async function sendViaCustom(settings: any, config: Record<string, string>, phone: string, message: string) {
  const customUrl = config.custom_url;
  if (!customUrl) throw new Error("Custom SMS API URL not configured");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (settings.api_key) headers["X-API-Key"] = settings.api_key;
  if (settings.api_key) headers["Authorization"] = `Bearer ${settings.api_key}`;

  const res = await fetch(customUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      phone,
      message,
      sender_id: settings.sender_id,
      api_key: settings.api_key,
      api_secret: settings.api_secret,
    }),
  });

  const data = await res.json().catch(() => ({ status: res.status }));
  if (!res.ok) throw new Error(`Custom SMS error [${res.status}]: ${JSON.stringify(data)}`);
  return { success: true, provider: "custom", data };
}
