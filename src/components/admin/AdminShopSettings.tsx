import { useState, useEffect, useRef } from "react";
import { Save, Image, Upload, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MediaPickerModal from "./MediaPickerModal";

interface ShopPageSettings {
  id: string;
  hero_background_image: string | null;
  hero_title: string;
  hero_title_bn: string | null;
  hero_subtitle: string;
  hero_subtitle_bn: string | null;
  hero_overlay_opacity: number;
  sales_banner_enabled: boolean;
  sales_banner_image: string | null;
  sales_banner_title: string | null;
  sales_banner_title_bn: string | null;
  sales_banner_link: string | null;
  sales_banner_start_date: string | null;
  sales_banner_end_date: string | null;
}

const AdminShopSettings = () => {
  const [settings, setSettings] = useState<ShopPageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroMediaPickerOpen, setHeroMediaPickerOpen] = useState(false);
  const [bannerMediaPickerOpen, setBannerMediaPickerOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("shop_page_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSettings(data as any);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shop_page_settings")
        .update({
          hero_background_image: settings.hero_background_image,
          hero_title: settings.hero_title,
          hero_title_bn: settings.hero_title_bn,
          hero_subtitle: settings.hero_subtitle,
          hero_subtitle_bn: settings.hero_subtitle_bn,
          hero_overlay_opacity: settings.hero_overlay_opacity,
          sales_banner_enabled: settings.sales_banner_enabled,
          sales_banner_image: settings.sales_banner_image,
          sales_banner_title: settings.sales_banner_title,
          sales_banner_title_bn: settings.sales_banner_title_bn,
          sales_banner_link: settings.sales_banner_link,
          sales_banner_start_date: settings.sales_banner_start_date,
          sales_banner_end_date: settings.sales_banner_end_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ShopPageSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Media Pickers */}
      <MediaPickerModal
        open={heroMediaPickerOpen}
        onClose={() => setHeroMediaPickerOpen(false)}
        onSelect={(url) => {
          updateField("hero_background_image", url);
          setHeroMediaPickerOpen(false);
        }}
        accept="image/*"
        title="Select Hero Background"
      />
      <MediaPickerModal
        open={bannerMediaPickerOpen}
        onClose={() => setBannerMediaPickerOpen(false)}
        onSelect={(url) => {
          updateField("sales_banner_image", url);
          setBannerMediaPickerOpen(false);
        }}
        accept="image/*"
        title="Select Sales Banner"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground">Shop Page Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the shop page appearance
          </p>
        </div>
        <Button variant="gold" onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Hero Section Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Image className="h-5 w-5 text-gold" />
            Hero Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Background */}
          <div>
            <Label>Hero Background Image</Label>
            <div className="mt-2">
              {settings.hero_background_image ? (
                <div className="relative group w-full h-48 rounded-lg overflow-hidden border border-border">
                  <img
                    src={settings.hero_background_image}
                    alt="Hero Background"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={() => setHeroMediaPickerOpen(true)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => updateField("hero_background_image", null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-48 rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors"
                  onClick={() => setHeroMediaPickerOpen(true)}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to add background image</p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title (English)</Label>
              <Input
                value={settings.hero_title || ""}
                onChange={(e) => updateField("hero_title", e.target.value)}
                placeholder="Shop"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Title (Bengali)</Label>
              <Input
                value={settings.hero_title_bn || ""}
                onChange={(e) => updateField("hero_title_bn", e.target.value)}
                placeholder="দোকান"
                className="mt-1.5 font-bengali"
              />
            </div>
          </div>

          {/* Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subtitle (English)</Label>
              <Input
                value={settings.hero_subtitle || ""}
                onChange={(e) => updateField("hero_subtitle", e.target.value)}
                placeholder="Explore Our Collection"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Subtitle (Bengali)</Label>
              <Input
                value={settings.hero_subtitle_bn || ""}
                onChange={(e) => updateField("hero_subtitle_bn", e.target.value)}
                placeholder="আমাদের কালেকশন দেখুন"
                className="mt-1.5 font-bengali"
              />
            </div>
          </div>

          {/* Overlay Opacity */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <Label className="flex items-center justify-between">
              <span>Overlay Opacity</span>
              <span className="text-gold font-semibold">{Math.round((settings.hero_overlay_opacity || 0.5) * 100)}%</span>
            </Label>
            <Slider
              value={[settings.hero_overlay_opacity || 0.5]}
              onValueChange={([value]) => updateField("hero_overlay_opacity", value)}
              min={0}
              max={1}
              step={0.1}
              className="mt-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Banner Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              {settings.sales_banner_enabled ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              Sales Banner
            </CardTitle>
            <Switch
              checked={settings.sales_banner_enabled || false}
              onCheckedChange={(checked) => updateField("sales_banner_enabled", checked)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Image */}
          <div>
            <Label>Banner Image</Label>
            <div className="mt-2">
              {settings.sales_banner_image ? (
                <div className="relative group w-full h-32 rounded-lg overflow-hidden border border-border">
                  <img
                    src={settings.sales_banner_image}
                    alt="Sales Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={() => setBannerMediaPickerOpen(true)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => updateField("sales_banner_image", null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-32 rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors"
                  onClick={() => setBannerMediaPickerOpen(true)}
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Click to add banner</p>
                </div>
              )}
            </div>
          </div>

          {/* Banner Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Banner Title (English)</Label>
              <Input
                value={settings.sales_banner_title || ""}
                onChange={(e) => updateField("sales_banner_title", e.target.value)}
                placeholder="Big Sale!"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Banner Title (Bengali)</Label>
              <Input
                value={settings.sales_banner_title_bn || ""}
                onChange={(e) => updateField("sales_banner_title_bn", e.target.value)}
                placeholder="বড় সেল!"
                className="mt-1.5 font-bengali"
              />
            </div>
          </div>

          {/* Banner Link */}
          <div>
            <Label>Banner Link (optional)</Label>
            <Input
              value={settings.sales_banner_link || ""}
              onChange={(e) => updateField("sales_banner_link", e.target.value)}
              placeholder="/collections/sale"
              className="mt-1.5"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="datetime-local"
                value={settings.sales_banner_start_date?.slice(0, 16) || ""}
                onChange={(e) => updateField("sales_banner_start_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="datetime-local"
                value={settings.sales_banner_end_date?.slice(0, 16) || ""}
                onChange={(e) => updateField("sales_banner_end_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShopSettings;
