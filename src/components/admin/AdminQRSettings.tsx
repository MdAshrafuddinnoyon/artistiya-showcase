import { useState, useEffect } from "react";
import { QrCode, Gift, Settings, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QRSettings {
  id: string;
  is_active: boolean;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  expires_after_days: number;
  usage_limit_per_customer: number;
  message: string;
  message_bn: string;
}

const AdminQRSettings = () => {
  const [settings, setSettings] = useState<QRSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("qr_discount_settings")
          .select("*")
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setSettings(data);
        } else {
          // Create default settings
          const { data: newData, error: insertError } = await supabase
            .from("qr_discount_settings")
            .insert({
              is_active: true,
              discount_type: "percentage",
              discount_value: 5,
              min_order_value: 0,
              expires_after_days: 30,
              usage_limit_per_customer: 1,
              message: "Thank you for scanning! Enjoy a special discount on your next order.",
              message_bn: "স্ক্যান করার জন্য ধন্যবাদ! আপনার পরবর্তী অর্ডারে বিশেষ ছাড় উপভোগ করুন।",
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newData);
        }
      } catch (error) {
        console.error("Error fetching QR settings:", error);
        toast.error("Failed to load QR settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("qr_discount_settings")
        .update({
          is_active: settings.is_active,
          discount_type: settings.discount_type,
          discount_value: settings.discount_value,
          min_order_value: settings.min_order_value,
          expires_after_days: settings.expires_after_days,
          usage_limit_per_customer: settings.usage_limit_per_customer,
          message: settings.message,
          message_bn: settings.message_bn,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("QR settings saved successfully");
    } catch (error) {
      console.error("Error saving QR settings:", error);
      toast.error("Failed to save QR settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">QR Code Discount</h1>
        <p className="text-muted-foreground">
          Configure automatic discounts when customers scan QR codes
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <QrCode className="h-5 w-5 text-gold" />
              </div>
              <div>
                <CardTitle>QR Discount System</CardTitle>
                <CardDescription>
                  Reward customers who scan QR codes on invoices
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.is_active}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, is_active: checked })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Discount Type */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Discount Type</Label>
              <Select
                value={settings.discount_type}
                onValueChange={(value) =>
                  setSettings({ ...settings, discount_type: value })
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Discount Value ({settings.discount_type === "percentage" ? "%" : "৳"})
              </Label>
              <Input
                type="number"
                value={settings.discount_value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    discount_value: Number(e.target.value),
                  })
                }
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Min Order & Expiry */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Minimum Order Value (৳)</Label>
              <Input
                type="number"
                value={settings.min_order_value}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    min_order_value: Number(e.target.value),
                  })
                }
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = No minimum
              </p>
            </div>

            <div>
              <Label>Expires After (Days)</Label>
              <Input
                type="number"
                value={settings.expires_after_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    expires_after_days: Number(e.target.value),
                  })
                }
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Usage Limit */}
          <div>
            <Label>Usage Limit Per Customer</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[settings.usage_limit_per_customer]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, usage_limit_per_customer: value })
                }
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8 text-center">
                {settings.usage_limit_per_customer}x
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            <div>
              <Label>Thank You Message (English)</Label>
              <Textarea
                value={settings.message}
                onChange={(e) =>
                  setSettings({ ...settings, message: e.target.value })
                }
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div>
              <Label>Thank You Message (বাংলা)</Label>
              <Textarea
                value={settings.message_bn}
                onChange={(e) =>
                  setSettings({ ...settings, message_bn: e.target.value })
                }
                className="mt-1.5 font-bengali"
                rows={2}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} variant="gold">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-gold" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                1
              </span>
              <span>
                QR code is automatically added to invoices and delivery slips
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                2
              </span>
              <span>
                Customer scans the QR code with their phone
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                3
              </span>
              <span>
                Discount credit ({settings.discount_type === "percentage" 
                  ? `${settings.discount_value}%` 
                  : `৳${settings.discount_value}`}) is automatically added to their account
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                4
              </span>
              <span>
                Discount applies automatically on their next order (expires in {settings.expires_after_days} days)
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQRSettings;