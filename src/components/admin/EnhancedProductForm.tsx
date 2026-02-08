import { useState } from "react";
import { Plus, X, GripVertical, Video, Image, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import ProductImageUpload from "./ProductImageUpload";
import RichTextEditor from "./RichTextEditor";

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  name_bn: string;
  slug: string;
  price: string;
  compare_at_price: string;
  description: string;
  story: string;
  story_bn: string;
  materials: string;
  materials_bn: string;
  care_instructions: string;
  care_instructions_bn: string;
  dimensions: string;
  production_time: string;
  stock_quantity: string;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_preorderable: boolean;
  allow_customization: boolean;
  customization_only: boolean;
  advance_payment_percent: string;
  customization_instructions: string;
  is_showcase: boolean;
  showcase_description: string;
  showcase_description_bn: string;
  category_id: string;
  featured_section: string;
  images: string[];
  features: string[];
  video_url: string;
}

interface EnhancedProductFormProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  categories: Category[];
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const EnhancedProductForm = ({
  formData,
  setFormData,
  categories,
  isEditing,
  onSubmit,
  onCancel,
}: EnhancedProductFormProps) => {
  const [newFeature, setNewFeature] = useState("");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full grid grid-cols-5 mb-6">
          <TabsTrigger value="basic" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1.5 hidden sm:block" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="media" className="text-xs sm:text-sm">
            <Image className="h-4 w-4 mr-1.5 hidden sm:block" />
            Media
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs sm:text-sm">
            <Sparkles className="h-4 w-4 mr-1.5 hidden sm:block" />
            Details
          </TabsTrigger>
          <TabsTrigger value="features" className="text-xs sm:text-sm">
            Features
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-xs sm:text-sm">
            SEO
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name (English) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="name_bn">Name (Bengali)</Label>
              <Input
                id="name_bn"
                value={formData.name_bn}
                onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                className="font-bengali"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (৳) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="compare_at_price">Compare Price</Label>
              <Input
                id="compare_at_price"
                type="number"
                value={formData.compare_at_price}
                onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
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
              <Label htmlFor="featured_section">Featured Section</Label>
              <Select
                value={formData.featured_section || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, featured_section: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="bestsellers">Bestsellers</SelectItem>
                  <SelectItem value="new_arrivals">New Arrivals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "is_active", label: "Active" },
              { id: "is_featured", label: "Featured" },
              { id: "is_new_arrival", label: "New Arrival" },
              { id: "is_preorderable", label: "Pre-orderable" },
              { id: "allow_customization", label: "Allow Customization" },
              { id: "customization_only", label: "Customization Only (No Cart)" },
              { id: "is_showcase", label: "Showcase Only (No Sale)" },
            ].map((toggle) => (
              <div key={toggle.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Label htmlFor={toggle.id} className={toggle.id === "is_showcase" || toggle.id === "customization_only" ? "text-gold" : ""}>
                  {(toggle.id === "is_showcase" || toggle.id === "customization_only") && <Sparkles className="h-3 w-3 inline mr-1" />}
                  {toggle.label}
                </Label>
                <Switch
                  id={toggle.id}
                  checked={formData[toggle.id as keyof ProductFormData] as boolean}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, [toggle.id]: checked })
                  }
                />
              </div>
            ))}
          </div>

          {/* Customization Only Settings */}
          {formData.customization_only && (
            <div className="p-4 bg-gold/10 border border-gold/30 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-gold">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Customization Order Settings</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advance_percent">Advance Payment %</Label>
                  <Input
                    id="advance_percent"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.advance_payment_percent}
                    onChange={(e) => setFormData({ ...formData, advance_payment_percent: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="custom_instructions">Customization Instructions</Label>
                  <Input
                    id="custom_instructions"
                    value={formData.customization_instructions}
                    onChange={(e) => setFormData({ ...formData, customization_instructions: e.target.value })}
                    placeholder="e.g., Specify colors, size..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Showcase Description */}
          {formData.is_showcase && (
            <div className="p-4 bg-gold/10 border border-gold/30 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-gold">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Showcase Product Settings</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This product will be displayed for showcase purposes only. Customers can request a custom order for similar items.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Showcase Description (English)</Label>
                  <Textarea
                    value={formData.showcase_description || ""}
                    onChange={(e) => setFormData({ ...formData, showcase_description: e.target.value })}
                    placeholder="Describe the custom order options..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Showcase Description (Bengali)</Label>
                  <Textarea
                    value={formData.showcase_description_bn || ""}
                    onChange={(e) => setFormData({ ...formData, showcase_description_bn: e.target.value })}
                    className="font-bengali"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Product Images</Label>
            <ProductImageUpload
              images={formData.images}
              onImagesChange={(images) => setFormData({ ...formData, images })}
            />
          </div>

          <div>
            <Label htmlFor="video_url">Product Video URL (YouTube/Vimeo)</Label>
            <div className="flex gap-2 mt-1.5">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <Video className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Add a YouTube or Vimeo URL for product demonstration
            </p>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="materials">Materials (English)</Label>
              <Textarea
                id="materials"
                value={formData.materials}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                rows={2}
                placeholder="Cotton, Silk, etc."
              />
            </div>
            <div>
              <Label htmlFor="materials_bn">Materials (Bengali)</Label>
              <Textarea
                id="materials_bn"
                value={formData.materials_bn}
                onChange={(e) => setFormData({ ...formData, materials_bn: e.target.value })}
                rows={2}
                className="font-bengali"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                placeholder="10cm x 15cm x 5cm"
              />
            </div>
            <div>
              <Label htmlFor="production_time">Production Time</Label>
              <Input
                id="production_time"
                value={formData.production_time}
                onChange={(e) => setFormData({ ...formData, production_time: e.target.value })}
                placeholder="3-5 business days"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="care">Care Instructions (English)</Label>
              <Textarea
                id="care"
                value={formData.care_instructions}
                onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })}
                rows={2}
                placeholder="Hand wash only, air dry..."
              />
            </div>
            <div>
              <Label htmlFor="care_bn">Care Instructions (Bengali)</Label>
              <Textarea
                id="care_bn"
                value={formData.care_instructions_bn}
                onChange={(e) => setFormData({ ...formData, care_instructions_bn: e.target.value })}
                rows={2}
                className="font-bengali"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="story">Artisan Story (English)</Label>
              <Textarea
                id="story"
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                rows={3}
                placeholder="Tell the story behind this product..."
              />
            </div>
            <div>
              <Label htmlFor="story_bn">Artisan Story (Bengali)</Label>
              <Textarea
                id="story_bn"
                value={formData.story_bn}
                onChange={(e) => setFormData({ ...formData, story_bn: e.target.value })}
                rows={3}
                className="font-bengali"
              />
            </div>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div>
            <Label className="text-base font-medium">Product Features</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Add key features that will be displayed as bullet points
            </p>

            <div className="flex gap-2 mb-4">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Enter a feature..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              />
              <Button type="button" variant="outline" onClick={addFeature}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.features.length > 0 ? (
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg group"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="flex-1 text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                No features added yet
              </div>
            )}
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-2">Search Preview</h3>
            <div className="space-y-1">
              <p className="text-blue-500 text-lg hover:underline cursor-pointer">
                {formData.name || "Product Name"} | artistiya.store
              </p>
              <p className="text-green-600 text-sm">
                artistiya.store/product/{formData.slug || "product-slug"}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {formData.description || "Product description will appear here..."}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            SEO meta tags will be automatically generated from the product name, description,
            and slug. Make sure to write descriptive content for better search visibility.
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button type="submit" variant="gold" className="flex-1">
          {isEditing ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default EnhancedProductForm;
