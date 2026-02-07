import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NagadConfig {
  merchant_id: string;
  public_key: string;
  private_key: string;
  sandbox: boolean;
}

// Helper to generate random string
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to format date for Nagad
function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

class NagadService {
  private config: NagadConfig;
  private baseUrl: string;

  constructor(config: NagadConfig) {
    this.config = config;
    this.baseUrl = config.sandbox
      ? "https://sandbox.mynagad.com:10061/remote-payment-gateway-1.0/api/dfs"
      : "https://api.mynagad.com/api/dfs";
  }

  // RSA encryption with public key
  async encryptWithPublicKey(data: string): Promise<string> {
    try {
      const pemHeader = "-----BEGIN PUBLIC KEY-----";
      const pemFooter = "-----END PUBLIC KEY-----";
      let pemContents = this.config.public_key;
      
      if (pemContents.includes(pemHeader)) {
        pemContents = pemContents
          .replace(pemHeader, "")
          .replace(pemFooter, "")
          .replace(/\s/g, "");
      }

      const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
      
      const publicKey = await crypto.subtle.importKey(
        "spki",
        binaryKey,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"]
      );

      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encodedData
      );

      return encode(encrypted);
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  // Generate signature with private key
  async signData(data: string): Promise<string> {
    try {
      const pemHeader = "-----BEGIN PRIVATE KEY-----";
      const pemFooter = "-----END PRIVATE KEY-----";
      let pemContents = this.config.private_key;
      
      if (pemContents.includes(pemHeader)) {
        pemContents = pemContents
          .replace(pemHeader, "")
          .replace(pemFooter, "")
          .replace(/\s/g, "");
      }

      const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
      
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      
      const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        encodedData
      );

      return encode(signature);
    } catch (error) {
      console.error("Signing error:", error);
      throw new Error("Failed to sign data");
    }
  }

  async initializePayment(
    amount: number,
    orderId: string,
    callbackUrl: string
  ): Promise<any> {
    const dateTime = formatDate(new Date());
    const challenge = generateRandomString(40);
    
    const sensitiveData = {
      merchantId: this.config.merchant_id,
      datetime: dateTime,
      orderId: orderId,
      challenge: challenge,
    };

    console.log("Initializing Nagad payment for order:", orderId);

    const encryptedData = await this.encryptWithPublicKey(JSON.stringify(sensitiveData));
    const signature = await this.signData(JSON.stringify(sensitiveData));

    const response = await fetch(
      `${this.baseUrl}/check-out/initialize/${this.config.merchant_id}/${orderId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
          "X-KM-Api-Version": "v-0.2.0",
        },
        body: JSON.stringify({
          dateTime,
          sensitiveData: encryptedData,
          signature,
        }),
      }
    );

    const data = await response.json();
    console.log("Initialize response:", JSON.stringify(data));

    if (data.reason) {
      throw new Error(data.reason);
    }

    return {
      ...data,
      challenge,
    };
  }

  async completePayment(
    paymentReferenceId: string,
    challenge: string,
    amount: number,
    orderId: string,
    callbackUrl: string
  ): Promise<any> {
    const dateTime = formatDate(new Date());

    const sensitiveData = {
      merchantId: this.config.merchant_id,
      orderId: orderId,
      currencyCode: "050", // BDT
      amount: amount.toFixed(2),
      challenge: challenge,
    };

    console.log("Completing Nagad payment:", paymentReferenceId);

    const encryptedData = await this.encryptWithPublicKey(JSON.stringify(sensitiveData));
    const signature = await this.signData(JSON.stringify(sensitiveData));

    const response = await fetch(
      `${this.baseUrl}/check-out/complete/${paymentReferenceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
          "X-KM-Api-Version": "v-0.2.0",
        },
        body: JSON.stringify({
          dateTime,
          sensitiveData: encryptedData,
          signature,
          merchantCallbackURL: callbackUrl,
        }),
      }
    );

    const data = await response.json();
    console.log("Complete response:", JSON.stringify(data));

