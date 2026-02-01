import { useState, useEffect } from "react";
import { Plus, Trash2, Save, GripVertical, Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle, Pin, Music, Globe, Mail, Phone, MapPin, Send, Video, Camera, Rss, Heart, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
}

const platformOptions = [
  { value: "facebook", label: "Facebook", icon: Facebook, color: "bg-blue-600" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" },
  { value: "twitter", label: "Twitter/X", icon: Twitter, color: "bg-black" },
  { value: "youtube", label: "YouTube", icon: Youtube, color: "bg-red-600" },
  { value: "tiktok", label: "TikTok", icon: Music, color: "bg-black" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-500" },
  { value: "pinterest", label: "Pinterest", icon: Pin, color: "bg-red-500" },
  { value: "telegram", label: "Telegram", icon: Send, color: "bg-blue-400" },
  { value: "snapchat", label: "Snapchat", icon: Camera, color: "bg-yellow-400" },
  { value: "email", label: "Email", icon: Mail, color: "bg-gray-600" },
  { value: "phone", label: "Phone", icon: Phone, color: "bg-green-600" },
  { value: "website", label: "Website", icon: Globe, color: "bg-gray-500" },
  { value: "other", label: "Other", icon: ExternalLink, color: "bg-gray-400" },
];

const getIconForPlatform = (platform: string) => {
  const option = platformOptions.find(p => p.value === platform);
  return option?.icon || Globe;
};

const getColorForPlatform = (platform: string) => {
  const option = platformOptions.find(p => p.value === platform);
  return option?.color || "bg-gray-500";
};

const AdminSocialLinks = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error("Error fetching social links:", error);
    } finally {
      setLoading(false);
    }
  };

  const addLink = async () => {
    try {
      const { error } = await supabase.from("social_links").insert({
        platform: "facebook",
        url: "https://facebook.com/",
        icon_name: "facebook",
        display_order: links.length,
      });

      if (error) throw error;
      toast.success("Social link added");
      fetchLinks();
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error("Failed to add link");
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm("Delete this social link?")) return;

    try {
      const { error } = await supabase.from("social_links").delete().eq("id", id);
      if (error) throw error;
      toast.success("Link deleted");
      fetchLinks();
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error("Failed to delete link");
    }
  };

  const updateField = (id: string, field: keyof SocialLink, value: any) => {
    setLinks(prev => prev.map(link => {
      if (link.id === id) {
        // Auto-update icon_name when platform changes
        if (field === "platform") {
          return { ...link, [field]: value, icon_name: value };
        }
        return { ...link, [field]: value };
      }
      return link;
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const link of links) {
        const { error } = await supabase
          .from("social_links")
          .update({
            platform: link.platform,
            url: link.url,
            icon_name: link.icon_name,
            display_order: link.display_order,
            is_active: link.is_active,
          })
          .eq("id", link.id);

        if (error) throw error;
      }
      toast.success("All social links saved");
    } catch (error) {
      console.error("Error saving links:", error);
      toast.error("Failed to save links");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-gold" />
            Social Media Links
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage social media links displayed in header and footer
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={addLink} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
          <Button variant="gold" onClick={saveAll} disabled={saving} className="flex-1 sm:flex-none">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {links.map((link, index) => {
          const IconComponent = getIconForPlatform(link.platform);
          const colorClass = getColorForPlatform(link.platform);

          return (
            <Card key={link.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Icon Preview */}
                  <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center text-white flex-shrink-0`}>
                    <IconComponent className="h-6 w-6" />
                  </div>

                  {/* Platform Select */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <Label className="text-xs">Platform</Label>
                    <Select
                      value={link.platform}
                      onValueChange={(v) => updateField(link.id, "platform", v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platformOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* URL Input */}
                  <div className="flex-[2] min-w-0 w-full sm:w-auto">
                    <Label className="text-xs">URL</Label>
                    <Input
                      value={link.url}
                      onChange={(e) => updateField(link.id, "url", e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(checked) => updateField(link.id, "is_active", checked)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {link.is_active ? "Active" : "Hidden"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-9 w-9"
                      onClick={() => deleteLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {links.length === 0 && (
          <Card className="p-8 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No social links added yet</p>
            <Button variant="gold" onClick={addLink}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Link
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminSocialLinks;