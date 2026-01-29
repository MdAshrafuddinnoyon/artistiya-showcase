import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, GripVertical, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import BulkSelectionToolbar from "./BulkSelectionToolbar";

interface BlogCategory {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  parent_id: string | null;
}

const AdminBlogCategories = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    name_bn: "",
    slug: "",
    description: "",
    is_active: true,
    parent_id: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const categoryData = {
        name: formData.name,
        name_bn: formData.name_bn || null,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        is_active: formData.is_active,
        display_order: editingCategory ? editingCategory.display_order : categories.length,
        parent_id: formData.parent_id || null,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from("blog_categories")
          .update(categoryData)
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast.success("Category updated!");
      } else {
        const { error } = await supabase.from("blog_categories").insert(categoryData);

        if (error) throw error;
        toast.success("Category created!");
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category");
    }
  };

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_bn: category.name_bn || "",
      slug: category.slug,
      description: category.description || "",
      is_active: category.is_active,
      parent_id: category.parent_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted!");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} categories?`)) return;

    try {
      const { error } = await supabase
        .from("blog_categories")
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
      is_active: true,
      parent_id: "",
    });
  };

  // Build tree structure
  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  const renderCategory = (category: BlogCategory, level: number = 0) => {
    const children = getChildren(category.id);

    return (
      <div key={category.id}>
        <div
          className={`bg-card border border-border rounded-lg p-4 flex items-center justify-between ${level > 0 ? "ml-8" : ""}`}
        >
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedIds.includes(category.id)}
              onCheckedChange={() => toggleSelect(category.id)}
            />
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <div>
              <div className="flex items-center gap-2">
                {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <h3 className="font-medium text-foreground">{category.name}</h3>
                {category.name_bn && (
                  <span className="text-sm text-muted-foreground font-bengali">({category.name_bn})</span>
                )}
                {!category.is_active && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">/{category.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handleDelete(category.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {children.map((child) => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Blog Categories</h2>
          <p className="text-sm text-muted-foreground">Organize your blog posts with categories and subcategories</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create Category"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name (English)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (!editingCategory) {
                        setFormData((prev) => ({
                          ...prev,
                          slug: generateSlug(e.target.value),
                        }));
                      }
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

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
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
                      .filter((c) => c.id !== editingCategory?.id && !c.parent_id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold">
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Selection Toolbar */}
      <BulkSelectionToolbar
        selectedIds={selectedIds}
        totalCount={categories.length}
        onSelectAll={() => setSelectedIds(categories.map((c) => c.id))}
        onDeselectAll={() => setSelectedIds([])}
        onBulkDelete={handleBulkDelete}
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">No categories yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {parentCategories.map((category) => renderCategory(category))}
        </div>
      )}
    </div>
  );
};

export default AdminBlogCategories;
