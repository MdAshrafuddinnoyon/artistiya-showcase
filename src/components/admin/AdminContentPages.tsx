import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContentPage {
  id: string;
  page_key: string;
  title: string;
  title_bn: string | null;
  content: string;
  content_bn: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
}

const pageLabels: Record<string, { label: string; route: string }> = {
  about: { label: "About Us", route: "/about" },
  terms: { label: "Terms & Conditions", route: "/terms" },
  privacy: { label: "Privacy Policy", route: "/privacy" },
  "return-policy": { label: "Return Policy", route: "/return-policy" },
  "shipping-info": { label: "Shipping Info", route: "/shipping" },
};

const AdminContentPages = () => {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from("content_pages")
        .select("*")
        .order("page_key");

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Failed to load content pages");
    } finally {
      setLoading(false);
    }
  };

  const getPage = (key: string) => pages.find((p) => p.page_key === key);

  const updatePageField = (key: string, field: keyof ContentPage, value: any) => {
    setPages((prev) =>
      prev.map((p) => (p.page_key === key ? { ...p, [field]: value } : p))
    );
  };

  const savePage = async (pageKey: string) => {
    setSaving(true);
    try {
      const page = getPage(pageKey);
      if (!page) return;

      const { error } = await supabase
        .from("content_pages")
        .update({
          title: page.title,
          title_bn: page.title_bn,
          content: page.content,
          content_bn: page.content_bn,
          meta_title: page.meta_title,
          meta_description: page.meta_description,
          is_active: page.is_active,
        })
        .eq("page_key", pageKey);

      if (error) throw error;
      toast.success("Page saved successfully");
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Content Pages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your website's static pages content
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-muted">
          {Object.entries(pageLabels).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key} className="text-xs md:text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(pageLabels).map(([pageKey, { label, route }]) => {
          const page = getPage(pageKey);
          if (!page) return null;

          return (
            <TabsContent key={pageKey} value={pageKey} className="space-y-6 mt-6">
              {/* Status Bar */}
              <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {page.is_active ? (
                    <Eye className="h-5 w-5 text-green-500" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-foreground font-medium">{label}</span>
                  <a
                    href={route}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:underline flex items-center gap-1 text-sm"
                  >
                    View Page <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Switch
                  checked={page.is_active}
                  onCheckedChange={(checked) => updatePageField(pageKey, "is_active", checked)}
                />
              </div>

              {/* Content Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gold" />
                    Page Content (English)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Page Title</Label>
                    <Input
                      value={page.title}
                      onChange={(e) => updatePageField(pageKey, "title", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Content (HTML supported)</Label>
                    <Textarea
                      value={page.content}
                      onChange={(e) => updatePageField(pageKey, "content", e.target.value)}
                      className="mt-1.5 font-mono text-sm"
                      rows={15}
                      placeholder="Enter HTML content..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bengali Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gold" />
                    Page Content (বাংলা)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Page Title (Bengali)</Label>
                    <Input
                      value={page.title_bn || ""}
                      onChange={(e) => updatePageField(pageKey, "title_bn", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Content (বাংলা - HTML supported)</Label>
                    <Textarea
                      value={page.content_bn || ""}
                      onChange={(e) => updatePageField(pageKey, "content_bn", e.target.value)}
                      className="mt-1.5 font-mono text-sm"
                      rows={15}
                      placeholder="বাংলা কন্টেন্ট লিখুন..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Meta Title</Label>
                    <Input
                      value={page.meta_title || ""}
                      onChange={(e) => updatePageField(pageKey, "meta_title", e.target.value)}
                      className="mt-1.5"
                      placeholder="SEO title for search engines"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 50-60 characters
                    </p>
                  </div>

                  <div>
                    <Label>Meta Description</Label>
                    <Textarea
                      value={page.meta_description || ""}
                      onChange={(e) => updatePageField(pageKey, "meta_description", e.target.value)}
                      className="mt-1.5"
                      rows={3}
                      placeholder="Brief description for search results"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 150-160 characters
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button
                variant="gold"
                size="lg"
                onClick={() => savePage(pageKey)}
                disabled={saving}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : `Save ${label}`}
              </Button>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AdminContentPages;
