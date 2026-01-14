import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, CreditCard, Truck, Loader2, CheckCircle2, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppOrderButton from "@/components/common/WhatsAppOrderButton";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { divisions, calculateShippingCost, isDhakaDistrict } from "@/data/bangladeshLocations";

const Checkout = () => {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  
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

  const districts = selectedDivision
    ? divisions.find(d => d.name === selectedDivision)?.districts || []
    : [];

  const thanas = selectedDistrict
    ? districts.find(d => d.name === selectedDistrict)?.thanas || []
    : [];

  const shippingCost = selectedDistrict ? calculateShippingCost(selectedDistrict) : 0;
  const total = subtotal + shippingCost;

  const hasPreorderItems = items.some(
    item => item.product.stock_quantity === 0 && item.product.is_preorderable
  );

  // Redirect if cart is empty (but not after success)
  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate("/shop");
    }
  }, [items.length, orderSuccess, navigate]);

  if (items.length === 0 && !orderSuccess) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.phone || !selectedDivision || 
        !selectedDistrict || !selectedThana || !formData.addressLine) {
      toast.error(t("checkout.fillAll"));
      return;
    }

    if ((formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && 
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

      // Clear cart
      await clearCart();

      // Show success
      setOrderNumber(orderData.order_number);
      setOrderSuccess(true);
      toast.success(language === "bn" ? "অর্ডার সফল হয়েছে!" : "Order placed successfully!");

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
                              <SelectItem key={dist.name} value={dist.name}>
                                {dist.name}
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
                              <SelectItem key={thana.name} value={thana.name}>
                                {thana.name}
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

                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-gold/50 transition-colors">
                      <RadioGroupItem value="bkash" id="bkash" />
                      <Label htmlFor="bkash" className="flex-1 cursor-pointer">
                        <span className="font-medium text-pink-500">bKash</span>
                        <span className="block text-sm text-muted-foreground">
                          01XXXXXXXXX {language === "bn" ? "নম্বরে Send Money করুন" : "- Send Money"}
                        </span>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-gold/50 transition-colors">
                      <RadioGroupItem value="nagad" id="nagad" />
                      <Label htmlFor="nagad" className="flex-1 cursor-pointer">
                        <span className="font-medium text-orange-500">Nagad</span>
                        <span className="block text-sm text-muted-foreground">
                          01XXXXXXXXX {language === "bn" ? "নম্বরে Send Money করুন" : "- Send Money"}
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {(formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4"
                    >
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
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("checkout.processing")}
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
