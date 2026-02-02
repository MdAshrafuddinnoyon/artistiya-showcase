import { useState, useEffect } from "react";
import { Save, MessageCircle, BarChart3, Facebook, RefreshCw, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhatsAppSettings {
  number: string;
  message: string;
}

interface AnalyticsSettings {
  tracking_id: string;
  is_active: boolean;
}

interface PixelSettings {
  pixel_id: string;
  is_active: boolean;
}

interface HomepageSections {
  show_blog: boolean;
  show_youtube: boolean;
  show_new_arrivals: boolean;
  show_featured: boolean;
  show_testimonials: boolean;
  show_instagram: boolean;
}

const defaultWhatsApp: WhatsAppSettings = { number: "", message: "" };
const defaultAnalytics: AnalyticsSettings = { tracking_id: "", is_active: false };
const defaultPixel: PixelSettings = { pixel_id: "", is_active: false };
const defaultHomepageSections: HomepageSections = {
  show_blog: true,
  show_youtube: true,
  show_new_arrivals: true,
  show_featured: true,
  show_testimonials: true,
  show_instagram: true,
};

const AdminMarketingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("whatsapp");

  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings>(defaultWhatsApp);
  const [googleAnalytics, setGoogleAnalytics] = useState<AnalyticsSettings>(defaultAnalytics);
  const [facebookPixel, setFacebookPixel] = useState<PixelSettings>(defaultPixel);
  const [homepageSections, setHomepageSections] = useState<HomepageSections>(defaultHomepageSections);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "whatsapp",
          "whatsapp_number",
          "google_analytics",
          "facebook_pixel",
          "homepage_sections",
        ]);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        data.forEach((item) => {
          const value = item.value;
          
          switch (item.key) {
            case "whatsapp":
              if (typeof value === "object" && value !== null) {
                setWhatsapp({
                  number: (value as any).number || "",
                  message: (value as any).message || "",
                });
              }
              break;
            case "whatsapp_number":
              // Legacy format - just the number as string
              if (typeof value === "string") {
                setWhatsapp(prev => ({ ...prev, number: value }));
              }
              break;
            case "google_analytics":
              if (typeof value === "object" && value !== null) {
                setGoogleAnalytics({
                  tracking_id: (value as any).tracking_id || "",
                  is_active: (value as any).is_active || false,
                });
              }
              break;
            case "facebook_pixel":
              if (typeof value === "object" && value !== null) {
                setFacebookPixel({
                  pixel_id: (value as any).pixel_id || "",
                  is_active: (value as any).is_active || false,
                });
              }
              break;
            case "homepage_sections":
              if (typeof value === "object" && value !== null) {
                setHomepageSections({
                  show_blog: (value as any).show_blog ?? true,
                  show_youtube: (value as any).show_youtube ?? true,
                  show_new_arrivals: (value as any).show_new_arrivals ?? true,
                  show_featured: (value as any).show_featured ?? true,
                  show_testimonials: (value as any).show_testimonials ?? true,
                  show_instagram: (value as any).show_instagram ?? true,
                });
              }
              break;
          }
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      // Check if setting exists
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("site_settings")
          .insert({ key, value });

        if (error) throw error;
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-foreground">Marketing Settings</h1>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Marketing Settings</h1>
          <p className="text-muted-foreground">
            Configure marketing pixels, WhatsApp, and homepage sections
          </p>
        </div>
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="pixel" className="gap-2">
            <Facebook className="h-4 w-4" />
            <span className="hidden sm:inline">FB Pixel</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Sections</span>
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                WhatsApp Settings
              </CardTitle>
              <CardDescription>
                Configure WhatsApp number for customer support and order inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  value={whatsapp.number}
                  onChange={(e) => setWhatsapp({ ...whatsapp, number: e.target.value })}
                  placeholder="8801XXXXXXXXX"
                />
                <p className="text-sm text-muted-foreground">
                  Include country code without + sign (e.g., 8801712345678)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_message">Default Message Template</Label>
                <Textarea
                  id="whatsapp_message"
                  value={whatsapp.message}
                  onChange={(e) => setWhatsapp({ ...whatsapp, message: e.target.value })}
                  rows={3}
                  placeholder="Hello! I am interested in your products."
                />
                <p className="text-sm text-muted-foreground">
                  This message will be pre-filled when customers click WhatsApp button
                </p>
              </div>
              <Button
                variant="gold"
                onClick={() => saveSetting("whatsapp", whatsapp)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save WhatsApp Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Google Analytics
              </CardTitle>
              <CardDescription>
                Track website visitors with Google Analytics 4
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-base">Enable Google Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Track page views, user behavior, and conversions
                  </p>
                </div>
                <Switch
                  checked={googleAnalytics.is_active}
                  onCheckedChange={(checked) =>
                    setGoogleAnalytics({ ...googleAnalytics, is_active: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ga_tracking_id">Measurement ID</Label>
                <Input
                  id="ga_tracking_id"
                  value={googleAnalytics.tracking_id}
                  onChange={(e) =>
                    setGoogleAnalytics({ ...googleAnalytics, tracking_id: e.target.value })
                  }
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-sm text-muted-foreground">
                  Find this in Google Analytics → Admin → Data Streams → Measurement ID
                </p>
              </div>
              <Button
                variant="gold"
                onClick={() => saveSetting("google_analytics", googleAnalytics)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Analytics Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facebook Pixel Tab */}
        <TabsContent value="pixel" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="h-5 w-5 text-blue-600" />
                Facebook Pixel
              </CardTitle>
              <CardDescription>
                Track conversions and retarget visitors with Facebook/Meta Pixel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-base">Enable Facebook Pixel</Label>
                  <p className="text-sm text-muted-foreground">
                    Track add-to-cart, purchases, and create retargeting audiences
                  </p>
                </div>
                <Switch
                  checked={facebookPixel.is_active}
                  onCheckedChange={(checked) =>
                    setFacebookPixel({ ...facebookPixel, is_active: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb_pixel_id">Pixel ID</Label>
                <Input
                  id="fb_pixel_id"
                  value={facebookPixel.pixel_id}
                  onChange={(e) =>
                    setFacebookPixel({ ...facebookPixel, pixel_id: e.target.value })
                  }
                  placeholder="XXXXXXXXXXXXXXXX"
                />
                <p className="text-sm text-muted-foreground">
                  Find this in Meta Business Suite → Events Manager → Data Sources
                </p>
              </div>
              <Button
                variant="gold"
                onClick={() => saveSetting("facebook_pixel", facebookPixel)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Pixel Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage Sections Tab */}
        <TabsContent value="sections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold" />
                Homepage Sections
              </CardTitle>
              <CardDescription>
                Control which sections are visible on the homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: "show_new_arrivals", label: "New Arrivals Section", description: "Display latest products" },
                { key: "show_featured", label: "Featured Products", description: "Highlight special products" },
                { key: "show_blog", label: "Blog Section", description: "Show recent blog posts" },
                { key: "show_youtube", label: "YouTube Videos", description: "Display video content" },
                { key: "show_testimonials", label: "Testimonials", description: "Customer reviews and ratings" },
                { key: "show_instagram", label: "Instagram Feed", description: "Social media integration" },
              ].map((item) => (
                <div 
                  key={item.key} 
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <Label className="text-base cursor-pointer">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={(homepageSections as any)[item.key]}
                    onCheckedChange={(checked) =>
                      setHomepageSections({
                        ...homepageSections,
                        [item.key]: checked,
                      })
                    }
                  />
                </div>
              ))}
              <div className="pt-4">
                <Button
                  variant="gold"
                  onClick={() => saveSetting("homepage_sections", homepageSections)}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Homepage Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-gold/5 border-gold/20">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground mb-2">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>WhatsApp:</strong> Enter number with country code (e.g., 8801712345678)</li>
            <li>• <strong>Google Analytics:</strong> Use GA4 Measurement ID starting with G-</li>
            <li>• <strong>Facebook Pixel:</strong> 15-16 digit number from Meta Business Suite</li>
            <li>• <strong>Homepage:</strong> Toggle sections to show/hide on your homepage</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketingSettings;