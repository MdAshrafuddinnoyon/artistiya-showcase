import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutSettings {
  id: string;
  require_phone: boolean;
  require_address: boolean;
  show_order_notes: boolean;
  show_gift_message: boolean;
  show_promo_code: boolean;
  show_shipping_calculator: boolean;
  min_order_amount: number;
  free_shipping_threshold: number;
  default_shipping_cost: number;
  cod_enabled: boolean;
  cod_extra_charge: number;
}

const AdminCheckoutSettings = () => {
  const [settings, setSettings] = useState<CheckoutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("checkout_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSettings(data);
      } else {
        const { data: newData, error: insertError } = await supabase
          .from("checkout_settings")
          .insert({})
          .select()
          .single();
        
        if (insertError) throw insertError;
        setSettings(newData);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch checkout settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("checkout_settings")
        .update(settings)
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Checkout settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CheckoutSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return <div className="h-96 bg-muted rounded-xl animate-pulse" />;
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-foreground">Checkout Settings</h2>
        <Button variant="gold" onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Fields */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-display">Form Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Require Phone Number</Label>
                <p className="text-xs text-muted-foreground">Customer must provide phone</p>
              </div>
              <Switch
                checked={settings.require_phone}
                onCheckedChange={(checked) => updateField("require_phone", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Require Address</Label>
                <p className="text-xs text-muted-foreground">Full shipping address required</p>
              </div>
              <Switch
                checked={settings.require_address}
                onCheckedChange={(checked) => updateField("require_address", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Show Order Notes</Label>
                <p className="text-xs text-muted-foreground">Allow special instructions</p>
              </div>
              <Switch
                checked={settings.show_order_notes}
                onCheckedChange={(checked) => updateField("show_order_notes", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Show Gift Message</Label>
                <p className="text-xs text-muted-foreground">Option to add gift message</p>
              </div>
              <Switch
                checked={settings.show_gift_message}
                onCheckedChange={(checked) => updateField("show_gift_message", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Show Promo Code</Label>
                <p className="text-xs text-muted-foreground">Allow discount codes</p>
              </div>
              <Switch
                checked={settings.show_promo_code}
                onCheckedChange={(checked) => updateField("show_promo_code", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label>Shipping Calculator</Label>
                <p className="text-xs text-muted-foreground">Show shipping estimate</p>
              </div>
              <Switch
                checked={settings.show_shipping_calculator}
                onCheckedChange={(checked) => updateField("show_shipping_calculator", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-display">Order Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Minimum Order Amount (৳)</Label>
              <Input
                type="number"
                value={settings.min_order_amount}
                onChange={(e) => updateField("min_order_amount", parseFloat(e.target.value) || 0)}
                className="mt-1.5"
                min={0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set to 0 for no minimum
              </p>
            </div>

            <div>
              <Label>Free Shipping Threshold (৳)</Label>
              <Input
                type="number"
                value={settings.free_shipping_threshold}
                onChange={(e) => updateField("free_shipping_threshold", parseFloat(e.target.value) || 0)}
                className="mt-1.5"
                min={0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Orders above this amount get free shipping
              </p>
            </div>

            <div>
              <Label>Default Shipping Cost (৳)</Label>
              <Input
                type="number"
                value={settings.default_shipping_cost}
                onChange={(e) => updateField("default_shipping_cost", parseFloat(e.target.value) || 0)}
                className="mt-1.5"
                min={0}
              />
            </div>
          </CardContent>
        </Card>

        {/* COD Settings */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display">Cash on Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Enable COD</Label>
                  <p className="text-xs text-muted-foreground">Allow cash on delivery</p>
                </div>
                <Switch
                  checked={settings.cod_enabled}
                  onCheckedChange={(checked) => updateField("cod_enabled", checked)}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <Label>COD Extra Charge (৳)</Label>
                <Input
                  type="number"
                  value={settings.cod_extra_charge}
                  onChange={(e) => updateField("cod_extra_charge", parseFloat(e.target.value) || 0)}
                  className="mt-1.5"
                  min={0}
                  disabled={!settings.cod_enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Additional fee for COD orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCheckoutSettings;
