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

  // Get callback URL based on current domain
  const getCallbackUrl = (gateway: string) => {
    const baseUrl = window.location.origin;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/${gateway}-payment/callback`;
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
        return { 
          success: false, 
          error: "bKash is not configured. Please use manual payment." 
        };
      }

      const callbackUrl = getCallbackUrl("bkash");
      
      const { data, error } = await supabase.functions.invoke("bkash-payment/create", {
        body: { amount, orderId, callbackUrl },
      });

      if (error) throw error;

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        paymentID: data.paymentID,
        bkashURL: data.bkashURL,
      };
    } catch (error: any) {
      console.error("bKash payment error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to initiate payment" 
      };
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
        return { 
          success: false, 
          error: "Nagad is not configured. Please use manual payment." 
        };
      }

      const callbackUrl = getCallbackUrl("nagad");
      
      const { data, error } = await supabase.functions.invoke("nagad-payment/create", {
        body: { amount, orderId, callbackUrl },
      });

      if (error) throw error;

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        paymentReferenceId: data.paymentReferenceId,
        callBackUrl: data.callBackUrl,
      };
    } catch (error: any) {
      console.error("Nagad payment error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to initiate payment" 
      };
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
    isAutomatedPaymentAvailable,
    redirectToPayment,
    checkProvider,
  };
};
