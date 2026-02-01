import { useState, useEffect, useRef } from "react";
import { Save, Upload, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeaturedSection {
  id: string;
  section_key: string;
  badge_text: string | null;
  title_line1: string | null;
  title_highlight: string | null;
  description: string | null;
  features: string[] | null;
  button_text: string | null;
  button_link: string | null;
  price_text: string | null;
  image_url: string | null;
  layout: string;
  is_active: boolean;
}

const AdminFeaturedSection = () => {
  const [section, setSection] = useState<FeaturedSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSection();
  }, []);

  const fetchSection = async () => {
    try {
      const { data, error } = await supabase
        .from("featured_sections")
        .select("*")
        .eq("section_key", "signature")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSection(data);
      } else {
        // Create default if not exists
        const { data: newData, error: insertError } = await supabase
          .from("featured_sections")
          .insert({
            section_key: "signature",
            badge_text: "Signature Collection",
            title_line1: "The Floral Bloom",
            title_highlight: "Tote Collection",
            layout: "image-left",
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setSection(newData);
      }
    } catch (error) {
      console.error("Error fetching section:", error);
      toast.error("Failed to load section data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!section) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("featured_sections")
        .update({
          badge_text: section.badge_text,
          title_line1: section.title_line1,
          title_highlight: section.title_highlight,
          description: section.description,
          features: section.features,
          button_text: section.button_text,
          button_link: section.button_link,
          price_text: section.price_text,
          image_url: section.image_url,
          layout: section.layout,
          is_active: section.is_active,
        })
        .eq("id", section.id);

      if (error) throw error;
      toast.success("Section saved successfully");
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!section) return;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `featured-${section.id}-${Date.now()}.${fileExt}`;
      const filePath = `featured/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setSection({ ...section, image_url: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim() || !section) return;
    const features = [...(section.features || []), newFeature.trim()];
    setSection({ ...section, features });
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    if (!section) return;
    const features = (section.features || []).filter((_, i) => i !== index);
    setSection({ ...section, features });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!section) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl text-foreground">Signature Collection Section</h2>
          <p className="text-sm text-muted-foreground">
            Edit the featured collection section on homepage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Active</Label>
            <Switch
              checked={section.is_active}
              onCheckedChange={(checked) => setSection({ ...section, is_active: checked })}
            />
          </div>
          <Button variant="gold" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
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
          if (file) handleImageUpload(file);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image & Layout */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Image & Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Section Image</Label>
              <div
                className="mt-2 aspect-[4/5] rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : section.image_url ? (
                  <img
                    src={section.image_url}
                    alt="Featured"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Layout Direction</Label>
              <Select
                value={section.layout}
                onValueChange={(value) => setSection({ ...section, layout: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image-left">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4" />
                      Image Left, Content Right
                    </div>
                  </SelectItem>
                  <SelectItem value="image-right">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4 rotate-180" />
                      Image Right, Content Left
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Badge Text</Label>
              <Input
                value={section.badge_text || ""}
                onChange={(e) => setSection({ ...section, badge_text: e.target.value })}
                className="mt-1.5"
                placeholder="e.g. Signature Collection"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title Line 1</Label>
                <Input
                  value={section.title_line1 || ""}
                  onChange={(e) => setSection({ ...section, title_line1: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. The Floral Bloom"
                />
              </div>
              <div>
                <Label>Title Highlight (Gold)</Label>
                <Input
                  value={section.title_highlight || ""}
                  onChange={(e) => setSection({ ...section, title_highlight: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. Tote Collection"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={section.description || ""}
                onChange={(e) => setSection({ ...section, description: e.target.value })}
                className="mt-1.5"
                rows={3}
                placeholder="Write about this collection..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={section.button_text || ""}
                  onChange={(e) => setSection({ ...section, button_text: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. Explore Collection"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={section.button_link || ""}
                  onChange={(e) => setSection({ ...section, button_link: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. /collections/floral-bloom"
                />
              </div>
            </div>

            <div>
              <Label>Price Text</Label>
              <Input
                value={section.price_text || ""}
                onChange={(e) => setSection({ ...section, price_text: e.target.value })}
                className="mt-1.5"
                placeholder="e.g. From ৳3,800"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Features / Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature..."
              onKeyPress={(e) => e.key === "Enter" && addFeature()}
            />
            <Button onClick={addFeature} variant="outline">Add</Button>
          </div>
          <div className="space-y-2">
            {(section.features || []).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                <span className="flex-1 text-sm">{feature}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-destructive"
                  onClick={() => removeFeature(index)}
                >
                  ×
                </Button>
              </div>
            ))}
            {(!section.features || section.features.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No features added yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFeaturedSection;
