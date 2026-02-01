import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, CheckCircle, XCircle, User, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ClaimDiscount = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const qrId = searchParams.get("qr");
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "error" | "already_claimed" | "login_required">("success");
  const [discount, setDiscount] = useState({ type: "percentage", value: 5 });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const claimDiscount = async () => {
      if (!orderId || !qrId) {
        setStatus("error");
        setMessage("Invalid QR code");
        setLoading(false);
        return;
      }

      try {
        // Get QR settings
        const { data: settings, error: settingsError } = await supabase
          .from("qr_discount_settings")
          .select("*")
          .limit(1)
          .single();

        if (settingsError || !settings || !settings.is_active) {
          setStatus("error");
          setMessage("This promotion is not currently active");
          setLoading(false);
          return;
        }

        // Check if order exists and QR matches
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("id, qr_code_id, qr_discount_claimed, user_id")
          .eq("id", orderId)
          .single();

        if (orderError || !order) {
          setStatus("error");
          setMessage("Order not found");
          setLoading(false);
          return;
        }

        if (order.qr_code_id !== qrId) {
          setStatus("error");
          setMessage("Invalid QR code");
          setLoading(false);
          return;
        }

        if (order.qr_discount_claimed) {
          setStatus("already_claimed");
          setMessage("This discount has already been claimed");
          setLoading(false);
          return;
        }

        // User must be logged in to claim
        if (!user) {
          setStatus("login_required");
          setMessage("Please login or create an account to claim your discount");
          setLoading(false);
          return;
        }

        // Check usage limit
        const { count } = await supabase
          .from("customer_discount_credits")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("source", "qr_scan");

        if (count !== null && count >= settings.usage_limit_per_customer) {
          setStatus("error");
          setMessage("You have already claimed the maximum number of QR discounts");
          setLoading(false);
          return;
        }

        // Create discount credit
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + settings.expires_after_days);

        const { error: creditError } = await supabase
          .from("customer_discount_credits")
          .insert({
            user_id: user.id,
            order_id: orderId,
            discount_type: settings.discount_type,
            discount_value: settings.discount_value,
            expires_at: expiresAt.toISOString(),
            source: "qr_scan",
          });

        if (creditError) throw creditError;

        // Mark QR as claimed
        await supabase
          .from("orders")
          .update({
            qr_discount_claimed: true,
            qr_discount_claimed_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        setDiscount({
          type: settings.discount_type,
          value: settings.discount_value,
        });
        setMessage(settings.message);
        setStatus("success");
      } catch (error) {
        console.error("Error claiming discount:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    claimDiscount();
  }, [orderId, qrId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-24">
          <div className="container mx-auto px-4 max-w-md text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-24 w-24 bg-muted rounded-full mx-auto" />
              <div className="h-6 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            </div>
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
        <div className="container mx-auto px-4 max-w-md text-center">
          {status === "success" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="h-24 w-24 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
                <Gift className="h-12 w-12 text-green-500" />
              </div>
              <h1 className="font-display text-3xl text-foreground">
                Congratulations! 🎉
              </h1>
              <p className="text-muted-foreground">{message}</p>

              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Your Discount
                </p>
                <p className="text-4xl font-bold text-gold">
                  {discount.type === "percentage"
                    ? `${discount.value}%`
                    : `৳${discount.value}`}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Off your next order
                </p>
              </div>

              <Link to="/shop">
                <Button variant="gold" className="w-full">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </motion.div>
          )}

          {status === "already_claimed" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="h-24 w-24 bg-yellow-500/20 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-yellow-500" />
              </div>
              <h1 className="font-display text-2xl text-foreground">
                Already Claimed
              </h1>
              <p className="text-muted-foreground">{message}</p>
              <Link to="/shop">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </motion.div>
          )}

          {status === "login_required" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="h-24 w-24 bg-gold/20 rounded-full mx-auto flex items-center justify-center">
                <User className="h-12 w-12 text-gold" />
              </div>
              <h1 className="font-display text-2xl text-foreground">
                Login to Claim
              </h1>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex gap-3 justify-center">
                <Link to={`/auth?redirect=/claim-discount?orderId=${orderId}&qr=${qrId}`}>
                  <Button variant="gold">Login</Button>
                </Link>
                <Link to={`/auth?mode=signup&redirect=/claim-discount?orderId=${orderId}&qr=${qrId}`}>
                  <Button variant="outline">Create Account</Button>
                </Link>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="h-24 w-24 bg-red-500/20 rounded-full mx-auto flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="font-display text-2xl text-foreground">Oops!</h1>
              <p className="text-muted-foreground">{message}</p>
              <Link to="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClaimDiscount;