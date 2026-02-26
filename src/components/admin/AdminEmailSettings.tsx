import { useState, useEffect } from "react";
import { Save, Mail, TestTube, RefreshCw, Bell, Truck, Package, MessageSquare, Smartphone, Send } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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

interface SMSSettings {
  id: string;
  is_enabled: boolean;
  provider: string;
  api_key: string;
  api_secret: string;
  sender_id: string;
  config: Record<string, any>;
  send_order_confirmation: boolean;
  send_shipping_update: boolean;
  send_delivery_notification: boolean;
  send_otp: boolean;
}

const AdminEmailSettings = () => {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [smsSettings, setSmsSettings] = useState<SMSSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [activeTab, setActiveTab] = useState("provider");
  const [mainTab, setMainTab] = useState("email");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch email and SMS settings in parallel
      const [emailRes, smsRes] = await Promise.all([
        supabase.from("email_settings").select("*").limit(1).maybeSingle(),
        supabase.from("sms_settings").select("*").limit(1).maybeSingle(),
      ]);

      if (emailRes.error) throw emailRes.error;
      if (smsRes.error && smsRes.error.code !== "PGRST116") console.error("SMS settings error:", smsRes.error);

      if (emailRes.data) {
        setSettings(emailRes.data as EmailSettings);
      } else {
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

      if (smsRes.data) {
        setSmsSettings(smsRes.data as unknown as SMSSettings);
      } else {
        const { data: newSms, error: smsInsertErr } = await supabase
          .from("sms_settings")
          .insert({
            provider: "twilio",
            is_enabled: false,
            send_order_confirmation: true,
            send_shipping_update: true,
            send_delivery_notification: true,
            send_otp: true,
          })
          .select()
          .single();
        if (smsInsertErr) console.error("SMS init error:", smsInsertErr);
        else setSmsSettings(newSms as unknown as SMSSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const credentialsToEncrypt: Record<string, string> = {};
      if (settings.smtp_password) credentialsToEncrypt.smtp_password = settings.smtp_password;
      if (settings.resend_api_key) credentialsToEncrypt.resend_api_key = settings.resend_api_key;

      let encryptedCreds: Record<string, string> = {};
      if (Object.keys(credentialsToEncrypt).length > 0) {
        const { data: encryptResult, error: encryptError } = await supabase.functions.invoke(
          "encrypt-credentials",
          { body: { credentials: credentialsToEncrypt } }
        );
        if (encryptError) {
          encryptedCreds = credentialsToEncrypt;
        } else if (encryptResult?.encrypted) {
          encryptedCreds = encryptResult.encrypted;
        } else {
          encryptedCreds = credentialsToEncrypt;
        }
      }

      const { error } = await supabase
        .from("email_settings")
        .update({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_password: encryptedCreds.smtp_password || settings.smtp_password,
          from_email: settings.from_email,
          from_name: settings.from_name,
          reply_to_email: settings.reply_to_email,
          is_enabled: settings.is_enabled,
          provider: settings.provider,
          resend_api_key: encryptedCreds.resend_api_key || settings.resend_api_key,
          send_order_confirmation: settings.send_order_confirmation,
          send_shipping_update: settings.send_shipping_update,
          send_delivery_notification: settings.send_delivery_notification,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Email settings saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSMS = async () => {
    if (!smsSettings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("sms_settings")
        .update({
          is_enabled: smsSettings.is_enabled,
          provider: smsSettings.provider,
          api_key: smsSettings.api_key,
          api_secret: smsSettings.api_secret,
          sender_id: smsSettings.sender_id,
          config: smsSettings.config,
          send_order_confirmation: smsSettings.send_order_confirmation,
          send_shipping_update: smsSettings.send_shipping_update,
          send_delivery_notification: smsSettings.send_delivery_notification,
          send_otp: smsSettings.send_otp,
        })
        .eq("id", smsSettings.id);

      if (error) throw error;
      toast.success("SMS settings saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save SMS settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) { toast.error("Please enter a test email address"); return; }
    if (!settings?.is_enabled) { toast.error("Please enable email notifications first"); return; }

    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke("send-order-email", {
        body: {
          to: testEmail,
          subject: "Test Email from Artistiya",
          type: "test",
          data: { order_number: "TEST-001", customer_name: "Test Customer" },
        },
      });
      if (error) throw error;
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  const updateSettings = (field: keyof EmailSettings, value: string | number | boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const updateSMSSettings = (field: keyof SMSSettings, value: any) => {
    if (!smsSettings) return;
    setSmsSettings({ ...smsSettings, [field]: value });
  };

  const applyHostingerPreset = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      provider: "smtp",
      smtp_host: "smtp.hostinger.com",
      smtp_port: 465,
    });
    toast.success("Hostinger SMTP preset applied! Enter your email credentials.");
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-foreground">Email & SMS Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure email delivery and SMS notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs: Email vs SMS */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> SMS
          </TabsTrigger>
        </TabsList>

        {/* ══════════ EMAIL TAB ══════════ */}
        <TabsContent value="email" className="space-y-6 mt-6">
          {settings && (
            <>
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
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Button variant="outline" size="sm" onClick={applyHostingerPreset}>
                          <Send className="h-4 w-4 mr-2" />
                          Hostinger Preset
                        </Button>
                      </div>

                      <Select
                        value={settings.provider}
                        onValueChange={(value) => updateSettings("provider", value)}
                      >
                        <SelectTrigger className="w-full md:w-64">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resend">Resend (Recommended)</SelectItem>
                          <SelectItem value="smtp">SMTP Server (Hostinger / Custom)</SelectItem>
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
                              <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                                resend.com/api-keys
                              </a>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* SMTP Settings */}
                      {settings.provider === "smtp" && (
                        <div className="space-y-4">
                          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                            <p className="font-medium text-blue-600">Hostinger SMTP</p>
                            <p className="text-muted-foreground mt-1">
                              Host: <code>smtp.hostinger.com</code> | Port: <code>465</code> (SSL) or <code>587</code> (TLS)<br />
                              Find credentials in hPanel → Emails → Connect Apps & Devices
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                              <Label htmlFor="smtp_host">SMTP Host</Label>
                              <Input
                                id="smtp_host"
                                value={settings.smtp_host || ""}
                                onChange={(e) => updateSettings("smtp_host", e.target.value)}
                                placeholder="smtp.hostinger.com"
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label htmlFor="smtp_port">SMTP Port</Label>
                              <Input
                                id="smtp_port"
                                type="number"
                                value={settings.smtp_port || 465}
                                onChange={(e) => updateSettings("smtp_port", parseInt(e.target.value))}
                                placeholder="465"
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label htmlFor="smtp_user">Username (Email Address)</Label>
                              <Input
                                id="smtp_user"
                                value={settings.smtp_user || ""}
                                onChange={(e) => updateSettings("smtp_user", e.target.value)}
                                placeholder="info@yourdomain.com"
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label htmlFor="smtp_password">Password</Label>
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
                          <Input id="from_name" value={settings.from_name || ""} onChange={(e) => updateSettings("from_name", e.target.value)} placeholder="Artistiya" className="mt-1.5" />
                        </div>
                        <div>
                          <Label htmlFor="from_email">From Email</Label>
                          <Input id="from_email" type="email" value={settings.from_email || ""} onChange={(e) => updateSettings("from_email", e.target.value)} placeholder="orders@yourdomain.com" className="mt-1.5" />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="reply_to">Reply-To Email</Label>
                          <Input id="reply_to" type="email" value={settings.reply_to_email || ""} onChange={(e) => updateSettings("reply_to_email", e.target.value)} placeholder="support@yourdomain.com" className="mt-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">When customers reply to order emails, it will go to this address</p>
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
                          <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center"><Package className="h-5 w-5 text-green-500" /></div>
                          <div>
                            <Label className="text-base">Order Confirmation</Label>
                            <p className="text-sm text-muted-foreground">Sent when a customer places an order</p>
                          </div>
                        </div>
                        <Switch checked={settings.send_order_confirmation} onCheckedChange={(checked) => updateSettings("send_order_confirmation", checked)} />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center"><Truck className="h-5 w-5 text-blue-500" /></div>
                          <div>
                            <Label className="text-base">Shipping Update</Label>
                            <p className="text-sm text-muted-foreground">Sent when order status changes to shipped</p>
                          </div>
                        </div>
                        <Switch checked={settings.send_shipping_update} onCheckedChange={(checked) => updateSettings("send_shipping_update", checked)} />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gold/10 rounded-lg flex items-center justify-center"><Bell className="h-5 w-5 text-gold" /></div>
                          <div>
                            <Label className="text-base">Delivery Notification</Label>
                            <p className="text-sm text-muted-foreground">Sent when order is delivered</p>
                          </div>
                        </div>
                        <Switch checked={settings.send_delivery_notification} onCheckedChange={(checked) => updateSettings("send_delivery_notification", checked)} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Test Email */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Test Email</CardTitle>
                  <CardDescription>Verify your email configuration is working correctly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="Enter test email address" className="flex-1" type="email" />
                    <Button variant="outline" onClick={handleTestEmail} disabled={testing || !settings.is_enabled}>
                      <TestTube className="h-4 w-4 mr-2" />
                      {testing ? "Sending..." : "Send Test"}
                    </Button>
                  </div>
                  {!settings.is_enabled && (
                    <p className="text-xs text-yellow-500 mt-2">Enable email notifications above to send test emails</p>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button variant="gold" onClick={handleSaveEmail} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Email Settings"}
                </Button>
              </div>

              {/* Setup Guide */}
              <Card className="bg-gold/5 border-gold/20">
                <CardContent className="pt-6">
                  <h3 className="font-medium text-foreground mb-2">Setup Guide</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Resend:</strong> Easiest — just add your API Key and verify your domain</li>
                    <li>• <strong>SMTP (Hostinger):</strong> Use <code>smtp.hostinger.com</code>, Port 465 (SSL). Find credentials in hPanel → Emails</li>
                    <li>• <strong>SendGrid / Mailgun:</strong> Add API key in provider config</li>
                    <li>• <strong>From Email:</strong> Must be from a verified domain (noreply@yourdomain.com)</li>
                    <li>• Order confirmations, shipping updates, and delivery notifications are sent automatically</li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ══════════ SMS TAB ══════════ */}
        <TabsContent value="sms" className="space-y-6 mt-6">
          {smsSettings && (
            <>
              {/* Enable/Disable */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg text-foreground">SMS Notifications</h3>
                        <p className="text-sm text-muted-foreground">
                          Send SMS alerts for orders, OTP, and updates
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={smsSettings.is_enabled}
                      onCheckedChange={(checked) => updateSMSSettings("is_enabled", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SMS Provider */}
              <Card>
                <CardHeader>
                  <CardTitle>SMS Provider</CardTitle>
                  <CardDescription>Connect your SMS gateway for notifications and OTP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={smsSettings.provider}
                    onValueChange={(value) => updateSMSSettings("provider", value)}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="firebase">Google Firebase</SelectItem>
                      <SelectItem value="bulksmsbd">BulkSMSBD</SelectItem>
                      <SelectItem value="smsq">SMSQ</SelectItem>
                      <SelectItem value="greenweb">Green Web SMS</SelectItem>
                      <SelectItem value="infobip">Infobip</SelectItem>
                      <SelectItem value="nexmo">Vonage (Nexmo)</SelectItem>
                      <SelectItem value="custom">Custom API</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Provider-specific help */}
                  {smsSettings.provider === "twilio" && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                      <p className="font-medium text-blue-600">Twilio Setup</p>
                      <p className="text-muted-foreground mt-1">
                        Get <strong>Account SID</strong> and <strong>Auth Token</strong> from{" "}
                        <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">console.twilio.com</a>.
                        Use your Twilio phone number as Sender ID.
                      </p>
                    </div>
                  )}

                  {smsSettings.provider === "firebase" && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm">
                      <p className="font-medium text-orange-600">Google Firebase SMS</p>
                      <p className="text-muted-foreground mt-1">
                        Use Firebase Identity Platform for OTP, or a Cloud Function endpoint for general SMS.
                        Get your <strong>Web API Key</strong> from{" "}
                        <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Firebase Console</a>{" "}
                        → Project Settings → General.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="sms_api_key">
                        {smsSettings.provider === "twilio" ? "Account SID" :
                         smsSettings.provider === "firebase" ? "Firebase Web API Key" :
                         "API Key"}
                      </Label>
                      <Input
                        id="sms_api_key"
                        type="password"
                        value={smsSettings.api_key || ""}
                        onChange={(e) => updateSMSSettings("api_key", e.target.value)}
                        placeholder={smsSettings.provider === "twilio" ? "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" :
                                     smsSettings.provider === "firebase" ? "AIzaSy..." : "Enter API Key"}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sms_api_secret">
                        {smsSettings.provider === "twilio" ? "Auth Token" :
                         smsSettings.provider === "firebase" ? "Service Account Key (optional)" :
                         "API Secret"}
                      </Label>
                      <Input
                        id="sms_api_secret"
                        type="password"
                        value={smsSettings.api_secret || ""}
                        onChange={(e) => updateSMSSettings("api_secret", e.target.value)}
                        placeholder="Enter API Secret"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="sms_sender_id">Sender ID / From Number</Label>
                      <Input
                        id="sms_sender_id"
                        value={smsSettings.sender_id || ""}
                        onChange={(e) => updateSMSSettings("sender_id", e.target.value)}
                        placeholder="e.g., Artistiya or +8801XXXXXXXXX"
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alphanumeric sender ID or phone number (depends on provider)
                      </p>
                    </div>
                  </div>

                  {/* Firebase-specific fields */}
                  {smsSettings.provider === "firebase" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label>Firebase Project ID</Label>
                        <Input
                          value={(smsSettings.config as any)?.firebase_project_id || ""}
                          onChange={(e) => updateSMSSettings("config", { ...smsSettings.config, firebase_project_id: e.target.value })}
                          placeholder="my-project-12345"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Cloud Function URL (optional)</Label>
                        <Input
                          value={(smsSettings.config as any)?.firebase_function_url || ""}
                          onChange={(e) => updateSMSSettings("config", { ...smsSettings.config, firebase_function_url: e.target.value })}
                          placeholder="https://us-central1-project.cloudfunctions.net/sendSMS"
                          className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          If provided, general SMS messages will be sent via this Cloud Function.
                          Without it, only OTP via Firebase Identity Platform is supported.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Infobip-specific */}
                  {smsSettings.provider === "infobip" && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label>Infobip Base URL</Label>
                      <Input
                        value={(smsSettings.config as any)?.infobip_base_url || ""}
                        onChange={(e) => updateSMSSettings("config", { ...smsSettings.config, infobip_base_url: e.target.value })}
                        placeholder="https://xxxxx.api.infobip.com"
                        className="mt-1.5"
                      />
                    </div>
                  )}

                  {/* Custom API */}
                  {smsSettings.provider === "custom" && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label htmlFor="sms_custom_url">Custom API Endpoint URL</Label>
                      <Input
                        id="sms_custom_url"
                        value={(smsSettings.config as any)?.custom_url || ""}
                        onChange={(e) => updateSMSSettings("config", { ...smsSettings.config, custom_url: e.target.value })}
                        placeholder="https://api.yoursmsprovider.com/send"
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Custom SMS provider endpoint. API key and secret will be sent as headers.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SMS Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle>SMS Notification Types</CardTitle>
                  <CardDescription>Choose which SMS notifications to send</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center"><Package className="h-5 w-5 text-green-500" /></div>
                      <div>
                        <Label className="text-base">Order Confirmation SMS</Label>
                        <p className="text-sm text-muted-foreground">Sent when an order is placed</p>
                      </div>
                    </div>
                    <Switch checked={smsSettings.send_order_confirmation} onCheckedChange={(checked) => updateSMSSettings("send_order_confirmation", checked)} />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center"><Truck className="h-5 w-5 text-blue-500" /></div>
                      <div>
                        <Label className="text-base">Shipping Update SMS</Label>
                        <p className="text-sm text-muted-foreground">Sent when order is shipped with tracking info</p>
                      </div>
                    </div>
                    <Switch checked={smsSettings.send_shipping_update} onCheckedChange={(checked) => updateSMSSettings("send_shipping_update", checked)} />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gold/10 rounded-lg flex items-center justify-center"><Bell className="h-5 w-5 text-gold" /></div>
                      <div>
                        <Label className="text-base">Delivery Notification SMS</Label>
                        <p className="text-sm text-muted-foreground">Sent when order is delivered</p>
                      </div>
                    </div>
                    <Switch checked={smsSettings.send_delivery_notification} onCheckedChange={(checked) => updateSMSSettings("send_delivery_notification", checked)} />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center"><MessageSquare className="h-5 w-5 text-purple-500" /></div>
                      <div>
                        <Label className="text-base">OTP / Verification SMS</Label>
                        <p className="text-sm text-muted-foreground">Send OTP for login, registration, or password reset</p>
                      </div>
                    </div>
                    <Switch checked={smsSettings.send_otp} onCheckedChange={(checked) => updateSMSSettings("send_otp", checked)} />
                  </div>
                </CardContent>
              </Card>

              {/* Test SMS */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Test SMS</CardTitle>
                  <CardDescription>Verify your SMS configuration is working correctly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="Enter phone number (e.g. +8801XXXXXXXXX)"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!testPhone) { toast.error("Please enter a phone number"); return; }
                        if (!smsSettings?.is_enabled) { toast.error("Please enable SMS first"); return; }
                        setTesting(true);
                        try {
                          const { error } = await supabase.functions.invoke("send-sms", {
                            body: {
                              phone: testPhone,
                              message: `Test SMS from Artistiya. Your SMS configuration with ${smsSettings.provider} is working correctly!`,
                              type: "test",
                            },
                          });
                          if (error) throw error;
                          toast.success(`Test SMS sent to ${testPhone}`);
                        } catch (error: any) {
                          toast.error(error.message || "Failed to send test SMS");
                        } finally {
                          setTesting(false);
                        }
                      }}
                      disabled={testing || !smsSettings.is_enabled}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {testing ? "Sending..." : "Send Test"}
                    </Button>
                  </div>
                  {!smsSettings.is_enabled && (
                    <p className="text-xs text-yellow-500 mt-2">Enable SMS notifications above to send test messages</p>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button variant="gold" onClick={handleSaveSMS} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save SMS Settings"}
                </Button>
              </div>

              {/* SMS Guide */}
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="pt-6">
                  <h3 className="font-medium text-foreground mb-2">SMS Setup Guide</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Twilio:</strong> Get Account SID and Auth Token from <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">console.twilio.com</a></li>
                    <li>• <strong>Firebase:</strong> Use Firebase Identity Platform for OTP verification, or deploy a Cloud Function for general SMS dispatch</li>
                    <li>• <strong>BulkSMSBD / SMSQ / Green Web:</strong> Popular Bangladesh SMS gateways — get API key from their dashboard</li>
                    <li>• <strong>Infobip / Vonage:</strong> Enterprise-grade global SMS — get credentials from their portal</li>
                    <li>• <strong>Sender ID:</strong> Must be approved by the provider (e.g., "Artistiya")</li>
                    <li>• <strong>OTP:</strong> OTP messages are sent instantly (not queued) for security</li>
                    <li>• <strong>Custom API:</strong> Use any SMS gateway by providing the endpoint URL</li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEmailSettings;
