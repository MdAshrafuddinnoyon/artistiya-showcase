import { useState, useEffect } from "react";
import { Settings, Save, Loader2, Palette, ToggleLeft, Percent, Type, Link as LinkIcon, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  // Form customization
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
            Custom Order Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage custom order system, header button, form fields, and advance payment
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
          Save All Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="form">Form Customization</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
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

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Header Button</Label>
                    <p className="text-sm text-muted-foreground">
                      Show custom order button in the header
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

            {/* Header Button Customization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-gold" />
                  Header Button Settings
                </CardTitle>
                <CardDescription>
                  Customize the header button text and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="buttonText">Button Text (English)</Label>
                  <Input
                    id="buttonText"
                    value={settings.header_button_text}
                    onChange={(e) => 
                      setSettings({ ...settings, header_button_text: e.target.value })
                    }
                    placeholder="Custom Design"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="buttonTextBn">Button Text (বাংলা)</Label>
                  <Input
                    id="buttonTextBn"
                    value={settings.header_button_text_bn}
                    onChange={(e) => 
                      setSettings({ ...settings, header_button_text_bn: e.target.value })
                    }
                    placeholder="কাস্টম ডিজাইন"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="buttonLink" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Custom Link (Optional)
                  </Label>
                  <Input
                    id="buttonLink"
                    value={settings.header_button_link || ""}
                    onChange={(e) => 
                      setSettings({ ...settings, header_button_link: e.target.value || null })
                    }
                    placeholder="/custom-order or leave empty for modal"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to open custom order modal
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Card */}
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
            {/* Form Texts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gold" />
                  Form Title & Subtitle
                </CardTitle>
                <CardDescription>
                  Customize the form header texts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Form Title (English)</Label>
                  <Input
                    value={settings.form_title}
                    onChange={(e) => setSettings({ ...settings, form_title: e.target.value })}
                    placeholder="Submit Your Design"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Form Title (বাংলা)</Label>
                  <Input
                    value={settings.form_title_bn}
                    onChange={(e) => setSettings({ ...settings, form_title_bn: e.target.value })}
                    placeholder="আপনার ডিজাইন জমা দিন"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Subtitle (English)</Label>
                  <Textarea
                    value={settings.form_subtitle}
                    onChange={(e) => setSettings({ ...settings, form_subtitle: e.target.value })}
                    placeholder="Upload your design idea..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Subtitle (বাংলা)</Label>
                  <Textarea
                    value={settings.form_subtitle_bn}
                    onChange={(e) => setSettings({ ...settings, form_subtitle_bn: e.target.value })}
                    placeholder="আপনার ডিজাইন আইডিয়া আপলোড করুন..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gold" />
                  Form Fields
                </CardTitle>
                <CardDescription>
                  Configure form field labels and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Description Label</Label>
                  <Input
                    value={settings.form_description_label}
                    onChange={(e) => setSettings({ ...settings, form_description_label: e.target.value })}
                    placeholder="Detailed Description"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description Placeholder</Label>
                  <Textarea
                    value={settings.form_description_placeholder}
                    onChange={(e) => setSettings({ ...settings, form_description_placeholder: e.target.value })}
                    placeholder="Describe your preferred colors..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Require Image</Label>
                    <p className="text-sm text-muted-foreground">
                      Make reference image mandatory
                    </p>
                  </div>
                  <Switch
                    checked={settings.require_image}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, require_image: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground font-medium">Show Budget Fields</Label>
                    <p className="text-sm text-muted-foreground">
                      Display min/max budget inputs
                    </p>
                  </div>
                  <Switch
                    checked={settings.show_budget_fields}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, show_budget_fields: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Success Messages */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  ✓ Success Messages
                </CardTitle>
                <CardDescription>
                  Messages shown after successful submission
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Success Message (English)</Label>
                  <Input
                    value={settings.success_message}
                    onChange={(e) => setSettings({ ...settings, success_message: e.target.value })}
                    placeholder="Your custom order request has been submitted!"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Success Message (বাংলা)</Label>
                  <Input
                    value={settings.success_message_bn}
                    onChange={(e) => setSettings({ ...settings, success_message_bn: e.target.value })}
                    placeholder="আপনার কাস্টম অর্ডার রিকোয়েস্ট জমা দেওয়া হয়েছে!"
                    className="mt-1"
                  />
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
              <CardDescription>
                Configure advance payment percentages for custom orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <Separator />

              <div className="grid grid-cols-2 gap-6">
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
                      className="w-24"
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
                      className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-gold/30 bg-gold/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-gold mt-0.5" />
                <div>
                  <h4 className="font-medium text-gold">How Custom Orders Work</h4>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1.5">
                    <li>• Products marked as "Customization Only" show request button instead of Add to Cart</li>
                    <li>• Header button opens the custom order form modal (or redirects if link is set)</li>
                    <li>• For product-specific orders, customers complete delivery info and pay advance</li>
                    <li>• Advance payment (% of product price) is collected via bKash/Nagad</li>
                    <li>• COD option allows customers to skip advance payment</li>
                    <li>• You can set per-product advance percentage in the product editor</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCustomizationSettings;
