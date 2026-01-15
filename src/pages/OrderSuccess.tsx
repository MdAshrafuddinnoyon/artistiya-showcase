import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Package, ArrowRight, Home, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

interface OrderDetails {
  id: string;
  order_number: string;
  total: number;
  payment_method: string;
  payment_transaction_id: string | null;
  status: string;
  created_at: string;
}

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId");
  const trxId = searchParams.get("trxId");
  const paymentError = searchParams.get("error");

  useEffect(() => {
    if (paymentError) {
      setError(paymentError === "payment_failed" 
        ? (language === "bn" ? "পেমেন্ট ব্যর্থ হয়েছে" : "Payment failed")
        : (language === "bn" ? "পেমেন্ট বাতিল হয়েছে" : "Payment was cancelled"));
      setLoading(false);
      return;
    }

    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId, paymentError]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("id, order_number, total, payment_method, payment_transaction_id, status, created_at")
        .eq("id", orderId)
        .single();

      if (fetchError) throw fetchError;
      setOrder(data);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(language === "bn" ? "অর্ডার খুঁজে পাওয়া যায়নি" : "Order not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-24">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mb-6"
            >
              <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <span className="text-4xl">❌</span>
              </div>
            </motion.div>
            
            <h1 className="font-display text-3xl text-foreground mb-4">
              {language === "bn" ? "পেমেন্ট সমস্যা" : "Payment Issue"}
            </h1>
            
            <p className="text-muted-foreground mb-8">{error}</p>

            <Button variant="gold" onClick={() => navigate("/checkout")}>
              {language === "bn" ? "আবার চেষ্টা করুন" : "Try Again"}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="mb-6"
            >
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-2 -right-2 bg-gold text-background rounded-full p-2"
                >
                  ✓
                </motion.div>
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl md:text-4xl text-foreground mb-3"
            >
              {language === "bn" ? "অর্ডার সফল হয়েছে!" : "Order Confirmed!"}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              {language === "bn" 
                ? "আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে"
                : "Your order has been successfully placed"}
            </motion.p>
          </div>

          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-gold" />
                <span className="font-medium">
                  {language === "bn" ? "অর্ডার নম্বর" : "Order Number"}
                </span>
              </div>
              <span className="text-xl font-bold text-gold">
                {order?.order_number || "N/A"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {language === "bn" ? "মোট মূল্য" : "Total Amount"}
                </p>
                <p className="text-lg font-semibold">
                  ৳{order?.total?.toLocaleString() || 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {language === "bn" ? "পেমেন্ট" : "Payment"}
                </p>
                <p className="text-lg font-semibold capitalize">
                  {order?.payment_method === "cod" 
                    ? (language === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery")
                    : order?.payment_method?.toUpperCase()}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {language === "bn" ? "স্ট্যাটাস" : "Status"}
                </p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {order?.status === "confirmed" 
                    ? (language === "bn" ? "কনফার্মড" : "Confirmed")
                    : (language === "bn" ? "পেন্ডিং" : "Pending")}
                </span>
              </div>

              {(trxId || order?.payment_transaction_id) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === "bn" ? "ট্রানজেকশন আইডি" : "Transaction ID"}
                  </p>
                  <p className="text-sm font-mono">
                    {trxId || order?.payment_transaction_id}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gold/5 border border-gold/20 rounded-xl p-6 mb-8"
          >
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-gold" />
              {language === "bn" ? "পরবর্তী কী হবে?" : "What's Next?"}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">1.</span>
                {language === "bn" 
                  ? "আমরা আপনার অর্ডার প্রসেস করব এবং শীঘ্রই কনফার্মেশন কল করব"
                  : "We'll process your order and call you shortly to confirm"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">2.</span>
                {language === "bn"
                  ? "আপনার প্রোডাক্ট ২-৫ কার্যদিবসের মধ্যে ডেলিভারি হবে"
                  : "Your product will be delivered within 2-5 business days"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">3.</span>
                {language === "bn"
                  ? "ট্র্যাক অর্ডার পেজ থেকে আপনার অর্ডার ট্র্যাক করতে পারবেন"
                  : "Track your order status from the Track Order page"}
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button 
              variant="gold" 
              className="flex-1"
              onClick={() => navigate("/track")}
            >
              <Package className="h-4 w-4 mr-2" />
              {language === "bn" ? "অর্ডার ট্র্যাক করুন" : "Track Order"}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate("/shop")}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {language === "bn" ? "আরও শপিং করুন" : "Continue Shopping"}
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              {language === "bn" ? "হোম" : "Home"}
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
