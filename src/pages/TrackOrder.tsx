import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  shipping_cost: number;
  payment_method: string;
  notes: string | null;
  address: {
    full_name: string;
    phone: string;
    division: string;
    district: string;
    thana: string;
    address_line: string;
  } | null;
  items: {
    product_name: string;
    quantity: number;
    product_price: number;
  }[];
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Clock },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [notFound, setNotFound] = useState(false);

  const trackOrder = async () => {
    if (!orderNumber.trim()) {
      toast.error("Please enter an order number");
      return;
    }

    setLoading(true);
    setNotFound(false);
    setOrder(null);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, total, created_at, shipping_cost, payment_method, notes,
          address:addresses(full_name, phone, division, district, thana, address_line),
          items:order_items(product_name, quantity, product_price)
        `)
        .eq("order_number", orderNumber.toUpperCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOrder(data as unknown as OrderDetails);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error tracking order:", error);
      toast.error("Failed to track order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex((step) => step.key === status);
    return index >= 0 ? index : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              Order Status
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-4 mb-4">
              Track Your Order
            </h1>
            <p className="text-muted-foreground">
              Enter your order number to track the status of your order.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md mx-auto mb-12"
          >
            <div className="flex gap-2">
              <Input
                placeholder="Enter order number (e.g., ART-20260114-1234)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && trackOrder()}
                className="flex-1"
              />
              <Button variant="gold" onClick={trackOrder} disabled={loading}>
                {loading ? (
                  <div className="h-5 w-5 animate-spin border-2 border-background border-t-transparent rounded-full" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </Button>
            </div>
          </motion.div>

          {/* Not Found */}
          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">
                Order Not Found
              </h3>
              <p className="text-muted-foreground">
                We couldn't find an order with that number. Please check and try again.
              </p>
            </motion.div>
          )}

          {/* Order Details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              {/* Status Timeline */}
              <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                <h2 className="font-display text-xl text-foreground mb-6">
                  Order Status
                </h2>

                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
                  <div
                    className="absolute left-6 top-6 w-0.5 bg-gold transition-all duration-500"
                    style={{
                      height: `${(getStatusIndex(order.status) / (statusSteps.length - 1)) * 100}%`,
                    }}
                  />

                  {/* Steps */}
                  <div className="space-y-6">
                    {statusSteps.map((step, index) => {
                      const isActive = getStatusIndex(order.status) >= index;
                      const isCurrent = order.status === step.key;

                      return (
                        <div key={step.key} className="flex items-center gap-4">
                          <div
                            className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                              isActive ? "bg-gold text-charcoal-deep" : "bg-muted text-muted-foreground"
                            } ${isCurrent ? "ring-4 ring-gold/30" : ""}`}
                          >
                            <step.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                isActive ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-sm text-gold">Current Status</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Summary */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display text-lg text-foreground mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Number</span>
                      <span className="text-foreground font-medium">{order.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="text-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="text-foreground uppercase">{order.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-foreground">৳{order.shipping_cost}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border">
                      <span className="text-foreground font-medium">Total</span>
                      <span className="text-gold font-semibold text-lg">
                        ৳{order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.address && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-display text-lg text-foreground mb-4">
                      Delivery Address
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-foreground">{order.address.full_name}</p>
                      <p className="text-muted-foreground">{order.address.phone}</p>
                      <p className="text-muted-foreground">
                        {order.address.address_line}
                      </p>
                      <p className="text-muted-foreground">
                        {order.address.thana}, {order.address.district}
                      </p>
                      <p className="text-muted-foreground">{order.address.division}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display text-lg text-foreground mb-4">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-foreground">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-gold font-medium">
                        ৳{(item.product_price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
