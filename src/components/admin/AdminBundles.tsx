import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Package, Percent, Eye, EyeOff, GripVertical, X, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
}

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  price: number;
  images: string[] | null;
  category_id: string | null;
}

interface BundleProduct {
  id: string;
  product_id: string | null;
  category_id: string | null;
  product?: Product | null;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number | null;
  is_active: boolean | null;
  display_order: number | null;
  bundle_products?: BundleProduct[];
}

const AdminBundles = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bundlesRes, productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("product_bundles")
          .select(`
            id,
            name,
            description,
            discount_percent,
            is_active,
            display_order,
            bundle_products(id, product_id, category_id, product:products(id, name, name_bn, price, images, category_id))
          `)
          .order("display_order"),
        supabase
          .from("products")
          .select("id, name, name_bn, price, images, category_id")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("categories")
          .select("id, name, name_bn")
          .order("display_order"),
      ]);

      if (bundlesRes.error) throw bundlesRes.error;
      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setBundles((bundlesRes.data as any) || []);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching bundles:", error);
      toast.error("Failed to load bundles");
    } finally {
      setLoading(false);
    }
  };
  const addBundle = async () => {
    try {
      const { data, error } = await supabase
        .from("product_bundles")
        .insert({
          name: "New Bundle",
          description: "Bundle description",
          discount_percent: 10,
          is_active: false,
          display_order: bundles.length,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Bundle created");
      fetchData();
    } catch (error) {
      console.error("Error adding bundle:", error);
      toast.error("Failed to create bundle");
    }
  };

  const deleteBundle = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;

    try {
      // Delete bundle products first
      await supabase.from("bundle_products").delete().eq("bundle_id", id);
      // Then delete bundle
      const { error } = await supabase.from("product_bundles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bundle deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting bundle:", error);
      toast.error("Failed to delete bundle");
    }
  };

  const updateBundle = async (id: string, field: keyof Bundle, value: any) => {
    setBundles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const saveBundle = async (bundle: Bundle) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("product_bundles")
        .update({
          name: bundle.name,
          description: bundle.description,
          discount_percent: bundle.discount_percent,
          is_active: bundle.is_active,
          display_order: bundle.display_order,
        })
        .eq("id", bundle.id);

      if (error) throw error;
      toast.success("Bundle saved");
    } catch (error) {
      console.error("Error saving bundle:", error);
      toast.error("Failed to save bundle");
    } finally {
      setSaving(false);
    }
  };

  const addProductToBundle = async (bundleId: string, productId: string) => {
    try {
      // Check if product already in bundle
      const bundle = bundles.find((b) => b.id === bundleId);
      if (bundle?.bundle_products?.some((bp) => bp.product_id === productId)) {
        toast.error("Product already in bundle");
        return;
      }

      const { error } = await supabase.from("bundle_products").insert({
        bundle_id: bundleId,
        product_id: productId,
      });

      if (error) throw error;
      toast.success("Product added to bundle");
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    }
  };

  const removeProductFromBundle = async (bundleProductId: string) => {
    try {
      const { error } = await supabase
        .from("bundle_products")
        .delete()
        .eq("id", bundleProductId);

      if (error) throw error;
      toast.success("Product removed");
      fetchData();
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error("Failed to remove product");
    }
  };

  const calculateBundlePrice = (bundle: Bundle) => {
    const products = bundle.bundle_products || [];
    const originalTotal = products.reduce(
      (sum, bp) => sum + (bp.product?.price || 0),
      0
    );
    const discount = bundle.discount_percent || 0;
    const discountedTotal = Math.round(originalTotal * (1 - discount / 100));
    return { originalTotal, discountedTotal, savings: originalTotal - discountedTotal };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-gold" />
            Product Bundles
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create product bundles with discounts to boost sales
          </p>
        </div>
        <Button variant="gold" onClick={addBundle}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bundle
        </Button>
      </div>

      {bundles.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No bundles created yet</p>
          <Button variant="gold" onClick={addBundle}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Bundle
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {bundles.map((bundle, index) => {
            const { originalTotal, discountedTotal, savings } = calculateBundlePrice(bundle);
            const bundleProducts = bundle.bundle_products || [];

            return (
              <Card key={bundle.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    {bundle.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-lg">{bundle.name}</span>
                    {bundle.discount_percent && bundle.discount_percent > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Percent className="h-3 w-3" />
                        {bundle.discount_percent}% OFF
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={bundle.is_active || false}
                      onCheckedChange={(checked) => {
                        updateBundle(bundle.id, "is_active", checked);
                        saveBundle({ ...bundle, is_active: checked });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteBundle(bundle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Bundle Name</Label>
                      <Input
                        value={bundle.name}
                        onChange={(e) => updateBundle(bundle.id, "name", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Discount Percent (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={bundle.discount_percent || 0}
                        onChange={(e) =>
                          updateBundle(bundle.id, "discount_percent", parseInt(e.target.value) || 0)
                        }
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        min={0}
                        value={bundle.display_order || 0}
                        onChange={(e) =>
                          updateBundle(bundle.id, "display_order", parseInt(e.target.value) || 0)
                        }
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={bundle.description || ""}
                      onChange={(e) => updateBundle(bundle.id, "description", e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>

                  {/* Products in Bundle */}
                  <div>
                    <Label className="mb-3 block">Products in Bundle</Label>
                    
                    {bundleProducts.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {bundleProducts.map((bp) => (
                          <div
                            key={bp.id}
                            className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                          >
                            {bp.product?.images?.[0] && (
                              <img
                                src={bp.product.images[0]}
                                alt={bp.product.name}
                                className="h-12 w-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{bp.product?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ৳{bp.product?.price?.toLocaleString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeProductFromBundle(bp.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">
                        No products added yet. Add products to create the bundle.
                      </p>
                    )}

                    {/* Category Filter + Search + Product Select */}
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex gap-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter by category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Filtered Products Grid */}
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {products
                          .filter((p) => {
                            const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
                            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                            const notInBundle = !bundleProducts.some((bp) => bp.product_id === p.id);
                            return matchesCategory && matchesSearch && notInBundle;
                          })
                          .map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                              onClick={() => addProductToBundle(bundle.id, product.id)}
                            >
                              {product.images?.[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-10 w-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ৳{product.price.toLocaleString()}
                                </p>
                              </div>
                              <Plus className="h-4 w-4 text-gold" />
                            </div>
                          ))}
                        {products.filter((p) => {
                          const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
                          const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                          const notInBundle = !bundleProducts.some((bp) => bp.product_id === p.id);
                          return matchesCategory && matchesSearch && notInBundle;
                        }).length === 0 && (
                          <p className="text-center text-sm text-muted-foreground py-4">
                            No products found
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bundle Summary */}
                  {bundleProducts.length > 0 && (
                    <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Bundle Price</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xl font-bold text-gold">
                              ৳{discountedTotal.toLocaleString()}
                            </span>
                            {savings > 0 && (
                              <>
                                <span className="text-sm text-muted-foreground line-through">
                                  ৳{originalTotal.toLocaleString()}
                                </span>
                                <Badge variant="secondary">
                                  Save ৳{savings.toLocaleString()}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="gold"
                          onClick={() => saveBundle(bundle)}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? "Saving..." : "Save Bundle"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminBundles;
