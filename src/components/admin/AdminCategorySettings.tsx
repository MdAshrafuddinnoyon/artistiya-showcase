import { useState, useEffect } from "react";
import { Save, LayoutGrid, Rows, Play, Pause, Monitor, Tablet, Smartphone, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface CategorySettings {
  id: string;
  section_title: string;
  section_subtitle: string;
  items_to_show: number;
  card_shape: string;
  enable_slider: boolean;
  auto_slide: boolean;
  slide_interval: number;
  show_description: boolean;
  show_subtitle: boolean;
  columns_desktop: number;
  columns_tablet: number;
  columns_mobile: number;
}

const AdminCategorySettings = () => {
  const [settings, setSettings] = useState<CategorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("category_display_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setSettings(data);
      } else {
        const { data: newData, error: insertError } = await supabase
          .from("category_display_settings")
          .insert({})
          .select()
          .single();
        
        if (insertError) throw insertError;
        setSettings(newData);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("category_display_settings")
        .update(settings)
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CategorySettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const getPreviewColumns = () => {
    if (!settings) return 4;
    switch (previewDevice) {
      case "mobile": return settings.columns_mobile;
      case "tablet": return settings.columns_tablet;
      default: return settings.columns_desktop;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground">Category Section Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize how categories appear on your homepage
          </p>
        </div>
        <Button variant="gold" onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="content" className="text-xs sm:text-sm">Content</TabsTrigger>
          <TabsTrigger value="layout" className="text-xs sm:text-sm">Layout</TabsTrigger>
          <TabsTrigger value="slider" className="text-xs sm:text-sm">Slider</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs sm:text-sm">Preview</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Eye className="h-5 w-5 text-gold" />
                Section Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={settings.section_title || ""}
                  onChange={(e) => updateField("section_title", e.target.value)}
                  placeholder="Shop by Category"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Section Subtitle</Label>
                <Input
                  value={settings.section_subtitle || ""}
                  onChange={(e) => updateField("section_subtitle", e.target.value)}
                  placeholder="Explore Our World"
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-foreground">Show Subtitle</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Display subtitle above the title</p>
                </div>
                <Switch
                  checked={settings.show_subtitle}
                  onCheckedChange={(checked) => updateField("show_subtitle", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-foreground">Show Description</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Display category description on hover</p>
                </div>
                <Switch
                  checked={settings.show_description}
                  onCheckedChange={(checked) => updateField("show_description", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-gold" />
                Display Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="flex items-center justify-between">
                  <span>Categories to Show</span>
                  <span className="text-gold font-semibold">{settings.items_to_show}</span>
                </Label>
                <Slider
                  value={[settings.items_to_show]}
                  onValueChange={([value]) => updateField("items_to_show", value)}
                  min={1}
                  max={12}
                  step={1}
                  className="mt-3"
                />
              </div>

              <div>
                <Label>Card Shape</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { value: "square", label: "Square", icon: "□" },
                    { value: "rounded", label: "Rounded", icon: "▢" },
                    { value: "circle", label: "Circle", icon: "○" },
                  ].map((shape) => (
                    <button
                      key={shape.value}
                      onClick={() => updateField("card_shape", shape.value)}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        settings.card_shape === shape.value
                          ? "border-gold bg-gold/10"
                          : "border-border hover:border-gold/50"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{shape.icon}</span>
                      <span className="text-xs text-foreground">{shape.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsive Columns */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Rows className="h-5 w-5 text-gold" />
                Responsive Grid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Monitor className="h-4 w-4 text-blue-500" />
                    <Label className="text-foreground">Desktop</Label>
                  </div>
                  <Select
                    value={settings.columns_desktop.toString()}
                    onValueChange={(value) => updateField("columns_desktop", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} Columns</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Tablet className="h-4 w-4 text-purple-500" />
                    <Label className="text-foreground">Tablet</Label>
                  </div>
                  <Select
                    value={settings.columns_tablet.toString()}
                    onValueChange={(value) => updateField("columns_tablet", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} Columns</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    <Label className="text-foreground">Mobile</Label>
                  </div>
                  <Select
                    value={settings.columns_mobile.toString()}
                    onValueChange={(value) => updateField("columns_mobile", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} Columns</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slider Tab */}
        <TabsContent value="slider" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Play className="h-5 w-5 text-gold" />
                Slider Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-foreground">Enable Slider</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Swipeable carousel instead of grid
                  </p>
                </div>
                <Switch
                  checked={settings.enable_slider}
                  onCheckedChange={(checked) => updateField("enable_slider", checked)}
                />
              </div>

              <motion.div
                initial={false}
                animate={{ 
                  height: settings.enable_slider ? "auto" : 0,
                  opacity: settings.enable_slider ? 1 : 0
                }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-foreground flex items-center gap-2">
                        {settings.auto_slide ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        Auto Slide
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Automatically transition between slides
                      </p>
                    </div>
                    <Switch
                      checked={settings.auto_slide}
                      onCheckedChange={(checked) => updateField("auto_slide", checked)}
                    />
                  </div>

                  <motion.div
                    initial={false}
                    animate={{
                      height: settings.auto_slide ? "auto" : 0,
                      opacity: settings.auto_slide ? 1 : 0
                    }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="flex items-center justify-between">
                        <span>Slide Interval</span>
                        <span className="text-gold font-semibold">{(settings.slide_interval / 1000).toFixed(1)}s</span>
                      </Label>
                      <Slider
                        value={[settings.slide_interval]}
                        onValueChange={([value]) => updateField("slide_interval", value)}
                        min={2000}
                        max={10000}
                        step={500}
                        className="mt-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>2s (Fast)</span>
                        <span>10s (Slow)</span>
                      </div>
                    </div>
                  </motion.div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-400">
                      💡 <strong>Mobile Tip:</strong> Users can swipe left/right to navigate between slides on touch devices.
                    </p>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-lg font-display">Live Preview</CardTitle>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                  {[
                    { value: "desktop", icon: Monitor, label: "Desktop" },
                    { value: "tablet", icon: Tablet, label: "Tablet" },
                    { value: "mobile", icon: Smartphone, label: "Mobile" },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setPreviewDevice(value as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                        previewDevice === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className={`p-6 bg-background rounded-lg border border-border overflow-hidden ${
                  previewDevice === "mobile" ? "max-w-[375px] mx-auto" :
                  previewDevice === "tablet" ? "max-w-[768px] mx-auto" : ""
                }`}
              >
                {/* Section Header Preview */}
                <div className="text-center mb-6">
                  {settings.show_subtitle && (
                    <span className="text-gold text-xs tracking-[0.2em] uppercase">
                      {settings.section_subtitle || "Subtitle"}
                    </span>
                  )}
                  <h2 className="font-display text-xl text-foreground mt-1">
                    {settings.section_title || "Section Title"}
                  </h2>
                </div>
                
                {/* Grid/Slider Preview */}
                <div 
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${getPreviewColumns()}, 1fr)`
                  }}
                >
                  {Array.from({ length: Math.min(settings.items_to_show, 6) }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`aspect-[4/5] bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-end p-3 ${
                        settings.card_shape === "circle" ? "rounded-full" :
                        settings.card_shape === "rounded" ? "rounded-2xl" : "rounded-lg"
                      }`}
                    >
                      <span className="text-gold text-[8px] uppercase tracking-wider">Handcrafted</span>
                      <span className="text-foreground text-xs font-display">Category {i + 1}</span>
                      <div className="w-4 h-0.5 bg-gold mt-1.5" />
                    </motion.div>
                  ))}
                </div>

                {/* Slider Indicators Preview */}
                {settings.enable_slider && (
                  <div className="flex justify-center gap-2 mt-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all ${
                          i === 0 ? "w-6 h-2 bg-gold" : "w-2 h-2 bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCategorySettings;
