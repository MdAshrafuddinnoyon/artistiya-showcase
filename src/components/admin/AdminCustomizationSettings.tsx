import { useState, useEffect } from "react";
import { Settings, Save, Loader2, Palette, ToggleLeft, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomizationSettings {
  id: string;
  custom_order_enabled: boolean;
  header_button_enabled: boolean;
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
      setSettings(data);
    } catch (error) {
      console.error("Error fetching customization settings:", error);
      // Initialize defaults if no settings exist
      setSettings({
        id: "",
        custom_order_enabled: true,
        header_button_enabled: true,
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
            default_advance_percent: settings.default_advance_percent,
            min_advance_percent: settings.min_advance_percent,
            max_advance_percent: settings.max_advance_percent,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
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
            Control custom order functionality and advance payment settings
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
                <li>• Customers fill out requirements and delivery info before payment</li>
                <li>• Advance payment (configurable %) is collected via bKash/Nagad</li>
                <li>• You can set per-product advance percentage in the product editor</li>
                <li>• COD option allows customers to skip advance payment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomizationSettings;