    return data;
  }

  async verifyPayment(paymentReferenceId: string): Promise<any> {
    console.log("Verifying Nagad payment:", paymentReferenceId);

    const response = await fetch(
      `${this.baseUrl}/verify/payment/${paymentReferenceId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
          "X-KM-Api-Version": "v-0.2.0",
        },
      }
    );

    const data = await response.json();
    console.log("Verify response:", JSON.stringify(data));

    return data;
  }
}

// Helper function to authenticate user and verify order ownership
async function authenticateAndVerifyOrder(
  req: Request,
  supabase: any,
  orderId: string,
  requirePendingStatus: boolean = true
): Promise<{ user: any; order: any; error?: Response }> {
  // Check for authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      user: null,
      order: null,
      error: new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // Verify JWT token
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    console.error("Auth error:", claimsError);
    return {
      user: null,
      order: null,
      error: new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const userId = claimsData.claims.sub;

  // Verify order exists and belongs to user
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status, total")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("Order not found:", orderError);
    return {
      user: null,
      order: null,
      error: new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // Verify order ownership
  if (order.user_id !== userId) {
    console.error("Order ownership mismatch:", { orderUserId: order.user_id, requestUserId: userId });
    return {
      user: null,
      order: null,
      error: new Response(
        JSON.stringify({ success: false, error: "Unauthorized access to order" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // Check order status if required
  if (requirePendingStatus && order.status !== "pending") {
    return {
      user: null,
      order: null,
      error: new Response(
        JSON.stringify({ success: false, error: "Order already processed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  return { user: { id: userId }, order, error: undefined };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // Get Nagad config from database
    const { data: providerData, error: configError } = await supabaseService
      .from("payment_providers")
      .select("*")
      .eq("provider_type", "nagad")
      .eq("is_active", true)
      .single();

    if (configError || !providerData) {
      console.error("Nagad not configured:", configError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nagad payment is not configured. Please set up Nagad in admin panel." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse config from database
    const config: NagadConfig = {
      merchant_id: providerData.store_id || "",
      public_key: providerData.config?.public_key || "",
      private_key: providerData.config?.private_key || "",
      sandbox: providerData.is_sandbox ?? true,
    };

    if (!config.merchant_id || !config.public_key || !config.private_key) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nagad API credentials are not configured." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const nagad = new NagadService(config);

    if (action === "create" && req.method === "POST") {
      const { amount, orderId, callbackUrl } = await req.json();

      if (!amount || !orderId || !callbackUrl) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Authenticate user and verify order ownership
      const { order, error: authError } = await authenticateAndVerifyOrder(
        req,
        supabaseAuth,
        orderId,
        true // Require pending status
      );

      if (authError) {
        return authError;
      }

      // Step 1: Initialize payment
      const initResponse = await nagad.initializePayment(amount, orderId, callbackUrl);
      
      // Step 2: Complete payment
      const completeResponse = await nagad.completePayment(
        initResponse.paymentReferenceId,
        initResponse.challenge,
        amount,
        orderId,
        callbackUrl
      );

      // Save payment initiation to database
      await supabaseService.from("payment_transactions").insert({
        order_id: orderId,
        gateway_code: "nagad",
        transaction_id: initResponse.paymentReferenceId,
        amount,
        currency: "BDT",
        status: "pending",
        gateway_response: { init: initResponse, complete: completeResponse },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          paymentReferenceId: initResponse.paymentReferenceId,
          callBackUrl: completeResponse.callBackUrl,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify" && req.method === "POST") {
      const { paymentReferenceId, orderId } = await req.json();

      if (!paymentReferenceId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing paymentReferenceId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If orderId provided, verify ownership
      if (orderId) {
        const { error: authError } = await authenticateAndVerifyOrder(
          req,
          supabaseAuth,
          orderId,
          false // Don't require pending status for verify
        );

        if (authError) {
          return authError;
        }
      }

      const result = await nagad.verifyPayment(paymentReferenceId);

      // Update transaction status
      const status = result.status === "Success" ? "completed" : "failed";
      await supabaseService
        .from("payment_transactions")
        .update({
          status,
          gateway_response: result,
          completed_at: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("transaction_id", paymentReferenceId);

      // If successful, update order status
      if (status === "completed") {
        const { data: txn } = await supabaseService
          .from("payment_transactions")
          .select("order_id")
          .eq("transaction_id", paymentReferenceId)
          .single();

        if (txn?.order_id) {
          await supabaseService
            .from("orders")
            .update({ 
              status: "confirmed",
              payment_transaction_id: result.issuerPaymentRefNo,
            })
            .eq("id", txn.order_id);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: result.status === "Success",
          data: result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle callback from Nagad - remains unauthenticated as it comes from Nagad servers
    if (action === "callback") {
      const params = url.searchParams;
      const paymentReferenceId = params.get("payment_ref_id");
      const status = params.get("status");

      console.log("Nagad callback received:", { paymentReferenceId, status });

      if (paymentReferenceId) {
        // Verify the payment
        const result = await nagad.verifyPayment(paymentReferenceId);
        
        // Update transaction
        const txnStatus = result.status === "Success" ? "completed" : "failed";
        await supabaseService
          .from("payment_transactions")
          .update({
            status: txnStatus,
            gateway_response: result,
            completed_at: txnStatus === "completed" ? new Date().toISOString() : null,
          })
          .eq("transaction_id", paymentReferenceId);

        // Get order ID
        const { data: txn } = await supabaseService
          .from("payment_transactions")
          .select("order_id")
          .eq("transaction_id", paymentReferenceId)
          .single();

        if (txnStatus === "completed" && txn?.order_id) {
          await supabaseService
            .from("orders")
            .update({ 
              status: "confirmed",
              payment_transaction_id: result.issuerPaymentRefNo,
            })
            .eq("id", txn.order_id);
        }

        // Redirect to appropriate page
        const redirectUrl = txnStatus === "completed"
          ? `${url.origin}/order-success?orderId=${txn?.order_id}`
          : `${url.origin}/checkout?error=payment_failed`;

        return Response.redirect(redirectUrl, 302);
      }

      return Response.redirect(`${url.origin}/checkout?error=payment_error`, 302);
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Nagad payment error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Payment processing failed" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
