import { useState, useEffect } from "react";
import { Save, MessageCircle, BarChart3, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SiteSettings {
  whatsapp: { number: string; message: string };
  google_analytics: { tracking_id: string; is_active: boolean };
  facebook_pixel: { pixel_id: string; is_active: boolean };
  homepage_sections: {
    show_blog: boolean;
    show_youtube: boolean;
    show_new_arrivals: boolean;
    show_featured: boolean;
    show_testimonials: boolean;
    show_instagram: boolean;
  };
}

const AdminMarketingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<SiteSettings>({
    whatsapp: { number: "", message: "" },
    google_analytics: { tracking_id: "", is_active: false },
    facebook_pixel: { pixel_id: "", is_active: false },
    homepage_sections: {
      show_blog: true,
      show_youtube: true,
      show_new_arrivals: true,
      show_featured: true,
      show_testimonials: true,
      show_instagram: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "whatsapp",
          "google_analytics",
          "facebook_pixel",
          "homepage_sections",
        ]);

      if (error) throw error;

      const newSettings = { ...settings };
      data?.forEach((item) => {
        if (item.key in newSettings) {
          (newSettings as any)[item.key] = item.value;
        }
      });
      setSettings(newSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Marketing Settings</h1>
        <p className="text-muted-foreground">
          Configure marketing pixels, WhatsApp, and homepage sections
        </p>
      </div>

      {/* WhatsApp Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            WhatsApp Settings
          </CardTitle>
          <CardDescription>
            Configure WhatsApp number for customer support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
            <Input
              id="whatsapp_number"
              value={settings.whatsapp.number}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, number: e.target.value },
                })
              }
              placeholder="8801XXXXXXXXX"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Include country code without + sign
            </p>
          </div>
          <div>
            <Label htmlFor="whatsapp_message">Default Message</Label>
            <Textarea
              id="whatsapp_message"
              value={settings.whatsapp.message}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  whatsapp: { ...settings.whatsapp, message: e.target.value },
                })
              }
              rows={2}
              placeholder="Hello! I am interested in your products."
            />
          </div>
          <Button
            variant="gold"
            onClick={() => saveSetting("whatsapp", settings.whatsapp)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save WhatsApp Settings
          </Button>
        </CardContent>
      </Card>

      {/* Google Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Track website visitors with Google Analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Google Analytics</Label>
            <Switch
              checked={settings.google_analytics.is_active}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  google_analytics: { ...settings.google_analytics, is_active: checked },
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="ga_tracking_id">Tracking ID / Measurement ID</Label>
            <Input
              id="ga_tracking_id"
              value={settings.google_analytics.tracking_id}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  google_analytics: {
                    ...settings.google_analytics,
                    tracking_id: e.target.value,
                  },
                })
              }
              placeholder="G-XXXXXXXXXX or UA-XXXXXX-X"
            />
          </div>
          <Button
            variant="gold"
            onClick={() => saveSetting("google_analytics", settings.google_analytics)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Analytics Settings
          </Button>
        </CardContent>
      </Card>

      {/* Facebook Pixel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Facebook Pixel
          </CardTitle>
          <CardDescription>
            Track conversions and retarget visitors with Facebook Pixel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Facebook Pixel</Label>
            <Switch
              checked={settings.facebook_pixel.is_active}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  facebook_pixel: { ...settings.facebook_pixel, is_active: checked },
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="fb_pixel_id">Pixel ID</Label>
            <Input
              id="fb_pixel_id"
              value={settings.facebook_pixel.pixel_id}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  facebook_pixel: {
                    ...settings.facebook_pixel,
                    pixel_id: e.target.value,
                  },
                })
              }
              placeholder="XXXXXXXXXXXXXXXX"
            />
          </div>
          <Button
            variant="gold"
            onClick={() => saveSetting("facebook_pixel", settings.facebook_pixel)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Pixel Settings
          </Button>
        </CardContent>
      </Card>

      {/* Homepage Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Sections</CardTitle>
          <CardDescription>
            Control which sections are visible on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "show_new_arrivals", label: "New Arrivals Section" },
            { key: "show_featured", label: "Featured Products Section" },
            { key: "show_blog", label: "Blog Section" },
            { key: "show_youtube", label: "YouTube Videos Section" },
            { key: "show_testimonials", label: "Testimonials Section" },
            { key: "show_instagram", label: "Instagram Section" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <Label>{item.label}</Label>
              <Switch
                checked={(settings.homepage_sections as any)[item.key]}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    homepage_sections: {
                      ...settings.homepage_sections,
                      [item.key]: checked,
                    },
                  })
                }
              />
            </div>
          ))}
          <Button
            variant="gold"
            onClick={() => saveSetting("homepage_sections", settings.homepage_sections)}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Homepage Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketingSettings;