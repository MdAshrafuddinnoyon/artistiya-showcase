import { useState, useEffect, useRef } from "react";
import { Save, Upload, Image, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";
import AdminSocialLinks from "./AdminSocialLinks";

interface SiteBranding {
  id: string;
  logo_url: string | null;
  logo_text: string;
  logo_text_secondary: string;
  show_logo_text: boolean;
  favicon_url: string | null;
  header_announcement_text: string;
  header_announcement_active: boolean;
  footer_description: string;
  footer_copyright: string;
  footer_logo_size: string;
  footer_banner_url: string | null;
  footer_banner_link: string | null;
  footer_banner_height: number;
  payment_methods: string[];
  signup_discount_percent: number;
  signup_discount_enabled: boolean;
  social_instagram: string;
  social_facebook: string;
  social_email: string;
}

const defaultPaymentMethods = ["bKash", "Nagad", "Visa", "Mastercard", "COD"];

const AdminSiteBranding = () => {
  const [branding, setBranding] = useState<SiteBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const footerBannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const { data, error } = await supabase
        .from("site_branding")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        const paymentMethodsArray = Array.isArray(data.payment_methods) 
          ? data.payment_methods as string[]
          : defaultPaymentMethods;
        
        setBranding({
          ...data,
          show_logo_text: data.show_logo_text ?? true,
          footer_logo_size: data.footer_logo_size || "medium",
          footer_banner_height: data.footer_banner_height || 80,
          payment_methods: paymentMethodsArray,
          signup_discount_percent: data.signup_discount_percent || 5,
          signup_discount_enabled: data.signup_discount_enabled ?? true,
        });
      } else {
        const { data: newData, error: insertError } = await supabase
          .from("site_branding")
          .insert({})
          .select()
          .single();
        
        if (insertError) throw insertError;
        setBranding({
          ...newData,
          show_logo_text: true,
          footer_logo_size: "medium",
          footer_banner_height: 80,
          payment_methods: defaultPaymentMethods,
          signup_discount_percent: 5,
          signup_discount_enabled: true,
        });
      }
    } catch (error) {
      console.error("Error fetching branding:", error);
      toast.error("Failed to fetch branding settings");
    } finally {
      setLoading(false);
    }
  };

  const saveBranding = async () => {
    if (!branding) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_branding")
        .update({
          ...branding,
          payment_methods: branding.payment_methods,
        })
        .eq("id", branding.id);

      if (error) throw error;
      toast.success("Branding saved successfully");
    } catch (error) {
      console.error("Error saving branding:", error);
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (type: "logo" | "favicon" | "footer_banner", file: File) => {
    setUploading(type);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      const fieldName = type === "logo" ? "logo_url" : type === "favicon" ? "favicon_url" : "footer_banner_url";
      setBranding(prev => prev ? { ...prev, [fieldName]: publicUrl } : null);
      
      // Update favicon in HTML if uploaded
      if (type === "favicon") {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
          link.href = publicUrl;
        }
      }
      
      toast.success(`${type.replace("_", " ")} uploaded successfully`);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  };

  const updateField = (field: keyof SiteBranding, value: any) => {
    setBranding(prev => prev ? { ...prev, [field]: value } : null);
  };

  const addPaymentMethod = () => {
    if (!newPaymentMethod.trim() || !branding) return;
    const methods = [...(branding.payment_methods || []), newPaymentMethod.trim()];
    updateField("payment_methods", methods);
    setNewPaymentMethod("");
  };

  const removePaymentMethod = (index: number) => {
    if (!branding) return;
    const methods = branding.payment_methods.filter((_, i) => i !== index);
    updateField("payment_methods", methods);
  };

  if (loading) {
    return <div className="h-96 bg-muted rounded-xl animate-pulse" />;
  }

  if (!branding) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="font-display text-xl text-foreground">Site Branding</h2>
        <Button variant="gold" onClick={saveBranding} disabled={saving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <input
        type="file"
        ref={logoInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload("logo", file);
        }}
      />
      <input
        type="file"
        ref={faviconInputRef}
        className="hidden"
        accept="image/x-icon,image/png,image/svg+xml"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload("favicon", file);
        }}
      />
      <input
        type="file"
        ref={footerBannerInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload("footer_banner", file);
        }}
      />

      <Tabs defaultValue="logo">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-5 bg-muted">
            <TabsTrigger value="logo" className="text-xs sm:text-sm">Logo & Favicon</TabsTrigger>
            <TabsTrigger value="header" className="text-xs sm:text-sm">Header</TabsTrigger>
            <TabsTrigger value="footer" className="text-xs sm:text-sm">Footer</TabsTrigger>
            <TabsTrigger value="social" className="text-xs sm:text-sm">Social Links</TabsTrigger>
            <TabsTrigger value="discounts" className="text-xs sm:text-sm">Discounts</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="logo" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Logo</CardTitle>
                <CardDescription>Upload a logo image or use text logo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="aspect-[3/1] rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploading === "logo" ? (
                    <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
                  ) : branding.logo_url ? (
                    <img
                      src={branding.logo_url}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain p-4"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Upload Logo Image</p>
                    </div>
                  )}
                </div>

                {branding.logo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateField("logo_url", null)}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Logo Image
                  </Button>
                )}

                {/* Show/Hide Text Logo Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Show Text Logo</Label>
                    <p className="text-xs text-muted-foreground">
                      {branding.logo_url 
                        ? "Show text alongside image logo" 
                        : "Text will be used as logo"}
                    </p>
                  </div>
                  <Switch
                    checked={branding.show_logo_text}
                    onCheckedChange={(checked) => updateField("show_logo_text", checked)}
                  />
                </div>

                {branding.show_logo_text && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Logo Text (Primary)</Label>
                      <Input
                        value={branding.logo_text}
                        onChange={(e) => updateField("logo_text", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Logo Text (Secondary)</Label>
                      <Input
                        value={branding.logo_text_secondary}
                        onChange={(e) => updateField("logo_text_secondary", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                )}

                {/* Logo Preview */}
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <div className="flex items-center gap-3">
                    {branding.logo_url && (
                      <img src={branding.logo_url} alt="Logo" className="h-8 w-auto" />
                    )}
                    {branding.show_logo_text && (
                      <h2 className="font-display text-2xl">
                        <span className="text-gold">{branding.logo_text}</span>
                        <span className="text-foreground">{branding.logo_text_secondary}</span>
                      </h2>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favicon Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Favicon</CardTitle>
                <CardDescription>Small icon shown in browser tabs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="w-32 h-32 mx-auto rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden"
                  onClick={() => faviconInputRef.current?.click()}
                >
                  {uploading === "favicon" ? (
                    <div className="animate-spin h-6 w-6 border-2 border-gold border-t-transparent rounded-full" />
                  ) : branding.favicon_url ? (
                    <img
                      src={branding.favicon_url}
                      alt="Favicon"
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Image className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Upload</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Recommended: 32x32 or 64x64 pixels, PNG or ICO format
                </p>
                {branding.favicon_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateField("favicon_url", null)}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Favicon
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="header" className="space-y-6 mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Announcement Bar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Announcement Bar</Label>
                <Switch
                  checked={branding.header_announcement_active}
                  onCheckedChange={(checked) => updateField("header_announcement_active", checked)}
                />
              </div>
              <div>
                <Label>Announcement Text</Label>
                <Input
                  value={branding.header_announcement_text}
                  onChange={(e) => updateField("header_announcement_text", e.target.value)}
                  className="mt-1.5"
                  disabled={!branding.header_announcement_active}
                />
              </div>

              {/* Preview */}
              {branding.header_announcement_active && (
                <div className="bg-gold/10 border border-gold/20 py-2 px-4 rounded-lg">
                  <p className="text-center text-sm text-gold">
                    {branding.header_announcement_text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Footer Content */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Footer Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Footer Description</Label>
                  <Textarea
                    value={branding.footer_description}
                    onChange={(e) => updateField("footer_description", e.target.value)}
                    className="mt-1.5"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Copyright Text</Label>
                  <Input
                    value={branding.footer_copyright}
                    onChange={(e) => updateField("footer_copyright", e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                {/* Footer Logo Size */}
                <div>
                  <Label>Footer Logo Size</Label>
                  <Select
                    value={branding.footer_logo_size}
                    onValueChange={(v) => updateField("footer_logo_size", v)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (24px)</SelectItem>
                      <SelectItem value="medium">Medium (32px)</SelectItem>
                      <SelectItem value="large">Large (48px)</SelectItem>
                      <SelectItem value="xlarge">Extra Large (64px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Payment Methods (We Accept)</CardTitle>
                <CardDescription>Manage payment badges shown in footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {branding.payment_methods.map((method, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 py-1.5 px-3">
                      {method}
                      <button
                        onClick={() => removePaymentMethod(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    placeholder="Add payment method..."
                    onKeyDown={(e) => e.key === "Enter" && addPaymentMethod()}
                  />
                  <Button variant="outline" onClick={addPaymentMethod}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Banner */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Footer Banner</CardTitle>
              <CardDescription>Optional promotional banner above payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="aspect-[4/1] rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center cursor-pointer hover:border-gold transition-colors overflow-hidden"
                  onClick={() => footerBannerInputRef.current?.click()}
                >
                  {uploading === "footer_banner" ? (
                    <div className="animate-spin h-6 w-6 border-2 border-gold border-t-transparent rounded-full" />
                  ) : branding.footer_banner_url ? (
                    <img
                      src={branding.footer_banner_url}
                      alt="Footer Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Upload Banner</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Banner Link (Optional)</Label>
                    <Input
                      value={branding.footer_banner_link || ""}
                      onChange={(e) => updateField("footer_banner_link", e.target.value)}
                      placeholder="/sale or https://..."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Banner Height: {branding.footer_banner_height}px</Label>
                    <Slider
                      value={[branding.footer_banner_height]}
                      onValueChange={([v]) => updateField("footer_banner_height", v)}
                      min={40}
                      max={200}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                  {branding.footer_banner_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateField("footer_banner_url", null)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Banner
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <AdminSocialLinks />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6 mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Account Creation Discount</CardTitle>
              <CardDescription>
                Offer discount to guest users who create an account during checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Enable Signup Discount</Label>
                  <p className="text-xs text-muted-foreground">
                    Guest users get discount when they create an account
                  </p>
                </div>
                <Switch
                  checked={branding.signup_discount_enabled}
                  onCheckedChange={(checked) => updateField("signup_discount_enabled", checked)}
                />
              </div>

              {branding.signup_discount_enabled && (
                <div>
                  <Label>Discount Percentage: {branding.signup_discount_percent}%</Label>
                  <Slider
                    value={[branding.signup_discount_percent]}
                    onValueChange={([v]) => updateField("signup_discount_percent", v)}
                    min={1}
                    max={25}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Users who create account during checkout will receive {branding.signup_discount_percent}% off their order
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSiteBranding;
