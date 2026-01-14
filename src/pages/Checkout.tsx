import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, CreditCard, Truck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { divisions, calculateShippingCost, isDhakaDistrict } from "@/data/bangladeshLocations";

const Checkout = () => {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
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

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  if (items.length === 0 && !orderSuccess) {
    navigate("/shop");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.phone || !selectedDivision || 
        !selectedDistrict || !selectedThana || !formData.addressLine) {
      toast.error("সব তথ্য পূরণ করুন");
      return;
    }

    if ((formData.paymentMethod === "bkash" || formData.paymentMethod === "nagad") && 
        !formData.transactionId) {
      toast.error("ট্রানজেকশন আইডি দিন");
      return;
    }

    setLoading(true);

    try {
      // Create address
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          division: selectedDivision,
          district: selectedDistrict,
          thana: selectedThana,
          address_line: formData.addressLine,
          is_default: true,
        })
        .select()
        .single();

      if (addressError) throw addressError;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: user.id,
          address_id: addressData.id,
          payment_method: formData.paymentMethod,
          payment_transaction_id: formData.transactionId || null,
          subtotal,
          shipping_cost: shippingCost,
          total,
          is_preorder: hasPreorderItems,
          notes: formData.notes || null,
        }])
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
      toast.success("অর্ডার সফল হয়েছে!");

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("অর্ডার করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

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
            
            <h1 className="font-display text-3xl text-foreground mb-4">
              অর্ডার সফল হয়েছে!
            </h1>
            
            <p className="text-muted-foreground mb-2">
              আপনার অর্ডার নম্বর
            </p>
            <p className="text-2xl font-bold text-gold mb-6">
              {orderNumber}
            </p>

            {hasPreorderItems && (
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-gold font-medium">⏳ প্রি-অর্ডার আইটেম</p>
                <p className="text-sm text-muted-foreground mt-1">
                  এই অর্ডারে প্রি-অর্ডার আইটেম আছে। তৈরি করতে সময় লাগবে।
                </p>
              </div>
            )}

            <p className="text-muted-foreground mb-8">
              আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
            </p>

            <div className="flex gap-4 justify-center">
              <Button variant="gold" onClick={() => navigate("/shop")}>
                আরো শপিং
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                হোম যান
              </Button>
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
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-8 text-center">
            চেকআউট
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Shipping Address */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h2 className="font-display text-xl flex items-center gap-2 mb-6">
                    <MapPin className="h-5 w-5 text-gold" />
                    ডেলিভারি ঠিকানা
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="fullName">পুরো নাম *</Label>
                      <Input
                        id="fullName"
                        placeholder="আপনার নাম"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="phone">মোবাইল নম্বর *</Label>
                      <div className="relative mt-1.5">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="01XXXXXXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>বিভাগ *</Label>
                      <Select value={selectedDivision} onValueChange={(v) => {
                        setSelectedDivision(v);
                        setSelectedDistrict("");
                        setSelectedThana("");
                      }}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map(div => (
                            <SelectItem key={div.name} value={div.name}>
                              {div.name_bn} ({div.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>জেলা *</Label>
                      <Select 
                        value={selectedDistrict} 
                        onValueChange={(v) => {
                          setSelectedDistrict(v);
                          setSelectedThana("");
                        }}
                        disabled={!selectedDivision}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="জেলা নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map(dist => (
                            <SelectItem key={dist.name} value={dist.name}>
                              {dist.name_bn} ({dist.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>থানা/উপজেলা *</Label>
                      <Select 
                        value={selectedThana} 
                        onValueChange={setSelectedThana}
                        disabled={!selectedDistrict}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="থানা নির্বাচন করুন" />
                        </SelectTrigger>
                        <SelectContent>
                          {thanas.map(thana => (
                            <SelectItem key={thana.name} value={thana.name}>
                              {thana.name_bn} ({thana.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>শিপিং চার্জ</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gold" />
                        <span className="font-semibold text-gold">
                          {selectedDistrict ? `৳${shippingCost}` : "জেলা নির্বাচন করুন"}
                        </span>
                        {selectedDistrict && (
                          <span className="text-xs text-muted-foreground">
                            ({isDhakaDistrict(selectedDistrict) ? "ঢাকা" : "ঢাকার বাইরে"})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="addressLine">সম্পূর্ণ ঠিকানা *</Label>
                      <Textarea
                        id="addressLine"
                        placeholder="বাড়ি নং, রোড নং, এলাকা..."
                        value={formData.addressLine}
                        onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Payment Method */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h2 className="font-display text-xl flex items-center gap-2 mb-6">
                    <CreditCard className="h-5 w-5 text-gold" />
                    পেমেন্ট পদ্ধতি
                  </h2>

                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as any })}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-gold/50 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <span className="font-medium">ক্যাশ অন ডেলিভারি</span>
                        <span className="block text-sm text-muted-foreground">
                          পণ্য হাতে পেয়ে টাকা দিন
                        </span>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-gold/50 transition-colors">
                      <RadioGroupItem value="bkash" id="bkash" />
                      <Label htmlFor="bkash" className="flex-1 cursor-pointer">
                        <span className="font-medium text-pink-500">বিকাশ</span>
                        <span className="block text-sm text-muted-foreground">
                          01XXXXXXXXX নম্বরে Send Money করুন
                        </span>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-gold/50 transition-colors">
                      <RadioGroupItem value="nagad" id="nagad" />
                      <Label htmlFor="nagad" className="flex-1 cursor-pointer">
                        <span className="font-medium text-orange-500">নগদ</span>
                        <span className="block text-sm text-muted-foreground">
                          01XXXXXXXXX নম্বরে Send Money করুন
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
                      <Label htmlFor="transactionId">ট্রানজেকশন আইডি *</Label>
                      <Input
                        id="transactionId"
                        placeholder="যেমন: 8N7A5XXXXX"
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
                  <Label htmlFor="notes">অতিরিক্ত নোট (ঐচ্ছিক)</Label>
                  <Textarea
                    id="notes"
                    placeholder="কোনো বিশেষ নির্দেশনা থাকলে লিখুন..."
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
                  <h2 className="font-display text-xl mb-6">অর্ডার সামারি</h2>

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
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-muted-foreground text-sm">
                            ৳{item.product.price.toLocaleString()} × {item.quantity}
                          </p>
                          {item.product.stock_quantity === 0 && item.product.is_preorderable && (
                            <span className="text-xs text-gold">প্রি-অর্ডার</span>
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
                      <span className="text-muted-foreground">সাবটোটাল</span>
                      <span>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">শিপিং</span>
                      <span>৳{shippingCost}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
                      <span>মোট</span>
                      <span className="text-gold">৳{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {hasPreorderItems && (
                    <div className="mt-4 p-3 bg-gold/10 border border-gold/30 rounded-lg">
                      <p className="text-xs text-gold">
                        ⏳ এই অর্ডারে প্রি-অর্ডার আইটেম আছে
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full mt-6"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        অর্ডার হচ্ছে...
                      </span>
                    ) : (
                      `অর্ডার কনফার্ম করুন • ৳${total.toLocaleString()}`
                    )}
                  </Button>
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
