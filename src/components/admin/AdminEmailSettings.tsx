import { useState, useEffect } from "react";
import { Save, Mail, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
}

const AdminEmailSettings = () => {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSettings(data as EmailSettings);
      } else {
        // Create default settings
        const { data: newData, error: insertError } = await supabase
          .from("email_settings")
          .insert({
            provider: "smtp",
            smtp_port: 587,
            is_enabled: false,
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

    setTesting(true);
    try {
      // In a real implementation, this would call an edge function
      toast.success(`Test email would be sent to ${testEmail}`);
    } catch (error) {
      toast.error("Failed to send test email");
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
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/4 mb-4" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ))}
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
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Enable/Disable */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gold/10 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-gold" />
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
      </div>

      {/* Provider Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">Email Provider</h2>
        <Select
          value={settings.provider}
          onValueChange={(value) => updateSettings("provider", value)}
        >
          <SelectTrigger className="w-full md:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="smtp">SMTP Server</SelectItem>
            <SelectItem value="sendgrid">SendGrid</SelectItem>
            <SelectItem value="mailgun">Mailgun</SelectItem>
            <SelectItem value="ses">Amazon SES</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SMTP Settings */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">SMTP Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Sender Info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">Sender Information</h2>
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
          </div>
        </div>
      </div>

      {/* Test Email */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">Send Test Email</h2>
        <div className="flex gap-3">
          <Input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter test email address"
            className="flex-1"
          />
          <Button variant="outline" onClick={handleTestEmail} disabled={testing}>
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? "Sending..." : "Send Test"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailSettings;
