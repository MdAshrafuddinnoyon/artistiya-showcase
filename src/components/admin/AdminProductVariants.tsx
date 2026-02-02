import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Palette, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductColor {
  id: string;
  name: string;
  name_bn: string | null;
  color_code: string;
  display_order: number;
  is_active: boolean;
}

interface ProductSize {
  id: string;
  name: string;
  name_bn: string | null;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminProductVariants = () => {
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [newColor, setNewColor] = useState({ name: "", name_bn: "", color_code: "#000000" });
  const [newSize, setNewSize] = useState({ name: "", name_bn: "", category: "clothing" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [colorsRes, sizesRes] = await Promise.all([
        supabase.from("product_colors").select("*").order("display_order"),
        supabase.from("product_sizes").select("*").order("display_order"),
      ]);

      if (colorsRes.error) throw colorsRes.error;
      if (sizesRes.error) throw sizesRes.error;

      setColors(colorsRes.data || []);
      setSizes(sizesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load variant options");
    } finally {
      setLoading(false);
    }
  };

  const addColor = async () => {
    if (!newColor.name || !newColor.color_code) {
      toast.error("Please fill in color name and code");
      return;
    }

    try {
      const { error } = await supabase.from("product_colors").insert({
        name: newColor.name,
        name_bn: newColor.name_bn || null,
        color_code: newColor.color_code,
        display_order: colors.length,
      });

      if (error) throw error;
      toast.success("Color added");
      setNewColor({ name: "", name_bn: "", color_code: "#000000" });
      fetchData();
    } catch (error) {
      console.error("Error adding color:", error);
      toast.error("Failed to add color");
    }
  };

  const deleteColor = async (id: string) => {
    if (!confirm("Delete this color?")) return;

    try {
      const { error } = await supabase.from("product_colors").delete().eq("id", id);
      if (error) throw error;
      toast.success("Color deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting color:", error);
      toast.error("Failed to delete color");
    }
  };

  const toggleColor = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from("product_colors")
        .update({ is_active: !is_active })
        .eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error toggling color:", error);
    }
  };

  const addSize = async () => {
    if (!newSize.name) {
      toast.error("Please fill in size name");
      return;
    }

    try {
      const { error } = await supabase.from("product_sizes").insert({
        name: newSize.name,
        name_bn: newSize.name_bn || null,
        category: newSize.category,
        display_order: sizes.length,
      });

      if (error) throw error;
      toast.success("Size added");
      setNewSize({ name: "", name_bn: "", category: "clothing" });
      fetchData();
    } catch (error) {
      console.error("Error adding size:", error);
      toast.error("Failed to add size");
    }
  };

  const deleteSize = async (id: string) => {
    if (!confirm("Delete this size?")) return;

    try {
      const { error } = await supabase.from("product_sizes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Size deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting size:", error);
      toast.error("Failed to delete size");
    }
  };

  const toggleSize = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from("product_sizes")
        .update({ is_active: !is_active })
        .eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error toggling size:", error);
    }
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
      <div>
        <h2 className="font-display text-xl text-foreground">Product Variant Options</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage available colors and sizes for products
        </p>
      </div>

      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="sizes" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Sizes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6 space-y-6">
          {/* Add New Color */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Add New Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <Label>Color Name (English)</Label>
                  <Input
                    value={newColor.name}
                    onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                    placeholder="Red"
                    className="mt-1.5 w-40"
                  />
                </div>
                <div>
                  <Label>Color Name (বাংলা)</Label>
                  <Input
                    value={newColor.name_bn}
                    onChange={(e) => setNewColor({ ...newColor, name_bn: e.target.value })}
                    placeholder="লাল"
                    className="mt-1.5 w-40 font-bengali"
                  />
                </div>
                <div>
                  <Label>Color Code</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      type="color"
                      value={newColor.color_code}
                      onChange={(e) => setNewColor({ ...newColor, color_code: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={newColor.color_code}
                      onChange={(e) => setNewColor({ ...newColor, color_code: e.target.value })}
                      placeholder="#000000"
                      className="w-28"
                    />
                  </div>
                </div>
                <Button variant="gold" onClick={addColor}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Color
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Colors List */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {colors.map((color) => (
              <Card
                key={color.id}
                className={`bg-card border-border ${!color.is_active ? "opacity-50" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg border border-border shadow-inner"
                      style={{ backgroundColor: color.color_code }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{color.name}</p>
                      {color.name_bn && (
                        <p className="text-xs text-muted-foreground font-bengali">{color.name_bn}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{color.color_code}</p>
                  <div className="flex items-center justify-between">
                    <Switch
                      checked={color.is_active}
                      onCheckedChange={() => toggleColor(color.id, color.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8"
                      onClick={() => deleteColor(color.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sizes" className="mt-6 space-y-6">
          {/* Add New Size */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-display">Add New Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <Label>Size Name (English)</Label>
                  <Input
                    value={newSize.name}
                    onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                    placeholder="XL"
                    className="mt-1.5 w-32"
                  />
                </div>
                <div>
                  <Label>Size Name (বাংলা)</Label>
                  <Input
                    value={newSize.name_bn}
                    onChange={(e) => setNewSize({ ...newSize, name_bn: e.target.value })}
                    placeholder="এক্সএল"
                    className="mt-1.5 w-32 font-bengali"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={newSize.category}
                    onChange={(e) => setNewSize({ ...newSize, category: e.target.value })}
                    className="mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="clothing">Clothing</option>
                    <option value="shoes">Shoes</option>
                    <option value="accessories">Accessories</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <Button variant="gold" onClick={addSize}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Size
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sizes by Category */}
          {["clothing", "shoes", "accessories", "general"].map((category) => {
            const categorySizes = sizes.filter((s) => s.category === category);
            if (categorySizes.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="font-display text-lg capitalize mb-4">{category} Sizes</h3>
                <div className="flex flex-wrap gap-3">
                  {categorySizes.map((size) => (
                    <Card
                      key={size.id}
                      className={`bg-card border-border ${!size.is_active ? "opacity-50" : ""}`}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-foreground">
                            {size.name}
                          </div>
                          {size.name_bn && (
                            <span className="text-xs text-muted-foreground font-bengali">
                              {size.name_bn}
                            </span>
                          )}
                        </div>
                        <Switch
                          checked={size.is_active}
                          onCheckedChange={() => toggleSize(size.id, size.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={() => deleteSize(size.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminProductVariants;
