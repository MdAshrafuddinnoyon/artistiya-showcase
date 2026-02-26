import { useState, useEffect } from "react";
import { Save, Upload, FileText, Eye, RefreshCw, Pen, Globe, Facebook, Instagram, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  digital_signature_url: string | null;
  signatory_name: string | null;
  signatory_title: string | null;
  show_social_links: boolean;
  social_facebook: string | null;
  social_instagram: string | null;
  social_whatsapp: string | null;
  social_website: string | null;
  company_tagline: string | null;
}

const AdminInvoiceSettings = () => {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [generatingPreview, setGeneratingPreview] = useState(false);

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
      setSettings(data as unknown as InvoiceSettings);
    } catch (error) {
      console.error("Error fetching invoice settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "logo_url" | "digital_signature_url",
    setUploading: (v: boolean) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `invoice-${field === "logo_url" ? "logo" : "signature"}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
      setSettings((prev) => (prev ? { ...prev, [field]: publicUrl } : null));
      toast.success(`${field === "logo_url" ? "Logo" : "Signature"} uploaded`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
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
          digital_signature_url: settings.digital_signature_url,
          signatory_name: settings.signatory_name,
          signatory_title: settings.signatory_title,
          show_social_links: settings.show_social_links,
          social_facebook: settings.social_facebook,
          social_instagram: settings.social_instagram,
          social_whatsapp: settings.social_whatsapp,
          social_website: settings.social_website,
          company_tagline: settings.company_tagline,
        } as any)
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Invoice settings saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    // Save first, then generate preview with a sample order
    await saveSettings();
    setGeneratingPreview(true);
    try {
      // Try to get a real order for preview, else show sample
      const { data: sampleOrder } = await supabase
        .from("orders")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sampleOrder) {
        const { data, error } = await supabase.functions.invoke("generate-invoice", {
          body: { orderId: sampleOrder.id },
        });
        if (error) throw error;
        setPreviewHtml(data.html);
      } else {
        setPreviewHtml(buildSamplePreview());
      }
      setPreviewOpen(true);
    } catch (error: any) {
      console.error("Preview error:", error);
      // Fallback to sample preview
      setPreviewHtml(buildSamplePreview());
      setPreviewOpen(true);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const buildSamplePreview = () => {
    const s = settings;
    if (!s) return "<p>No settings configured</p>";
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice Preview</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: #fff; color: #2d2926; }
      .header { display: flex; justify-content: space-between; padding-bottom: 30px; border-bottom: 3px solid #b8a88a; margin-bottom: 30px; }
      .logo-section { display: flex; align-items: center; gap: 16px; }
      .logo-section img { max-height: 70px; max-width: 140px; object-fit: contain; }
      .company-name { font-size: 26px; font-weight: 700; }
      .company-tagline { font-size: 11px; color: #b8a88a; letter-spacing: 3px; text-transform: uppercase; }
      .company-info { font-size: 12px; color: #8a8580; margin-top: 8px; line-height: 1.8; }
      .invoice-title { font-size: 32px; font-weight: 800; color: #b8a88a; letter-spacing: 4px; text-transform: uppercase; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      thead th { background: linear-gradient(135deg, #2d2926, #3d3935); color: #b8a88a; padding: 14px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
      tbody td { padding: 14px 16px; border-bottom: 1px solid #f0ede8; font-size: 14px; }
      .signature { margin-top: 40px; text-align: right; }
      .signature img { max-height: 60px; }
      .signature .name { font-weight: 700; margin-top: 8px; }
      .signature .title { font-size: 12px; color: #8a8580; }
      .footer { text-align: center; padding-top: 25px; border-top: 1px solid #f0ede8; margin-top: 30px; }
      .footer .thank-you { font-size: 16px; color: #b8a88a; font-weight: 600; }
      .social { margin-top: 12px; font-size: 12px; }
      .social a { color: #b8a88a; text-decoration: none; margin: 0 8px; }
    </style></head><body>
    <div class="header">
      <div class="logo-section">
        ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" />` : ""}
        <div>
          <div class="company-name">${s.company_name || "Your Company"}</div>
          <div class="company-tagline">${s.company_tagline || "Handcrafted with love"}</div>
          <div class="company-info">${s.company_address || "Address"}<br>${s.company_email || "email"} &bull; ${s.company_phone || "phone"}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div class="invoice-title">Invoice</div>
        <div style="font-size:13px;color:#5a5550;margin-top:12px;line-height:2">
          <strong>Invoice #:</strong> INV-ART-20260226-0001<br>
          <strong>Order #:</strong> ART-20260226-0001<br>
          <strong>Date:</strong> 26 Feb 2026
        </div>
      </div>
    </div>
    <table>
      <thead><tr><th>Item Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Sample Handcrafted Product</td><td style="text-align:center">2</td><td style="text-align:right">৳1,500</td><td style="text-align:right">৳3,000</td></tr>
        <tr style="background:#fafaf8"><td>Artisan Ceramic Vase</td><td style="text-align:center">1</td><td style="text-align:right">৳2,800</td><td style="text-align:right">৳2,800</td></tr>
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end">
      <div style="width:320px;background:#fafaf8;border-radius:10px;padding:20px;border:1px solid #f0ede8">
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;color:#5a5550"><span>Subtotal</span><span>৳5,800</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;color:#5a5550"><span>Shipping</span><span>৳120</span></div>
        <div style="display:flex;justify-content:space-between;border-top:2px solid #b8a88a;margin-top:8px;padding-top:14px;font-size:20px;font-weight:800"><span>Total</span><span style="color:#b8a88a">৳5,920</span></div>
      </div>
    </div>
    ${s.digital_signature_url || s.signatory_name ? `
    <div class="signature">
      ${s.digital_signature_url ? `<img src="${s.digital_signature_url}" alt="Signature" />` : ""}
      ${s.signatory_name ? `<div class="name">${s.signatory_name}</div>` : ""}
      ${s.signatory_title ? `<div class="title">${s.signatory_title}</div>` : ""}
    </div>` : ""}
    ${s.terms_and_conditions ? `<div style="background:#fafaf8;border:1px solid #f0ede8;border-radius:10px;padding:18px;font-size:12px;color:#8a8580;margin-top:25px"><strong>Terms & Conditions:</strong><br>${s.terms_and_conditions}</div>` : ""}
    <div class="footer">
      <div class="thank-you">${s.footer_note || "Thank you for your purchase!"}</div>
      ${s.show_social_links ? `<div class="social">
        ${s.social_facebook ? `<a href="${s.social_facebook}">Facebook</a>` : ""}
        ${s.social_instagram ? `<a href="${s.social_instagram}">Instagram</a>` : ""}
        ${s.social_whatsapp ? `<a href="https://wa.me/${s.social_whatsapp}">WhatsApp</a>` : ""}
        ${s.social_website ? `<a href="${s.social_website}">Website</a>` : ""}
      </div>` : ""}
      <div style="font-size:11px;color:#aaa;margin-top:6px">This is a computer-generated invoice.</div>
    </div>
    </body></html>`;
  };

  const update = (field: keyof InvoiceSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handlePreview} disabled={generatingPreview}>
            <Eye className="h-4 w-4 mr-2" />
            {generatingPreview ? "Generating..." : "Preview Invoice"}
          </Button>
          <Button variant="gold" onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo & Branding</CardTitle>
          <CardDescription>Logo displayed on invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Invoice Logo" className="w-full h-full object-contain" />
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
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "logo_url", setUploading)} disabled={uploading} />
              <p className="text-xs text-muted-foreground">Recommended: 200x80px PNG or SVG</p>
            </div>
          </div>
          <div className="mt-4">
            <Label>Company Tagline</Label>
            <Input value={settings.company_tagline || ""} onChange={(e) => update("company_tagline", e.target.value)} placeholder="Handcrafted with love" className="mt-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input value={settings.company_name || ""} onChange={(e) => update("company_name", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Company Email</Label>
              <Input type="email" value={settings.company_email || ""} onChange={(e) => update("company_email", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Company Phone</Label>
              <Input value={settings.company_phone || ""} onChange={(e) => update("company_phone", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Company Address</Label>
              <Input value={settings.company_address || ""} onChange={(e) => update("company_address", e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Digital Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pen className="h-5 w-5" />
            Digital Signature
          </CardTitle>
          <CardDescription>Add an authorized signature to invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-40 h-24 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
              {settings.digital_signature_url ? (
                <img src={settings.digital_signature_url} alt="Signature" className="w-full h-full object-contain" />
              ) : (
                <Pen className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature-upload" className="cursor-pointer">
                <Button variant="outline" asChild disabled={uploadingSignature}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingSignature ? "Uploading..." : "Upload Signature"}
                  </span>
                </Button>
              </Label>
              <input id="signature-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "digital_signature_url", setUploadingSignature)} disabled={uploadingSignature} />
              <p className="text-xs text-muted-foreground">Transparent PNG recommended (300x100px)</p>
              {settings.digital_signature_url && (
                <Button variant="ghost" size="sm" onClick={() => update("digital_signature_url", null)} className="text-destructive">
                  Remove Signature
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Signatory Name</Label>
              <Input value={settings.signatory_name || ""} onChange={(e) => update("signatory_name", e.target.value)} placeholder="John Doe" className="mt-1.5" />
            </div>
            <div>
              <Label>Signatory Title</Label>
              <Input value={settings.signatory_title || ""} onChange={(e) => update("signatory_title", e.target.value)} placeholder="Managing Director" className="mt-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Social Media Links on Invoice
          </CardTitle>
          <CardDescription>Display social links in invoice footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Show Social Links on Invoice</Label>
            <Switch checked={settings.show_social_links} onCheckedChange={(checked) => update("show_social_links", checked)} />
          </div>
          {settings.show_social_links && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</Label>
                <Input value={settings.social_facebook || ""} onChange={(e) => update("social_facebook", e.target.value)} placeholder="https://facebook.com/yourpage" className="mt-1.5" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
                <Input value={settings.social_instagram || ""} onChange={(e) => update("social_instagram", e.target.value)} placeholder="https://instagram.com/yourpage" className="mt-1.5" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp</Label>
                <Input value={settings.social_whatsapp || ""} onChange={(e) => update("social_whatsapp", e.target.value)} placeholder="8801XXXXXXXXX" className="mt-1.5" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</Label>
                <Input value={settings.social_website || ""} onChange={(e) => update("social_website", e.target.value)} placeholder="https://yourwebsite.com" className="mt-1.5" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Content */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Terms & Conditions</Label>
            <Textarea value={settings.terms_and_conditions || ""} onChange={(e) => update("terms_and_conditions", e.target.value)} className="mt-1.5" rows={5} placeholder="Enter terms and conditions" />
          </div>
          <div>
            <Label>Footer Note</Label>
            <Input value={settings.footer_note || ""} onChange={(e) => update("footer_note", e.target.value)} className="mt-1.5" placeholder="Thank you for your purchase!" />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="border border-border rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={previewHtml}
              className="w-full min-h-[700px] border-0"
              title="Invoice Preview"
              sandbox="allow-same-origin"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              const printWindow = window.open("", "_blank");
              if (printWindow) {
                printWindow.document.write(previewHtml);
                printWindow.document.close();
                printWindow.print();
              }
            }}>
              Print Preview
            </Button>
            <Button variant="gold" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoiceSettings;
