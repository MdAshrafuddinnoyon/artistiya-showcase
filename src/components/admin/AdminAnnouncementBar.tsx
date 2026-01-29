import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Bell, Eye, EyeOff, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Announcement {
  id: string;
  message: string;
  message_bn: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string;
  text_color: string;
  is_active: boolean;
  show_on_desktop: boolean;
  show_on_mobile: boolean;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
}

const AdminAnnouncementBar = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("announcement_bar_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcement_bar" }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcement_bar")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async () => {
    try {
      const { error } = await supabase.from("announcement_bar").insert({
        message: "🎉 New announcement! Edit this message.",
        message_bn: "🎉 নতুন ঘোষণা!",
        background_color: "#D4AF37",
        text_color: "#1A1A1A",
        display_order: announcements.length,
      });

      if (error) throw error;
      toast.success("Announcement added!");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error adding announcement:", error);
      toast.error("Failed to add announcement");
    }
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      const { error } = await supabase.from("announcement_bar").update(updates).eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating announcement:", error);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const { error } = await supabase.from("announcement_bar").delete().eq("id", id);
      if (error) throw error;
      toast.success("Announcement deleted");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const ann of announcements) {
        await updateAnnouncement(ann.id, ann);
      }
      toast.success("All announcements saved!");
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (id: string, field: keyof Announcement, value: any) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground">Announcement Bar</h2>
          <p className="text-sm text-muted-foreground">
            ডেস্কটপ এবং মোবাইলে নোটিফিকেশন/অফার দেখান
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addAnnouncement} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
          <Button variant="gold" onClick={saveAll} disabled={saving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((ann, index) => (
          <Card key={ann.id} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-display">
                  Announcement {index + 1}
                </CardTitle>
                {ann.is_active ? (
                  <Eye className="h-4 w-4 text-green-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={ann.is_active}
                  onCheckedChange={(checked) => updateField(ann.id, "is_active", checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteAnnouncement(ann.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview */}
              <div
                className="p-3 rounded-lg text-center text-sm font-medium"
                style={{
                  backgroundColor: ann.background_color,
                  color: ann.text_color,
                }}
              >
                {ann.message}
                {ann.link_text && (
                  <span className="underline ml-2">{ann.link_text}</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Message (English)</Label>
                  <Input
                    value={ann.message}
                    onChange={(e) => updateField(ann.id, "message", e.target.value)}
                    className="mt-1.5"
                    placeholder="🎉 Special offer! 20% off..."
                  />
                </div>
                <div>
                  <Label>Message (Bengali)</Label>
                  <Input
                    value={ann.message_bn || ""}
                    onChange={(e) => updateField(ann.id, "message_bn", e.target.value)}
                    className="mt-1.5"
                    placeholder="🎉 বিশেষ অফার! ২০% ছাড়..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Link URL (Optional)</Label>
                  <Input
                    value={ann.link_url || ""}
                    onChange={(e) => updateField(ann.id, "link_url", e.target.value)}
                    className="mt-1.5"
                    placeholder="/shop/sale"
                  />
                </div>
                <div>
                  <Label>Link Text</Label>
                  <Input
                    value={ann.link_text || ""}
                    onChange={(e) => updateField(ann.id, "link_text", e.target.value)}
                    className="mt-1.5"
                    placeholder="Shop Now"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      type="color"
                      value={ann.background_color}
                      onChange={(e) => updateField(ann.id, "background_color", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={ann.background_color}
                      onChange={(e) => updateField(ann.id, "background_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Text Color</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      type="color"
                      value={ann.text_color}
                      onChange={(e) => updateField(ann.id, "text_color", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={ann.text_color}
                      onChange={(e) => updateField(ann.id, "text_color", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={ann.start_date?.split("T")[0] || ""}
                    onChange={(e) => updateField(ann.id, "start_date", e.target.value || null)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={ann.end_date?.split("T")[0] || ""}
                    onChange={(e) => updateField(ann.id, "end_date", e.target.value || null)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Desktop</Label>
                  <Switch
                    checked={ann.show_on_desktop}
                    onCheckedChange={(checked) => updateField(ann.id, "show_on_desktop", checked)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Mobile</Label>
                  <Switch
                    checked={ann.show_on_mobile}
                    onCheckedChange={(checked) => updateField(ann.id, "show_on_mobile", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {announcements.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No announcements yet</p>
            <Button variant="gold" onClick={addAnnouncement}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Announcement
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncementBar;