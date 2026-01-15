import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BkashConfig {
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
  sandbox: boolean;
}

class BkashService {
  private config: BkashConfig;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: BkashConfig) {
    this.config = config;
    this.baseUrl = config.sandbox
      ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
      : "https://tokenized.pay.bka.sh/v1.2.0-beta";
  }

  async grantToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.tokenExpiry > now) {
      return this.token;
    }

    console.log("Requesting bKash token...");
    
    const response = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "username": this.config.username,
        "password": this.config.password,
      },
      body: JSON.stringify({
        app_key: this.config.app_key,
        app_secret: this.config.app_secret,
      }),
    });

    const data = await response.json();
    console.log("Token response:", JSON.stringify(data));

    if (data.statusCode !== "0000") {
      throw new Error(data.statusMessage || "Failed to get bKash token");
    }

    this.token = data.id_token;
    this.tokenExpiry = now + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry
    return this.token!;
  }

  async createPayment(
    amount: number,
    orderId: string,
    callbackUrl: string
  ): Promise<any> {
    const token = await this.grantToken();

    console.log("Creating bKash payment for order:", orderId);

    const response = await fetch(`${this.baseUrl}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": token,
        "X-APP-Key": this.config.app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: orderId,
        callbackURL: callbackUrl,
        amount: amount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: orderId,
      }),
    });

    const data = await response.json();
    console.log("Create payment response:", JSON.stringify(data));

    if (data.statusCode !== "0000") {
      throw new Error(data.statusMessage || "Failed to create payment");
    }

    return data;
  }

  async executePayment(paymentID: string): Promise<any> {
    const token = await this.grantToken();

    console.log("Executing bKash payment:", paymentID);

    const response = await fetch(`${this.baseUrl}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": token,
        "X-APP-Key": this.config.app_key,
      },
      body: JSON.stringify({ paymentID }),
    });

    const data = await response.json();
    console.log("Execute payment response:", JSON.stringify(data));

    return data;
  }

  async queryPayment(paymentID: string): Promise<any> {
    const token = await this.grantToken();

    console.log("Querying bKash payment:", paymentID);

    const response = await fetch(`${this.baseUrl}/tokenized/checkout/payment/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": token,
        "X-APP-Key": this.config.app_key,
      },
      body: JSON.stringify({ paymentID }),
    });

    const data = await response.json();
    console.log("Query payment response:", JSON.stringify(data));

    return data;
  }

  async refundPayment(
    paymentID: string,
    trxID: string,
    amount: number,
    reason: string
  ): Promise<any> {
    const token = await this.grantToken();

    console.log("Refunding bKash payment:", paymentID);

    const response = await fetch(`${this.baseUrl}/tokenized/checkout/payment/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": token,
        "X-APP-Key": this.config.app_key,
      },
      body: JSON.stringify({
        paymentID,
        trxID,
        amount: amount.toFixed(2),
        reason,
        sku: "refund",
      }),
    });

    const data = await response.json();
    console.log("Refund response:", JSON.stringify(data));

    return data;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // Get bKash config from database
    const { data: providerData, error: configError } = await supabase
      .from("payment_providers")
      .select("*")
      .eq("provider_type", "bkash")
      .eq("is_active", true)
      .single();

    if (configError || !providerData) {
      console.error("bKash not configured:", configError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "bKash payment is not configured. Please set up bKash in admin panel." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse config from database
    const config: BkashConfig = {
      app_key: providerData.store_id || "",
      app_secret: providerData.store_password || "",
      username: providerData.config?.username || "",
      password: providerData.config?.password || "",
      sandbox: providerData.is_sandbox ?? true,
    };

    if (!config.app_key || !config.app_secret) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "bKash API credentials are not configured." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const bkash = new BkashService(config);

    if (action === "create" && req.method === "POST") {
      const { amount, orderId, callbackUrl } = await req.json();

      if (!amount || !orderId || !callbackUrl) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payment = await bkash.createPayment(amount, orderId, callbackUrl);

      // Save payment initiation to database
      await supabase.from("payment_transactions").insert({
        order_id: orderId,
        gateway_code: "bkash",
        transaction_id: payment.paymentID,
        amount,
        currency: "BDT",
        status: "pending",
        gateway_response: payment,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          paymentID: payment.paymentID,
          bkashURL: payment.bkashURL,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "execute" && req.method === "POST") {
      const { paymentID } = await req.json();

      if (!paymentID) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing paymentID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await bkash.executePayment(paymentID);

      // Update transaction status
      const status = result.statusCode === "0000" ? "completed" : "failed";
      await supabase
        .from("payment_transactions")
        .update({
          status,
          gateway_response: result,
          completed_at: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("transaction_id", paymentID);

      // If successful, update order status
      if (status === "completed") {
        const { data: txn } = await supabase
          .from("payment_transactions")
          .select("order_id")
          .eq("transaction_id", paymentID)
          .single();

        if (txn?.order_id) {
          await supabase
            .from("orders")
            .update({ 
              status: "confirmed",
              payment_transaction_id: result.trxID,
            })
            .eq("id", txn.order_id);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: result.statusCode === "0000",
          trxID: result.trxID,
          status,
          message: result.statusMessage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "query" && req.method === "POST") {
      const { paymentID } = await req.json();

      if (!paymentID) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing paymentID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await bkash.queryPayment(paymentID);

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refund" && req.method === "POST") {
      const { paymentID, trxID, amount, reason } = await req.json();

      if (!paymentID || !trxID || !amount) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await bkash.refundPayment(paymentID, trxID, amount, reason || "Refund");

      return new Response(
        JSON.stringify({ 
          success: result.statusCode === "0000",
          data: result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle callback from bKash
    if (action === "callback") {
      const params = url.searchParams;
      const paymentID = params.get("paymentID");
      const status = params.get("status");

      console.log("bKash callback received:", { paymentID, status });

      if (status === "success" && paymentID) {
        // Execute the payment
        const result = await bkash.executePayment(paymentID);
        
        // Get the order ID from transaction
        const { data: txn } = await supabase
          .from("payment_transactions")
          .select("order_id")
          .eq("transaction_id", paymentID)
          .single();

        // Redirect to order success page
        const redirectUrl = result.statusCode === "0000"
          ? `${url.origin}/order-success?orderId=${txn?.order_id}&trxId=${result.trxID}`
          : `${url.origin}/checkout?error=payment_failed`;

        return Response.redirect(redirectUrl, 302);
      }

      return Response.redirect(`${url.origin}/checkout?error=payment_cancelled`, 302);
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("bKash payment error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Payment processing failed" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
