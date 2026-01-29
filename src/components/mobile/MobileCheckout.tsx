import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, MapPin, Phone, Truck, Store, 
  CreditCard, Wallet, User, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { divisions, calculateShippingCost, getDistrictsByDivision, getThanasByDistrict } from "@/data/bangladeshLocations";

const MobileCheckout = () => {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"delivery" | "pickup">("delivery");
  
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine: "",
    paymentMethod: "cod" as "cod" | "bkash" | "nagad",
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate("/shop");
    }
  }, [items.length, navigate]);

  const districts = selectedDivision
    ? getDistrictsByDivision(selectedDivision)
    : [];

  const thanas = selectedDistrict
    ? getThanasByDistrict(selectedDistrict)
    : [];

  const shippingCost = selectedDistrict ? calculateShippingCost(selectedDistrict) : 0;
  const total = subtotal + (shippingMethod === "delivery" ? shippingCost : 0);

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

    setLoading(true);

    try {
      const userId = user?.id || null;

      // Create address
      const addressData = {
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        full_name: formData.fullName,
        phone: formData.phone,
        division: selectedDivision || "N/A",
        district: selectedDistrict || "N/A",
        thana: selectedThana || "N/A",
        address_line: shippingMethod === "pickup" ? "Store Pickup" : formData.addressLine,
        is_default: false,
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
          subtotal,
          shipping_cost: shippingMethod === "delivery" ? shippingCost : 0,
          total,
          notes: formData.email ? `Guest Email: ${formData.email}` : null,
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

      // Navigate to success
      navigate(`/order-success?orderId=${orderData.id}`);

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order. Please try again.");
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

        {/* Guest Notice */}
        {!user && (
          <div className="p-4 bg-muted/50 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gold" />
                <span className="text-sm">Ordering as Guest</span>
              </div>
              <Link to="/auth" className="text-gold text-sm font-medium">
                Login
              </Link>
            </div>
          </div>
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
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              Delivery Address
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Division *</Label>
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
                      <SelectItem key={div.name} value={div.name}>{div.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">District *</Label>
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
                      <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm">Thana *</Label>
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
                    <SelectItem key={thana} value={thana}>{thana}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as "cod" | "bkash" | "nagad" })}
            className="space-y-2"
          >
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              formData.paymentMethod === "cod" ? "border-gold bg-gold/10" : "border-border"
            }`}>
              <RadioGroupItem value="cod" id="cod" />
              <label htmlFor="cod" className="flex items-center gap-2 flex-1 cursor-pointer">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Cash on Delivery</span>
              </label>
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              formData.paymentMethod === "bkash" ? "border-gold bg-gold/10" : "border-border"
            }`}>
              <RadioGroupItem value="bkash" id="bkash" />
              <label htmlFor="bkash" className="flex items-center gap-2 flex-1 cursor-pointer">
                <div className="w-5 h-5 bg-[#E2136E] rounded text-white text-[8px] font-bold flex items-center justify-center">b</div>
                <span className="text-sm font-medium">bKash</span>
              </label>
            </div>
            
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              formData.paymentMethod === "nagad" ? "border-gold bg-gold/10" : "border-border"
            }`}>
              <RadioGroupItem value="nagad" id="nagad" />
              <label htmlFor="nagad" className="flex items-center gap-2 flex-1 cursor-pointer">
                <div className="w-5 h-5 bg-[#F6A200] rounded text-white text-[8px] font-bold flex items-center justify-center">N</div>
                <span className="text-sm font-medium">Nagad</span>
              </label>
            </div>
          </RadioGroup>
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
