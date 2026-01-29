import { useState, useEffect } from "react";
import { Save, ExternalLink, Search, BarChart3, Tag, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Integration {
  id: string;
  integration_key: string;
  settings: Record<string, any>;
  is_active: boolean;
}

const AdminGoogleIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from("site_integrations")
        .select("*")
        .order("integration_key");

      if (error) throw error;
      // Cast settings to Record<string, any>
      const typedData = (data || []).map(item => ({
        ...item,
        settings: (item.settings as Record<string, any>) || {}
      }));
      setIntegrations(typedData);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  const updateIntegration = (key: string, field: string, value: string | boolean) => {
    setIntegrations((prev) =>
      prev.map((int) => {
        if (int.integration_key === key) {
          if (field === "is_active") {
            return { ...int, is_active: value as boolean };
          }
          return {
            ...int,
            settings: { ...int.settings, [field]: value as string },
          };
        }
        return int;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const integration of integrations) {
        const { error } = await supabase
          .from("site_integrations")
          .update({
            settings: integration.settings,
            is_active: integration.is_active,
          })
          .eq("id", integration.id);

        if (error) throw error;
      }
      toast.success("Integrations saved successfully!");
    } catch (error: any) {
      console.error("Error saving integrations:", error);
      toast.error(error.message || "Failed to save integrations");
    } finally {
      setSaving(false);
    }
  };

  const getIntegration = (key: string) => {
    return integrations.find((int) => int.integration_key === key);
  };

  const integrationConfigs = [
    {
      key: "google_analytics",
      title: "Google Analytics 4",
      icon: BarChart3,
      description: "Track website traffic and user behavior",
      fields: [
        { name: "measurement_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" },
        { name: "tracking_id", label: "Tracking ID (Legacy)", placeholder: "UA-XXXXXXXXX-X" },
      ],
      helpLink: "https://analytics.google.com/",
    },
    {
      key: "google_search_console",
      title: "Google Search Console",
      icon: Search,
      description: "Verify ownership and monitor search performance",
      fields: [
        { name: "verification_code", label: "Verification Meta Tag", placeholder: "google-site-verification=..." },
      ],
      helpLink: "https://search.google.com/search-console",
    },
    {
      key: "google_tag_manager",
      title: "Google Tag Manager",
      icon: Code,
      description: "Manage marketing and analytics tags",
      fields: [
        { name: "container_id", label: "Container ID", placeholder: "GTM-XXXXXXX" },
      ],
      helpLink: "https://tagmanager.google.com/",
    },
    {
      key: "facebook_pixel",
      title: "Facebook Pixel",
      icon: Tag,
      description: "Track conversions and build audiences",
      fields: [
        { name: "pixel_id", label: "Pixel ID", placeholder: "XXXXXXXXXXXXXXXXX" },
      ],
      helpLink: "https://business.facebook.com/events_manager",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect Google Analytics, Search Console, and marketing tools
          </p>
        </div>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        {integrationConfigs.map((config) => {
          const integration = getIntegration(config.key);
          if (!integration) return null;

          const Icon = config.icon;

          return (
            <div key={config.key} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-foreground">{config.title}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={config.helpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gold hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Setup Guide
                  </a>
                  <Switch
                    checked={integration.is_active}
                    onCheckedChange={(checked) =>
                      updateIntegration(config.key, "is_active", checked)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.fields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={`${config.key}_${field.name}`}>{field.label}</Label>
                    <Input
                      id={`${config.key}_${field.name}`}
                      value={integration.settings[field.name] || ""}
                      onChange={(e) =>
                        updateIntegration(config.key, field.name, e.target.value)
                      }
                      placeholder={field.placeholder}
                      className="mt-1.5"
                      disabled={!integration.is_active}
                    />
                  </div>
                ))}
              </div>

              {config.key === "google_search_console" && integration.is_active && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Add this meta tag to your site's &lt;head&gt; for verification:
                  </p>
                  <code className="block mt-2 p-2 bg-background rounded text-xs text-foreground overflow-x-auto">
                    {`<meta name="google-site-verification" content="${integration.settings.verification_code || "YOUR_CODE"}" />`}
                  </code>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminGoogleIntegrations;
