import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, ChevronRight, Upload, Image, X, Maximize2, Smile } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BulkSelectionToolbar from "./BulkSelectionToolbar";
import CategoryExportImport from "./CategoryExportImport";
import MediaPickerModal from "./MediaPickerModal";

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number | null;
  parent_id: string | null;
  icon_name: string | null;
  icon_emoji: string | null;
  mobile_image_url: string | null;
}

// ─── Emoji Groups for Picker ─────────────────────────────────────────
const EMOJI_GROUPS = [
  {
    label: "Shopping",
    emojis: ["🛍️", "🛒", "💳", "🎁", "🏷️", "💰", "🎀", "📦", "🛺", "🚀"],
  },
  {
    label: "Fashion & Clothing",
    emojis: ["👗", "👘", "🥻", "🩱", "🩲", "👚", "👕", "🧥", "🥼", "🧣", "🧤", "🎩", "👒", "🪖", "👔", "👙"],
  },
  {
    label: "Accessories",
    emojis: ["💍", "📿", "💎", "🪬", "🧿", "⌚", "👓", "🕶️", "🥽", "🪮", "✨", "💫", "⭐", "🌟"],
  },
  {
    label: "Bags & Leather",
    emojis: ["👜", "👛", "👝", "🎒", "💼", "🧳", "🪣"],
  },
  {
    label: "Art & Crafts",
    emojis: ["🎨", "🖼️", "🖌️", "✂️", "🧶", "🪡", "🪢", "🧵", "🪷", "🌸", "🌺", "🌻", "🌹", "🪴"],
  },
  {
    label: "Home & Living",
    emojis: ["🏠", "🪴", "🕯️", "🪑", "🛋️", "🛏️", "🚿", "🪞", "🖼️", "🧺", "🧹", "🪣"],
  },
  {
    label: "Food & Kitchen",
    emojis: ["🍽️", "🥘", "🍳", "☕", "🫖", "🍵", "🧁", "🎂", "🍰", "🍫"],
  },
  {
    label: "Kids & Toys",
    emojis: ["🧸", "🪆", "🎠", "🎡", "🎢", "🎯", "🎮", "🧩", "🪀", "🪁"],
  },
  {
    label: "Nature",
    emojis: ["🌿", "🍃", "🌱", "🌲", "🌳", "🍀", "🌾", "🌵", "🦋", "🐝"],
  },
  {
    label: "Sports",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸"],
  },
];

