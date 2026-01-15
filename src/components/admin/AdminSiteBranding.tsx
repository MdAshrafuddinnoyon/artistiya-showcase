import { useState, useEffect, useRef } from "react";
import { Save, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SiteBranding {
  id: string;
  logo_url: string | null;
  logo_text: string;
  logo_text_secondary: string;
  favicon_url: string | null;
  header_announcement_text: string;
  header_announcement_active: boolean;
  footer_description: string;
  footer_copyright: string;
  social_instagram: string;
  social_facebook: string;
  social_email: string;
}

const AdminSiteBranding = () => {
  const [branding, setBranding] = useState<SiteBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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
        setBranding(data);
      } else {
        const { data: newData, error: insertError } = await supabase
          .from("site_branding")
          .insert({})
          .select()
          .single();
        
        if (insertError) throw insertError;
        setBranding(newData);
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
        .update(branding)
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

  const handleImageUpload = async (type: "logo" | "favicon", file: File) => {
    setUploading(type);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const fieldName = type === "logo" ? "logo_url" : "favicon_url";
      setBranding(prev => prev ? { ...prev, [fieldName]: publicUrl } : null);
      
      toast.success(`${type === "logo" ? "Logo" : "Favicon"} uploaded successfully`);
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

  if (loading) {
    return <div className="h-96 bg-muted rounded-xl animate-pulse" />;
  }

  if (!branding) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-foreground">Site Branding</h2>
        <Button variant="gold" onClick={saveBranding} disabled={saving}>
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

      <Tabs defaultValue="logo">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="logo">Logo & Favicon</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
        </TabsList>

        <TabsContent value="logo" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Logo</CardTitle>
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

                <div className="text-center text-muted-foreground text-sm">- OR use text logo -</div>

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

                {/* Logo Preview */}
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <h2 className="font-display text-2xl">
                    <span className="text-gold">{branding.logo_text}</span>
                    <span className="text-foreground">{branding.logo_text_secondary}</span>
                  </h2>
                </div>
              </CardContent>
            </Card>

            {/* Favicon Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-display">Favicon</CardTitle>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6 mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Instagram URL</Label>
                <Input
                  value={branding.social_instagram}
                  onChange={(e) => updateField("social_instagram", e.target.value)}
                  className="mt-1.5"
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
              <div>
                <Label>Facebook URL</Label>
                <Input
                  value={branding.social_facebook}
                  onChange={(e) => updateField("social_facebook", e.target.value)}
                  className="mt-1.5"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  value={branding.social_email}
                  onChange={(e) => updateField("social_email", e.target.value)}
                  className="mt-1.5"
                  placeholder="hello@example.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSiteBranding;
