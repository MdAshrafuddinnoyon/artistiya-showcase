import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Eye, EyeOff, GripVertical, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";

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
  // New fields for banner-only mode
  show_title: boolean;
  show_description: boolean;
  show_badge: boolean;
  show_primary_button: boolean;
  show_secondary_button: boolean;
  image_link_url: string | null;
  overlay_position: string;
  overlay_enabled: boolean;
  overlay_opacity: number | null;
  image_fit: string;
}

const AdminHeroSlider = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSlides();

    // Real-time subscription
    const channel = supabase
      .channel('hero_slides_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_slides' },
        () => {
          fetchSlides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        show_title: true,
        show_description: true,
        show_badge: true,
        show_primary_button: true,
        show_secondary_button: true,
        overlay_enabled: true,
        overlay_position: "left",
        overlay_opacity: 50,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="font-display text-xl text-foreground">Hero Slider Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addSlide} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
          <Button variant="gold" onClick={saveAllSlides} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {slides.map((slide, index) => (
          <Card key={slide.id} className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-2">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab hidden sm:block" />
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
                  <ImageUploadZone
                    value={slide.image_url}
                    onChange={(url) => updateSlideField(slide.id, "image_url", url)}
                    onRemove={() => updateSlideField(slide.id, "image_url", "")}
                    label="Slide Image"
                    bucket="product-images"
                    folder="hero-slides"
                    aspectRatio="video"
                  />
                  
                  {/* Image Link URL */}
                  <div className="mt-3">
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="h-3 w-3" />
                      Image Click URL
                    </Label>
                    <Input
                      value={slide.image_link_url || ""}
                      onChange={(e) => updateSlideField(slide.id, "image_link_url", e.target.value)}
                      className="mt-1.5"
                      placeholder="e.g. /shop/sale or https://..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ইমেজে ক্লিক করলে এই লিংকে যাবে (ব্যানার-অনলি মোডে কার্যকর)
                    </p>
                  </div>

                  {/* Image Fit Mode */}
                  <div className="mt-3">
                    <Label>Image Fit Mode (ইমেজ প্রদর্শন)</Label>
                    <Select
                      value={slide.image_fit || "cover"}
                      onValueChange={(value) => updateSlideField(slide.id, "image_fit", value)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover (পুরো এরিয়া ঢেকে)</SelectItem>
                        <SelectItem value="contain">Contain (সম্পূর্ণ ইমেজ দেখায়)</SelectItem>
                        <SelectItem value="fill">Fill (স্ট্রেচ করে)</SelectItem>
                        <SelectItem value="scale-down">Scale Down (ছোট করে)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Text Fields */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Visibility Toggles */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3">প্রদর্শন নিয়ন্ত্রণ (Visibility Controls)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="flex items-center justify-between bg-background p-2 rounded-md">
                        <Label className="text-xs">Badge</Label>
                        <Switch
                          checked={slide.show_badge ?? true}
                          onCheckedChange={(checked) => updateSlideField(slide.id, "show_badge", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between bg-background p-2 rounded-md">
                        <Label className="text-xs">Title</Label>
                        <Switch
                          checked={slide.show_title ?? true}
                          onCheckedChange={(checked) => updateSlideField(slide.id, "show_title", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between bg-background p-2 rounded-md">
                        <Label className="text-xs">Description</Label>
                        <Switch
                          checked={slide.show_description ?? true}
                          onCheckedChange={(checked) => updateSlideField(slide.id, "show_description", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between bg-background p-2 rounded-md">
                        <Label className="text-xs">Button 1</Label>
                        <Switch
                          checked={slide.show_primary_button ?? true}
                          onCheckedChange={(checked) => updateSlideField(slide.id, "show_primary_button", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between bg-background p-2 rounded-md">
                        <Label className="text-xs">Button 2</Label>
                        <Switch
                          checked={slide.show_secondary_button ?? true}
                          onCheckedChange={(checked) => updateSlideField(slide.id, "show_secondary_button", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Overlay Controls */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3">ওভারলে নিয়ন্ত্রণ (Overlay Settings)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between bg-background p-2 rounded-md">
                        <Label className="text-xs">Enable Overlay</Label>
                        <Switch
                          checked={slide.overlay_enabled ?? true}
                          onCheckedChange={(checked) => updateSlideField(slide.id, "overlay_enabled", checked)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Position</Label>
                        <Select
                          value={slide.overlay_position || "left"}
                          onValueChange={(value) => updateSlideField(slide.id, "overlay_position", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left (বামে)</SelectItem>
                            <SelectItem value="right">Right (ডানে)</SelectItem>
                            <SelectItem value="top">Top (উপরে)</SelectItem>
                            <SelectItem value="bottom">Bottom (নিচে)</SelectItem>
                            <SelectItem value="center">Center (মাঝে)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Opacity: {slide.overlay_opacity ?? 50}%</Label>
                        <Slider
                          value={[slide.overlay_opacity ?? 50]}
                          onValueChange={(val) => updateSlideField(slide.id, "overlay_opacity", val[0])}
                          min={0}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Fields - only show if title/desc visible */}
                  {(slide.show_badge || slide.show_title || slide.show_description) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Badge Text</Label>
                          <Input
                            value={slide.badge_text || ""}
                            onChange={(e) => updateSlideField(slide.id, "badge_text", e.target.value)}
                            className="mt-1.5"
                            placeholder="e.g. Premium Collection"
                            disabled={!slide.show_badge}
                          />
                        </div>
                        <div>
                          <Label>Title (Main)</Label>
                          <Input
                            value={slide.title || ""}
                            onChange={(e) => updateSlideField(slide.id, "title", e.target.value)}
                            className="mt-1.5"
                            placeholder="e.g. Artistry Woven,"
                            disabled={!slide.show_title}
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
                            disabled={!slide.show_title}
                          />
                        </div>
                        <div>
                          <Label>Title End</Label>
                          <Input
                            value={slide.title_end || ""}
                            onChange={(e) => updateSlideField(slide.id, "title_end", e.target.value)}
                            className="mt-1.5"
                            placeholder="e.g. Defined"
                            disabled={!slide.show_title}
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
                          disabled={!slide.show_description}
                        />
                      </div>
                    </>
                  )}

                  {/* Button Fields - only show if buttons visible */}
                  {(slide.show_primary_button || slide.show_secondary_button) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={slide.button_text || ""}
                          onChange={(e) => updateSlideField(slide.id, "button_text", e.target.value)}
                          className="mt-1.5"
                          disabled={!slide.show_primary_button}
                        />
                      </div>
                      <div>
                        <Label>Button Link</Label>
                        <Input
                          value={slide.button_link || ""}
                          onChange={(e) => updateSlideField(slide.id, "button_link", e.target.value)}
                          className="mt-1.5"
                          disabled={!slide.show_primary_button}
                        />
                      </div>
                      <div>
                        <Label>Secondary Button</Label>
                        <Input
                          value={slide.secondary_button_text || ""}
                          onChange={(e) => updateSlideField(slide.id, "secondary_button_text", e.target.value)}
                          className="mt-1.5"
                          disabled={!slide.show_secondary_button}
                        />
                      </div>
                      <div>
                        <Label>Secondary Link</Label>
                        <Input
                          value={slide.secondary_button_link || ""}
                          onChange={(e) => updateSlideField(slide.id, "secondary_button_link", e.target.value)}
                          className="mt-1.5"
                          disabled={!slide.show_secondary_button}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
