import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Settings {
  [key: string]: any;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      const settingsObj: Settings = {};
      data?.forEach((item) => {
        settingsObj[item.key] = item.value;
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({ value })
        .eq("key", key);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating setting:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await updateSetting(key, value);
      }
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key: string, defaultValue: any = "") => {
    const value = settings[key];
    if (typeof value === "string") {
      // Remove quotes if it's a string
      return value.replace(/^"|"$/g, "");
    }
    return value ?? defaultValue;
  };

  const setValue = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-32 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl text-foreground">Site Settings</h1>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Contact & Communication */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">Contact & Communication</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              value={getValue("whatsapp_number")}
              onChange={(e) => setValue("whatsapp_number", `"${e.target.value}"`)}
              placeholder="8801XXXXXXXXX"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">Include country code</p>
          </div>
          <div>
            <Label htmlFor="facebook">Facebook Page ID</Label>
            <Input
              id="facebook"
              value={getValue("facebook_page_id")}
              onChange={(e) => setValue("facebook_page_id", `"${e.target.value}"`)}
              placeholder="your-page-id"
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">Payment Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bkash">bKash Number</Label>
            <Input
              id="bkash"
              value={getValue("bkash_number")}
              onChange={(e) => setValue("bkash_number", `"${e.target.value}"`)}
              placeholder="01XXXXXXXXX"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="nagad">Nagad Number</Label>
            <Input
              id="nagad"
              value={getValue("nagad_number")}
              onChange={(e) => setValue("nagad_number", `"${e.target.value}"`)}
              placeholder="01XXXXXXXXX"
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 p-3 bg-muted rounded-lg">
          <Label htmlFor="payment_banner">Show Payment Banner in Footer</Label>
          <Switch
            id="payment_banner"
            checked={settings.show_payment_banner === true || settings.show_payment_banner === "true"}
            onCheckedChange={(checked) => setValue("show_payment_banner", checked)}
          />
        </div>
      </div>

      {/* Shipping Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">Shipping Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="dhaka_shipping">Dhaka Shipping (৳)</Label>
            <Input
              id="dhaka_shipping"
              type="number"
              value={getValue("dhaka_shipping_cost", 80)}
              onChange={(e) => setValue("dhaka_shipping_cost", parseInt(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="outside_dhaka">Outside Dhaka (৳)</Label>
            <Input
              id="outside_dhaka"
              type="number"
              value={getValue("outside_dhaka_shipping_cost", 130)}
              onChange={(e) => setValue("outside_dhaka_shipping_cost", parseInt(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="free_threshold">Free Shipping Threshold (৳)</Label>
            <Input
              id="free_threshold"
              type="number"
              value={getValue("free_shipping_threshold", 5000)}
              onChange={(e) => setValue("free_shipping_threshold", parseInt(e.target.value))}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* Announcement Bar */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">Announcement Bar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="announcement_en">Announcement (English)</Label>
            <Input
              id="announcement_en"
              value={getValue("announcement_text")}
              onChange={(e) => setValue("announcement_text", `"${e.target.value}"`)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="announcement_bn">Announcement (Bengali)</Label>
            <Input
              id="announcement_bn"
              value={getValue("announcement_text_bn")}
              onChange={(e) => setValue("announcement_text_bn", `"${e.target.value}"`)}
              className="mt-1.5 font-bengali"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