// ─── Emoji Picker Component ───────────────────────────────────────────
const EmojiPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-background hover:border-primary transition-colors text-left"
        >
          <span className="text-2xl min-w-[2rem] text-center">
            {value || "🛍️"}
          </span>
          <span className="text-sm text-muted-foreground flex-1">
            {value ? "Click to change emoji" : "Click to pick emoji"}
          </span>
          <Smile className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="bottom" align="start">
        {/* Group Tabs */}
        <div className="flex overflow-x-auto border-b border-border scrollbar-none">
          {EMOJI_GROUPS.map((group, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveGroup(i)}
              className={`px-3 py-2 text-xs whitespace-nowrap flex-shrink-0 transition-colors ${
                activeGroup === i
                  ? "border-b-2 border-primary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {EMOJI_GROUPS[activeGroup].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              className={`text-xl p-1.5 rounded-lg hover:bg-muted transition-colors text-center leading-none ${
                value === emoji ? "bg-primary/10 ring-1 ring-primary" : ""
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Clear */}
        {value && (
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="w-full text-xs text-muted-foreground hover:text-destructive py-1 text-center transition-colors"
            >
              ✕ Clear emoji
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

// ─── Mobile Preview Component ─────────────────────────────────────────
const MobileCategoryPreview = ({
  name,
  emoji,
  imageUrl,
  mobileImageUrl,
}: {
  name: string;
  emoji: string;
  imageUrl: string;
  mobileImageUrl: string;
}) => {
  const displayImage = mobileImageUrl || imageUrl;
  const displayEmoji = emoji || "🛍️";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary/30 flex items-center justify-center bg-muted">
        {displayImage ? (
          <img
            src={displayImage}
            alt={name || "Category"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">{displayEmoji}</span>
        )}
      </div>
      <span className="text-xs text-center max-w-[64px] truncate text-foreground font-medium">
        {name || "Category"}
      </span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────
const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mobileMediaPickerOpen, setMobileMediaPickerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    name_bn: "",
    slug: "",
    description: "",
    image_url: "",
    display_order: "0",
    parent_id: "",
    icon_emoji: "",
    mobile_image_url: "",
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

  const handleImageUpload = async (file: File, field: "image_url" | "mobile_image_url") => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `category-${field === "mobile_image_url" ? "mobile-" : ""}${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, [field]: publicUrl }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
    setMediaPickerOpen(false);
  };

  const handleMobileMediaSelect = (url: string) => {
    setFormData((prev) => ({ ...prev, mobile_image_url: url }));
    setMobileMediaPickerOpen(false);
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
      icon_emoji: formData.icon_emoji || null,
      mobile_image_url: formData.mobile_image_url || null,
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
      icon_emoji: category.icon_emoji || "",
      mobile_image_url: category.mobile_image_url || "",
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
      icon_emoji: "",
      mobile_image_url: "",
    });
  };

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildren(category.id);
    const displayImage = category.mobile_image_url || category.image_url;
    const displayEmoji = category.icon_emoji || "🛍️";

    return (
      <div key={category.id}>
        <div className={`bg-card border border-border rounded-xl overflow-hidden group ${level > 0 ? "ml-8" : ""}`}>
          <div className="flex items-center">
            <div className="p-3">
              <Checkbox
                checked={selectedIds.includes(category.id)}
                onCheckedChange={() => toggleSelect(category.id)}
              />
            </div>

            {/* Thumbnail */}
            <div className="h-16 w-16 bg-muted relative overflow-hidden flex-shrink-0 rounded-full m-2 border-2 border-border">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  {displayEmoji}
                </div>
              )}
            </div>

            <div className="flex-1 p-4">
              <div className="flex items-center gap-2 mb-1">
                {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <h3 className="font-display text-lg text-foreground">{category.name}</h3>
                <span className="text-xs text-muted-foreground">#{category.display_order || 0}</span>
                {/* Icon type badge */}
                {category.mobile_image_url ? (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Mobile Img</span>
                ) : category.icon_emoji ? (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Emoji {category.icon_emoji}</span>
                ) : null}
              </div>
              {category.name_bn && (
                <p className="text-sm text-primary font-bengali">{category.name_bn}</p>
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
              <Button variant="destructive" size="icon" onClick={() => handleDelete(category.id)}>
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
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, "image_url");
          e.target.value = "";
        }}
      />
      <input
        type="file"
        ref={mobileFileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, "mobile_image_url");
          e.target.value = "";
        }}
      />

      {/* Media Picker Modals */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        accept="image/*"
        title="Select Category Image"
      />
      <MediaPickerModal
        open={mobileMediaPickerOpen}
        onClose={() => setMobileMediaPickerOpen(false)}
        onSelect={handleMobileMediaSelect}
        accept="image/*"
        title="Select Mobile Category Image"
      />

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <h1 className="font-display text-2xl text-foreground">Categories</h1>
        <div className="flex gap-3">
          <CategoryExportImport categories={categories} onImportComplete={fetchCategories} />

          {/* Add/Edit Dialog */}
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5 mt-4">

                {/* ── Basic Info ── */}
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
                    onValueChange={(value) =>
                      setFormData({ ...formData, parent_id: value === "none" ? "" : value })
                    }
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

                {/* ── Desktop Image ── */}
                <div>
                  <Label>Desktop / Main Image</Label>
                  <div className="mt-2">
                    {formData.image_url ? (
                      <div className="relative group w-full aspect-video rounded-lg overflow-hidden border border-border">
                        <img
                          src={formData.image_url}
                          alt="Category"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button type="button" size="icon" variant="secondary" onClick={() => setPreviewImage(formData.image_url)}>
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="secondary" onClick={() => setMediaPickerOpen(true)}>
                            <Image className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="icon" variant="destructive" onClick={() => setFormData((p) => ({ ...p, image_url: "" }))}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="w-full aspect-video rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setMediaPickerOpen(true)}
                      >
                        {uploading ? (
                          <div className="text-center">
                            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Click to add desktop image</p>
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-1" /> Upload
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setMediaPickerOpen(true)}>
                        <Image className="h-4 w-4 mr-1" /> Library
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ── Mobile Display Section ── */}
                <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">📱 Mobile Display Options</h4>
                    <span className="text-xs text-muted-foreground">Priority: Mobile Image → Emoji</span>
                  </div>

                  {/* Live Mobile Preview */}
                  <div className="flex items-center gap-4 p-3 bg-background rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground flex-1">Live Preview:</p>
                    <MobileCategoryPreview
                      name={formData.name}
                      emoji={formData.icon_emoji}
                      imageUrl={formData.image_url}
                      mobileImageUrl={formData.mobile_image_url}
                    />
                  </div>

                  {/* Emoji Picker */}
                  <div>
                    <Label className="mb-2 block">
                      Emoji Icon{" "}
                      <span className="text-muted-foreground font-normal">(shown when no mobile image)</span>
                    </Label>
                    <EmojiPicker
                      value={formData.icon_emoji}
                      onChange={(emoji) => setFormData((p) => ({ ...p, icon_emoji: emoji }))}
                    />
                  </div>

                  {/* Mobile-specific Image */}
                  <div>
                    <Label className="mb-2 block">
                      Mobile-Specific Image{" "}
                      <span className="text-muted-foreground font-normal">(overrides emoji, optional)</span>
                    </Label>
                    {formData.mobile_image_url ? (
                      <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background">
                        <img
                          src={formData.mobile_image_url}
                          alt="Mobile"
                          className="w-12 h-12 rounded-full object-cover border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{formData.mobile_image_url}</p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setFormData((p) => ({ ...p, mobile_image_url: "" }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => mobileFileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1" /> Upload Mobile Image
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setMobileMediaPickerOpen(true)}
                        >
                          <Image className="h-4 w-4 mr-1" /> From Library
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Description ── */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
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
              <div className="h-20 bg-muted rounded-lg" />
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
