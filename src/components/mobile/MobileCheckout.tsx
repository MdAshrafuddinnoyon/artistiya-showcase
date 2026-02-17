import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, MapPin, Phone, Truck, Store, 
  CreditCard, Wallet, User, Loader2, Navigation,
  Gift, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// NOTE: We intentionally avoid Radix Select here due to a runtime DOM error observed on checkout.
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { divisions, calculateShippingCost, getDistrictsByDivision, getThanasByDistrict } from "@/data/bangladeshLocations";
import { useGeolocation, useShippingCost } from "@/hooks/useGeolocation";

const MobileCheckout = () => {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { loading: geoLoading, detectLocation } = useGeolocation();
  const { getShippingCost } = useShippingCost();
  
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"delivery" | "pickup">("delivery");
  const [dynamicShippingCost, setDynamicShippingCost] = useState<number | null>(null);
  const [estimatedDays, setEstimatedDays] = useState<string | null>(null);
  
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
    paymentNote: "",
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate("/shop");
    }
  }, [items.length, navigate]);

  // Update shipping cost when location changes
  useEffect(() => {
    const updateShippingCost = async () => {
      if (selectedDivision && selectedDistrict) {
        const result = await getShippingCost(selectedDivision, selectedDistrict, selectedThana);
        setDynamicShippingCost(result.cost);
        setEstimatedDays(result.estimatedDays);
      }
    };
    updateShippingCost();
  }, [selectedDivision, selectedDistrict, selectedThana, getShippingCost]);

  const handleAutoDetectLocation = async () => {
    const location = await detectLocation();
    if (location) {
      setSelectedDivision(location.division);
      setSelectedDistrict(location.district);
      setSelectedThana(location.thana);
      toast.success(`Location detected: ${location.district}, ${location.division}`);
    } else {
      toast.error("Could not detect your location");
    }
  };

  const districts = selectedDivision
    ? getDistrictsByDivision(selectedDivision)
    : [];

  const thanas = selectedDistrict
    ? getThanasByDistrict(selectedDistrict)
    : [];

  const shippingCost = dynamicShippingCost ?? (selectedDistrict ? calculateShippingCost(selectedDistrict) : 0);
  const total = subtotal + (shippingMethod === "delivery" ? shippingCost : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone) {
      toast.error("Please fill in your name and phone number");
      return;
    }

    // Phone validation
    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      toast.error(language === "bn" ? "সঠিক ফোন নম্বর দিন" : "Please enter a valid phone number");
      return;
    }

    if (shippingMethod === "delivery" && (!selectedDivision || !selectedDistrict || !selectedThana || !formData.addressLine)) {
      toast.error("Please fill in your delivery address");
      return;
    }

    setLoading(true);

    try {
      // Build secure order payload - prices verified server-side
      const orderPayload = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        address: {
          full_name: formData.fullName,
          phone: cleanPhone,
          email: formData.email || null,
          division: selectedDivision || "N/A",
          district: selectedDistrict || "N/A",
          thana: selectedThana || "N/A",
          address_line: shippingMethod === "pickup" ? "Store Pickup" : formData.addressLine,
        },
        payment_method: formData.paymentMethod,
        transaction_id: formData.transactionId || null,
        promo_code: null,
        notes: [formData.paymentNote ? `Payment Note: ${formData.paymentNote}` : null].filter(Boolean).join(" | ") || null,
        shipping_method: shippingMethod,
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

      // Clear local cart
      await clearCart();

      // Navigate to success
      navigate(`/order-success?orderId=${data.order_id}`);

    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg text-foreground">Checkout</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Product Summary */}
        <div className="p-4 border-b border-border">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 mb-3">
              <img
                src={item.product.images?.[0] || "/placeholder.svg"}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {item.product.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  ৳{item.product.price.toLocaleString()} × {item.quantity}
                </p>
              </div>
              <span className="text-gold font-semibold">
                ৳{(item.product.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Guest Discount Banner */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border-b border-gold/30"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Gift className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm text-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn" 
                    ? "একাউন্ট তৈরি করে ৫% ডিসকাউন্ট পান!" 
                    : "Get 5% OFF with an account!"}
                </h3>
                <p className={`text-xs text-muted-foreground mt-0.5 ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn"
                    ? "একাউন্ট তৈরি করলে ডিসকাউন্ট এবং অর্ডার ট্র্যাকিং পাবেন।"
                    : "Create an account for discounts & order tracking."}
                </p>
              </div>
              <Link to="/auth?redirect=/checkout">
                <Button variant="gold" size="sm" className="h-8 px-3">
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  <span className={`text-xs ${language === "bn" ? "font-bengali" : ""}`}>
                    {language === "bn" ? "তৈরি করুন" : "Sign Up"}
                  </span>
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Contact Info */}
        <div className="p-4 space-y-3 border-b border-border">
          <div>
            <Label className="text-sm">Full Name *</Label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your name"
              className="mt-1.5 h-11"
            />
          </div>

          <div>
            <Label className="text-sm">Phone *</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="pl-10 h-11"
              />
            </div>
          </div>

          {!user && (
            <div>
              <Label className="text-sm">Email (Optional)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="mt-1.5 h-11"
              />
            </div>
          )}
        </div>

        {/* Shipping Method */}
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Shipping Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShippingMethod("delivery")}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                shippingMethod === "delivery"
                  ? "border-gold bg-gold/10"
                  : "border-border"
              }`}
            >
              <Truck className={`h-5 w-5 mx-auto mb-1 ${shippingMethod === "delivery" ? "text-gold" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">Home Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => setShippingMethod("pickup")}
              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                shippingMethod === "pickup"
                  ? "border-gold bg-gold/10"
                  : "border-border"
              }`}
            >
              <Store className={`h-5 w-5 mx-auto mb-1 ${shippingMethod === "pickup" ? "text-gold" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">Store Pickup</span>
            </button>
          </div>
        </div>

        {/* Delivery Address */}
        {shippingMethod === "delivery" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 space-y-3 border-b border-border"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" />
                Delivery Address
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoDetectLocation}
                disabled={geoLoading}
                className="text-xs h-8"
              >
                {geoLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Navigation className="h-3 w-3 mr-1" />
                )}
                Auto-detect
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Division *</Label>
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
                <Label className="text-sm">District *</Label>
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

            <div>
              <Label className="text-sm">Thana *</Label>
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
              <Label className="text-sm">Address Line *</Label>
              <Input
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                placeholder="House, Road, Area"
                className="mt-1.5 h-11"
              />
            </div>
          </motion.div>
        )}

        {/* Payment Method */}
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gold" />
            Payment Method
          </h3>

          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as any, transactionId: "", paymentNote: "" })}
            className="space-y-2"
          >
            {/* COD */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              formData.paymentMethod === "cod" ? "border-gold bg-gold/10" : "border-border"
            }`}>
              <RadioGroupItem value="cod" id="cod" />
              <label htmlFor="cod" className="flex items-center gap-2 flex-1 cursor-pointer">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Cash on Delivery</span>
              </label>
            </div>
            
            {/* bKash */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              formData.paymentMethod === "bkash" ? "border-pink-500 bg-pink-500/10" : "border-border"
            }`}>
              <RadioGroupItem value="bkash" id="bkash" />
              <label htmlFor="bkash" className="flex items-center gap-2 flex-1 cursor-pointer">
                <div className="w-5 h-5 bg-[#E2136E] rounded text-white text-[8px] font-bold flex items-center justify-center">b</div>
                <span className="text-sm font-medium">bKash Send Money</span>
              </label>
            </div>
            
            {/* Nagad */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              formData.paymentMethod === "nagad" ? "border-orange-500 bg-orange-500/10" : "border-border"
            }`}>
              <RadioGroupItem value="nagad" id="nagad" />
              <label htmlFor="nagad" className="flex items-center gap-2 flex-1 cursor-pointer">
                <div className="w-5 h-5 bg-[#F6A200] rounded text-white text-[8px] font-bold flex items-center justify-center">N</div>
                <span className="text-sm font-medium">Nagad Send Money</span>
              </label>
            </div>

            {/* Bank / Other */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              formData.paymentMethod === "bank_transfer" ? "border-blue-500 bg-blue-500/10" : "border-border"
            }`}>
              <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              <label htmlFor="bank_transfer" className="flex items-center gap-2 flex-1 cursor-pointer">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Bank / Other</span>
              </label>
            </div>
          </RadioGroup>

          {/* bKash/Nagad Transaction ID */}
          {(formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-2"
            >
              <div className="p-2 bg-gold/5 border border-gold/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {formData.paymentMethod === "bkash" 
                    ? "bKash নম্বর: 01XXXXXXXXX — Send Money করে Transaction ID দিন"
                    : "Nagad নম্বর: 01XXXXXXXXX — Send Money করে Transaction ID দিন"}
                </p>
              </div>
              <div>
                <Label className="text-sm">Transaction ID *</Label>
                <Input
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  placeholder="e.g. 8N7A5XXXXX"
                  className="mt-1 h-10"
                />
              </div>
            </motion.div>
          )}

          {/* Bank Transfer / Other */}
          {formData.paymentMethod === "bank_transfer" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-2"
            >
              <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Bank: XYZ Bank | Account: 123456789 | Name: Artistiya
                </p>
              </div>
              <div>
                <Label className="text-sm">Payment Reference / Note</Label>
                <Input
                  value={formData.paymentNote}
                  onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
                  placeholder="Transaction reference or note"
                  className="mt-1 h-10"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Order Summary */}
        <div className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
            <span>৳{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>{shippingMethod === "pickup" ? "Free" : `৳${shippingCost}`}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-gold">৳{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40">
          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              `Finalize Purchase • ৳${total.toLocaleString()}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MobileCheckout;
