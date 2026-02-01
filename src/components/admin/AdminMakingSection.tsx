import { useState, useEffect, useRef } from "react";
import { Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MakingSection {
  id: string;
  badge_text: string | null;
  title_line1: string | null;
  title_highlight: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  background_image_url: string | null;
  stat1_number: string | null;
  stat1_label: string | null;
  stat2_number: string | null;
  stat2_label: string | null;
  stat3_number: string | null;
  stat3_label: string | null;
  overlay_opacity: number | null;
  is_active: boolean;
}

const AdminMakingSection = () => {
  const [section, setSection] = useState<MakingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSection();
  }, []);

  const fetchSection = async () => {
    try {
      const { data, error } = await supabase
        .from("making_section")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSection(data);
      } else {
        // Create default
        const { data: newData, error: insertError } = await supabase
          .from("making_section")
          .insert({
            badge_text: "Behind the Craft",
            title_line1: "Behind Every Piece",
            title_highlight: "An Artisan's Story",
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
        .from("making_section")
        .update({
          badge_text: section.badge_text,
          title_line1: section.title_line1,
          title_highlight: section.title_highlight,
          description: section.description,
          button_text: section.button_text,
          button_link: section.button_link,
          background_image_url: section.background_image_url,
          stat1_number: section.stat1_number,
          stat1_label: section.stat1_label,
          stat2_number: section.stat2_number,
          stat2_label: section.stat2_label,
          stat3_number: section.stat3_number,
          stat3_label: section.stat3_label,
          overlay_opacity: section.overlay_opacity,
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
      const fileName = `making-${section.id}-${Date.now()}.${fileExt}`;
      const filePath = `making/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setSection({ ...section, background_image_url: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
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
          <h2 className="font-display text-xl text-foreground">Behind the Craft Section</h2>
          <p className="text-sm text-muted-foreground">
            Edit the artisan story section on homepage
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
        {/* Background Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Background Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : section.background_image_url ? (
                <img
                  src={section.background_image_url}
                  alt="Background"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload background</p>
                </div>
              )}
            </div>

            <div>
              <Label>Overlay Opacity: {section.overlay_opacity ?? 85}%</Label>
              <Slider
                value={[section.overlay_opacity ?? 85]}
                onValueChange={(val) => setSection({ ...section, overlay_opacity: val[0] })}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
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
                placeholder="e.g. Behind the Craft"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title Line 1</Label>
                <Input
                  value={section.title_line1 || ""}
                  onChange={(e) => setSection({ ...section, title_line1: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. Behind Every Piece"
                />
              </div>
              <div>
                <Label>Title Highlight (Gold)</Label>
                <Input
                  value={section.title_highlight || ""}
                  onChange={(e) => setSection({ ...section, title_highlight: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. An Artisan's Story"
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
                placeholder="Write about the craftsmanship..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={section.button_text || ""}
                  onChange={(e) => setSection({ ...section, button_text: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. Read Our Story"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={section.button_link || ""}
                  onChange={(e) => setSection({ ...section, button_link: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. /about"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Stat 1 Number</Label>
              <Input
                value={section.stat1_number || ""}
                onChange={(e) => setSection({ ...section, stat1_number: e.target.value })}
                placeholder="e.g. 500+"
              />
              <Label>Stat 1 Label</Label>
              <Input
                value={section.stat1_label || ""}
                onChange={(e) => setSection({ ...section, stat1_label: e.target.value })}
                placeholder="e.g. Handcrafted Pieces"
              />
            </div>

            <div className="space-y-2">
              <Label>Stat 2 Number</Label>
              <Input
                value={section.stat2_number || ""}
                onChange={(e) => setSection({ ...section, stat2_number: e.target.value })}
                placeholder="e.g. 15+"
              />
              <Label>Stat 2 Label</Label>
              <Input
                value={section.stat2_label || ""}
                onChange={(e) => setSection({ ...section, stat2_label: e.target.value })}
                placeholder="e.g. Skilled Artisans"
              />
            </div>

            <div className="space-y-2">
              <Label>Stat 3 Number</Label>
              <Input
                value={section.stat3_number || ""}
                onChange={(e) => setSection({ ...section, stat3_number: e.target.value })}
                placeholder="e.g. 1000+"
              />
              <Label>Stat 3 Label</Label>
              <Input
                value={section.stat3_label || ""}
                onChange={(e) => setSection({ ...section, stat3_label: e.target.value })}
                placeholder="e.g. Happy Customers"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMakingSection;
