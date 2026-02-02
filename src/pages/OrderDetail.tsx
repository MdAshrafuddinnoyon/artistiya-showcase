import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  ArrowLeft,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  is_preorder: boolean;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  payment_method: string;
  payment_transaction_id: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  address: {
    full_name: string;
    phone: string;
    division: string;
    district: string;
    thana: string;
    address_line: string;
  } | null;
  delivery_partner: {
    id: string;
    name: string;
  } | null;
}

const statusSteps = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchOrder();

    // Real-time subscription
    const channel = supabase
      .channel(`order_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        () => fetchOrder()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;

    try {
      const { data, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          address:addresses (
            full_name,
            phone,
            division,
            district,
            thana,
            address_line
          ),
          delivery_partner:delivery_partners (id, name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (orderError) throw orderError;

      if (!data) {
        setError("Order not found");
        setLoading(false);
        return;
      }

      // Check if user owns this order or is admin
      if (data.user_id && user && data.user_id !== user.id) {
        // Check if admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          setError("You don't have permission to view this order");
          setLoading(false);
          return;
        }
      }

      setOrder(data as Order);

      // Fetch order items
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

      setOrderItems(items || []);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    if (status === "cancelled") return -1;
    return statusSteps.findIndex((s) => s.key === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "confirmed":
        return "bg-blue-500/20 text-blue-500";
      case "processing":
        return "bg-purple-500/20 text-purple-500";
      case "shipped":
        return "bg-indigo-500/20 text-indigo-500";
      case "delivered":
        return "bg-green-500/20 text-green-500";
      case "cancelled":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 md:pt-32 pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-64 bg-muted rounded-xl" />
              <div className="h-48 bg-muted rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 md:pt-32 pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="font-display text-2xl text-foreground mb-2">
                {error || "Order Not Found"}
              </h1>
              <p className="text-muted-foreground mb-6">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link to="/dashboard">
                <Button variant="gold">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          {/* Back Button */}
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          {/* Order Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="font-display text-2xl text-foreground mb-1">
                  Order {order.order_number}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge className={`${getStatusColor(order.status)} text-sm px-4 py-1`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            {/* Status Timeline */}
            {order.status !== "cancelled" && (
              <div className="relative">
                <div className="flex justify-between">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isCompleted
                              ? "bg-gold text-background"
                              : "bg-muted text-muted-foreground"
                          } ${isCurrent ? "ring-4 ring-gold/30" : ""}`}
                        >
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <span
                          className={`text-xs mt-2 text-center ${
                            isCompleted ? "text-gold font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
                  <div
                    className="h-full bg-gold transition-all"
                    style={{
                      width: `${Math.max(0, (currentStatusIndex / (statusSteps.length - 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                <p className="text-red-500 font-medium">This order has been cancelled</p>
              </div>
            )}
          </motion.div>

          {/* Tracking Info */}
          {order.tracking_number && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-medium text-foreground">{order.tracking_number}</p>
                  </div>
                </div>
                {order.delivery_partner && (
                  <Badge variant="secondary">{order.delivery_partner.name}</Badge>
                )}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-gold" />
                <h3 className="font-medium text-foreground">Shipping Address</h3>
              </div>
              {order.address ? (
                <div className="text-muted-foreground text-sm space-y-1">
                  <p className="text-foreground font-medium">{order.address.full_name}</p>
                  <p>{order.address.phone}</p>
                  <p>{order.address.address_line}</p>
                  <p>
                    {order.address.thana}, {order.address.district}
                  </p>
                  <p>{order.address.division}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No address provided</p>
              )}
            </motion.div>

            {/* Payment Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-gold" />
                <h3 className="font-medium text-foreground">Payment Details</h3>
              </div>
              <div className="text-muted-foreground text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="text-foreground uppercase">{order.payment_method}</span>
                </div>
                {order.payment_transaction_id && (
                  <div className="flex justify-between">
                    <span>Transaction ID</span>
                    <span className="text-foreground font-mono text-xs">
                      {order.payment_transaction_id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span>Subtotal</span>
                  <span>৳{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>৳{order.shipping_cost}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-semibold text-foreground">
                  <span>Total</span>
                  <span className="text-gold">৳{order.total.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-6 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-gold" />
              <h3 className="font-medium text-foreground">Order Items</h3>
            </div>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="text-foreground font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ৳{item.product_price.toLocaleString()} × {item.quantity}
                    </p>
                    {item.is_preorder && (
                      <Badge variant="secondary" className="mt-1 bg-gold/20 text-gold text-xs">
                        Pre-Order
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-foreground">
                    ৳{(item.product_price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          {order.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-xl p-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-gold" />
                <h3 className="font-medium text-foreground">Order Notes</h3>
              </div>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{order.notes}</p>
            </motion.div>
          )}

          {/* Timestamps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-muted-foreground"
          >
            {order.shipped_at && (
              <p>
                Shipped on{" "}
                {new Date(order.shipped_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {order.delivered_at && (
              <p>
                Delivered on{" "}
                {new Date(order.delivered_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetail;
