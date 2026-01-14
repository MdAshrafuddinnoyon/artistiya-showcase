import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  Heart,
  User,
  LogOut,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items: {
    product_name: string;
    quantity: number;
    product_price: number;
  }[];
}

interface Address {
  id: string;
  full_name: string;
  phone: string;
  division: string;
  district: string;
  thana: string;
  address_line: string;
  is_default: boolean;
}

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock_quantity: number;
  };
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch orders with items
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, total, created_at,
          items:order_items(product_name, quantity, product_price)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);

      // Fetch addresses
      const { data: addressesData } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      setAddresses(addressesData || []);

      // Fetch wishlist
      const { data: wishlistData } = await supabase
        .from("wishlist_items")
        .select(`
          id,
          product:products(id, name, slug, price, images, stock_quantity)
        `)
        .eq("user_id", user.id);

      setWishlist(wishlistData as unknown as WishlistItem[] || []);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Removed from wishlist");
      fetchData();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user?.id);

      // Then set the new default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId);

      if (error) throw error;
      toast.success("Default address updated");
      fetchData();
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error("Failed to update address");
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);

      if (error) throw error;
      toast.success("Address deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "confirmed":
        return <Clock className="h-4 w-4" />;
      case "processing":
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
              My Account
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name || user.email}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-4 sticky top-24">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground truncate">
                      {profile?.full_name || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {[
                    { id: "orders", icon: Package, label: "My Orders" },
                    { id: "addresses", icon: MapPin, label: "Addresses" },
                    { id: "wishlist", icon: Heart, label: "Wishlist" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? "bg-gold/10 text-gold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </nav>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-muted mb-6 lg:hidden">
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                </TabsList>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-4">
                  <h2 className="font-display text-xl text-foreground mb-4">
                    Order History
                  </h2>

                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-border rounded-xl">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No orders yet</p>
                      <Link to="/shop">
                        <Button variant="gold">Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-xl p-4 md:p-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium text-foreground">
                                {order.order_number}
                              </span>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-gold text-lg">
                              ৳{order.total.toLocaleString()}
                            </span>
                            <Link to={`/order/${order.id}`}>
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4">
                          <div className="flex flex-wrap gap-2">
                            {order.items?.slice(0, 3).map((item, index) => (
                              <span
                                key={index}
                                className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full"
                              >
                                {item.quantity}x {item.product_name}
                              </span>
                            ))}
                            {order.items?.length > 3 && (
                              <span className="text-sm text-gold">
                                +{order.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </TabsContent>

                {/* Addresses Tab */}
                <TabsContent value="addresses" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl text-foreground">
                      Saved Addresses
                    </h2>
                    <Link to="/checkout">
                      <Button variant="outline" size="sm">
                        Add New Address
                      </Button>
                    </Link>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-border rounded-xl">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No saved addresses</p>
                      <Link to="/checkout">
                        <Button variant="gold">Add Address</Button>
                      </Link>
                    </div>
                  ) : (
                    addresses.map((address) => (
                      <motion.div
                        key={address.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-card border rounded-xl p-4 md:p-6 ${
                          address.is_default ? "border-gold" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-gold" />
                            <span className="font-medium text-foreground">
                              {address.full_name}
                            </span>
                            {address.is_default && (
                              <Badge variant="secondary" className="bg-gold/20 text-gold">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-2">{address.phone}</p>
                        <p className="text-muted-foreground text-sm">
                          {address.address_line}, {address.thana}, {address.district},{" "}
                          {address.division}
                        </p>

                        <div className="flex gap-2 mt-4">
                          {!address.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultAddress(address.id)}
                            >
                              Set as Default
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteAddress(address.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </TabsContent>

                {/* Wishlist Tab */}
                <TabsContent value="wishlist" className="space-y-4">
                  <h2 className="font-display text-xl text-foreground mb-4">
                    My Wishlist
                  </h2>

                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : wishlist.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-border rounded-xl">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
                      <Link to="/shop">
                        <Button variant="gold">Explore Products</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {wishlist.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card border border-border rounded-xl overflow-hidden group"
                        >
                          <Link to={`/product/${item.product.slug}`}>
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={item.product.images?.[0] || "/placeholder.svg"}
                                alt={item.product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          </Link>
                          <div className="p-4">
                            <Link to={`/product/${item.product.slug}`}>
                              <h3 className="font-medium text-foreground line-clamp-2 mb-2 hover:text-gold transition-colors">
                                {item.product.name}
                              </h3>
                            </Link>
                            <p className="text-gold font-semibold mb-3">
                              ৳{item.product.price.toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                              <Button variant="gold" size="sm" className="flex-1" asChild>
                                <Link to={`/product/${item.product.slug}`}>
                                  View
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromWishlist(item.id)}
                              >
                                <Heart className="h-4 w-4 fill-current text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
