import { useState, useEffect } from "react";
import { Settings, Save, Loader2, Palette, ToggleLeft, Percent, Type, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomizationSettings {
  id: string;
  custom_order_enabled: boolean;
  header_button_enabled: boolean;
  header_button_text: string;
  header_button_text_bn: string;
  header_button_link: string | null;
  default_advance_percent: number;
  min_advance_percent: number;
  max_advance_percent: number;
}

const AdminCustomizationSettings = () => {
  const [settings, setSettings] = useState<CustomizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("customization_settings")
        .select("*")
        .single();

      if (error) throw error;
      setSettings({
        id: data.id,
        custom_order_enabled: data.custom_order_enabled ?? true,
        header_button_enabled: data.header_button_enabled ?? true,
        header_button_text: data.header_button_text || "Custom Design",
        header_button_text_bn: data.header_button_text_bn || "কাস্টম ডিজাইন",
        header_button_link: data.header_button_link || null,
        default_advance_percent: data.default_advance_percent ?? 50,
        min_advance_percent: data.min_advance_percent ?? 20,
        max_advance_percent: data.max_advance_percent ?? 100,
      });
    } catch (error) {
      console.error("Error fetching customization settings:", error);
      // Initialize defaults if no settings exist
      setSettings({
        id: "",
        custom_order_enabled: true,
        header_button_enabled: true,
        header_button_text: "Custom Design",
        header_button_text_bn: "কাস্টম ডিজাইন",
        header_button_link: null,
        default_advance_percent: 50,
        min_advance_percent: 20,
        max_advance_percent: 100,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from("customization_settings")
          .update({
            custom_order_enabled: settings.custom_order_enabled,
            header_button_enabled: settings.header_button_enabled,
            header_button_text: settings.header_button_text,
            header_button_text_bn: settings.header_button_text_bn,
            header_button_link: settings.header_button_link || null,
            default_advance_percent: settings.default_advance_percent,
            min_advance_percent: settings.min_advance_percent,
            max_advance_percent: settings.max_advance_percent,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("customization_settings")
          .insert({
            custom_order_enabled: settings.custom_order_enabled,
            header_button_enabled: settings.header_button_enabled,
            header_button_text: settings.header_button_text,
            header_button_text_bn: settings.header_button_text_bn,
            header_button_link: settings.header_button_link || null,
            default_advance_percent: settings.default_advance_percent,
            min_advance_percent: settings.min_advance_percent,
            max_advance_percent: settings.max_advance_percent,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings({ ...settings, id: data.id });
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-gold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Customization Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Control custom order functionality, header button, and advance payment settings
          </p>
        </div>
        <Button 
          variant="gold" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleLeft className="h-5 w-5 text-gold" />
              Feature Controls
            </CardTitle>
            <CardDescription>
              Enable or disable customization features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground font-medium">Custom Order System</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to request custom product orders
                </p>
              </div>
              <Switch
                checked={settings.custom_order_enabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, custom_order_enabled: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground font-medium">Header Button</Label>
                <p className="text-sm text-muted-foreground">
                  Show "Custom Design" button in the header
                </p>
              </div>
              <Switch
                checked={settings.header_button_enabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, header_button_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Header Button Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-gold" />
              Header Button Settings
            </CardTitle>
            <CardDescription>
              Customize the header button text and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="buttonText">Button Text (English)</Label>
              <Input
                id="buttonText"
                value={settings.header_button_text}
                onChange={(e) => 
                  setSettings({ ...settings, header_button_text: e.target.value })
                }
                placeholder="Custom Design"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="buttonTextBn">Button Text (বাংলা)</Label>
              <Input
                id="buttonTextBn"
                value={settings.header_button_text_bn}
                onChange={(e) => 
                  setSettings({ ...settings, header_button_text_bn: e.target.value })
                }
                placeholder="কাস্টম ডিজাইন"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="buttonLink" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Custom Link (Optional)
              </Label>
              <Input
                id="buttonLink"
                value={settings.header_button_link || ""}
                onChange={(e) => 
                  setSettings({ ...settings, header_button_link: e.target.value || null })
                }
                placeholder="/custom-order or leave empty for modal"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to open custom order modal, or enter a URL to redirect
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advance Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-gold" />
              Advance Payment
            </CardTitle>
            <CardDescription>
              Configure advance payment percentages for custom orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultPercent">Default Advance Percentage</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="defaultPercent"
                  type="number"
                  min={settings.min_advance_percent}
                  max={settings.max_advance_percent}
                  value={settings.default_advance_percent}
                  onChange={(e) => 
                    setSettings({ 
                      ...settings, 
                      default_advance_percent: parseInt(e.target.value) || 50 
                    })
                  }
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Applied when product doesn't have specific settings
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPercent">Minimum Allowed</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="minPercent"
                    type="number"
                    min={0}
                    max={100}
                    value={settings.min_advance_percent}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        min_advance_percent: parseInt(e.target.value) || 20 
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label htmlFor="maxPercent">Maximum Allowed</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="maxPercent"
                    type="number"
                    min={0}
                    max={100}
                    value={settings.max_advance_percent}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        max_advance_percent: parseInt(e.target.value) || 100 
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="border-gold/30 bg-gold/5">
          <CardHeader>
            <CardTitle className="text-gold">Preview</CardTitle>
            <CardDescription>
              How the header button will appear
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">English:</span>
                {settings.header_button_enabled ? (
                  <Button variant="gold-outline" size="sm" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    {settings.header_button_text || "Custom Design"}
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Button disabled</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">বাংলা:</span>
                {settings.header_button_enabled ? (
                  <Button variant="gold-outline" size="sm" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    {settings.header_button_text_bn || "কাস্টম ডিজাইন"}
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground italic">বাটন নিষ্ক্রিয়</span>
                )}
              </div>
              {settings.header_button_link && (
                <p className="text-xs text-muted-foreground">
                  → Redirects to: <code className="bg-muted px-1 py-0.5 rounded">{settings.header_button_link}</code>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-gold/30 bg-gold/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-gold mt-0.5" />
            <div>
              <h4 className="font-medium text-gold">How It Works</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1.5">
                <li>• Products marked as "Customization Only" will show a request button instead of Add to Cart</li>
                <li>• The header button can be customized with different text and behavior</li>
                <li>• If no custom link is set, clicking the button opens the custom order modal</li>
                <li>• Customers fill out requirements and delivery info before payment</li>
                <li>• Advance payment (configurable %) is collected via bKash/Nagad</li>
                <li>• You can set per-product advance percentage in the product editor</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomizationSettings;