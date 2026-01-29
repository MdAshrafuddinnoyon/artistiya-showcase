import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, GripVertical, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import BulkSelectionToolbar from "./BulkSelectionToolbar";
import CategoryExportImport from "./CategoryExportImport";

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number | null;
  parent_id: string | null;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    name_bn: "",
    slug: "",
    description: "",
    image_url: "",
    display_order: "0",
    parent_id: "",
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryData = {
      name: formData.name,
      name_bn: formData.name_bn || null,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description || null,
      image_url: formData.image_url || null,
      display_order: parseInt(formData.display_order) || 0,
      parent_id: formData.parent_id || null,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase.from("categories").insert(categoryData);

        if (error) throw error;
        toast.success("Category created");
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_bn: category.name_bn || "",
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      display_order: (category.display_order || 0).toString(),
      parent_id: category.parent_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will affect all products in this category.")) return;

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} categories? This will affect related products.`)) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;
      toast.success(`Deleted ${selectedIds.length} categories`);
      setSelectedIds([]);
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete categories");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      name_bn: "",
      slug: "",
      description: "",
      image_url: "",
      display_order: "0",
      parent_id: "",
    });
  };

  // Build tree structure for display
  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildren(category.id);

    return (
      <div key={category.id}>
        <div
          className={`bg-card border border-border rounded-xl overflow-hidden group ${level > 0 ? "ml-8" : ""}`}
        >
          <div className="flex items-center">
            <div className="p-3">
              <Checkbox
                checked={selectedIds.includes(category.id)}
                onCheckedChange={() => toggleSelect(category.id)}
              />
            </div>
            <div className="h-24 w-24 bg-muted relative overflow-hidden flex-shrink-0">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-1">
                {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <h3 className="font-display text-lg text-foreground">{category.name}</h3>
                <span className="text-xs text-muted-foreground">#{category.display_order || 0}</span>
              </div>
              {category.name_bn && (
                <p className="text-sm text-gold font-bengali">{category.name_bn}</p>
              )}
              <p className="text-xs text-muted-foreground">{category.slug}</p>
              {category.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{category.description}</p>
              )}
            </div>
            <div className="p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="secondary" size="icon" onClick={() => handleEdit(category)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {children.map((child) => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h1 className="font-display text-2xl text-foreground">Categories</h1>
        <div className="flex gap-3">
          <CategoryExportImport categories={categories} onImportComplete={fetchCategories} />
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name (English) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="parent_id">Parent Category</Label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (Top Level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {categories
                        .filter((c) => c.id !== editingCategory?.id)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" variant="gold" className="flex-1">
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Selection Toolbar */}
      <BulkSelectionToolbar
        selectedIds={selectedIds}
        totalCount={categories.length}
        onSelectAll={() => setSelectedIds(categories.map((c) => c.id))}
        onDeselectAll={() => setSelectedIds([])}
        onBulkDelete={handleBulkDelete}
      />

      {/* Categories List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-24 bg-muted rounded-lg" />
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No categories found
          </div>
        ) : (
          parentCategories.map((category) => renderCategory(category))
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
