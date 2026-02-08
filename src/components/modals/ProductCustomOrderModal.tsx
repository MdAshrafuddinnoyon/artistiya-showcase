import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, Loader2, CreditCard, Palette, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePayment } from "@/hooks/usePayment";
import { useCustomizationSettings } from "@/hooks/useCustomizationSettings";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { divisions, districtThanas } from "@/data/bangladeshLocations";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  advance_payment_percent?: number;
  customization_instructions?: string;
}

interface ProductCustomOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

type Step = "requirements" | "delivery" | "payment";

const ProductCustomOrderModal = ({ 
  open, 
  onOpenChange, 
  product 
}: ProductCustomOrderModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings } = useCustomizationSettings();
  const { initiateBkashPayment, initiateNagadPayment, loading: paymentLoading } = usePayment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<Step>("requirements");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Form data
  const [requirements, setRequirements] = useState({
    description: "",
    budgetMin: "",
    budgetMax: "",
  });
  
  const [delivery, setDelivery] = useState({
    fullName: "",
    phone: "",
    email: "",
    division: "",
    district: "",
    thana: "",
    addressLine: "",
    notes: "",
  });
  
  const [paymentMethod, setPaymentMethod] = useState<string>("bkash");

  // Calculate advance payment
  const advancePercent = product.advance_payment_percent || settings?.default_advance_percent || 50;
  const advanceAmount = Math.ceil((product.price * advancePercent) / 100);

  // Get districts and thanas based on selection
  const divisionNames = divisions.map(d => d.name);
  const districtList = delivery.division 
    ? (divisions.find(d => d.name === delivery.division)?.districts || [])
    : [];
  const thanaList = delivery.district
    ? (districtThanas[delivery.district] || [])
    : [];

  // Pre-fill user email if logged in
  useEffect(() => {
    if (user?.email && !delivery.email) {
      setDelivery(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG or WEBP files allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateStep = (currentStep: Step): boolean => {
    if (currentStep === "requirements") {
      if (!requirements.description.trim()) {
        toast.error("Please describe your requirements");
        return false;
      }
      return true;
    }

    if (currentStep === "delivery") {
      if (!delivery.fullName.trim()) {
        toast.error("Please enter your name");
        return false;
      }
      if (!delivery.phone.trim() || delivery.phone.length < 11) {
        toast.error("Please enter a valid phone number");
        return false;
      }
      if (!delivery.division || !delivery.district || !delivery.addressLine.trim()) {
        toast.error("Please complete your delivery address");
        return false;
      }
      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;

    if (step === "requirements") setStep("delivery");
    else if (step === "delivery") setStep("payment");
  };

  const prevStep = () => {
    if (step === "delivery") setStep("requirements");
    else if (step === "payment") setStep("delivery");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to place a custom order");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Upload reference image if provided
      let imageUrl = product.images?.[0] || "";
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("custom-designs")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("custom-designs")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create custom order request
      const { data: orderData, error: insertError } = await supabase
        .from("custom_order_requests")
        .insert({
          user_id: user.id,
          product_id: product.id,
          reference_image_url: imageUrl,
          description: requirements.description,
          budget_min: requirements.budgetMin ? parseFloat(requirements.budgetMin) : product.price,
          budget_max: requirements.budgetMax ? parseFloat(requirements.budgetMax) : null,
          advance_amount: advanceAmount,
          payment_method: paymentMethod,
          full_name: delivery.fullName,
          phone: delivery.phone,
          email: delivery.email,
          division: delivery.division,
          district: delivery.district,
          thana: delivery.thana,
          address_line: delivery.addressLine,
          delivery_notes: delivery.notes,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Process payment
      if (paymentMethod === "bkash") {
        const result = await initiateBkashPayment(advanceAmount, orderData.id);
        if (result.success && result.bkashURL) {
          window.location.href = result.bkashURL;
          return;
        } else {
          toast.error(result.error || "Payment initiation failed");
        }
      } else if (paymentMethod === "nagad") {
        const result = await initiateNagadPayment(advanceAmount, orderData.id);
        if (result.success && result.callBackUrl) {
          window.location.href = result.callBackUrl;
          return;
        } else {
          toast.error(result.error || "Payment initiation failed");
        }
      } else if (paymentMethod === "cod") {
        // For COD, mark as submitted without payment
        toast.success("Custom order request submitted! We will contact you shortly.");
        onOpenChange(false);
        resetForm();
      }

    } catch (error) {
      console.error("Error submitting custom order:", error);
      toast.error("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("requirements");
    setRequirements({ description: "", budgetMin: "", budgetMax: "" });
    setDelivery({
      fullName: "",
      phone: "",
      email: user?.email || "",
      division: "",
      district: "",
      thana: "",
      addressLine: "",
      notes: "",
    });
    setSelectedFile(null);
    setImagePreview(null);
    setPaymentMethod("bkash");
  };

  const stepProgress = step === "requirements" ? 33 : step === "delivery" ? 66 : 100;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Custom Order Request
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {product.name} • Advance: ৳{advanceAmount.toLocaleString()} ({advancePercent}%)
          </p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={stepProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={step === "requirements" ? "text-gold font-medium" : ""}>
              Requirements
            </span>
            <span className={step === "delivery" ? "text-gold font-medium" : ""}>
              Delivery
            </span>
            <span className={step === "payment" ? "text-gold font-medium" : ""}>
              Payment
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-4 space-y-4">
          {/* Step 1: Requirements */}
          {step === "requirements" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Product Preview */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img 
                  src={product.images?.[0] || "/placeholder.svg"} 
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-medium text-foreground">{product.name}</h4>
                  <p className="text-gold font-semibold">Base: ৳{product.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Customization Instructions */}
              {product.customization_instructions && (
                <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg text-sm">
                  <p className="font-medium text-gold mb-1">Customization Guide:</p>
                  <p className="text-muted-foreground">{product.customization_instructions}</p>
                </div>
              )}

              {/* Reference Image */}
              <div>
                <Label className="text-foreground mb-2 block">
                  Reference Image (Optional)
                </Label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setSelectedFile(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 hover:border-gold/50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-gold" />
                    <span className="text-sm text-muted-foreground">Upload reference image</span>
                  </button>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-foreground">
                  Your Requirements <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe colors, size, materials, and other preferences..."
                  value={requirements.description}
                  onChange={(e) => setRequirements(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1.5 min-h-[80px]"
                />
              </div>

              {/* Budget Range */}
              <div>
                <Label className="text-foreground">Expected Budget (Optional)</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <Input
                    type="number"
                    placeholder="Min ৳"
                    value={requirements.budgetMin}
                    onChange={(e) => setRequirements(prev => ({ ...prev, budgetMin: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max ৳"
                    value={requirements.budgetMax}
                    onChange={(e) => setRequirements(prev => ({ ...prev, budgetMax: e.target.value }))}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Delivery */}
          {step === "delivery" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-gold mb-2">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Delivery Information</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={delivery.fullName}
                    onChange={(e) => setDelivery(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="01XXXXXXXXX"
                    value={delivery.phone}
                    onChange={(e) => setDelivery(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={delivery.email}
                  onChange={(e) => setDelivery(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Division *</Label>
                  <select
                    value={delivery.division}
                    onChange={(e) => setDelivery(prev => ({ 
                      ...prev, 
                      division: e.target.value,
                      district: "",
                      thana: ""
                    }))}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                  >
                    <option value="">Select</option>
                    {divisionNames.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>District *</Label>
                  <select
                    value={delivery.district}
                    onChange={(e) => setDelivery(prev => ({ 
                      ...prev, 
                      district: e.target.value,
                      thana: ""
                    }))}
                    disabled={!delivery.division}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm disabled:opacity-50"
                  >
                    <option value="">Select</option>
                    {districtList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Thana</Label>
                  <select
                    value={delivery.thana}
                    onChange={(e) => setDelivery(prev => ({ ...prev, thana: e.target.value }))}
                    disabled={!delivery.district}
                    className="w-full mt-1 h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm disabled:opacity-50"
                  >
                    <option value="">Select</option>
                    {thanaList.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="addressLine">Full Address *</Label>
                <Textarea
                  id="addressLine"
                  placeholder="House/Road/Village details..."
                  value={delivery.addressLine}
                  onChange={(e) => setDelivery(prev => ({ ...prev, addressLine: e.target.value }))}
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <div>
                <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any special instructions..."
                  value={delivery.notes}
                  onChange={(e) => setDelivery(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-gold mb-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Advance Payment</span>
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product Base Price</span>
                  <span>৳{product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Advance Required ({advancePercent}%)</span>
                  <span className="text-gold font-semibold">৳{advanceAmount.toLocaleString()}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-semibold">
                  <span>Pay Now</span>
                  <span className="text-gold text-lg">৳{advanceAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <Label>Select Payment Method</Label>
                
                <div className="grid gap-2">
                  {/* bKash */}
                  <label 
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === "bkash" 
                        ? "border-gold bg-gold/10" 
                        : "border-border hover:border-gold/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="bkash"
                      checked={paymentMethod === "bkash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-gold"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#E2136E] rounded flex items-center justify-center text-white text-xs font-bold">
                        bK
                      </div>
                      <span className="font-medium">bKash</span>
                    </div>
                  </label>

                  {/* Nagad */}
                  <label 
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === "nagad" 
                        ? "border-gold bg-gold/10" 
                        : "border-border hover:border-gold/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="nagad"
                      checked={paymentMethod === "nagad"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-gold"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#F6921E] rounded flex items-center justify-center text-white text-xs font-bold">
                        N
                      </div>
                      <span className="font-medium">Nagad</span>
                    </div>
                  </label>

                  {/* COD - No advance */}
                  <label 
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === "cod" 
                        ? "border-gold bg-gold/10" 
                        : "border-border hover:border-gold/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-gold"
                    />
                    <div className="flex items-center gap-2">
                      <Truck className="w-8 h-8 text-muted-foreground p-1" />
                      <div>
                        <span className="font-medium">Cash on Delivery</span>
                        <p className="text-xs text-muted-foreground">Pay full amount on delivery</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {paymentMethod !== "cod" && (
                <p className="text-xs text-muted-foreground text-center">
                  You'll be redirected to complete payment. Remaining amount will be collected on delivery.
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          {step !== "requirements" && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1"
              disabled={loading}
            >
              Back
            </Button>
          )}
          
          {step !== "payment" ? (
            <Button
              type="button"
              variant="gold"
              onClick={nextStep}
              className="flex-1"
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              variant="gold"
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading || paymentLoading}
            >
              {loading || paymentLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : paymentMethod === "cod" ? (
                "Submit Request"
              ) : (
                `Pay ৳${advanceAmount.toLocaleString()}`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCustomOrderModal;
