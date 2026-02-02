import { useState, useEffect } from "react";
import { Save, Mail, TestTube, RefreshCw, Bell, Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailSettings {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  reply_to_email: string;
  is_enabled: boolean;
  provider: string;
  resend_api_key: string;
  send_order_confirmation: boolean;
  send_shipping_update: boolean;
  send_delivery_notification: boolean;
}

const AdminEmailSettings = () => {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [activeTab, setActiveTab] = useState("provider");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data as EmailSettings);
      } else {
        // Create default settings
        const { data: newData, error: insertError } = await supabase
          .from("email_settings")
          .insert({
            provider: "resend",
            smtp_port: 587,
            is_enabled: false,
            send_order_confirmation: true,
            send_shipping_update: true,
            send_delivery_notification: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newData as EmailSettings);
      }
    } catch (error) {
      console.error("Error fetching email settings:", error);
      toast.error("Failed to load email settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_settings")
        .update({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: settings.smtp_password,
          from_email: settings.from_email,
          from_name: settings.from_name,
          reply_to_email: settings.reply_to_email,
          is_enabled: settings.is_enabled,
          provider: settings.provider,
          resend_api_key: settings.resend_api_key,
          send_order_confirmation: settings.send_order_confirmation,
          send_shipping_update: settings.send_shipping_update,
          send_delivery_notification: settings.send_delivery_notification,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Email settings saved!");
    } catch (error: any) {
      console.error("Error saving email settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }

    if (!settings?.is_enabled) {
      toast.error("Please enable email notifications first");
      return;
    }

    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke("send-order-email", {
        body: {
          to: testEmail,
          subject: "Test Email from Artistiya",
          type: "test",
          data: {
            order_number: "TEST-001",
            customer_name: "Test Customer",
          },
        },
      });

      if (error) throw error;
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  const updateSettings = (field: keyof EmailSettings, value: string | number | boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
          </div>
        </div>
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-foreground">Email Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure email delivery for order notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="gold" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Enable/Disable */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gold/10 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Send order confirmations and updates to customers
                </p>
              </div>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(checked) => updateSettings("is_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="provider">Provider</TabsTrigger>
          <TabsTrigger value="sender">Sender Info</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Provider Tab */}
        <TabsContent value="provider" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Provider</CardTitle>
              <CardDescription>Choose how to send emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={settings.provider}
                onValueChange={(value) => updateSettings("provider", value)}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resend">Resend (Recommended)</SelectItem>
                  <SelectItem value="smtp">SMTP Server</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                </SelectContent>
              </Select>

              {/* Resend Settings */}
              {settings.provider === "resend" && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="resend_api_key">Resend API Key</Label>
                    <Input
                      id="resend_api_key"
                      type="password"
                      value={settings.resend_api_key || ""}
                      onChange={(e) => updateSettings("resend_api_key", e.target.value)}
                      placeholder="re_xxxxxxxxxxxxx"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Get your API key from{" "}
                      <a 
                        href="https://resend.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        resend.com/api-keys
                      </a>
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                    <p className="font-medium text-yellow-600">Important!</p>
                    <p className="text-muted-foreground mt-1">
                      You must verify your domain at{" "}
                      <a 
                        href="https://resend.com/domains" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        resend.com/domains
                      </a>
                      {" "}to send emails from your own domain.
                    </p>
                  </div>
                </div>
              )}

              {/* SMTP Settings */}
              {settings.provider === "smtp" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={settings.smtp_host || ""}
                      onChange={(e) => updateSettings("smtp_host", e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={settings.smtp_port || 587}
                      onChange={(e) => updateSettings("smtp_port", parseInt(e.target.value))}
                      placeholder="587"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_user">Username</Label>
                    <Input
                      id="smtp_user"
                      value={settings.smtp_user || ""}
                      onChange={(e) => updateSettings("smtp_user", e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_password">Password / App Password</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={settings.smtp_password || ""}
                      onChange={(e) => updateSettings("smtp_password", e.target.value)}
                      placeholder="••••••••"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sender Info Tab */}
        <TabsContent value="sender" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sender Information</CardTitle>
              <CardDescription>How your emails appear to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={settings.from_name || ""}
                    onChange={(e) => updateSettings("from_name", e.target.value)}
                    placeholder="artistiya.store"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={settings.from_email || ""}
                    onChange={(e) => updateSettings("from_email", e.target.value)}
                    placeholder="orders@artistiya.store"
                    className="mt-1.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="reply_to">Reply-To Email</Label>
                  <Input
                    id="reply_to"
                    type="email"
                    value={settings.reply_to_email || ""}
                    onChange={(e) => updateSettings("reply_to_email", e.target.value)}
                    placeholder="support@artistiya.store"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    When customers reply to order emails, it will go to this address
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notification Types</CardTitle>
              <CardDescription>Choose which emails to send automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <Label className="text-base">Order Confirmation</Label>
                    <p className="text-sm text-muted-foreground">
                      Sent when a customer places an order
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.send_order_confirmation}
                  onCheckedChange={(checked) => updateSettings("send_order_confirmation", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Truck className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <Label className="text-base">Shipping Update</Label>
                    <p className="text-sm text-muted-foreground">
                      Sent when order status changes to shipped
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.send_shipping_update}
                  onCheckedChange={(checked) => updateSettings("send_shipping_update", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <Label className="text-base">Delivery Notification</Label>
                    <p className="text-sm text-muted-foreground">
                      Sent when order is delivered
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.send_delivery_notification}
                  onCheckedChange={(checked) => updateSettings("send_delivery_notification", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Verify your email configuration is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter test email address"
              className="flex-1"
              type="email"
            />
            <Button 
              variant="outline" 
              onClick={handleTestEmail} 
              disabled={testing || !settings.is_enabled}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? "Sending..." : "Send Test"}
            </Button>
          </div>
          {!settings.is_enabled && (
            <p className="text-xs text-yellow-500 mt-2">
              Enable email notifications above to send test emails
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gold/5 border-gold/20">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground mb-2">Setup Guide</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Resend:</strong> সবচেয়ে সহজ - শুধু API Key দিন এবং Domain verify করুন</li>
            <li>• <strong>SMTP:</strong> Gmail, Yahoo, বা কাস্টম SMTP সার্ভার ব্যবহার করুন</li>
            <li>• <strong>From Email:</strong> Verified domain থেকে পাঠাতে হবে (noreply@yourdomain.com)</li>
            <li>• অর্ডার কনফার্মেশন, শিপিং আপডেট স্বয়ংক্রিয়ভাবে পাঠানো হবে</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailSettings;