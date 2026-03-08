import { useState, useEffect, useRef } from "react";
import { Settings, Save, Loader2, Palette, ToggleLeft, Percent, Type, Link as LinkIcon, FileText, MessageSquare, Download, Upload, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CRMExportTools from "./crm/CRMExportTools";

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
  form_title: string;
  form_title_bn: string;
  form_subtitle: string;
  form_subtitle_bn: string;
  form_description_label: string;
  form_description_placeholder: string;
  require_image: boolean;
  show_budget_fields: boolean;
  success_message: string;
  success_message_bn: string;
}

const defaultSettings: CustomizationSettings = {
  id: "",
  custom_order_enabled: true,
  header_button_enabled: true,
  header_button_text: "Custom Design",
  header_button_text_bn: "কাস্টম ডিজাইন",
  header_button_link: null,
  default_advance_percent: 50,
  min_advance_percent: 20,
  max_advance_percent: 100,
  form_title: "Submit Your Design",
  form_title_bn: "আপনার ডিজাইন জমা দিন",
  form_subtitle: "Upload your design idea and we will make it for you",
  form_subtitle_bn: "আপনার ডিজাইন আইডিয়া আপলোড করুন, আমরা আপনার জন্য তৈরি করব",
  form_description_label: "Detailed Description",
  form_description_placeholder: "Describe your preferred colors, size, materials, and other details...",
  require_image: false,
  show_budget_fields: true,
  success_message: "Your custom order request has been submitted!",
  success_message_bn: "আপনার কাস্টম অর্ডার রিকোয়েস্ট জমা দেওয়া হয়েছে!",
};

const AdminCustomizationSettings = () => {
  const [settings, setSettings] = useState<CustomizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
    fetchCustomOrders();
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
        header_button_text: data.header_button_text || defaultSettings.header_button_text,
        header_button_text_bn: data.header_button_text_bn || defaultSettings.header_button_text_bn,
        header_button_link: data.header_button_link || null,
        default_advance_percent: data.default_advance_percent ?? 50,
        min_advance_percent: data.min_advance_percent ?? 20,
        max_advance_percent: data.max_advance_percent ?? 100,
        form_title: data.form_title || defaultSettings.form_title,
        form_title_bn: data.form_title_bn || defaultSettings.form_title_bn,
        form_subtitle: data.form_subtitle || defaultSettings.form_subtitle,
        form_subtitle_bn: data.form_subtitle_bn || defaultSettings.form_subtitle_bn,
        form_description_label: data.form_description_label || defaultSettings.form_description_label,
        form_description_placeholder: data.form_description_placeholder || defaultSettings.form_description_placeholder,
        require_image: data.require_image ?? false,
        show_budget_fields: data.show_budget_fields ?? true,
        success_message: data.success_message || defaultSettings.success_message,
        success_message_bn: data.success_message_bn || defaultSettings.success_message_bn,
      });
    } catch (error) {
      console.error("Error fetching customization settings:", error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("custom_order_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCustomOrders(data || []);
    } catch (error) {
      console.error("Error fetching custom orders:", error);
    } finally {
      setLoadingOrders(false);
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
            form_title: settings.form_title,
            form_title_bn: settings.form_title_bn,
            form_subtitle: settings.form_subtitle,
            form_subtitle_bn: settings.form_subtitle_bn,
            form_description_label: settings.form_description_label,
            form_description_placeholder: settings.form_description_placeholder,
            require_image: settings.require_image,
            show_budget_fields: settings.show_budget_fields,
            success_message: settings.success_message,
            success_message_bn: settings.success_message_bn,
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
            form_title: settings.form_title,
            form_title_bn: settings.form_title_bn,
            form_subtitle: settings.form_subtitle,
            form_subtitle_bn: settings.form_subtitle_bn,
            form_description_label: settings.form_description_label,
            form_description_placeholder: settings.form_description_placeholder,
            require_image: settings.require_image,
            show_budget_fields: settings.show_budget_fields,
            success_message: settings.success_message,
            success_message_bn: settings.success_message_bn,
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

  // Excel/CSV Import
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim());
        if (lines.length < 2) { toast.error("CSV file is empty or invalid"); return; }

        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const records: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const record: Record<string, string> = {};
          headers.forEach((h, idx) => { record[h] = values[idx] || ""; });
          records.push(record);
        }

        // Map CSV columns to settings fields
        if (records.length > 0) {
          const row = records[0];
          const updatedSettings = { ...settings! };
          
          if (row.header_button_text) updatedSettings.header_button_text = row.header_button_text;
          if (row.header_button_text_bn) updatedSettings.header_button_text_bn = row.header_button_text_bn;
          if (row.form_title) updatedSettings.form_title = row.form_title;
          if (row.form_title_bn) updatedSettings.form_title_bn = row.form_title_bn;
          if (row.form_subtitle) updatedSettings.form_subtitle = row.form_subtitle;
          if (row.form_subtitle_bn) updatedSettings.form_subtitle_bn = row.form_subtitle_bn;
          if (row.success_message) updatedSettings.success_message = row.success_message;
          if (row.success_message_bn) updatedSettings.success_message_bn = row.success_message_bn;
          if (row.default_advance_percent) updatedSettings.default_advance_percent = Number(row.default_advance_percent);
          if (row.custom_order_enabled) updatedSettings.custom_order_enabled = row.custom_order_enabled === "true";
          if (row.require_image) updatedSettings.require_image = row.require_image === "true";
          if (row.show_budget_fields) updatedSettings.show_budget_fields = row.show_budget_fields === "true";

          setSettings(updatedSettings);
          toast.success(`Imported ${records.length} settings from CSV`);
        }
      } catch (err) {
        console.error("Import error:", err);
        toast.error("Failed to import CSV file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Export settings as CSV
  const handleExportSettings = () => {
    if (!settings) return;
    const data = [{
      custom_order_enabled: settings.custom_order_enabled,
      header_button_enabled: settings.header_button_enabled,
      header_button_text: settings.header_button_text,
      header_button_text_bn: settings.header_button_text_bn,
      header_button_link: settings.header_button_link || "",
      default_advance_percent: settings.default_advance_percent,
      min_advance_percent: settings.min_advance_percent,
      max_advance_percent: settings.max_advance_percent,
      form_title: settings.form_title,
      form_title_bn: settings.form_title_bn,
      form_subtitle: settings.form_subtitle,
      form_subtitle_bn: settings.form_subtitle_bn,
      require_image: settings.require_image,
      show_budget_fields: settings.show_budget_fields,
      success_message: settings.success_message,
      success_message_bn: settings.success_message_bn,
    }];

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customization_settings_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Settings exported to CSV");
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (!settings) return;
    setSettings({ ...defaultSettings, id: settings.id });
    toast.info("Settings reset to defaults. Click Save to apply.");
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

  // Custom orders export data
  const ordersExportData = customOrders.map(o => ({
    id: o.id,
    status: o.status,
    description: o.description,
    budget_min: o.budget_min,
    budget_max: o.budget_max,
    full_name: o.full_name,
    phone: o.phone,
    email: o.email,
    estimated_price: o.estimated_price,
    advance_amount: o.advance_amount,
    advance_paid: o.advance_paid,
    created_at: o.created_at,
  }));

  const ordersExportColumns = [
    { key: "id", label: "ID" },
    { key: "status", label: "Status" },
    { key: "description", label: "Description" },
    { key: "full_name", label: "Customer" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "budget_min", label: "Budget Min" },
    { key: "budget_max", label: "Budget Max" },
    { key: "estimated_price", label: "Estimated Price" },
    { key: "advance_amount", label: "Advance" },
    { key: "advance_paid", label: "Advance Paid" },
    { key: "created_at", label: "Created" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display text-gold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Custom Order Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage custom order system, header button, form fields, and advance payment
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCSV}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Form
          </Button>
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
            Save All Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="form">Form Customization</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="orders">Custom Orders</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToggleLeft className="h-5 w-5 text-gold" />
                  Feature Controls
                </CardTitle>
                <CardDescription>Enable or disable customization features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Custom Order System</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to request custom product orders</p>
                  </div>
                  <Switch checked={settings.custom_order_enabled} onCheckedChange={(checked) => setSettings({ ...settings, custom_order_enabled: checked })} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Header Button</Label>
                    <p className="text-sm text-muted-foreground">Show custom order button in the header</p>
                  </div>
                  <Switch checked={settings.header_button_enabled} onCheckedChange={(checked) => setSettings({ ...settings, header_button_enabled: checked })} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Require Image Upload</Label>
                    <p className="text-sm text-muted-foreground">Make image upload mandatory for custom orders</p>
                  </div>
                  <Switch checked={settings.require_image} onCheckedChange={(checked) => setSettings({ ...settings, require_image: checked })} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Show Budget Fields</Label>
                    <p className="text-sm text-muted-foreground">Display minimum/maximum budget fields</p>
                  </div>
                  <Switch checked={settings.show_budget_fields} onCheckedChange={(checked) => setSettings({ ...settings, show_budget_fields: checked })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-gold" />
                  Header Button Settings
                </CardTitle>
                <CardDescription>Customize the header button text and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="buttonText">Button Text (English)</Label>
                  <Input id="buttonText" value={settings.header_button_text} onChange={(e) => setSettings({ ...settings, header_button_text: e.target.value })} placeholder="Custom Design" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="buttonTextBn">Button Text (বাংলা)</Label>
                  <Input id="buttonTextBn" value={settings.header_button_text_bn} onChange={(e) => setSettings({ ...settings, header_button_text_bn: e.target.value })} placeholder="কাস্টম ডিজাইন" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="buttonLink" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Custom Link (Optional)
                  </Label>
                  <Input id="buttonLink" value={settings.header_button_link || ""} onChange={(e) => setSettings({ ...settings, header_button_link: e.target.value || null })} placeholder="/custom-order or leave empty for modal" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty to open custom order modal</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gold/30 bg-gold/5">
            <CardHeader>
              <CardTitle className="text-gold">Button Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">English:</span>
                  {settings.header_button_enabled ? (
                    <Button variant="gold-outline" size="sm" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      {settings.header_button_text || "Custom Design"}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Disabled</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">বাংলা:</span>
                  {settings.header_button_enabled ? (
                    <Button variant="gold-outline" size="sm" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      {settings.header_button_text_bn || "কাস্টম ডিজাইন"}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">নিষ্ক্রিয়</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Customization Tab */}
        <TabsContent value="form" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gold" />
                  Form Title & Subtitle
                </CardTitle>
                <CardDescription>Customize the form header texts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Form Title (English)</Label>
                  <Input value={settings.form_title} onChange={(e) => setSettings({ ...settings, form_title: e.target.value })} placeholder="Submit Your Design" className="mt-1" />
                </div>
                <div>
                  <Label>Form Title (বাংলা)</Label>
                  <Input value={settings.form_title_bn} onChange={(e) => setSettings({ ...settings, form_title_bn: e.target.value })} placeholder="আপনার ডিজাইন জমা দিন" className="mt-1" />
                </div>
                <div>
                  <Label>Subtitle (English)</Label>
                  <Textarea value={settings.form_subtitle} onChange={(e) => setSettings({ ...settings, form_subtitle: e.target.value })} placeholder="Upload your design idea..." className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Subtitle (বাংলা)</Label>
                  <Textarea value={settings.form_subtitle_bn} onChange={(e) => setSettings({ ...settings, form_subtitle_bn: e.target.value })} placeholder="আপনার ডিজাইন আইডিয়া আপলোড করুন..." className="mt-1" rows={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gold" />
                  Form Fields
                </CardTitle>
                <CardDescription>Customize field labels and placeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Description Field Label</Label>
                  <Input value={settings.form_description_label} onChange={(e) => setSettings({ ...settings, form_description_label: e.target.value })} placeholder="Detailed Description" className="mt-1" />
                </div>
                <div>
                  <Label>Description Placeholder</Label>
                  <Textarea value={settings.form_description_placeholder} onChange={(e) => setSettings({ ...settings, form_description_placeholder: e.target.value })} placeholder="Describe your preferred colors..." className="mt-1" rows={2} />
                </div>
                <Separator />
                <div>
                  <Label>Success Message (English)</Label>
                  <Textarea value={settings.success_message} onChange={(e) => setSettings({ ...settings, success_message: e.target.value })} className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Success Message (বাংলা)</Label>
                  <Textarea value={settings.success_message_bn} onChange={(e) => setSettings({ ...settings, success_message_bn: e.target.value })} className="mt-1" rows={2} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-gold" />
                Advance Payment Settings
              </CardTitle>
              <CardDescription>Configure advance payment percentage for custom orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Default Advance %</Label>
                  <Input type="number" min="0" max="100" value={settings.default_advance_percent} onChange={(e) => setSettings({ ...settings, default_advance_percent: Number(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label>Minimum %</Label>
                  <Input type="number" min="0" max="100" value={settings.min_advance_percent} onChange={(e) => setSettings({ ...settings, min_advance_percent: Number(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label>Maximum %</Label>
                  <Input type="number" min="0" max="100" value={settings.max_advance_percent} onChange={(e) => setSettings({ ...settings, max_advance_percent: Number(e.target.value) })} className="mt-1" />
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Customers will pay <strong className="text-foreground">{settings.default_advance_percent}%</strong> advance 
                  (range: {settings.min_advance_percent}% - {settings.max_advance_percent}%) when placing custom orders.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Custom Order Requests</h3>
              <p className="text-sm text-muted-foreground">{customOrders.length} total requests</p>
            </div>
            <div className="flex gap-2">
              <CRMExportTools
                data={ordersExportData}
                filename="custom_orders"
                title="Custom Order Requests Report"
                columns={ordersExportColumns}
              />
              <Button variant="outline" size="sm" onClick={fetchCustomOrders} disabled={loadingOrders}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingOrders ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {loadingOrders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : customOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No custom order requests yet
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Budget</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Estimated</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{order.full_name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{order.phone || order.email || ""}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === "completed" ? "bg-green-500/10 text-green-500" :
                          order.status === "in_progress" ? "bg-blue-500/10 text-blue-500" :
                          order.status === "rejected" ? "bg-red-500/10 text-red-500" :
                          "bg-yellow-500/10 text-yellow-500"
                        }`}>
                          {order.status || "pending"}
                        </span>
                      </td>
                      <td className="p-3 max-w-[200px] truncate">{order.description}</td>
                      <td className="p-3 text-right">
                        {order.budget_min || order.budget_max ? `৳${order.budget_min || 0} - ৳${order.budget_max || 0}` : "-"}
                      </td>
                      <td className="p-3 text-right">
                        {order.estimated_price ? `৳${Number(order.estimated_price).toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-lg font-semibold">{settings.form_title}</h3>
            <p className="text-sm text-muted-foreground">{settings.form_subtitle}</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">{settings.form_description_label}</Label>
                <Textarea placeholder={settings.form_description_placeholder} disabled className="mt-1" rows={3} />
              </div>
              {settings.require_image && (
                <div>
                  <Label className="text-sm font-medium">Reference Image *</Label>
                  <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center text-muted-foreground">
                    Upload your design reference
                  </div>
                </div>
              )}
              {settings.show_budget_fields && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Min Budget (৳)</Label>
                    <Input disabled placeholder="500" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Max Budget (৳)</Label>
                    <Input disabled placeholder="5000" className="mt-1" />
                  </div>
                </div>
              )}
              <Button variant="gold" className="w-full" disabled>Submit Request</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomizationSettings;
