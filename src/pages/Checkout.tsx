import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, CreditCard, Truck, Loader2, CheckCircle2, MessageCircle, User, ExternalLink, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// NOTE: We intentionally avoid Radix Select here due to a runtime DOM error observed on checkout.
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppOrderButton from "@/components/common/WhatsAppOrderButton";
import CheckoutOffersSidebar from "@/components/checkout/CheckoutOffersSidebar";
import SignupDiscountBanner from "@/components/checkout/SignupDiscountBanner";
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
  
  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    paymentMethod: "cod" as "cod" | "bkash" | "nagad" | "bank_transfer",
    transactionId: "",
    notes: "",
    paymentNote: "",
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
  const total = subtotal + shippingCost - promoDiscount;

  // Get cart category IDs for bundle filtering
  const cartCategoryIds = [...new Set(items.map(item => item.product.category_id).filter(Boolean))] as string[];
  const cartProductIds = items.map(item => item.product_id);

  const hasPreorderItems = items.some(
    item => item.product.stock_quantity === 0 && item.product.is_preorderable
  );

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError(language === "bn" ? "প্রোমো কোড লিখুন" : "Please enter a promo code");
      return;
    }

    setApplyingPromo(true);
    setPromoError("");

    try {
      const { data: promo, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (error || !promo) {
        setPromoError(language === "bn" ? "অবৈধ প্রোমো কোড" : "Invalid promo code");
        setApplyingPromo(false);
        return;
      }

      // Check expiry
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        setPromoError(language === "bn" ? "প্রোমো কোডের মেয়াদ শেষ" : "Promo code has expired");
        setApplyingPromo(false);
        return;
      }

      // Check min order amount
      if (promo.min_order_amount && subtotal < promo.min_order_amount) {
        setPromoError(
          language === "bn" 
            ? `সর্বনিম্ন অর্ডার ৳${promo.min_order_amount} প্রয়োজন` 
            : `Minimum order amount is ৳${promo.min_order_amount}`
        );
        setApplyingPromo(false);
        return;
      }

      // Check usage limit
      if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
        setPromoError(language === "bn" ? "প্রোমো কোড সীমা অতিক্রম করেছে" : "Promo code usage limit reached");
        setApplyingPromo(false);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (promo.discount_type === "percentage") {
        discount = Math.round(subtotal * (promo.discount_value / 100));
        if (promo.max_discount_amount && discount > promo.max_discount_amount) {
          discount = promo.max_discount_amount;
        }
      } else {
        discount = promo.discount_value;
      }

      setPromoDiscount(discount);
      setAppliedPromo({
        id: promo.id,
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      });
      toast.success(language === "bn" ? "প্রোমো কোড প্রয়োগ হয়েছে!" : "Promo code applied!");
    } catch (err) {
      setPromoError(language === "bn" ? "কিছু সমস্যা হয়েছে" : "Something went wrong");
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoCode("");
    setPromoError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.fullName || !formData.phone || !selectedDivision || 
        !selectedDistrict || !selectedThana || !formData.addressLine) {
      toast.error(t("checkout.fillAll"));
      return;
    }

    // Phone validation
    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      toast.error(language === "bn" ? "সঠিক ফোন নম্বর দিন" : "Please enter a valid phone number");
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
      // Build secure order payload - prices are verified server-side
      const orderPayload = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        address: {
          full_name: formData.fullName,
          phone: cleanPhone,
          email: formData.email || null,
          division: selectedDivision,
          district: selectedDistrict,
          thana: selectedThana,
          address_line: formData.addressLine,
        },
        payment_method: formData.paymentMethod,
        transaction_id: formData.transactionId || null,
        promo_code: appliedPromo?.code || null,
        notes: [formData.notes, formData.paymentNote ? `Payment Note: ${formData.paymentNote}` : null].filter(Boolean).join(" | ") || null,
        shipping_method: "delivery",
      };

      const { data, error } = await supabase.functions.invoke("create-order", {
        body: orderPayload,
      });

      if (error) throw error;

      if (!data?.success) {
        toast.error(data?.error || "Failed to place order");
        setLoading(false);
        return;
      }

      // Handle automated payment redirect
      if (isAutomatedPayment) {
        if (formData.paymentMethod === "bkash") {
          const result = await initiateBkashPayment(data.total, data.order_id);
          if (result.success && result.bkashURL) {
            redirectToPayment(result.bkashURL);
            return;
          } else {
            toast.error(result.error || "Failed to initiate bKash payment");
            setPaymentMode("manual");
            return;
          }
        } else if (formData.paymentMethod === "nagad") {
          const result = await initiateNagadPayment(data.total, data.order_id);
          if (result.success && result.callBackUrl) {
            redirectToPayment(result.callBackUrl);
            return;
          } else {
            toast.error(result.error || "Failed to initiate Nagad payment");
            setPaymentMode("manual");
            return;
          }
        }
      }

      // Clear local cart
      await clearCart();

      // Redirect to success page
      navigate(`/order-success?orderId=${data.order_id}`);

    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error?.message || t("checkout.error"));
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

          {/* Guest Checkout Notice with 5% Discount Incentive */}
          {!user && (
            <div className="max-w-3xl mx-auto mb-6 space-y-4">
              <SignupDiscountBanner discountPercent={5} />
            </div>
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
                        <select
                          value={selectedDivision}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelectedDivision(v);
                            setSelectedDistrict("");
                            setSelectedThana("");
                          }}
                          className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {divisions.map((div) => (
                            <option key={div.name} value={div.name}>
                              {div.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-sm">
                          District *
                        </Label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelectedDistrict(v);
                            setSelectedThana("");
                          }}
                          disabled={!selectedDivision}
                          className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {districts.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Thana & Shipping in single row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">
                          Thana *
                        </Label>
                        <select
                          value={selectedThana}
                          onChange={(e) => setSelectedThana(e.target.value)}
                          disabled={!selectedDistrict}
                          className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {thanas.map((thana) => (
                            <option key={thana} value={thana}>
                              {thana}
                            </option>
                          ))}
                        </select>
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
                    onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as any, transactionId: "", paymentNote: "" })}
                    className="space-y-2 md:space-y-3"
                  >
                    {/* COD */}
                    <div className={`flex items-center space-x-3 p-3 md:p-4 border rounded-lg transition-colors ${formData.paymentMethod === "cod" ? "border-gold bg-gold/5" : "border-border hover:border-gold/50"}`}>
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <span className="font-medium text-sm md:text-base">
                          {language === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery"}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {language === "bn" ? "ডেলিভারির সময় টাকা দিন" : "Pay when you receive"}
                        </span>
                      </Label>
                    </div>

                    {/* bKash */}
                    <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${formData.paymentMethod === "bkash" ? "border-pink-500/50 bg-pink-500/5" : "border-border hover:border-gold/50"}`}>
                      <RadioGroupItem value="bkash" id="bkash" />
                      <Label htmlFor="bkash" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-pink-500">bKash Send Money</span>
                          {bkashAvailable && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                              {language === "bn" ? "অটো পেমেন্ট উপলব্ধ" : "Auto Pay Available"}
                            </Badge>
                          )}
                        </div>
                        <span className="block text-sm text-muted-foreground">
                          {language === "bn" ? "Send Money করুন ও Transaction ID দিন" : "Send Money & enter Transaction ID"}
                        </span>
                      </Label>
                    </div>

                    {/* Nagad */}
                    <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${formData.paymentMethod === "nagad" ? "border-orange-500/50 bg-orange-500/5" : "border-border hover:border-gold/50"}`}>
                      <RadioGroupItem value="nagad" id="nagad" />
                      <Label htmlFor="nagad" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-orange-500">Nagad Send Money</span>
                          {nagadAvailable && (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                              {language === "bn" ? "অটো পেমেন্ট উপলব্ধ" : "Auto Pay Available"}
                            </Badge>
                          )}
                        </div>
                        <span className="block text-sm text-muted-foreground">
                          {language === "bn" ? "Send Money করুন ও Transaction ID দিন" : "Send Money & enter Transaction ID"}
                        </span>
                      </Label>
                    </div>

                    {/* Bank/Other */}
                    <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${formData.paymentMethod === "bank_transfer" ? "border-blue-500/50 bg-blue-500/5" : "border-border hover:border-gold/50"}`}>
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                        <span className="font-medium text-blue-500">
                          {language === "bn" ? "ব্যাংক / অন্যান্য" : "Bank / Other"}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {language === "bn" ? "ব্যাংক ট্রান্সফার বা অন্যান্য পদ্ধতি" : "Bank transfer or other methods"}
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Show payment mode selector for bKash/Nagad when auto is available */}
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
                            {language === "bn" ? "ম্যানুয়াল" : "Manual Send Money"}
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {/* Manual transaction ID field for bKash/Nagad */}
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
                        <p className="text-sm font-medium text-foreground mb-1">
                          {language === "bn" ? "পেমেন্ট নির্দেশনা:" : "Payment Instructions:"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formData.paymentMethod === "bkash" 
                            ? (language === "bn" 
                                ? "bKash নম্বর: 01XXXXXXXXX — Send Money করে নিচে Transaction ID দিন" 
                                : "bKash Number: 01XXXXXXXXX — Send Money and enter Transaction ID below")
                            : (language === "bn" 
                                ? "Nagad নম্বর: 01XXXXXXXXX — Send Money করে নিচে Transaction ID দিন" 
                                : "Nagad Number: 01XXXXXXXXX — Send Money and enter Transaction ID below")}
                        </p>
                      </div>
                      <Label htmlFor="transactionId">
                        {language === "bn" ? "ট্রানজ্যাকশন আইডি" : "Transaction ID"} *
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

                  {/* Bank / Other payment instructions */}
                  {formData.paymentMethod === "bank_transfer" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4"
                    >
                      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg mb-3">
                        <p className="text-sm font-medium text-foreground mb-1">
                          {language === "bn" ? "ব্যাংক ট্রান্সফার তথ্য:" : "Bank Transfer Details:"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "bn" 
                            ? "ব্যাংক: XYZ Bank | অ্যাকাউন্ট: 123456789 | নাম: Artistiya | রাউটিং: 123456" 
                            : "Bank: XYZ Bank | Account: 123456789 | Name: Artistiya | Routing: 123456"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "bn" 
                            ? "পেমেন্ট সম্পন্ন করে নিচে রেফারেন্স/নোট লিখুন" 
                            : "After payment, enter reference/note below"}
                        </p>
                      </div>
                      <Label htmlFor="paymentNote">
                        {language === "bn" ? "পেমেন্ট রেফারেন্স / নোট" : "Payment Reference / Note"}
                      </Label>
                      <Input
                        id="paymentNote"
                        placeholder={language === "bn" ? "ট্রানজ্যাকশন রেফারেন্স বা নোট" : "Transaction reference or note"}
                        value={formData.paymentNote}
                        onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
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

                  {/* Promo Code Input */}
                  <div className="border-t border-border pt-4 mb-4">
                    <Label className="text-sm mb-2 block">
                      {language === "bn" ? "প্রোমো কোড" : "Promo Code"}
                    </Label>
                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div>
                          <span className="font-medium text-green-600">{appliedPromo.code}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            (-৳{promoDiscount.toLocaleString()})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromo}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder={language === "bn" ? "কোড লিখুন" : "Enter code"}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromo}
                          disabled={applyingPromo}
                        >
                          {applyingPromo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            language === "bn" ? "প্রয়োগ" : "Apply"
                          )}
                        </Button>
                      </div>
                    )}
                    {promoError && (
                      <p className="text-xs text-red-500 mt-1">{promoError}</p>
                    )}
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
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{language === "bn" ? "প্রোমো ছাড়" : "Promo Discount"}</span>
                        <span>-৳{promoDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
                      <span className={language === "bn" ? "font-bengali" : ""}>
                        {language === "bn" ? "মোট" : "Total"}
                      </span>
                      <span className="text-gold">৳{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Bundle Offers */}
                  <CheckoutOffersSidebar
                    cartSubtotal={subtotal}
                    cartProductIds={cartProductIds}
                    cartCategoryIds={cartCategoryIds}
                  />

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
