import { useState, useEffect } from "react";
import { Save, Palette, Type, Layout, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThemeColors {
  primary: string;
  primaryLight: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  border: string;
  accent: string;
  // Extended hover/gradient tokens
  buttonHover: string;
  buttonActive: string;
  gradientStart: string;
  gradientEnd: string;
  shadowColor: string;
}

interface ThemeFonts {
  display: string;
  body: string;
  bengali: string;
}

interface ThemeLayout {
  containerWidth: string;
  borderRadius: string;
  headerHeight: string;
}

const fontOptions = [
  { value: "Playfair Display", label: "Playfair Display (Elegant)" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond (Classic)" },
  { value: "Libre Baskerville", label: "Libre Baskerville (Serif)" },
  { value: "Montserrat", label: "Montserrat (Modern)" },
  { value: "Poppins", label: "Poppins (Clean)" },
  { value: "Merriweather", label: "Merriweather (Traditional)" },
  { value: "Lora", label: "Lora (Elegant Serif)" },
  { value: "Oswald", label: "Oswald (Bold Impact)" },
  { value: "Raleway", label: "Raleway (Thin & Modern)" },
  { value: "Crimson Text", label: "Crimson Text (Book Style)" },
];

const bodyFontOptions = [
  { value: "Lato", label: "Lato (Readable)" },
  { value: "Open Sans", label: "Open Sans (Professional)" },
  { value: "Roboto", label: "Roboto (Modern)" },
  { value: "Source Sans 3", label: "Source Sans 3 (Clean)" },
  { value: "Nunito", label: "Nunito (Friendly)" },
  { value: "Inter", label: "Inter (UI Focused)" },
  { value: "Work Sans", label: "Work Sans (Geometric)" },
  { value: "Mulish", label: "Mulish (Minimal)" },
  { value: "DM Sans", label: "DM Sans (Geometric)" },
  { value: "Outfit", label: "Outfit (Modern Geometric)" },
];

const bengaliFontOptions = [
  { value: "Hind Siliguri", label: "Hind Siliguri (Modern)" },
  { value: "Noto Sans Bengali", label: "Noto Sans Bengali (Clean)" },
  { value: "Noto Serif Bengali", label: "Noto Serif Bengali (Traditional)" },
  { value: "Baloo Da 2", label: "Baloo Da 2 (Friendly)" },
  { value: "Anek Bangla", label: "Anek Bangla (Versatile)" },
  { value: "Galada", label: "Galada (Handwritten)" },
  { value: "Atma", label: "Atma (Playful)" },
  { value: "Mina", label: "Mina (Elegant)" },
];

const AdminThemeSettings = () => {
  const [colors, setColors] = useState<ThemeColors>({
    primary: "#d4af37",
    primaryLight: "#e5c158",
    background: "#0a0a0a",
    foreground: "#f5f0e8",
    card: "#1a1a1a",
    muted: "#262626",
    border: "#333333",
    accent: "#c4a035",
    buttonHover: "#e5c158",
    buttonActive: "#b89830",
    gradientStart: "#e5c158",
    gradientEnd: "#8b7020",
    shadowColor: "rgba(212, 175, 55, 0.3)",
  });

  const [fonts, setFonts] = useState<ThemeFonts>({
    display: "Playfair Display",
    body: "Lato",
    bengali: "Hind Siliguri",
  });

  const [layout, setLayout] = useState<ThemeLayout>({
    containerWidth: "1280px",
    borderRadius: "8px",
    headerHeight: "80px",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*");

      if (error) throw error;

      data?.forEach((setting: any) => {
        if (setting.setting_key === "colors") {
          setColors(setting.setting_value);
        } else if (setting.setting_key === "fonts") {
          setFonts(setting.setting_value);
        } else if (setting.setting_key === "layout") {
          setLayout(setting.setting_value);
        }
      });
    } catch (error) {
      console.error("Error fetching theme settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save colors - cast to any to bypass strict typing
      await supabase
        .from("theme_settings")
        .update({ setting_value: colors } as any)
        .eq("setting_key", "colors");

      // Save fonts
      await supabase
        .from("theme_settings")
        .update({ setting_value: fonts } as any)
        .eq("setting_key", "fonts");

      // Save layout
      await supabase
        .from("theme_settings")
        .update({ setting_value: layout } as any)
        .eq("setting_key", "layout");

      toast.success("Theme settings saved! Changes will apply automatically.");
    } catch (error) {
      console.error("Error saving theme settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setColors({
      primary: "#d4af37",
      primaryLight: "#e5c158",
      background: "#0a0a0a",
      foreground: "#f5f0e8",
      card: "#1a1a1a",
      muted: "#262626",
      border: "#333333",
      accent: "#c4a035",
      buttonHover: "#e5c158",
      buttonActive: "#b89830",
      gradientStart: "#e5c158",
      gradientEnd: "#8b7020",
      shadowColor: "rgba(212, 175, 55, 0.3)",
    });
    setFonts({
      display: "Playfair Display",
      body: "Lato",
      bengali: "Hind Siliguri",
    });
    setLayout({
      containerWidth: "1280px",
      borderRadius: "8px",
      headerHeight: "80px",
    });
    toast.info("Reset to defaults - click Save to apply");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Palette className="h-5 w-5 text-gold" />
            Theme Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize colors, fonts, and layout
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="gold" onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="fonts" className="gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs mb-2 block">Primary (Gold)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.primary}
                      onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.primary}
                      onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Primary Light</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.primaryLight}
                      onChange={(e) => setColors({ ...colors, primaryLight: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.primaryLight}
                      onChange={(e) => setColors({ ...colors, primaryLight: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.background}
                      onChange={(e) => setColors({ ...colors, background: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.background}
                      onChange={(e) => setColors({ ...colors, background: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Foreground</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.foreground}
                      onChange={(e) => setColors({ ...colors, foreground: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.foreground}
                      onChange={(e) => setColors({ ...colors, foreground: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Card</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.card}
                      onChange={(e) => setColors({ ...colors, card: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.card}
                      onChange={(e) => setColors({ ...colors, card: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Muted</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.muted}
                      onChange={(e) => setColors({ ...colors, muted: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.muted}
                      onChange={(e) => setColors({ ...colors, muted: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Border</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.border}
                      onChange={(e) => setColors({ ...colors, border: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.border}
                      onChange={(e) => setColors({ ...colors, border: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Accent</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.accent}
                      onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.accent}
                      onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Extended Colors - Hover, Gradient, Shadow */}
              <div className="border-t border-border pt-6">
                <h4 className="font-medium text-foreground mb-4">Hover & Gradient Settings</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-xs mb-2 block">Button Hover</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={colors.buttonHover}
                        onChange={(e) => setColors({ ...colors, buttonHover: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={colors.buttonHover}
                        onChange={(e) => setColors({ ...colors, buttonHover: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-2 block">Button Active</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={colors.buttonActive}
                        onChange={(e) => setColors({ ...colors, buttonActive: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={colors.buttonActive}
                        onChange={(e) => setColors({ ...colors, buttonActive: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-2 block">Gradient Start</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={colors.gradientStart}
                        onChange={(e) => setColors({ ...colors, gradientStart: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={colors.gradientStart}
                        onChange={(e) => setColors({ ...colors, gradientStart: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-2 block">Gradient End</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={colors.gradientEnd}
                        onChange={(e) => setColors({ ...colors, gradientEnd: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={colors.gradientEnd}
                        onChange={(e) => setColors({ ...colors, gradientEnd: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-2 block">Shadow Color</Label>
                    <Input
                      value={colors.shadowColor}
                      onChange={(e) => setColors({ ...colors, shadowColor: e.target.value })}
                      placeholder="rgba(212, 175, 55, 0.3)"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-6 rounded-xl border" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                <h3 style={{ color: colors.foreground }} className="text-lg font-semibold mb-4">Color Preview</h3>
                <div className="flex gap-4 flex-wrap">
                  <div 
                    className="px-4 py-2 rounded cursor-pointer transition-colors" 
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.gradientStart} 0%, ${colors.primary} 50%, ${colors.gradientEnd} 100%)`, 
                      color: colors.background,
                      boxShadow: `0 4px 20px ${colors.shadowColor}`
                    }}
                  >
                    Gold Button
                  </div>
                  <div 
                    className="px-4 py-2 rounded border cursor-pointer" 
                    style={{ backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }}
                  >
                    Card Element
                  </div>
                  <div 
                    className="px-4 py-2 rounded" 
                    style={{ backgroundColor: colors.muted, color: colors.foreground }}
                  >
                    Muted Background
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fonts Tab */}
        <TabsContent value="fonts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="mb-2 block">Display Font (Headings)</Label>
                  <Select value={fonts.display} onValueChange={(v) => setFonts({ ...fonts, display: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: fonts.display }}>
                    Preview: Artistry Woven
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">Body Font</Label>
                  <Select value={fonts.body} onValueChange={(v) => setFonts({ ...fonts, body: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyFontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: fonts.body }}>
                    Preview: This is body text for descriptions and content.
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">Bengali Font</Label>
                  <Select value={fonts.bengali} onValueChange={(v) => setFonts({ ...fonts, bengali: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bengaliFontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: fonts.bengali }}>
                    প্রিভিউ: বাংলা টেক্সট
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="mb-2 block">Container Width</Label>
                  <Select value={layout.containerWidth} onValueChange={(v) => setLayout({ ...layout, containerWidth: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024px">1024px (Compact)</SelectItem>
                      <SelectItem value="1280px">1280px (Default)</SelectItem>
                      <SelectItem value="1440px">1440px (Wide)</SelectItem>
                      <SelectItem value="1600px">1600px (Extra Wide)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Border Radius</Label>
                  <Select value={layout.borderRadius} onValueChange={(v) => setLayout({ ...layout, borderRadius: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">None (Sharp)</SelectItem>
                      <SelectItem value="4px">Small (4px)</SelectItem>
                      <SelectItem value="8px">Medium (8px)</SelectItem>
                      <SelectItem value="12px">Large (12px)</SelectItem>
                      <SelectItem value="16px">Extra Large (16px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Header Height</Label>
                  <Select value={layout.headerHeight} onValueChange={(v) => setLayout({ ...layout, headerHeight: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="64px">Compact (64px)</SelectItem>
                      <SelectItem value="80px">Default (80px)</SelectItem>
                      <SelectItem value="96px">Tall (96px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminThemeSettings;
