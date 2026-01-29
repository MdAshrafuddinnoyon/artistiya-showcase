import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, CreditCard, Truck, Loader2, CheckCircle2, MessageCircle, User, ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppOrderButton from "@/components/common/WhatsAppOrderButton";
import CheckoutOffersSidebar from "@/components/checkout/CheckoutOffersSidebar";
import MobileCheckout from "@/components/mobile/MobileCheckout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { usePayment } from "@/hooks/usePayment";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { divisions, calculateShippingCost, isDhakaDistrict, getDistrictsByDivision, getThanasByDistrict } from "@/data/bangladeshLocations";
import { useGeolocation, useShippingCost } from "@/hooks/useGeolocation";

const Checkout = () => {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { initiateBkashPayment, initiateNagadPayment, redirectToPayment, loading: paymentLoading } = usePayment();
  
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState<"auto" | "manual">("auto");
  const [bkashAvailable, setBkashAvailable] = useState(false);
  const [nagadAvailable, setNagadAvailable] = useState(false);
  
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    paymentMethod: "cod" as "cod" | "bkash" | "nagad",
    transactionId: "",
    notes: "",
  });

  // Check if automated payment providers are available
  useEffect(() => {
    const checkPaymentProviders = async () => {
      const { data: providers } = await supabase
        .from("payment_providers")
        .select("provider_type, is_active")
        .eq("is_active", true);

      if (providers) {
        setBkashAvailable(providers.some(p => p.provider_type === "bkash"));
        setNagadAvailable(providers.some(p => p.provider_type === "nagad"));
      }
    };
    checkPaymentProviders();
  }, []);

  // Redirect if cart is empty (but not after success)
  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate("/shop");
    }
  }, [items.length, orderSuccess, navigate]);

  // All hooks must be called before any conditional returns
  // Render mobile checkout
  if (isMobile) {
    return <MobileCheckout />;
  }

  if (items.length === 0 && !orderSuccess) {
    return null;
  }

  const districts = selectedDivision
    ? getDistrictsByDivision(selectedDivision)
    : [];

  const thanas = selectedDistrict
    ? getThanasByDistrict(selectedDistrict)
    : [];

  const shippingCost = selectedDistrict ? calculateShippingCost(selectedDistrict) : 0;
  const total = subtotal + shippingCost;

  const hasPreorderItems = items.some(
    item => item.product.stock_quantity === 0 && item.product.is_preorderable
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.phone || !selectedDivision || 
        !selectedDistrict || !selectedThana || !formData.addressLine) {
      toast.error(t("checkout.fillAll"));
      return;
    }

    // For manual payment mode, require transaction ID
    const isAutomatedPayment = 
      (formData.paymentMethod === "bkash" && bkashAvailable && paymentMode === "auto") ||
      (formData.paymentMethod === "nagad" && nagadAvailable && paymentMode === "auto");

    if (!isAutomatedPayment && 
        (formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && 
        !formData.transactionId) {
      toast.error(t("checkout.enterTxn"));
      return;
    }

    setLoading(true);

    try {
      // For guest checkout, we'll create order without user_id
      const userId = user?.id || null;

      // Create address (for guests, store with null user_id or create guest record)
      const addressData = {
        user_id: userId || "00000000-0000-0000-0000-000000000000", // Guest placeholder
        full_name: formData.fullName,
        phone: formData.phone,
        division: selectedDivision,
        district: selectedDistrict,
        thana: selectedThana,
        address_line: formData.addressLine,
        is_default: userId ? true : false,
      };

      const { data: address, error: addressError } = await supabase
        .from("addresses")
        .insert(addressData)
        .select()
        .single();

      if (addressError) throw addressError;

      // Generate order number
      const orderNum = `ART-${Date.now()}`;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          address_id: address.id,
          payment_method: formData.paymentMethod,
          payment_transaction_id: formData.transactionId || null,
          subtotal,
          shipping_cost: shippingCost,
          total,
          is_preorder: hasPreorderItems,
          notes: formData.notes || (formData.email ? `Guest Email: ${formData.email}` : null),
          order_number: orderNum,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        is_preorder: item.product.stock_quantity === 0 && item.product.is_preorderable,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Handle automated payment
      const isAutomatedPayment = 
        (formData.paymentMethod === "bkash" && bkashAvailable && paymentMode === "auto") ||
        (formData.paymentMethod === "nagad" && nagadAvailable && paymentMode === "auto");

      if (isAutomatedPayment) {
        // Initiate automated payment
        if (formData.paymentMethod === "bkash") {
          const result = await initiateBkashPayment(total, orderData.id);
          if (result.success && result.bkashURL) {
            // Redirect to bKash payment page
            redirectToPayment(result.bkashURL);
            return;
          } else {
            toast.error(result.error || "Failed to initiate bKash payment");
            // Fall back to manual payment
            setPaymentMode("manual");
            return;
          }
        } else if (formData.paymentMethod === "nagad") {
          const result = await initiateNagadPayment(total, orderData.id);
          if (result.success && result.callBackUrl) {
            // Redirect to Nagad payment page
            redirectToPayment(result.callBackUrl);
            return;
          } else {
            toast.error(result.error || "Failed to initiate Nagad payment");
            // Fall back to manual payment
            setPaymentMode("manual");
            return;
          }
        }
      }

      // Clear cart for COD or manual payment
      await clearCart();

      // Redirect to success page
      navigate(`/order-success?orderId=${orderData.id}`);

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("checkout.error"));
    } finally {
      setLoading(false);
    }
  };

  // Prepare cart items for WhatsApp
  const whatsappItems = items.map(item => ({
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-24">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="mb-6"
            >
              <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
            </motion.div>
            
            <h1 className={`font-display text-3xl text-foreground mb-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {t("checkout.success")}
            </h1>
            
            <p className={`text-muted-foreground mb-2 ${language === "bn" ? "font-bengali" : ""}`}>
              {t("checkout.orderNumber")}
            </p>
            <p className="text-2xl font-bold text-gold mb-6">
              {orderNumber}
            </p>

            {hasPreorderItems && (
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6 text-left">
                <p className={`text-gold font-medium ${language === "bn" ? "font-bengali" : ""}`}>
                  ⏳ {t("checkout.preorderNote")}
                </p>
              </div>
            )}

            <p className={`text-muted-foreground mb-8 ${language === "bn" ? "font-bengali" : ""}`}>
              {t("checkout.contact")}
            </p>

            <div className="flex gap-4 justify-center">
              <Button variant="gold" onClick={() => navigate("/shop")}>
                {t("checkout.moreShopping")}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                {t("checkout.goHome")}
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <main className="pt-20 md:pt-32 pb-8 md:pb-24">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-2xl md:text-4xl text-foreground mb-6 md:mb-8 text-center">
            Checkout
          </h1>

          {/* Guest Checkout Notice */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto mb-4 md:mb-6 p-3 md:p-4 bg-muted rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <User className="h-4 w-4 md:h-5 md:w-5 text-gold" />
                <span className="text-xs md:text-sm">
                  Ordering as Guest
                </span>
              </div>
              <Link to="/auth">
                <Button variant="link" size="sm" className="text-gold text-xs md:text-sm">
                  Login
                </Button>
              </Link>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Single column on mobile, 3 columns on desktop */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-4 md:space-y-8">
                {/* Shipping Address */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-4 md:p-6"
                >
                  <h2 className="font-display text-lg md:text-xl flex items-center gap-2 mb-4 md:mb-6">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-gold" />
                    Shipping Address
                  </h2>

                  {/* Mobile-optimized form layout */}
                  <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div className="md:col-span-2">
                      <Label htmlFor="fullName" className="text-sm">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Your name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="mt-1.5 h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm">
                        Phone *
                      </Label>
                      <div className="relative mt-1.5">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="01XXXXXXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>

                    {/* Email for guests */}
                    {!user && (
                      <div>
                        <Label htmlFor="email" className="text-sm">
                          Email (Optional)
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1.5 h-11"
                        />
                      </div>
                    )}

                    {/* Division & District in single row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">
                          Division *
                        </Label>
                        <Select value={selectedDivision} onValueChange={(v) => {
                          setSelectedDivision(v);
                          setSelectedDistrict("");
                          setSelectedThana("");
                        }}>
                          <SelectTrigger className="mt-1.5 h-11">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions.map(div => (
                              <SelectItem key={div.name} value={div.name}>
                                {div.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">
                          District *
                        </Label>
                        <Select 
                          value={selectedDistrict} 
                          onValueChange={(v) => {
                            setSelectedDistrict(v);
                            setSelectedThana("");
                          }}
                          disabled={!selectedDivision}
                        >
                          <SelectTrigger className="mt-1.5 h-11">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map(dist => (
                              <SelectItem key={dist} value={dist}>
                                {dist}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Thana & Shipping in single row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">
                          Thana *
                        </Label>
                        <Select 
                          value={selectedThana} 
                          onValueChange={setSelectedThana}
                          disabled={!selectedDistrict}
                        >
                          <SelectTrigger className="mt-1.5 h-11">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {thanas.map(thana => (
                              <SelectItem key={thana} value={thana}>
                                {thana}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">
                          Shipping
                        </Label>
                        <div className="mt-1.5 flex items-center gap-2 h-11 px-3 bg-muted rounded-md">
                          <Truck className="h-4 w-4 text-gold" />
                          <span className="font-semibold text-gold text-sm">
                            {selectedDistrict ? `৳${shippingCost}` : "Select district"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine" className="text-sm">
                        Address *
                      </Label>
                      <Textarea
                        id="addressLine"
                        placeholder="House No, Road No, Area..."
                        value={formData.addressLine}
                        onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                        className="mt-1.5"
                        rows={2}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Payment Method */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-xl p-4 md:p-6"
                >
                  <h2 className="font-display text-lg md:text-xl flex items-center gap-2 mb-4 md:mb-6">
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-gold" />
                    Payment Method
                  </h2>

                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as any })}
                    className="space-y-2 md:space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 md:p-4 border border-border rounded-lg hover:border-gold/50 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <span className="font-medium text-sm md:text-base">
                          Cash on Delivery
                        </span>
                        <span className={`block text-sm text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                          {t("checkout.codDesc")}
                        </span>
                      </Label>
                    </div>

                    <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${formData.paymentMethod === "bkash" ? "border-pink-500/50 bg-pink-500/5" : "border-border hover:border-gold/50"}`}>
                      <RadioGroupItem value="bkash" id="bkash" />
                      <Label htmlFor="bkash" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-pink-500">bKash</span>
                          {bkashAvailable && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                              {language === "bn" ? "অটো পেমেন্ট" : "Auto Pay"}
                            </Badge>
                          )}
                        </div>
                        <span className="block text-sm text-muted-foreground">
                          {bkashAvailable 
                            ? (language === "bn" ? "bKash পেজে রিডাইরেক্ট হবে" : "Redirect to bKash checkout")
                            : (language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Manual payment")}
                        </span>
                      </Label>
                    </div>

                    <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${formData.paymentMethod === "nagad" ? "border-orange-500/50 bg-orange-500/5" : "border-border hover:border-gold/50"}`}>
                      <RadioGroupItem value="nagad" id="nagad" />
                      <Label htmlFor="nagad" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-orange-500">Nagad</span>
                          {nagadAvailable && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                              {language === "bn" ? "অটো পেমেন্ট" : "Auto Pay"}
                            </Badge>
                          )}
                        </div>
                        <span className="block text-sm text-muted-foreground">
                          {nagadAvailable 
                            ? (language === "bn" ? "Nagad পেজে রিডাইরেক্ট হবে" : "Redirect to Nagad checkout")
                            : (language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Manual payment")}
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Show payment mode selector for bKash/Nagad */}
                  {((formData.paymentMethod === "bkash" && bkashAvailable) || 
                    (formData.paymentMethod === "nagad" && nagadAvailable)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMode"
                            checked={paymentMode === "auto"}
                            onChange={() => setPaymentMode("auto")}
                            className="accent-gold"
                          />
                          <span className="text-sm">
                            {language === "bn" ? "অটো পেমেন্ট" : "Auto Payment"}
                            <ExternalLink className="inline h-3 w-3 ml-1" />
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMode"
                            checked={paymentMode === "manual"}
                            onChange={() => setPaymentMode("manual")}
                            className="accent-gold"
                          />
                          <span className="text-sm">
                            {language === "bn" ? "ম্যানুয়াল" : "Manual"}
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {/* Manual transaction ID field */}
                  {(formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && 
                   (paymentMode === "manual" || 
                    (formData.paymentMethod === "bkash" && !bkashAvailable) ||
                    (formData.paymentMethod === "nagad" && !nagadAvailable)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4"
                    >
                      <div className="p-3 bg-gold/5 border border-gold/20 rounded-lg mb-3">
                        <p className="text-sm text-muted-foreground">
                          {formData.paymentMethod === "bkash" 
                            ? (language === "bn" ? "01XXXXXXXXX নম্বরে Send Money করে Transaction ID দিন" : "Send Money to 01XXXXXXXXX and enter Transaction ID")
                            : (language === "bn" ? "01XXXXXXXXX নম্বরে Send Money করে Transaction ID দিন" : "Send Money to 01XXXXXXXXX and enter Transaction ID")}
                        </p>
                      </div>
                      <Label htmlFor="transactionId" className={language === "bn" ? "font-bengali" : ""}>
                        {t("checkout.transactionId")} *
                      </Label>
                      <Input
                        id="transactionId"
                        placeholder="e.g. 8N7A5XXXXX"
                        value={formData.transactionId}
                        onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                        className="mt-1.5"
                      />
                    </motion.div>
                  )}
                </motion.div>

                {/* Notes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <Label htmlFor="notes" className={language === "bn" ? "font-bengali" : ""}>
                    {t("checkout.notes")} ({t("common.optional")})
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder={language === "bn" ? "কোনো বিশেষ নির্দেশনা থাকলে লিখুন..." : "Any special instructions..."}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1.5"
                  />
                </motion.div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-xl p-6 sticky top-32"
                >
                  <h2 className={`font-display text-xl mb-6 ${language === "bn" ? "font-bengali" : ""}`}>
                    {language === "bn" ? "অর্ডার সামারি" : "Order Summary"}
                  </h2>

                  {/* Items */}
                  <div className="space-y-4 max-h-64 overflow-y-auto mb-6">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {item.product.images?.[0] && (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${language === "bn" ? "font-bengali" : ""}`}>
                            {language === "bn" && item.product.name_bn ? item.product.name_bn : item.product.name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            ৳{item.product.price.toLocaleString()} × {item.quantity}
                          </p>
                          {item.product.stock_quantity === 0 && item.product.is_preorderable && (
                            <span className="text-xs text-gold">Pre-Order</span>
                          )}
                        </div>
                        <p className="font-semibold text-sm">
                          ৳{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                        {t("cart.subtotal")}
                      </span>
                      <span>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                        {language === "bn" ? "শিপিং" : "Shipping"}
                      </span>
                      <span>৳{shippingCost}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
                      <span className={language === "bn" ? "font-bengali" : ""}>
                        {language === "bn" ? "মোট" : "Total"}
                      </span>
                      <span className="text-gold">৳{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {hasPreorderItems && (
                    <div className="mt-4 p-3 bg-gold/10 border border-gold/30 rounded-lg">
                      <p className={`text-xs text-gold ${language === "bn" ? "font-bengali" : ""}`}>
                        ⏳ {t("checkout.preorderNote")}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    className={`w-full mt-6 ${language === "bn" ? "font-bengali" : ""}`}
                    size="lg"
                    disabled={loading || paymentLoading}
                  >
                    {loading || paymentLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {paymentLoading 
                          ? (language === "bn" ? "পেমেন্ট প্রসেসিং..." : "Processing payment...")
                          : t("checkout.processing")}
                      </span>
                    ) : formData.paymentMethod !== "cod" && paymentMode === "auto" && 
                        ((formData.paymentMethod === "bkash" && bkashAvailable) || 
                         (formData.paymentMethod === "nagad" && nagadAvailable)) ? (
                      <span className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {language === "bn" 
                          ? `${formData.paymentMethod === "bkash" ? "bKash" : "Nagad"} দিয়ে পে করুন • ৳${total.toLocaleString()}`
                          : `Pay with ${formData.paymentMethod === "bkash" ? "bKash" : "Nagad"} • ৳${total.toLocaleString()}`}
                      </span>
                    ) : (
                      `${t("checkout.placeOrder")} • ৳${total.toLocaleString()}`
                    )}
                  </Button>

                  {/* WhatsApp Order Option */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className={`text-xs text-center text-muted-foreground mb-3 ${language === "bn" ? "font-bengali" : ""}`}>
                      {t("checkout.orderViaWhatsapp")}
                    </p>
                    <WhatsAppOrderButton
                      items={whatsappItems}
                      variant="outline"
                      size="default"
                      className="w-full"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
