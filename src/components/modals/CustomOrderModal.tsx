import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CustomOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomOrderModal = ({ open, onOpenChange }: CustomOrderModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    budgetMin: "",
    budgetMax: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("শুধুমাত্র JPG, PNG বা WEBP ফাইল অনুমোদিত");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("অনুগ্রহ করে প্রথমে লগইন করুন");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    if (!selectedFile) {
      toast.error("অনুগ্রহ করে একটি ছবি আপলোড করুন");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("অনুগ্রহ করে বিবরণ লিখুন");
      return;
    }

    setLoading(true);

    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("custom-designs")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("custom-designs")
        .getPublicUrl(fileName);

      // Create custom order request
      const { error: insertError } = await supabase
        .from("custom_order_requests")
        .insert({
          user_id: user.id,
          reference_image_url: publicUrl,
          description: formData.description,
          budget_min: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
          budget_max: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
        });

      if (insertError) throw insertError;

      toast.success("আপনার কাস্টম অর্ডার রিকোয়েস্ট পাঠানো হয়েছে!");
      onOpenChange(false);
      
      // Reset form
      setFormData({ description: "", budgetMin: "", budgetMax: "" });
      setSelectedFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting custom order:", error);
      toast.error("সমস্যা হয়েছে, আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ description: "", budgetMin: "", budgetMax: "" });
    setSelectedFile(null);
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold">
            আপনার ডিজাইন দিন
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-1">
            আপনার পছন্দের ডিজাইন আপলোড করুন, আমরা তৈরি করে দেব
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Image Upload */}
          <div>
            <Label className="text-foreground mb-2 block">
              রেফারেন্স ছবি <span className="text-destructive">*</span>
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
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-gold/50 transition-colors"
              >
                <div className="p-4 bg-muted rounded-full">
                  <Upload className="h-6 w-6 text-gold" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-medium">ছবি আপলোড করুন</p>
                  <p className="text-muted-foreground text-sm">JPG, PNG বা WEBP (সর্বোচ্চ ৫MB)</p>
                </div>
              </button>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-foreground">
              বিস্তারিত বিবরণ <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="আপনার পছন্দের রঙ, সাইজ, মেটেরিয়াল, অন্যান্য বিবরণ লিখুন..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1.5 min-h-[100px]"
            />
          </div>

          {/* Budget Range */}
          <div>
            <Label className="text-foreground">বাজেট রেঞ্জ (ঐচ্ছিক)</Label>
            <div className="grid grid-cols-2 gap-4 mt-1.5">
              <div>
                <Input
                  type="number"
                  placeholder="সর্বনিম্ন ৳"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="সর্বোচ্চ ৳"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  পাঠানো হচ্ছে...
                </span>
              ) : (
                "রিকোয়েস্ট পাঠান"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomOrderModal;
