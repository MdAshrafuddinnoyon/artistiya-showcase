import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HomepageContent {
  id: string;
  section_key: string;
  content: any;
  is_active: boolean;
  display_order: number;
}

interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

const AdminHomepageCMS = () => {
  const [content, setContent] = useState<HomepageContent[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  useEffect(() => {
    fetchContent();
    fetchTestimonials();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("homepage_content")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    }
  };

  const updateContent = async (sectionKey: string, newContent: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("homepage_content")
        .update({ content: newContent })
        .eq("section_key", sectionKey);

      if (error) throw error;
      toast.success("Content saved successfully");
      fetchContent();
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = async (sectionKey: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("homepage_content")
        .update({ is_active: isActive })
        .eq("section_key", sectionKey);

      if (error) throw error;
      toast.success(`Section ${isActive ? "enabled" : "disabled"}`);
      fetchContent();
    } catch (error) {
      console.error("Error toggling section:", error);
    }
  };

  const addTestimonial = async () => {
    try {
      const { error } = await supabase.from("testimonials").insert({
        name: "New Customer",
        location: "Location",
        text: "Write your testimonial here...",
        rating: 5,
        display_order: testimonials.length,
      });

      if (error) throw error;
      toast.success("Testimonial added");
      fetchTestimonials();
    } catch (error) {
      console.error("Error adding testimonial:", error);
      toast.error("Failed to add testimonial");
    }
  };

  const updateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating testimonial:", error);
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);

      if (error) throw error;
      toast.success("Testimonial deleted");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  const saveTestimonials = async () => {
    setSaving(true);
    try {
      for (const testimonial of testimonials) {
        await updateTestimonial(testimonial.id, testimonial);
      }
      toast.success("Testimonials saved successfully");
    } catch (error) {
      toast.error("Failed to save testimonials");
    } finally {
      setSaving(false);
    }
  };

  const getSectionContent = (key: string) => {
    const section = content.find((c) => c.section_key === key);
    return section?.content || {};
  };

  const getSectionActive = (key: string) => {
    const section = content.find((c) => c.section_key === key);
    return section?.is_active ?? true;
  };

  const updateSectionField = (key: string, field: string, value: any) => {
    setContent((prev) =>
      prev.map((c) =>
        c.section_key === key
          ? { ...c, content: { ...c.content, [field]: value } }
          : c
      )
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl text-foreground">Homepage CMS</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-muted">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="making">Our Craft</TabsTrigger>
          <TabsTrigger value="testimonials">Reviews</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="space-y-6 mt-6">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              {getSectionActive("hero") ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-foreground font-medium">Hero Section</span>
            </div>
            <Switch
              checked={getSectionActive("hero")}
              onCheckedChange={(checked) => toggleSection("hero", checked)}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={getSectionContent("hero").badge || ""}
                  onChange={(e) => updateSectionField("hero", "badge", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  value={getSectionContent("hero").buttonText || ""}
                  onChange={(e) => updateSectionField("hero", "buttonText", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Title (First Part)</Label>
              <Input
                value={getSectionContent("hero").title || ""}
                onChange={(e) => updateSectionField("hero", "title", e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title Highlight (Gold Text)</Label>
                <Input
                  value={getSectionContent("hero").titleHighlight || ""}
                  onChange={(e) => updateSectionField("hero", "titleHighlight", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Title End</Label>
                <Input
                  value={getSectionContent("hero").titleEnd || ""}
                  onChange={(e) => updateSectionField("hero", "titleEnd", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={getSectionContent("hero").description || ""}
                onChange={(e) => updateSectionField("hero", "description", e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Button Link</Label>
                <Input
                  value={getSectionContent("hero").buttonLink || ""}
                  onChange={(e) => updateSectionField("hero", "buttonLink", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Secondary Button Text</Label>
                <Input
                  value={getSectionContent("hero").secondaryButtonText || ""}
                  onChange={(e) => updateSectionField("hero", "secondaryButtonText", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              variant="gold"
              onClick={() => updateContent("hero", getSectionContent("hero"))}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Hero Section"}
            </Button>
          </div>
        </TabsContent>

        {/* Featured Section */}
        <TabsContent value="featured" className="space-y-6 mt-6">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              {getSectionActive("featured") ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-foreground font-medium">Featured Section</span>
            </div>
            <Switch
              checked={getSectionActive("featured")}
              onCheckedChange={(checked) => toggleSection("featured", checked)}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={getSectionContent("featured").badge || ""}
                  onChange={(e) => updateSectionField("featured", "badge", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Price Text</Label>
                <Input
                  value={getSectionContent("featured").priceText || ""}
                  onChange={(e) => updateSectionField("featured", "priceText", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={getSectionContent("featured").title || ""}
                  onChange={(e) => updateSectionField("featured", "title", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Title Highlight (Gold)</Label>
                <Input
                  value={getSectionContent("featured").titleHighlight || ""}
                  onChange={(e) => updateSectionField("featured", "titleHighlight", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={getSectionContent("featured").description || ""}
                onChange={(e) => updateSectionField("featured", "description", e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={getSectionContent("featured").buttonText || ""}
                  onChange={(e) => updateSectionField("featured", "buttonText", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={getSectionContent("featured").buttonLink || ""}
                  onChange={(e) => updateSectionField("featured", "buttonLink", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              variant="gold"
              onClick={() => updateContent("featured", getSectionContent("featured"))}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Featured Section"}
            </Button>
          </div>
        </TabsContent>

        {/* Making Section */}
        <TabsContent value="making" className="space-y-6 mt-6">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              {getSectionActive("making") ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-foreground font-medium">Our Craft Section</span>
            </div>
            <Switch
              checked={getSectionActive("making")}
              onCheckedChange={(checked) => toggleSection("making", checked)}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={getSectionContent("making").badge || ""}
                  onChange={(e) => updateSectionField("making", "badge", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={getSectionContent("making").title || ""}
                  onChange={(e) => updateSectionField("making", "title", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={getSectionContent("making").description || ""}
                onChange={(e) => updateSectionField("making", "description", e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={getSectionContent("making").buttonText || ""}
                  onChange={(e) => updateSectionField("making", "buttonText", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input
                  value={getSectionContent("making").buttonLink || ""}
                  onChange={(e) => updateSectionField("making", "buttonLink", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              variant="gold"
              onClick={() => updateContent("making", getSectionContent("making"))}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Our Craft Section"}
            </Button>
          </div>
        </TabsContent>

        {/* Categories Section */}
        <TabsContent value="categories" className="space-y-6 mt-6">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              {getSectionActive("categories") ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-foreground font-medium">Categories Section</span>
            </div>
            <Switch
              checked={getSectionActive("categories")}
              onCheckedChange={(checked) => toggleSection("categories", checked)}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <p className="text-muted-foreground text-sm">
              Categories are automatically loaded from your product categories. 
              Manage them in the Categories tab.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={getSectionContent("categories").badge || ""}
                  onChange={(e) => updateSectionField("categories", "badge", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={getSectionContent("categories").title || ""}
                  onChange={(e) => updateSectionField("categories", "title", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              variant="gold"
              onClick={() => updateContent("categories", getSectionContent("categories"))}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Categories Section"}
            </Button>
          </div>
        </TabsContent>

        {/* Testimonials Section */}
        <TabsContent value="testimonials" className="space-y-6 mt-6">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              {getSectionActive("testimonials") ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-foreground font-medium">Reviews Section</span>
            </div>
            <Switch
              checked={getSectionActive("testimonials")}
              onCheckedChange={(checked) => toggleSection("testimonials", checked)}
            />
          </div>

          <div className="flex justify-between items-center">
            <h3 className="font-display text-lg text-foreground">Customer Reviews</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={addTestimonial}>
                <Plus className="h-4 w-4 mr-2" />
                Add Review
              </Button>
              <Button variant="gold" onClick={saveTestimonials} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="bg-card border border-border rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={testimonial.is_active}
                      onCheckedChange={(checked) => {
                        setTestimonials((prev) =>
                          prev.map((t) =>
                            t.id === testimonial.id ? { ...t, is_active: checked } : t
                          )
                        );
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteTestimonial(testimonial.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={testimonial.name}
                      onChange={(e) => {
                        setTestimonials((prev) =>
                          prev.map((t) =>
                            t.id === testimonial.id ? { ...t, name: e.target.value } : t
                          )
                        );
                      }}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={testimonial.location || ""}
                      onChange={(e) => {
                        setTestimonials((prev) =>
                          prev.map((t) =>
                            t.id === testimonial.id ? { ...t, location: e.target.value } : t
                          )
                        );
                      }}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Rating (1-5)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={testimonial.rating}
                      onChange={(e) => {
                        setTestimonials((prev) =>
                          prev.map((t) =>
                            t.id === testimonial.id
                              ? { ...t, rating: parseInt(e.target.value) || 5 }
                              : t
                          )
                        );
                      }}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label>Review Text</Label>
                  <Textarea
                    value={testimonial.text}
                    onChange={(e) => {
                      setTestimonials((prev) =>
                        prev.map((t) =>
                          t.id === testimonial.id ? { ...t, text: e.target.value } : t
                        )
                      );
                    }}
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Instagram Section */}
        <TabsContent value="instagram" className="space-y-6 mt-6">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              {getSectionActive("instagram") ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-foreground font-medium">Instagram Section</span>
            </div>
            <Switch
              checked={getSectionActive("instagram")}
              onCheckedChange={(checked) => toggleSection("instagram", checked)}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={getSectionContent("instagram").badge || ""}
                  onChange={(e) => updateSectionField("instagram", "badge", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Title (Username)</Label>
                <Input
                  value={getSectionContent("instagram").title || ""}
                  onChange={(e) => updateSectionField("instagram", "title", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>Instagram URL</Label>
              <Input
                value={getSectionContent("instagram").instagramUrl || ""}
                onChange={(e) => updateSectionField("instagram", "instagramUrl", e.target.value)}
                className="mt-1.5"
                placeholder="https://instagram.com/yourpage"
              />
            </div>

            <Button
              variant="gold"
              onClick={() => updateContent("instagram", getSectionContent("instagram"))}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Instagram Section"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHomepageCMS;
