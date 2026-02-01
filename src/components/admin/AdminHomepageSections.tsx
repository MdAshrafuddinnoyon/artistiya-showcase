import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, Upload, Eye, EyeOff, GripVertical, Layers, Package, Image, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HomepageSection {
  id: string;
  section_type: string;
  title: string;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
  config: any;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

const sectionTypes = [
  { value: "products", label: "Products Grid", icon: Package, description: "Display selected products" },
  { value: "category", label: "Category Products", icon: FolderTree, description: "Products from a category" },
  { value: "best_selling", label: "Best Selling", icon: Package, description: "Top selling products" },
  { value: "discount", label: "Discount Products", icon: Package, description: "Products on sale" },
  { value: "banner", label: "Promotional Banner", icon: Image, description: "Full-width banner" },
  { value: "dual_banner", label: "Dual Banner", icon: Image, description: "Two side-by-side banners" },
  { value: "featured", label: "Featured Collection", icon: Layers, description: "Highlight a collection" },
];

const AdminHomepageSections = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsRes, categoriesRes, productsRes] = await Promise.all([
        supabase.from("homepage_sections").select("*").order("display_order"),
        supabase.from("categories").select("id, name, slug").order("display_order"),
        supabase.from("products").select("id, name, slug, price, images").eq("is_active", true).limit(50),
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (productsRes.error) throw productsRes.error;

      setSections(sectionsRes.data || []);
      setCategories(categoriesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addSection = async (type: string) => {
    try {
      const typeInfo = sectionTypes.find((t) => t.value === type);
      const defaultConfigs: Record<string, any> = {
        products: { product_ids: [], columns: 4 },
        category: { category_id: null, limit: 8 },
        best_selling: { limit: 8, show_badge: true },
        discount: { limit: 8, min_discount: 10 },
        banner: { image_url: "", link: "", height: "400px", button_text: "", button_link: "" },
        dual_banner: { 
          banner1_image: "", banner1_link: "", banner1_title: "", 
          banner2_image: "", banner2_link: "", banner2_title: "" 
        },
        featured: { collection_id: null },
      };

      const { error } = await supabase.from("homepage_sections").insert({
        section_type: type,
        title: `New ${typeInfo?.label || "Section"}`,
        subtitle: "Add a subtitle",
        display_order: sections.length,
        config: defaultConfigs[type] || {},
      });

      if (error) throw error;
      toast.success("Section added");
      fetchData();
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Delete this section?")) return;

    try {
      const { error } = await supabase.from("homepage_sections").delete().eq("id", id);
      if (error) throw error;
      toast.success("Section deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  const updateSection = (id: string, updates: Partial<HomepageSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const updateSectionConfig = (id: string, configUpdates: any) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, config: { ...s.config, ...configUpdates } } : s
      )
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        const { error } = await supabase
          .from("homepage_sections")
          .update({
            title: section.title,
            subtitle: section.subtitle,
            is_active: section.is_active,
            display_order: section.display_order,
            config: section.config,
          })
          .eq("id", section.id);

        if (error) throw error;
      }
      toast.success("All sections saved");
    } catch (error) {
      console.error("Error saving sections:", error);
      toast.error("Failed to save sections");
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    newSections.forEach((s, i) => (s.display_order = i));
    setSections(newSections);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-gold" />
            Homepage Sections
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create custom product sections for homepage
          </p>
        </div>
        <Button variant="gold" onClick={saveAll} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {/* Add Section Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sectionTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => addSection(type.value)}
            className="p-4 bg-card border border-border rounded-xl hover:border-gold/50 transition-colors text-left"
          >
            <type.icon className="h-6 w-6 text-gold mb-2" />
            <p className="font-medium text-foreground">{type.label}</p>
            <p className="text-xs text-muted-foreground">{type.description}</p>
          </button>
        ))}
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No custom sections yet</p>
          <p className="text-sm text-muted-foreground">Click one of the buttons above to add a section</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={section.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Drag Handle & Order */}
                  <div className="flex flex-col items-center gap-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    <div className="flex flex-col gap-1 mt-2">
                      <button
                        onClick={() => moveSection(index, "up")}
                        disabled={index === 0}
                        className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted-foreground/20 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveSection(index, "down")}
                        disabled={index === sections.length - 1}
                        className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted-foreground/20 disabled:opacity-50"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {section.section_type}
                        </Badge>
                        {section.is_active ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.is_active}
                          onCheckedChange={(checked) => updateSection(section.id, { is_active: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Section Title</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Subtitle</Label>
                        <Input
                          value={section.subtitle || ""}
                          onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Section Type Specific Config */}
                    {section.section_type === "category" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={section.config.category_id || ""}
                            onValueChange={(v) => updateSectionConfig(section.id, { category_id: v })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Products to Show</Label>
                          <Select
                            value={String(section.config.limit || 8)}
                            onValueChange={(v) => updateSectionConfig(section.id, { limit: parseInt(v) })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4">4 Products</SelectItem>
                              <SelectItem value="6">6 Products</SelectItem>
                              <SelectItem value="8">8 Products</SelectItem>
                              <SelectItem value="12">12 Products</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {section.section_type === "products" && (
                      <div>
                        <Label className="text-xs mb-2 block">Select Products</Label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-muted rounded-lg">
                          {products.map((product) => {
                            const isSelected = (section.config.product_ids || []).includes(product.id);
                            return (
                              <button
                                key={product.id}
                                onClick={() => {
                                  const currentIds = section.config.product_ids || [];
                                  const newIds = isSelected
                                    ? currentIds.filter((id: string) => id !== product.id)
                                    : [...currentIds, product.id];
                                  updateSectionConfig(section.id, { product_ids: newIds });
                                }}
                                className={`p-2 rounded-lg border text-xs text-left transition-colors ${
                                  isSelected
                                    ? "border-gold bg-gold/10"
                                    : "border-border hover:border-gold/50"
                                }`}
                              >
                                <p className="font-medium truncate">{product.name}</p>
                                <p className="text-muted-foreground">৳{product.price}</p>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Selected: {(section.config.product_ids || []).length} products
                        </p>
                      </div>
                    )}

                    {section.section_type === "banner" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <Label className="text-xs">Banner Image URL</Label>
                            <Input
                              value={section.config.image_url || ""}
                              onChange={(e) => updateSectionConfig(section.id, { image_url: e.target.value })}
                              className="mt-1"
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Banner Link</Label>
                            <Input
                              value={section.config.link || ""}
                              onChange={(e) => updateSectionConfig(section.id, { link: e.target.value })}
                              className="mt-1"
                              placeholder="/shop"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Button Text</Label>
                            <Input
                              value={section.config.button_text || ""}
                              onChange={(e) => updateSectionConfig(section.id, { button_text: e.target.value })}
                              className="mt-1"
                              placeholder="e.g. Shop Now"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Button Link</Label>
                            <Input
                              value={section.config.button_link || ""}
                              onChange={(e) => updateSectionConfig(section.id, { button_link: e.target.value })}
                              className="mt-1"
                              placeholder="/shop"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {section.section_type === "best_selling" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Products to Show</Label>
                          <Select
                            value={String(section.config.limit || 8)}
                            onValueChange={(v) => updateSectionConfig(section.id, { limit: parseInt(v) })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4">4 Products</SelectItem>
                              <SelectItem value="6">6 Products</SelectItem>
                              <SelectItem value="8">8 Products</SelectItem>
                              <SelectItem value="12">12 Products</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 mt-6">
                          <input
                            type="checkbox"
                            checked={section.config.show_badge ?? true}
                            onChange={(e) => updateSectionConfig(section.id, { show_badge: e.target.checked })}
                            className="rounded"
                          />
                          <Label className="text-xs">Show "Best Seller" Badge</Label>
                        </div>
                      </div>
                    )}

                    {section.section_type === "discount" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Products to Show</Label>
                          <Select
                            value={String(section.config.limit || 8)}
                            onValueChange={(v) => updateSectionConfig(section.id, { limit: parseInt(v) })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4">4 Products</SelectItem>
                              <SelectItem value="6">6 Products</SelectItem>
                              <SelectItem value="8">8 Products</SelectItem>
                              <SelectItem value="12">12 Products</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Minimum Discount %</Label>
                          <Input
                            type="number"
                            value={section.config.min_discount || 10}
                            onChange={(e) => updateSectionConfig(section.id, { min_discount: parseInt(e.target.value) })}
                            className="mt-1"
                            min={0}
                            max={100}
                          />
                        </div>
                      </div>
                    )}

                    {section.section_type === "dual_banner" && (
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">Banner 1 (Left)</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <Label className="text-xs">Image URL</Label>
                            <Input
                              value={section.config.banner1_image || ""}
                              onChange={(e) => updateSectionConfig(section.id, { banner1_image: e.target.value })}
                              className="mt-1"
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Link</Label>
                            <Input
                              value={section.config.banner1_link || ""}
                              onChange={(e) => updateSectionConfig(section.id, { banner1_link: e.target.value })}
                              className="mt-1"
                              placeholder="/shop"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={section.config.banner1_title || ""}
                            onChange={(e) => updateSectionConfig(section.id, { banner1_title: e.target.value })}
                            className="mt-1"
                            placeholder="e.g. New Arrivals"
                          />
                        </div>

                        <p className="text-xs text-muted-foreground pt-2">Banner 2 (Right)</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <Label className="text-xs">Image URL</Label>
                            <Input
                              value={section.config.banner2_image || ""}
                              onChange={(e) => updateSectionConfig(section.id, { banner2_image: e.target.value })}
                              className="mt-1"
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Link</Label>
                            <Input
                              value={section.config.banner2_link || ""}
                              onChange={(e) => updateSectionConfig(section.id, { banner2_link: e.target.value })}
                              className="mt-1"
                              placeholder="/shop"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={section.config.banner2_title || ""}
                            onChange={(e) => updateSectionConfig(section.id, { banner2_title: e.target.value })}
                            className="mt-1"
                            placeholder="e.g. Sale Items"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHomepageSections;
