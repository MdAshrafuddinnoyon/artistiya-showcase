import { useState, useEffect } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        // Create default settings if not exists
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

  if (loading) {
    return <div className="h-96 bg-muted rounded-xl animate-pulse" />;
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-foreground">Category Section Settings</h2>
        <Button variant="gold" onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Text */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-display">Section Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={settings.section_title}
                onChange={(e) => updateField("section_title", e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Section Subtitle</Label>
              <Input
                value={settings.section_subtitle}
                onChange={(e) => updateField("section_subtitle", e.target.value)}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-display">Display Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Items to Show</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[settings.items_to_show]}
                  onValueChange={([value]) => updateField("items_to_show", value)}
                  min={1}
                  max={12}
                  step={1}
                  className="flex-1"
                />
                <span className="text-foreground font-medium w-8 text-center">
                  {settings.items_to_show}
                </span>
              </div>
            </div>

            <div>
              <Label>Card Shape</Label>
              <Select
                value={settings.card_shape}
                onValueChange={(value) => updateField("card_shape", value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Slider Options */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-display">Slider Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Slider</Label>
              <Switch
                checked={settings.enable_slider}
                onCheckedChange={(checked) => updateField("enable_slider", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto Slide</Label>
              <Switch
                checked={settings.auto_slide}
                onCheckedChange={(checked) => updateField("auto_slide", checked)}
                disabled={!settings.enable_slider}
              />
            </div>

            <div>
              <Label>Slide Interval (ms)</Label>
              <Input
                type="number"
                value={settings.slide_interval}
                onChange={(e) => updateField("slide_interval", parseInt(e.target.value) || 5000)}
                className="mt-1.5"
                disabled={!settings.enable_slider || !settings.auto_slide}
                min={1000}
                max={10000}
                step={500}
              />
            </div>
          </CardContent>
        </Card>

        {/* Grid Columns */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-display">Grid Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Desktop Columns</Label>
              <Select
                value={settings.columns_desktop.toString()}
                onValueChange={(value) => updateField("columns_desktop", parseInt(value))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} Columns</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tablet Columns</Label>
              <Select
                value={settings.columns_tablet.toString()}
                onValueChange={(value) => updateField("columns_tablet", parseInt(value))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} Columns</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mobile Columns</Label>
              <Select
                value={settings.columns_mobile.toString()}
                onValueChange={(value) => updateField("columns_mobile", parseInt(value))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} Columns</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Visibility */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display">Content Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm text-foreground">Show Subtitle</span>
                <Switch
                  checked={settings.show_subtitle}
                  onCheckedChange={(checked) => updateField("show_subtitle", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm text-foreground">Show Description</span>
                <Switch
                  checked={settings.show_description}
                  onCheckedChange={(checked) => updateField("show_description", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-display">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-background rounded-lg">
            <div className="text-center mb-8">
              <span className="text-gold text-sm tracking-[0.3em] uppercase">
                {settings.section_subtitle}
              </span>
              <h2 className="font-display text-2xl text-foreground mt-2">
                {settings.section_title}
              </h2>
            </div>
            
            <div 
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${Math.min(settings.items_to_show, settings.columns_desktop)}, 1fr)`
              }}
            >
              {Array.from({ length: Math.min(settings.items_to_show, 4) }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square bg-muted flex items-center justify-center ${
                    settings.card_shape === "circle" ? "rounded-full" :
                    settings.card_shape === "rounded" ? "rounded-2xl" : "rounded-lg"
                  }`}
                >
                  <span className="text-muted-foreground text-sm">Category {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCategorySettings;
