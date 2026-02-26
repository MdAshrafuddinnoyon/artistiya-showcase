import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentProvider {
  id: string;
  name: string;
  provider_type: string;
  is_active: boolean;
  is_sandbox: boolean;
}

interface CreatePaymentResponse {
  success: boolean;
  paymentID?: string;
  bkashURL?: string;
  paymentReferenceId?: string;
  callBackUrl?: string;
  gatewayUrl?: string;
  sessionKey?: string;
  sp_order_id?: string;
  error?: string;
}

export const usePayment = () => {
  const [loading, setLoading] = useState(false);

  // Check if a payment provider is configured and active
  const checkProvider = async (providerType: string): Promise<PaymentProvider | null> => {
    const { data } = await supabase
      .from("payment_providers")
      .select("*")
      .eq("provider_type", providerType)
      .eq("is_active", true)
      .single();

    return data;
  };

  // Initiate bKash payment
  const initiateBkashPayment = async (
    amount: number,
    orderId: string
  ): Promise<CreatePaymentResponse> => {
    setLoading(true);
    try {
      const provider = await checkProvider("bkash");
      if (!provider) {
        return { success: false, error: "bKash is not configured. Please use manual payment." };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const callbackUrl = `${supabaseUrl}/functions/v1/bkash-payment/callback`;

      const { data, error } = await supabase.functions.invoke("bkash-payment/create", {
        body: { amount, orderId, callbackUrl },
      });

      if (error) throw error;
      if (!data.success) return { success: false, error: data.error };

      return { success: true, paymentID: data.paymentID, bkashURL: data.bkashURL };
    } catch (error: any) {
      console.error("bKash payment error:", error);
      return { success: false, error: error.message || "Failed to initiate payment" };
    } finally {
      setLoading(false);
    }
  };

  // Initiate Nagad payment
  const initiateNagadPayment = async (
    amount: number,
    orderId: string
  ): Promise<CreatePaymentResponse> => {
    setLoading(true);
    try {
      const provider = await checkProvider("nagad");
      if (!provider) {
        return { success: false, error: "Nagad is not configured. Please use manual payment." };
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const callbackUrl = `${supabaseUrl}/functions/v1/nagad-payment/callback`;

      const { data, error } = await supabase.functions.invoke("nagad-payment/create", {
        body: { amount, orderId, callbackUrl },
      });

      if (error) throw error;
      if (!data.success) return { success: false, error: data.error };

      return { success: true, paymentReferenceId: data.paymentReferenceId, callBackUrl: data.callBackUrl };
    } catch (error: any) {
      console.error("Nagad payment error:", error);
      return { success: false, error: error.message || "Failed to initiate payment" };
    } finally {
      setLoading(false);
    }
  };

  // Initiate SSLCommerz payment
  // Docs: https://developer.sslcommerz.com/doc/v4/
  // Flow: init → GatewayPageURL redirect → callback (success/fail/cancel/ipn) → Validation API
  const initiateSSLCommerzPayment = async (
    orderId: string
  ): Promise<CreatePaymentResponse> => {
    setLoading(true);
    try {
      const provider = await checkProvider("sslcommerz");
      if (!provider) {
        return { success: false, error: "SSLCommerz is not configured." };
      }

      const { data, error } = await supabase.functions.invoke("sslcommerz-payment", {
        body: { action: "init", orderId, provider_id: provider.id },
      });

      if (error) throw error;
      if (!data?.success) return { success: false, error: data?.error || "SSLCommerz initialization failed" };

      return { success: true, gatewayUrl: data.gatewayUrl, sessionKey: data.sessionKey };
    } catch (error: any) {
      console.error("SSLCommerz payment error:", error);
      return { success: false, error: error.message || "Failed to initiate SSLCommerz payment" };
    } finally {
      setLoading(false);
    }
  };

  // Initiate AamarPay payment
  // Flow: init → payment_url redirect → callback → verify
  const initiateAamarPayPayment = async (
    orderId: string
  ): Promise<CreatePaymentResponse> => {
    setLoading(true);
    try {
      const provider = await checkProvider("aamarpay");
      if (!provider) {
        return { success: false, error: "AamarPay is not configured." };
      }

      const { data, error } = await supabase.functions.invoke("aamarpay-payment", {
        body: { action: "init", orderId, provider_id: provider.id },
      });

      if (error) throw error;
      if (!data?.success) return { success: false, error: data?.error || "AamarPay initialization failed" };

      return { success: true, gatewayUrl: data.gatewayUrl };
    } catch (error: any) {
      console.error("AamarPay payment error:", error);
      return { success: false, error: error.message || "Failed to initiate AamarPay payment" };
    } finally {
      setLoading(false);
    }
  };

  // Initiate SurjoPay payment
  // Docs: https://shurjopay.com.bd/developers/shurjopay-restapi
  // Flow: init (get_token → execute) → checkout_url redirect → return callback → verification
  const initiateSurjoPayPayment = async (
    orderId: string
  ): Promise<CreatePaymentResponse> => {
    setLoading(true);
    try {
      const provider = await checkProvider("surjopay");
      if (!provider) {
        return { success: false, error: "SurjoPay is not configured." };
      }

      const { data, error } = await supabase.functions.invoke("surjopay-payment", {
        body: { action: "init", orderId, provider_id: provider.id },
      });

      if (error) throw error;
      if (!data?.success) return { success: false, error: data?.error || "SurjoPay initialization failed" };

      return { success: true, gatewayUrl: data.gatewayUrl, sp_order_id: data.sp_order_id };
    } catch (error: any) {
      console.error("SurjoPay payment error:", error);
      return { success: false, error: error.message || "Failed to initiate SurjoPay payment" };
    } finally {
      setLoading(false);
    }
  };

  // Check if automated payment is available
  const isAutomatedPaymentAvailable = async (providerType: string): Promise<boolean> => {
    const provider = await checkProvider(providerType);
    return !!provider;
  };

  // Redirect to payment gateway
  const redirectToPayment = (url: string) => {
    window.location.href = url;
  };

  return {
    loading,
    initiateBkashPayment,
    initiateNagadPayment,
    initiateSSLCommerzPayment,
    initiateAamarPayPayment,
    initiateSurjoPayPayment,
    isAutomatedPaymentAvailable,
    redirectToPayment,
    checkProvider,
  };
};
