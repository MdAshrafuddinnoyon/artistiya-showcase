import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, Image, Eye, EyeOff, GripVertical, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HeroSlide {
  id: string;
  title: string | null;
  title_highlight: string | null;
  title_end: string | null;
  badge_text: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  secondary_button_text: string | null;
  secondary_button_link: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

const AdminHeroSlider = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error("Error fetching slides:", error);
      toast.error("Failed to fetch slides");
    } finally {
      setLoading(false);
    }
  };

  const addSlide = async () => {
    try {
      const { error } = await supabase.from("hero_slides").insert({
        title: "New Slide Title",
        title_highlight: "Highlight",
        badge_text: "New Collection",
        description: "Add your description here...",
        button_text: "Shop Now",
        button_link: "/shop",
        display_order: slides.length,
      });

      if (error) throw error;
      toast.success("Slide added successfully");
      fetchSlides();
    } catch (error) {
      console.error("Error adding slide:", error);
      toast.error("Failed to add slide");
    }
  };

  const updateSlide = async (id: string, updates: Partial<HeroSlide>) => {
    try {
      const { error } = await supabase
        .from("hero_slides")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating slide:", error);
    }
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    
    try {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);

      if (error) throw error;
      toast.success("Slide deleted");
      fetchSlides();
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error("Failed to delete slide");
    }
  };

  const saveAllSlides = async () => {
    setSaving(true);
    try {
      for (const slide of slides) {
        await updateSlide(slide.id, slide);
      }
      toast.success("All slides saved successfully");
    } catch (error) {
      toast.error("Failed to save slides");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (slideId: string, file: File) => {
    setUploading(slideId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero-${slideId}-${Date.now()}.${fileExt}`;
      const filePath = `hero-slides/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setSlides(prev =>
        prev.map(s => s.id === slideId ? { ...s, image_url: publicUrl } : s)
      );
      
      await updateSlide(slideId, { image_url: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(null);
    }
  };

  const updateSlideField = (id: string, field: keyof HeroSlide, value: any) => {
    setSlides(prev =>
      prev.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-foreground">Hero Slider Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addSlide}>
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
          <Button variant="gold" onClick={saveAllSlides} disabled={saving}>
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
          if (file && selectedSlideId) {
            handleImageUpload(selectedSlideId, file);
          }
        }}
      />

      <div className="space-y-6">
        {slides.map((slide, index) => (
          <Card key={slide.id} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                <CardTitle className="text-lg font-display">
                  Slide {index + 1}
                </CardTitle>
                {slide.is_active ? (
                  <Eye className="h-4 w-4 text-green-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={slide.is_active}
                  onCheckedChange={(checked) => updateSlideField(slide.id, "is_active", checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteSlide(slide.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Image Upload */}
                <div className="lg:row-span-2">
                  <Label>Slide Image</Label>
                  <div
                    className="mt-2 aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden"
                    onClick={() => {
                      setSelectedSlideId(slide.id);
                      fileInputRef.current?.click();
                    }}
                  >
                    {uploading === slide.id ? (
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : slide.image_url ? (
                      <img
                        src={slide.image_url}
                        alt="Slide"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload image
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Text Fields */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Badge Text</Label>
                      <Input
                        value={slide.badge_text || ""}
                        onChange={(e) => updateSlideField(slide.id, "badge_text", e.target.value)}
                        className="mt-1.5"
                        placeholder="e.g. Premium Collection"
                      />
                    </div>
                    <div>
                      <Label>Title (Main)</Label>
                      <Input
                        value={slide.title || ""}
                        onChange={(e) => updateSlideField(slide.id, "title", e.target.value)}
                        className="mt-1.5"
                        placeholder="e.g. Artistry Woven,"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Title Highlight (Gold)</Label>
                      <Input
                        value={slide.title_highlight || ""}
                        onChange={(e) => updateSlideField(slide.id, "title_highlight", e.target.value)}
                        className="mt-1.5"
                        placeholder="e.g. Elegance"
                      />
                    </div>
                    <div>
                      <Label>Title End</Label>
                      <Input
                        value={slide.title_end || ""}
                        onChange={(e) => updateSlideField(slide.id, "title_end", e.target.value)}
                        className="mt-1.5"
                        placeholder="e.g. Defined"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={slide.description || ""}
                      onChange={(e) => updateSlideField(slide.id, "description", e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={slide.button_text || ""}
                        onChange={(e) => updateSlideField(slide.id, "button_text", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Button Link</Label>
                      <Input
                        value={slide.button_link || ""}
                        onChange={(e) => updateSlideField(slide.id, "button_link", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Secondary Button</Label>
                      <Input
                        value={slide.secondary_button_text || ""}
                        onChange={(e) => updateSlideField(slide.id, "secondary_button_text", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Secondary Link</Label>
                      <Input
                        value={slide.secondary_button_link || ""}
                        onChange={(e) => updateSlideField(slide.id, "secondary_button_link", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No slides yet</p>
            <Button variant="gold" onClick={addSlide}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Slide
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeroSlider;
