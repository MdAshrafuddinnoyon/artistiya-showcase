import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, Upload, Eye, EyeOff, GripVertical, Layers, Package, Image as ImageIcon, FolderTree, X, Library, ZoomIn, ZoomOut, Youtube, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MediaPickerModal from "./MediaPickerModal";

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
  { value: "banner", label: "Promotional Banner", icon: ImageIcon, description: "Full-width banner" },
  { value: "dual_banner", label: "Dual Banner", icon: ImageIcon, description: "Two side-by-side banners" },
  { value: "featured", label: "Featured Collection", icon: Layers, description: "Highlight a collection" },
  { value: "youtube", label: "YouTube Videos", icon: Youtube, description: "Display YouTube videos" },
  { value: "blog", label: "Blog Posts", icon: FileText, description: "Recent blog posts" },
  { value: "faq", label: "FAQ Section", icon: HelpCircle, description: "Frequently asked questions" },
];

const AdminHomepageSections = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadConfig, setCurrentUploadConfig] = useState<{sectionId: string, field: string} | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{sectionId: string, field: string} | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  const handleImageUpload = async (file: File, sectionId: string, configField: string) => {
    setUploadingFor(`${sectionId}-${configField}`);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${sectionId}-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      updateSectionConfig(sectionId, { [configField]: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingFor(null);
    }
  };

  const triggerFileUpload = (sectionId: string, field: string) => {
    setCurrentUploadConfig({ sectionId, field });
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUploadConfig) {
      handleImageUpload(file, currentUploadConfig.sectionId, currentUploadConfig.field);
    }
    e.target.value = "";
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
        youtube: { limit: 3, auto_play: false },
        blog: { limit: 3, show_excerpt: true },
        faq: { limit: 5, page_type: "homepage" },
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

  const openMediaPicker = (sectionId: string, field: string) => {
    setMediaPickerTarget({ sectionId, field });
    setMediaPickerOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaPickerTarget) {
      updateSectionConfig(mediaPickerTarget.sectionId, { [mediaPickerTarget.field]: url });
    }
    setMediaPickerOpen(false);
    setMediaPickerTarget(null);
  };

  // Enhanced Image Upload Zone with Media Picker and Preview
  const ImageUploadZone = ({ 
    sectionId, 
    configField, 
    currentUrl, 
    label 
  }: { 
    sectionId: string; 
    configField: string; 
    currentUrl?: string; 
    label: string;
  }) => {
    const isUploading = uploadingFor === `${sectionId}-${configField}`;
    
    return (
      <div className="space-y-2">
        <Label className="text-xs">{label}</Label>
        {currentUrl ? (
          <div className="relative group">
            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
              <img 
                src={currentUrl} 
                alt={label} 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Hover Controls */}
            <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerFileUpload(sectionId, configField)}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openMediaPicker(sectionId, configField)}
                >
                  <Library className="h-3 w-3 mr-1" />
                  Library
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewImage(currentUrl)}
                >
                  <ZoomIn className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => updateSectionConfig(sectionId, { [configField]: "" })}
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50">
            {isUploading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="animate-spin h-6 w-6 border-2 border-gold border-t-transparent rounded-full mb-2" />
                <p className="text-xs text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerFileUpload(sectionId, configField)}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openMediaPicker(sectionId, configField)}
                  >
                    <Library className="h-3 w-3 mr-1" />
                    Library
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">or paste image URL below</p>
                <Input
                  placeholder="https://..."
                  className="max-w-[200px] h-7 text-xs"
                  onBlur={(e) => {
                    if (e.target.value) {
                      updateSectionConfig(sectionId, { [configField]: e.target.value });
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

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
                      <div className="space-y-4">
                        {!section.config.category_id && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                            <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                              <span>⚠️</span>
                              <span>No category selected. This section won't appear on homepage until you select a category.</span>
                            </p>
                          </div>
                        )}
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
                      </div>
                    )}

                    {section.section_type === "products" && (
                      <div>
                        <Label className="text-xs mb-2 block">Select Products</Label>
                        {(section.config.product_ids || []).length === 0 && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
                            <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                              <span>⚠️</span>
                              <span>No products selected. This section won't appear on homepage until you select products.</span>
                            </p>
                          </div>
                        )}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ImageUploadZone 
                            sectionId={section.id}
                            configField="image_url"
                            currentUrl={section.config.image_url}
                            label="Banner Image"
                          />
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs">Banner Link</Label>
                              <Input
                                value={section.config.link || ""}
                                onChange={(e) => updateSectionConfig(section.id, { link: e.target.value })}
                                className="mt-1"
                                placeholder="/shop"
                              />
                            </div>
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
                              <Label className="text-xs">Height</Label>
                              <Select
                                value={section.config.height || "400px"}
                                onValueChange={(v) => updateSectionConfig(section.id, { height: v })}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="300px">300px (Small)</SelectItem>
                                  <SelectItem value="400px">400px (Medium)</SelectItem>
                                  <SelectItem value="500px">500px (Large)</SelectItem>
                                  <SelectItem value="600px">600px (Extra Large)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {section.section_type === "best_selling" && (
                      <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
                            <span>💡</span>
                            <span>This section shows products marked as "Featured" in the Products section. Make sure you have featured products!</span>
                          </p>
                        </div>
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
                      </div>
                    )}

                    {section.section_type === "discount" && (
                      <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
                            <span>💡</span>
                            <span>This section shows products with "Compare at Price" set higher than regular price. Set discounts in Products section!</span>
                          </p>
                        </div>
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
                      </div>
                    )}

                    {section.section_type === "dual_banner" && (
                      <div className="space-y-6">
                        {/* Banner 1 */}
                        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                          <p className="text-sm font-medium text-foreground">Banner 1 (Left)</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImageUploadZone 
                              sectionId={section.id}
                              configField="banner1_image"
                              currentUrl={section.config.banner1_image}
                              label="Image"
                            />
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs">Title</Label>
                                <Input
                                  value={section.config.banner1_title || ""}
                                  onChange={(e) => updateSectionConfig(section.id, { banner1_title: e.target.value })}
                                  className="mt-1"
                                  placeholder="e.g. New Arrivals"
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
                          </div>
                        </div>

                        {/* Banner 2 */}
                        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                          <p className="text-sm font-medium text-foreground">Banner 2 (Right)</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImageUploadZone 
                              sectionId={section.id}
                              configField="banner2_image"
                              currentUrl={section.config.banner2_image}
                              label="Image"
                            />
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs">Title</Label>
                                <Input
                                  value={section.config.banner2_title || ""}
                                  onChange={(e) => updateSectionConfig(section.id, { banner2_title: e.target.value })}
                                  className="mt-1"
                                  placeholder="e.g. Sale Items"
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
                          </div>
                        </div>
                      </div>
                    )}

                    {section.section_type === "youtube" && (
                      <div className="space-y-4">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <Youtube className="h-4 w-4" />
                            <span>Videos from YouTube Videos section will be displayed here. Add videos in Content → YouTube Videos.</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Videos to Show</Label>
                            <Select
                              value={String(section.config.limit || 3)}
                              onValueChange={(v) => updateSectionConfig(section.id, { limit: parseInt(v) })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">2 Videos</SelectItem>
                                <SelectItem value="3">3 Videos</SelectItem>
                                <SelectItem value="4">4 Videos</SelectItem>
                                <SelectItem value="6">6 Videos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {section.section_type === "blog" && (
                      <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Published blog posts will be displayed here. Manage posts in Content → Blog Posts.</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Posts to Show</Label>
                            <Select
                              value={String(section.config.limit || 3)}
                              onValueChange={(v) => updateSectionConfig(section.id, { limit: parseInt(v) })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">2 Posts</SelectItem>
                                <SelectItem value="3">3 Posts</SelectItem>
                                <SelectItem value="4">4 Posts</SelectItem>
                                <SelectItem value="6">6 Posts</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <Switch
                              checked={section.config.show_excerpt !== false}
                              onCheckedChange={(checked) => updateSectionConfig(section.id, { show_excerpt: checked })}
                            />
                            <Label className="text-xs">Show Excerpt</Label>
                          </div>
                        </div>
                      </div>
                    )}

                    {section.section_type === "faq" && (
                      <div className="space-y-4">
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                          <p className="text-purple-600 dark:text-purple-400 text-sm flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            <span>FAQs will be displayed from the FAQ section. Manage FAQs in Content → FAQs.</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">FAQs to Show</Label>
                            <Select
                              value={String(section.config.limit || 5)}
                              onValueChange={(v) => updateSectionConfig(section.id, { limit: parseInt(v) })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 FAQs</SelectItem>
                                <SelectItem value="5">5 FAQs</SelectItem>
                                <SelectItem value="8">8 FAQs</SelectItem>
                                <SelectItem value="10">10 FAQs</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">FAQ Category</Label>
                            <Select
                              value={section.config.page_type || "homepage"}
                              onValueChange={(v) => updateSectionConfig(section.id, { page_type: v })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="homepage">Homepage FAQs</SelectItem>
                                <SelectItem value="checkout">Checkout FAQs</SelectItem>
                                <SelectItem value="about">About FAQs</SelectItem>
                                <SelectItem value="general">General FAQs</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
      {/* Media Picker Modal */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => {
          setMediaPickerOpen(false);
          setMediaPickerTarget(null);
        }}
        onSelect={handleMediaSelect}
        accept="image/*"
        title="Select Banner Image"
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomepageSections;
