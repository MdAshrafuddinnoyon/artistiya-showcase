import { useState, useEffect } from "react";
import { Save, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlogSettings {
  id: string;
  is_blog_active: boolean;
  banner_image_url: string | null;
  banner_link: string | null;
  banner_title: string | null;
  banner_title_bn: string | null;
  show_banner: boolean;
  posts_per_page: number;
}

const AdminBlogSettings = () => {
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("blog_settings")
        .update({
          is_blog_active: settings.is_blog_active,
          banner_image_url: settings.banner_image_url,
          banner_link: settings.banner_link,
          banner_title: settings.banner_title,
          banner_title_bn: settings.banner_title_bn,
          show_banner: settings.show_banner,
          posts_per_page: settings.posts_per_page,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Settings not found. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Blog Settings</h2>
          <p className="text-sm text-muted-foreground">Configure blog section</p>
        </div>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-foreground">General</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Blog Section</Label>
              <p className="text-sm text-muted-foreground">Show/hide blog on site</p>
            </div>
            <Switch
              checked={settings.is_blog_active}
              onCheckedChange={(checked) => setSettings({ ...settings, is_blog_active: checked })}
            />
          </div>

          <div>
            <Label htmlFor="posts_per_page">Posts Per Page</Label>
            <Input
              id="posts_per_page"
              type="number"
              min={1}
              max={50}
              value={settings.posts_per_page}
              onChange={(e) => setSettings({ ...settings, posts_per_page: parseInt(e.target.value) || 10 })}
              className="w-24"
            />
          </div>
        </div>

        {/* Banner Settings */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-foreground">Blog Page Banner</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Banner</Label>
              <p className="text-sm text-muted-foreground">Display ad banner on blog</p>
            </div>
            <Switch
              checked={settings.show_banner}
              onCheckedChange={(checked) => setSettings({ ...settings, show_banner: checked })}
            />
          </div>

          {settings.show_banner && (
            <>
              <div>
                <Label htmlFor="banner_image">Banner Image URL</Label>
                <Input
                  id="banner_image"
                  value={settings.banner_image_url || ""}
                  onChange={(e) => setSettings({ ...settings, banner_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="banner_link">Banner Link</Label>
                <Input
                  id="banner_link"
                  value={settings.banner_link || ""}
                  onChange={(e) => setSettings({ ...settings, banner_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="banner_title">Title (English)</Label>
                  <Input
                    id="banner_title"
                    value={settings.banner_title || ""}
                    onChange={(e) => setSettings({ ...settings, banner_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="banner_title_bn">Title (Bengali)</Label>
                  <Input
                    id="banner_title_bn"
                    value={settings.banner_title_bn || ""}
                    onChange={(e) => setSettings({ ...settings, banner_title_bn: e.target.value })}
                  />
                </div>
              </div>

              {settings.banner_image_url && (
                <div className="mt-4">
                  <Label>Preview</Label>
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    <img 
                      src={settings.banner_image_url} 
                      alt="Banner preview"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogSettings;
