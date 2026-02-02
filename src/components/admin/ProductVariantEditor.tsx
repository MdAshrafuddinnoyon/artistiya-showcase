import { useState, useEffect } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductColor {
  id: string;
  name: string;
  name_bn: string | null;
  color_code: string;
}

interface ProductSize {
  id: string;
  name: string;
  name_bn: string | null;
  category: string | null;
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  color: string | null;
  color_code: string | null;
  size: string | null;
  price_adjustment: number;
  stock_quantity: number;
  is_active: boolean;
}

interface ProductVariantEditorProps {
  productId: string;
  productName: string;
}

const ProductVariantEditor = ({ productId, productName }: ProductVariantEditorProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [variantsRes, colorsRes, sizesRes] = await Promise.all([
        supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .order("display_order"),
        supabase.from("product_colors").select("*").eq("is_active", true).order("display_order"),
        supabase.from("product_sizes").select("*").eq("is_active", true).order("display_order"),
      ]);

      if (variantsRes.error) throw variantsRes.error;
      if (colorsRes.error) throw colorsRes.error;
      if (sizesRes.error) throw sizesRes.error;

      setVariants(variantsRes.data || []);
      setColors(colorsRes.data || []);
      setSizes(sizesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  };

  const addVariant = async () => {
    try {
      const { error } = await supabase.from("product_variants").insert({
        product_id: productId,
        stock_quantity: 0,
        price_adjustment: 0,
        display_order: variants.length,
      });

      if (error) throw error;
      toast.success("Variant added");
      fetchData();
    } catch (error) {
      console.error("Error adding variant:", error);
      toast.error("Failed to add variant");
    }
  };

  const updateVariant = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from("product_variants")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
      );
    } catch (error) {
      console.error("Error updating variant:", error);
      toast.error("Failed to update");
    }
  };

  const deleteVariant = async (id: string) => {
    if (!confirm("Delete this variant?")) return;

    try {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;
      toast.success("Variant deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting variant:", error);
      toast.error("Failed to delete variant");
    }
  };

  const selectColor = (variantId: string, colorName: string) => {
    const color = colors.find((c) => c.name === colorName);
    if (color) {
      updateVariant(variantId, "color", color.name);
      updateVariant(variantId, "color_code", color.color_code);
    }
  };

  if (loading) {
    return <div className="h-32 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Package className="h-5 w-5 text-gold" />
          Variants for: {productName}
        </CardTitle>
        <Button variant="gold" size="sm" onClick={addVariant}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No variants yet. Add color/size variants for this product.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={variant.id}
                className={`p-4 border rounded-lg space-y-4 ${
                  variant.is_active ? "border-border bg-muted/30" : "border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variant #{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={(checked) => updateVariant(variant.id, "is_active", checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8"
                      onClick={() => deleteVariant(variant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Color */}
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Select
                      value={variant.color || ""}
                      onValueChange={(value) => selectColor(variant.id, value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select color">
                          {variant.color && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: variant.color_code || "#ccc" }}
                              />
                              {variant.color}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color.id} value={color.name}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: color.color_code }}
                              />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Size */}
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Select
                      value={variant.size || ""}
                      onValueChange={(value) => updateVariant(variant.id, "size", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map((size) => (
                          <SelectItem key={size.id} value={size.name}>
                            {size.name} {size.name_bn && `(${size.name_bn})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SKU */}
                  <div>
                    <Label className="text-xs">SKU</Label>
                    <Input
                      value={variant.sku || ""}
                      onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
                      placeholder="SKU-001"
                      className="mt-1"
                    />
                  </div>

                  {/* Price Adjustment */}
                  <div>
                    <Label className="text-xs">Price +/-</Label>
                    <Input
                      type="number"
                      value={variant.price_adjustment}
                      onChange={(e) =>
                        updateVariant(variant.id, "price_adjustment", parseFloat(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <Label className="text-xs">Stock</Label>
                    <Input
                      type="number"
                      min={0}
                      value={variant.stock_quantity}
                      onChange={(e) =>
                        updateVariant(variant.id, "stock_quantity", parseInt(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductVariantEditor;
