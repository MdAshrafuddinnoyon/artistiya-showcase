import { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useCustomizationSettings } from "@/hooks/useCustomizationSettings";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CustomOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomOrderModal = ({ open, onOpenChange }: CustomOrderModalProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { settings } = useCustomizationSettings();
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
      toast.error("Only JPG, PNG or WEBP files allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB");
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
      toast.error(language === "bn" ? "প্রথমে লগইন করুন" : "Please login first");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    // Check if image is required
    if (settings?.require_image && !selectedFile) {
      toast.error(language === "bn" ? "একটি ছবি আপলোড করুন" : "Please upload an image");
      return;
    }

    if (!formData.description.trim()) {
      toast.error(language === "bn" ? "বিস্তারিত লিখুন" : "Please add a description");
      return;
    }

    setLoading(true);

    try {
      let publicUrl = "";
      
      // Upload image if provided
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("custom-designs")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("custom-designs")
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
      }

      // Create custom order request
      const { error: insertError } = await supabase
        .from("custom_order_requests")
        .insert({
          user_id: user.id,
          reference_image_url: publicUrl || "https://via.placeholder.com/400x300?text=No+Image",
          description: formData.description,
          budget_min: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
          budget_max: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
        });

      if (insertError) throw insertError;

      const successMsg = language === "bn" 
        ? (settings?.success_message_bn || "আপনার কাস্টম অর্ডার রিকোয়েস্ট জমা দেওয়া হয়েছে!")
        : (settings?.success_message || "Your custom order request has been submitted!");
      
      toast.success(successMsg);
      onOpenChange(false);
      
      // Reset form
      setFormData({ description: "", budgetMin: "", budgetMax: "" });
      setSelectedFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting custom order:", error);
      toast.error(language === "bn" ? "কিছু ভুল হয়েছে, আবার চেষ্টা করুন" : "Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ description: "", budgetMin: "", budgetMax: "" });
    setSelectedFile(null);
    setImagePreview(null);
  };

  // Get localized texts
  const formTitle = language === "bn" 
    ? (settings?.form_title_bn || "আপনার ডিজাইন জমা দিন")
    : (settings?.form_title || "Submit Your Design");
  
  const formSubtitle = language === "bn"
    ? (settings?.form_subtitle_bn || "আপনার ডিজাইন আইডিয়া আপলোড করুন")
    : (settings?.form_subtitle || "Upload your design idea and we will make it for you");

  const descriptionLabel = settings?.form_description_label || "Detailed Description";
  const descriptionPlaceholder = settings?.form_description_placeholder || "Describe your preferred colors, size, materials...";

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold">
            {formTitle}
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {formSubtitle}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Image Upload */}
          <div>
            <Label className="text-foreground mb-2 block">
              {language === "bn" ? "রেফারেন্স ছবি" : "Reference Image"} 
              {settings?.require_image && <span className="text-destructive"> *</span>}
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
                  <p className="text-foreground font-medium">
                    {language === "bn" ? "ছবি আপলোড করুন" : "Upload Image"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    JPG, PNG or WEBP (max 5MB)
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-foreground">
              {descriptionLabel} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={descriptionPlaceholder}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1.5 min-h-[100px]"
            />
          </div>

          {/* Budget Range - Conditionally shown */}
          {settings?.show_budget_fields !== false && (
            <div>
              <Label className="text-foreground">
                {language === "bn" ? "বাজেট রেঞ্জ (ঐচ্ছিক)" : "Budget Range (Optional)"}
              </Label>
              <div className="grid grid-cols-2 gap-4 mt-1.5">
                <div>
                  <Input
                    type="number"
                    placeholder={language === "bn" ? "সর্বনিম্ন ৳" : "Min ৳"}
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder={language === "bn" ? "সর্বোচ্চ ৳" : "Max ৳"}
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {language === "bn" ? "বাতিল" : "Cancel"}
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
                  {language === "bn" ? "জমা দেওয়া হচ্ছে..." : "Submitting..."}
                </span>
              ) : (
                language === "bn" ? "রিকোয়েস্ট জমা দিন" : "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomOrderModal;
