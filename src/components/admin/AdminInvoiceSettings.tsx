import { useState, useEffect } from "react";
import { Save, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvoiceSettings {
  id: string;
  logo_url: string | null;
  company_name: string;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  terms_and_conditions: string | null;
  footer_note: string | null;
}

const AdminInvoiceSettings = () => {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching invoice settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setSettings(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("invoice_settings")
        .update({
          logo_url: settings.logo_url,
          company_name: settings.company_name,
          company_address: settings.company_address,
          company_phone: settings.company_phone,
          company_email: settings.company_email,
          terms_and_conditions: settings.terms_and_conditions,
          footer_note: settings.footer_note,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Invoice settings saved successfully");
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
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No invoice settings found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-foreground">Invoice Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize how invoices appear for customers
          </p>
        </div>
        <Button variant="gold" onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Logo Upload */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg text-foreground mb-4">Company Logo</h2>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Invoice Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <FileText className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <Button variant="outline" asChild disabled={uploading}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Logo"}
                </span>
              </Button>
            </Label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 200x80px PNG or SVG
            </p>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg text-foreground">Company Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={settings.company_name || ""}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="company_email">Company Email</Label>
            <Input
              id="company_email"
              type="email"
              value={settings.company_email || ""}
              onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_phone">Company Phone</Label>
            <Input
              id="company_phone"
              value={settings.company_phone || ""}
              onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="company_address">Company Address</Label>
            <Input
              id="company_address"
              value={settings.company_address || ""}
              onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg text-foreground">Invoice Content</h2>
        
        <div>
          <Label htmlFor="terms">Terms & Conditions</Label>
          <Textarea
            id="terms"
            value={settings.terms_and_conditions || ""}
            onChange={(e) => setSettings({ ...settings, terms_and_conditions: e.target.value })}
            className="mt-1.5"
            rows={5}
            placeholder="Enter terms and conditions (one per line)"
          />
        </div>

        <div>
          <Label htmlFor="footer">Footer Note</Label>
          <Input
            id="footer"
            value={settings.footer_note || ""}
            onChange={(e) => setSettings({ ...settings, footer_note: e.target.value })}
            className="mt-1.5"
            placeholder="Thank you for your purchase!"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceSettings;
