import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Phone, CreditCard, Truck, Loader2, Navigation, X, ShoppingBag, Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  divisions, calculateShippingCost, getDistrictsByDivision, getThanasByDistrict
} from "@/data/bangladeshLocations";
import { useGeolocation, useShippingCost } from "@/hooks/useGeolocation";

interface QuickCheckoutProduct {
  id: string;
  name: string;
  name_bn?: string | null;
  price: number;
  compare_at_price?: number | null;
  images: string[];
  stock_quantity: number;
  is_preorderable: boolean;
}

interface QuickCheckoutDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: QuickCheckoutProduct;
  quantity: number;
}

const QuickCheckoutDrawer = ({ open, onOpenChange, product, quantity }: QuickCheckoutDrawerProps) => {
  const { user } = useAuth();
  const { addToCart, clearCart } = useCart();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
    notes: "",
  });

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

  const districts = selectedDivision ? getDistrictsByDivision(selectedDivision) : [];
  const thanas = selectedDistrict ? getThanasByDistrict(selectedDistrict) : [];

  const itemTotal = product.price * quantity;
  const shippingCost = shippingMethod === "delivery"
    ? (dynamicShippingCost ?? (selectedDistrict ? calculateShippingCost(selectedDistrict) : 0))
    : 0;
  const total = itemTotal + shippingCost;

  const isPreorder = product.stock_quantity === 0 && product.is_preorderable;

  const selectClasses = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone) {
      toast.error("Please fill in your name and phone number");
      return;
    }

    if (shippingMethod === "delivery" && (!selectedDivision || !selectedDistrict || !selectedThana || !formData.addressLine)) {
      toast.error("Please fill in your delivery address");
      return;
    }

    if ((formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && !formData.transactionId) {
      toast.error("Please enter your Transaction ID");
      return;
    }

    setLoading(true);

    try {
      const userId = user?.id || null;
      const guestPlaceholder = "00000000-0000-0000-0000-000000000001";

      // Create address
      const { data: address, error: addressError } = await supabase
        .from("addresses")
        .insert({
          user_id: userId || guestPlaceholder,
          full_name: formData.fullName,
          phone: formData.phone,
          division: selectedDivision || "N/A",
          district: selectedDistrict || "N/A",
          thana: selectedThana || "N/A",
          address_line: shippingMethod === "pickup" ? "Store Pickup" : formData.addressLine,
          is_default: !!userId,
        })
        .select()
        .single();

      if (addressError) throw addressError;

      const orderNum = `ART-${Date.now()}`;

      const orderNotes = [
        formData.notes,
        !userId && formData.email ? `Guest Email: ${formData.email}` : null,
        formData.transactionId ? `Txn ID: ${formData.transactionId}` : null,
        formData.paymentNote ? `Payment Note: ${formData.paymentNote}` : null,
      ].filter(Boolean).join(" | ") || null;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          address_id: address.id,
          payment_method: formData.paymentMethod,
          payment_transaction_id: formData.transactionId || null,
          subtotal: itemTotal,
          shipping_cost: shippingCost,
          total,
          is_preorder: isPreorder,
          notes: orderNotes,
          order_number: orderNum,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert({
          order_id: orderData.id,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          quantity: quantity,
          is_preorder: isPreorder,
        });

      if (itemsError) throw itemsError;

      onOpenChange(false);
      navigate(`/order-success?orderId=${orderData.id}`);

    } catch (error) {
      console.error("Quick checkout error:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "h-[95vh] p-0" : "w-[500px] max-w-full p-0"}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <SheetTitle className="font-display text-lg">
              {language === "bn" ? "দ্রুত চেকআউট" : "Quick Checkout"}
            </SheetTitle>
          </div>

          <ScrollArea className="flex-1">
            <form id="quick-checkout-form" onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Product Summary */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ৳{product.price.toLocaleString()} × {quantity}
                  </p>
                </div>
                <span className="text-gold font-bold text-lg">
                  ৳{itemTotal.toLocaleString()}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gold" />
                  {language === "bn" ? "যোগাযোগ তথ্য" : "Contact Info"}
                </h3>
                <div>
                  <Label className="text-sm">Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Your name"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label className="text-sm">Phone *</Label>
                  <div className="relative mt-1">
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
                      className="mt-1 h-11"
                    />
                  </div>
                )}
              </div>

              {/* Shipping Method */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gold" />
                  {language === "bn" ? "ডেলিভারি পদ্ধতি" : "Shipping Method"}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShippingMethod("delivery")}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      shippingMethod === "delivery" ? "border-gold bg-gold/10" : "border-border"
                    }`}
                  >
                    <Truck className={`h-5 w-5 mx-auto mb-1 ${shippingMethod === "delivery" ? "text-gold" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">Home Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingMethod("pickup")}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      shippingMethod === "pickup" ? "border-gold bg-gold/10" : "border-border"
                    }`}
                  >
                    <Store className={`h-5 w-5 mx-auto mb-1 ${shippingMethod === "pickup" ? "text-gold" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">Store Pickup</span>
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              {shippingMethod === "delivery" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gold" />
                      Delivery Address
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoDetectLocation}
                      disabled={geoLoading}
                      className="text-xs h-7"
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
                      <Label className="text-xs">Division *</Label>
                      <select
                        value={selectedDivision}
                        onChange={(e) => {
                          setSelectedDivision(e.target.value);
                          setSelectedDistrict("");
                          setSelectedThana("");
                        }}
                        className={`mt-1 ${selectClasses}`}
                      >
                        <option value="" disabled>Select</option>
                        {divisions.map((div) => (
                          <option key={div.name} value={div.name}>{div.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">District *</Label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value);
                          setSelectedThana("");
                        }}
                        disabled={!selectedDivision}
                        className={`mt-1 ${selectClasses}`}
                      >
                        <option value="" disabled>Select</option>
                        {districts.map((dist) => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Thana *</Label>
                      <select
                        value={selectedThana}
                        onChange={(e) => setSelectedThana(e.target.value)}
                        disabled={!selectedDistrict}
                        className={`mt-1 ${selectClasses}`}
                      >
                        <option value="" disabled>Select</option>
                        {thanas.map((thana) => (
                          <option key={thana} value={thana}>{thana}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Shipping</Label>
                      <div className="mt-1 flex items-center gap-2 h-11 px-3 bg-muted rounded-md">
                        <Truck className="h-4 w-4 text-gold" />
                        <span className="font-semibold text-gold text-sm">
                          {selectedDistrict ? `৳${shippingCost}` : "—"}
                        </span>
                        {estimatedDays && (
                          <span className="text-xs text-muted-foreground">({estimatedDays})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Address *</Label>
                    <Input
                      value={formData.addressLine}
                      onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                      placeholder="House, Road, Area"
                      className="mt-1 h-11"
                    />
                  </div>
                </motion.div>
              )}

              {/* Payment Method */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gold" />
                  {language === "bn" ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
                </h3>

                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as any, transactionId: "", paymentNote: "" })}
                  className="space-y-2"
                >
                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    formData.paymentMethod === "cod" ? "border-gold bg-gold/10" : "border-border"
                  }`}>
                    <RadioGroupItem value="cod" id="qc-cod" />
                    <Label htmlFor="qc-cod" className="flex-1 cursor-pointer">
                      <span className="font-medium text-sm">Cash on Delivery</span>
                    </Label>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    formData.paymentMethod === "bkash" ? "border-pink-500/50 bg-pink-500/5" : "border-border"
                  }`}>
                    <RadioGroupItem value="bkash" id="qc-bkash" />
                    <Label htmlFor="qc-bkash" className="flex-1 cursor-pointer">
                      <span className="font-medium text-sm text-pink-500">bKash</span>
                    </Label>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    formData.paymentMethod === "nagad" ? "border-orange-500/50 bg-orange-500/5" : "border-border"
                  }`}>
                    <RadioGroupItem value="nagad" id="qc-nagad" />
                    <Label htmlFor="qc-nagad" className="flex-1 cursor-pointer">
                      <span className="font-medium text-sm text-orange-500">Nagad</span>
                    </Label>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    formData.paymentMethod === "bank_transfer" ? "border-blue-500/50 bg-blue-500/5" : "border-border"
                  }`}>
                    <RadioGroupItem value="bank_transfer" id="qc-bank" />
                    <Label htmlFor="qc-bank" className="flex-1 cursor-pointer">
                      <span className="font-medium text-sm text-blue-500">Bank / Other</span>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Transaction ID for bKash/Nagad */}
                {(formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2"
                  >
                    <Label className="text-xs">Transaction ID *</Label>
                    <Input
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      placeholder="e.g. 8N7A5XXXXX"
                      className="mt-1 h-11"
                    />
                  </motion.div>
                )}

                {/* Payment note for bank transfer */}
                {formData.paymentMethod === "bank_transfer" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2"
                  >
                    <Label className="text-xs">Payment Reference / Note</Label>
                    <Input
                      value={formData.paymentNote}
                      onChange={(e) => setFormData({ ...formData, paymentNote: e.target.value })}
                      placeholder="Transaction reference or note"
                      className="mt-1 h-11"
                    />
                  </motion.div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">
                  {language === "bn" ? "নোট (ঐচ্ছিক)" : "Notes (Optional)"}
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={language === "bn" ? "কোনো বিশেষ নির্দেশনা..." : "Any special instructions..."}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </form>
          </ScrollArea>

          {/* Sticky Footer */}
          <div className="border-t border-border p-4 bg-card space-y-3">
            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>৳{itemTotal.toLocaleString()}</span>
              </div>
              {shippingMethod === "delivery" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>৳{shippingCost.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
                <span>{language === "bn" ? "মোট" : "Total"}</span>
                <span className="text-gold">৳{total.toLocaleString()}</span>
              </div>
            </div>

            <Button
              type="submit"
              form="quick-checkout-form"
              variant="gold"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {language === "bn" ? "প্রসেসিং..." : "Processing..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  {language === "bn"
                    ? `অর্ডার করুন • ৳${total.toLocaleString()}`
                    : `Place Order • ৳${total.toLocaleString()}`}
                </span>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default QuickCheckoutDrawer;
