import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, Upload, Star, Eye, EyeOff, MapPin, User, ExternalLink, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Testimonial {
  id: string;
  name: string;
  text: string;
  location: string | null;
  rating: number;
  is_active: boolean;
  display_order: number;
  image_url: string | null;
  customer_photo_url: string | null;
  source: string;
  google_review_id: string | null;
  verified_purchase: boolean;
  product_id: string | null;
}

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTestimonialId, setSelectedTestimonialId] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTestimonial = async () => {
    try {
      const { error } = await supabase.from("testimonials").insert({
        name: "New Customer",
        text: "Add your review text here...",
        location: "Dhaka",
        rating: 5,
        display_order: testimonials.length,
        source: "manual",
      });

      if (error) throw error;
      toast.success("Testimonial added");
      fetchTestimonials();
    } catch (error) {
      console.error("Error adding testimonial:", error);
      toast.error("Failed to add testimonial");
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;

    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
      toast.success("Testimonial deleted");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  const updateField = (id: string, field: keyof Testimonial, value: any) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const testimonial of testimonials) {
        const { error } = await supabase
          .from("testimonials")
          .update({
            name: testimonial.name,
            text: testimonial.text,
            location: testimonial.location,
            rating: testimonial.rating,
            is_active: testimonial.is_active,
            display_order: testimonial.display_order,
            image_url: testimonial.image_url,
            customer_photo_url: testimonial.customer_photo_url,
            source: testimonial.source,
            verified_purchase: testimonial.verified_purchase,
          })
          .eq("id", testimonial.id);

        if (error) throw error;
      }
      toast.success("All testimonials saved");
    } catch (error) {
      console.error("Error saving testimonials:", error);
      toast.error("Failed to save testimonials");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (testimonialId: string, file: File) => {
    setUploading(testimonialId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `testimonial-${testimonialId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("testimonials")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("testimonials")
        .getPublicUrl(fileName);

      updateField(testimonialId, "customer_photo_url", publicUrl);
      toast.success("Photo uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 text-gold" />
            Customer Testimonials
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer reviews displayed on homepage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addTestimonial}>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
          <Button variant="gold" onClick={saveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selectedTestimonialId) {
            handlePhotoUpload(selectedTestimonialId, file);
          }
        }}
      />

      {testimonials.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No testimonials yet</p>
          <Button variant="gold" onClick={addTestimonial}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Testimonial
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Photo Upload */}
                  <div
                    className="w-24 h-24 rounded-full bg-muted flex-shrink-0 cursor-pointer group relative overflow-hidden"
                    onClick={() => {
                      setSelectedTestimonialId(testimonial.id);
                      fileInputRef.current?.click();
                    }}
                  >
                    {uploading === testimonial.id ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-gold border-t-transparent rounded-full" />
                      </div>
                    ) : testimonial.customer_photo_url ? (
                      <>
                        <img
                          src={testimonial.customer_photo_url}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground group-hover:text-gold transition-colors">
                        <User className="h-8 w-8" />
                        <span className="text-xs mt-1">Upload</span>
                      </div>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs">Customer Name</Label>
                          <Input
                            value={testimonial.name}
                            onChange={(e) => updateField(testimonial.id, "name", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Location</Label>
                          <Input
                            value={testimonial.location || ""}
                            onChange={(e) => updateField(testimonial.id, "location", e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Dhaka"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Rating</Label>
                          <Select
                            value={String(testimonial.rating)}
                            onValueChange={(v) => updateField(testimonial.id, "rating", parseInt(v))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 4, 3, 2, 1].map((r) => (
                                <SelectItem key={r} value={String(r)}>
                                  {r} Stars
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={testimonial.is_active}
                            onCheckedChange={(checked) => updateField(testimonial.id, "is_active", checked)}
                          />
                          {testimonial.is_active ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteTestimonial(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Review Text</Label>
                      <Textarea
                        value={testimonial.text}
                        onChange={(e) => updateField(testimonial.id, "text", e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={testimonial.verified_purchase}
                          onCheckedChange={(checked) => updateField(testimonial.id, "verified_purchase", checked)}
                        />
                        <span className="text-sm text-muted-foreground">Verified Purchase</span>
                      </div>

                      {testimonial.verified_purchase && (
                        <Badge variant="secondary" className="gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}

                      <Badge variant="outline" className="ml-auto">
                        #{index + 1} • {testimonial.source}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
