import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Image, Upload, Eye, EyeOff, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EnhancedProductForm from "./EnhancedProductForm";
import BulkProductUpload from "./BulkProductUpload";
import BulkSelectionToolbar from "./BulkSelectionToolbar";

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  description: string | null;
  story: string | null;
  materials: string | null;
  care_instructions: string | null;
  dimensions: string | null;
  production_time: string | null;
  images: string[] | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_preorderable: boolean;
  allow_customization: boolean;
  category_id: string | null;
  featured_section: string | null;
  category: { name: string } | null;
  features?: string[];
  video_url?: string;
  story_bn?: string;
  materials_bn?: string;
  care_instructions_bn?: string;
}

interface Category {
  id: string;
  name: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    name_bn: "",
    slug: "",
    price: "",
    compare_at_price: "",
    description: "",
    story: "",
    story_bn: "",
    materials: "",
    materials_bn: "",
    care_instructions: "",
    care_instructions_bn: "",
    dimensions: "",
    production_time: "",
    stock_quantity: "0",
    is_active: true,
    is_featured: false,
    is_new_arrival: true,
    is_preorderable: false,
    allow_customization: false,
    customization_only: false,
    advance_payment_percent: "50",
    customization_instructions: "",
    is_showcase: false,
    showcase_description: "",
    showcase_description_bn: "",
    category_id: "",
    featured_section: "",
    images: [] as string[],
    features: [] as string[],
    video_url: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`*, category:categories (name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    setCategories(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    // Real-time subscription
    const channel = supabase
      .channel("products_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => fetchProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      name_bn: formData.name_bn || null,
      slug: formData.slug || generateSlug(formData.name),
      price: parseFloat(formData.price),
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      description: formData.description || null,
      story: formData.story || null,
      story_bn: formData.story_bn || null,
      materials: formData.materials || null,
      materials_bn: formData.materials_bn || null,
      care_instructions: formData.care_instructions || null,
      care_instructions_bn: formData.care_instructions_bn || null,
      dimensions: formData.dimensions || null,
      production_time: formData.production_time || null,
      stock_quantity: parseInt(formData.stock_quantity),
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      is_new_arrival: formData.is_new_arrival,
      is_preorderable: formData.is_preorderable,
      allow_customization: formData.allow_customization,
      customization_only: formData.customization_only,
      advance_payment_percent: formData.advance_payment_percent ? parseInt(formData.advance_payment_percent) : null,
      customization_instructions: formData.customization_instructions || null,
      is_showcase: formData.is_showcase,
      showcase_description: formData.showcase_description || null,
      showcase_description_bn: formData.showcase_description_bn || null,
      category_id: formData.category_id || null,
      featured_section: formData.featured_section || null,
      images: formData.images,
      features: formData.features,
      video_url: formData.video_url || null,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("products").insert(productData);

        if (error) throw error;
        toast.success("Product created");
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Failed to save product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      name_bn: product.name_bn || "",
      slug: product.slug,
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || "",
      description: product.description || "",
      story: product.story || "",
      story_bn: product.story_bn || "",
      materials: product.materials || "",
      materials_bn: product.materials_bn || "",
      care_instructions: product.care_instructions || "",
      care_instructions_bn: product.care_instructions_bn || "",
      dimensions: product.dimensions || "",
      production_time: product.production_time || "",
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_preorderable: product.is_preorderable,
      allow_customization: product.allow_customization || false,
      customization_only: (product as any).customization_only || false,
      advance_payment_percent: (product as any).advance_payment_percent?.toString() || "50",
      customization_instructions: (product as any).customization_instructions || "",
      is_showcase: (product as any).is_showcase || false,
      showcase_description: (product as any).showcase_description || "",
      showcase_description_bn: (product as any).showcase_description_bn || "",
      category_id: product.category_id || "",
      featured_section: product.featured_section || "",
      images: product.images || [],
      features: product.features || [],
      video_url: product.video_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      toast.success("Product deleted");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} products?`)) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`Deleted ${selectedIds.length} products`);
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Failed to delete products");
    }
  };

  const handleBulkPublish = async () => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: true })
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`Published ${selectedIds.length} products`);
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to publish products");
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`Unpublished ${selectedIds.length} products`);
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to unpublish products");
    }
  };

  const handleBulkExport = () => {
    const exportData = products
      .filter((p) => selectedIds.includes(p.id))
      .map((p) => ({
        name: p.name,
        name_bn: p.name_bn,
        slug: p.slug,
        price: p.price,
        compare_at_price: p.compare_at_price,
        description: p.description,
        stock_quantity: p.stock_quantity,
        category: p.category?.name,
        is_active: p.is_active,
        is_featured: p.is_featured,
      }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_export_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Products exported");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      name_bn: "",
      slug: "",
      price: "",
      compare_at_price: "",
      description: "",
      story: "",
      story_bn: "",
      materials: "",
      materials_bn: "",
      care_instructions: "",
      care_instructions_bn: "",
      dimensions: "",
      production_time: "",
      stock_quantity: "0",
      is_active: true,
      is_featured: false,
      is_new_arrival: true,
      is_preorderable: false,
      allow_customization: false,
      customization_only: false,
      advance_payment_percent: "50",
      customization_instructions: "",
      is_showcase: false,
      showcase_description: "",
      showcase_description_bn: "",
      category_id: "",
      featured_section: "",
      images: [],
      features: [],
      video_url: "",
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h1 className="font-display text-2xl text-foreground">Products</h1>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Bulk Upload */}
          <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Product Upload</DialogTitle>
              </DialogHeader>
              <BulkProductUpload
                onComplete={() => {
                  setBulkUploadOpen(false);
                  fetchProducts();
                }}
                onCancel={() => setBulkUploadOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Add Product */}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
              </DialogHeader>

              <EnhancedProductForm
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                isEditing={!!editingProduct}
                onSubmit={handleSubmit}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Selection Toolbar */}
      <BulkSelectionToolbar
        selectedIds={selectedIds}
        totalCount={filteredProducts.length}
        onSelectAll={() => setSelectedIds(filteredProducts.map((p) => p.id))}
        onDeselectAll={() => setSelectedIds([])}
        onBulkDelete={handleBulkDelete}
        onBulkPublish={handleBulkPublish}
        onBulkUnpublish={handleBulkUnpublish}
        onBulkExport={handleBulkExport}
        showPublish={true}
      />

      {/* Products Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-10 p-4">
                  <Checkbox
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds(filteredProducts.map((p) => p.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stock</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={7} className="p-4">
                      <div className="h-12 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedIds.includes(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {product.category?.name || "-"}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-gold">৳{product.price.toLocaleString()}</p>
                      {product.compare_at_price && (
                        <p className="text-xs text-muted-foreground line-through">
                          ৳{product.compare_at_price.toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-sm ${product.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                        {product.stock_quantity > 0 ? product.stock_quantity : "Out of stock"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {product.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded">Active</span>
                        )}
                        {product.is_featured && (
                          <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded">Featured</span>
                        )}
                        {product.is_new_arrival && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded">New</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
