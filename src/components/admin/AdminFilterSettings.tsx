import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Image as ImageIcon, Layout, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FilterSetting {
  id: string;
  filter_key: string;
  filter_name: string;
  filter_name_bn?: string;
  filter_type: string;
  is_active: boolean;
  display_order: number;
  options: Record<string, any>;
}

interface ShopSettings {
  filter_position: string;
  show_sales_banner: boolean;
  sales_banner_position: string;
  sales_banner_text: string;
  sales_banner_text_bn: string;
  sales_banner_link: string;
  sales_banner_bg_color: string;
  sales_banner_text_color: string;
  show_promo_banner: boolean;
  promo_banner_position: string;
  promo_banner_image: string;
  promo_banner_link: string;
}

const filterTypes = [
  { value: "range", label: "Price Range Slider" },
  { value: "toggle", label: "Toggle (On/Off)" },
  { value: "checkbox", label: "Multi-Select Checkboxes" },
  { value: "select", label: "Single Select Dropdown" },
];

const positionOptions = [
  { value: "left", label: "Left Side" },
  { value: "right", label: "Right Side" },
];

const bannerPositionOptions = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left Sidebar" },
  { value: "right", label: "Right Sidebar" },
];

const AdminFilterSettings = () => {
  const [filters, setFilters] = useState<FilterSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<FilterSetting | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("filters");

  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    filter_position: "left",
    show_sales_banner: true,
    sales_banner_position: "top",
    sales_banner_text: "Big Sale! Up to 50% Off",
    sales_banner_text_bn: "বিশাল ছাড়! ৫০% পর্যন্ত ছাড়",
    sales_banner_link: "",
    sales_banner_bg_color: "#C9A961",
    sales_banner_text_color: "#000000",
    show_promo_banner: false,
    promo_banner_position: "right",
    promo_banner_image: "",
    promo_banner_link: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    filter_key: "",
    filter_name: "",
    filter_name_bn: "",
    filter_type: "toggle",
    is_active: true,
    options: {} as Record<string, any>,
  });

  const fetchFilters = async () => {
    const { data, error } = await supabase
      .from("filter_settings")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to load filters");
      console.error(error);
    } else {
      const mappedFilters: FilterSetting[] = (data || []).map((f) => ({
        id: f.id,
        filter_key: f.filter_key,
        filter_name: f.filter_name,
        filter_type: f.filter_type,
        is_active: f.is_active ?? true,
        display_order: f.display_order ?? 0,
        options: (typeof f.options === "object" && f.options !== null ? f.options : {}) as Record<string, any>,
      }));
      setFilters(mappedFilters);
    }
    setLoading(false);
  };

  const fetchShopSettings = async () => {
    const { data, error } = await supabase
      .from("shop_settings")
      .select("*")
      .single();

    if (!error && data) {
      setShopSettings({
        filter_position: data.filter_position || "left",
        show_sales_banner: data.show_sales_banner ?? true,
        sales_banner_position: data.sales_banner_position || "top",
        sales_banner_text: data.sales_banner_text || "",
        sales_banner_text_bn: data.sales_banner_text_bn || "",
        sales_banner_link: data.sales_banner_link || "",
        sales_banner_bg_color: data.sales_banner_bg_color || "#C9A961",
        sales_banner_text_color: data.sales_banner_text_color || "#000000",
        show_promo_banner: data.show_promo_banner ?? false,
        promo_banner_position: data.promo_banner_position || "right",
        promo_banner_image: data.promo_banner_image || "",
        promo_banner_link: data.promo_banner_link || "",
      });
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchShopSettings();

    // Realtime subscription with better error handling
    const channel = supabase
      .channel("filter_settings_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "filter_settings" },
        (payload) => {
          console.log("Admin: filter_settings changed:", payload.eventType, payload);
          fetchFilters();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shop_settings" },
        (payload) => {
          console.log("Admin: shop_settings changed:", payload.eventType);
          fetchShopSettings();
        }
      )
      .subscribe((status) => {
        console.log("Admin realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setFormData({
      filter_key: "",
      filter_name: "",
      filter_name_bn: "",
      filter_type: "toggle",
      is_active: true,
      options: {},
    });
    setEditingFilter(null);
  };

  const openDialog = (filter?: FilterSetting) => {
    if (filter) {
      setEditingFilter(filter);
      setFormData({
        filter_key: filter.filter_key,
        filter_name: filter.filter_name,
        filter_name_bn: (filter as any).filter_name_bn || "",
        filter_type: filter.filter_type,
        is_active: filter.is_active,
        options: filter.options || {},
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.filter_key || !formData.filter_name) {
      toast.error("Filter Key and Name are required");
      return;
    }

    setSaving(true);

    try {
      if (editingFilter) {
        const { error } = await supabase
          .from("filter_settings")
          .update({
            filter_key: formData.filter_key,
            filter_name: formData.filter_name,
            filter_type: formData.filter_type,
            is_active: formData.is_active,
            options: formData.options,
          })
          .eq("id", editingFilter.id);

        if (error) throw error;
        toast.success("Filter updated successfully");
      } else {
        const maxOrder = Math.max(0, ...filters.map((f) => f.display_order || 0));
        const { error } = await supabase.from("filter_settings").insert({
          filter_key: formData.filter_key,
          filter_name: formData.filter_name,
          filter_type: formData.filter_type,
          is_active: formData.is_active,
          display_order: maxOrder + 1,
          options: formData.options,
        });

        if (error) throw error;
        toast.success("Filter created successfully");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save filter");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this filter?")) return;

    const { error } = await supabase.from("filter_settings").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete filter");
    } else {
      toast.success("Filter deleted");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    console.log(`Toggling filter ${id} from ${currentState} to ${!currentState}`);
    
    const { error } = await supabase
      .from("filter_settings")
      .update({ is_active: !currentState })
      .eq("id", id);

    if (error) {
      console.error("Toggle error:", error);
      toast.error("Failed to update filter status");
    } else {
      console.log("Filter toggled successfully");
      toast.success(`Filter ${!currentState ? "enabled" : "disabled"}`);
      // Force immediate refetch
      fetchFilters();
    }
  };

  const handleReorder = async (filterId: string, direction: "up" | "down") => {
    const index = filters.findIndex((f) => f.id === filterId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= filters.length) return;

    const updatedFilters = [...filters];
    const [moved] = updatedFilters.splice(index, 1);
    updatedFilters.splice(newIndex, 0, moved);

    // Optimistic update
    setFilters(updatedFilters);

    // Update display_order
    for (let i = 0; i < updatedFilters.length; i++) {
      await supabase
        .from("filter_settings")
        .update({ display_order: i + 1 })
        .eq("id", updatedFilters[i].id);
    }

    toast.success("Filter order updated");
  };

  const handleSaveLayoutSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shop_settings")
        .update({
          filter_position: shopSettings.filter_position,
          show_sales_banner: shopSettings.show_sales_banner,
          sales_banner_position: shopSettings.sales_banner_position,
          sales_banner_text: shopSettings.sales_banner_text,
          sales_banner_text_bn: shopSettings.sales_banner_text_bn,
          sales_banner_link: shopSettings.sales_banner_link,
          sales_banner_bg_color: shopSettings.sales_banner_bg_color,
          sales_banner_text_color: shopSettings.sales_banner_text_color,
          show_promo_banner: shopSettings.show_promo_banner,
          promo_banner_position: shopSettings.promo_banner_position,
          promo_banner_image: shopSettings.promo_banner_image,
          promo_banner_link: shopSettings.promo_banner_link,
        })
        .not("id", "is", null);

      if (error) throw error;
      toast.success("Layout settings saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const getFilterTypeLabel = (type: string) => {
    return filterTypes.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display text-foreground">Filter & Layout Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage filters, banners, and layout positions. Real-time sync on desktop & mobile.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="filters" className="gap-2">
            <Sliders className="h-4 w-4" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-2">
            <Layout className="h-4 w-4" />
            Layout & Position
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Banners
          </TabsTrigger>
        </TabsList>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" onClick={() => openDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingFilter ? "Edit Filter" : "Add New Filter"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter_key">Filter Key (unique identifier)</Label>
                    <Input
                      id="filter_key"
                      value={formData.filter_key}
                      onChange={(e) =>
                        setFormData({ ...formData, filter_key: e.target.value.toLowerCase().replace(/\s+/g, "_") })
                      }
                      placeholder="e.g., price_range, color, size"
                      disabled={!!editingFilter}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter_name">Filter Name (English)</Label>
                    <Input
                      id="filter_name"
                      value={formData.filter_name}
                      onChange={(e) => setFormData({ ...formData, filter_name: e.target.value })}
                      placeholder="e.g., Price Range, Color, Size"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter_name_bn">Filter Name (Bengali)</Label>
                    <Input
                      id="filter_name_bn"
                      value={formData.filter_name_bn}
                      onChange={(e) => setFormData({ ...formData, filter_name_bn: e.target.value })}
                      placeholder="e.g., মূল্য সীমা, রং, সাইজ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter_type">Filter Type</Label>
                    <Select
                      value={formData.filter_type}
                      onValueChange={(value) => setFormData({ ...formData, filter_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.filter_type === "range" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Value</Label>
                        <Input
                          type="number"
                          value={formData.options.min || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              options: { ...formData.options, min: Number(e.target.value) },
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Value</Label>
                        <Input
                          type="number"
                          value={formData.options.max || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              options: { ...formData.options, max: Number(e.target.value) },
                            })
                          }
                          placeholder="50000"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="gold" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Filter"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Filters</CardTitle>
              <CardDescription>
                Use arrows to reorder filters. Toggle to enable/disable. Order determines display priority.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No filters configured. Click "Add Filter" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Order</TableHead>
                      <TableHead>Filter Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filters.map((filter, index) => (
                      <TableRow key={filter.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              {index + 1}
                            </span>
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleReorder(filter.id, "up")}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleReorder(filter.id, "down")}
                                disabled={index === filters.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{filter.filter_name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{filter.filter_key}</code>
                        </TableCell>
                        <TableCell>{getFilterTypeLabel(filter.filter_type)}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={filter.is_active}
                            onCheckedChange={() => handleToggleActive(filter.id, filter.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDialog(filter)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(filter.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filter Position</CardTitle>
              <CardDescription>
                Choose where to display filters on the Shop page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {positionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setShopSettings({ ...shopSettings, filter_position: option.value })}
                    className={`p-6 border rounded-lg text-center transition-all ${
                      shopSettings.filter_position === option.value
                        ? "border-gold bg-gold/10 ring-2 ring-gold"
                        : "border-border hover:border-gold/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {option.value === "left" ? (
                        <div className="flex gap-1">
                          <div className="w-4 h-8 bg-gold rounded" />
                          <div className="w-12 h-8 bg-muted rounded" />
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <div className="w-12 h-8 bg-muted rounded" />
                          <div className="w-4 h-8 bg-gold rounded" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>

              <Button variant="gold" onClick={handleSaveLayoutSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Layout Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-6 mt-6">
          {/* Sales Banner */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales Banner</CardTitle>
                  <CardDescription>Promotional text banner for sales and offers</CardDescription>
                </div>
                <Switch
                  checked={shopSettings.show_sales_banner}
                  onCheckedChange={(checked) => setShopSettings({ ...shopSettings, show_sales_banner: checked })}
                />
              </div>
            </CardHeader>
            {shopSettings.show_sales_banner && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banner Text (English)</Label>
                    <Input
                      value={shopSettings.sales_banner_text}
                      onChange={(e) => setShopSettings({ ...shopSettings, sales_banner_text: e.target.value })}
                      placeholder="Big Sale! Up to 50% Off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Banner Text (Bengali)</Label>
                    <Input
                      value={shopSettings.sales_banner_text_bn}
                      onChange={(e) => setShopSettings({ ...shopSettings, sales_banner_text_bn: e.target.value })}
                      placeholder="বিশাল ছাড়! ৫০% পর্যন্ত ছাড়"
                      className="font-bengali"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Banner Link (optional)</Label>
                  <Input
                    value={shopSettings.sales_banner_link}
                    onChange={(e) => setShopSettings({ ...shopSettings, sales_banner_link: e.target.value })}
                    placeholder="/shop?sale=true"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={shopSettings.sales_banner_bg_color}
                        onChange={(e) => setShopSettings({ ...shopSettings, sales_banner_bg_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={shopSettings.sales_banner_bg_color}
                        onChange={(e) => setShopSettings({ ...shopSettings, sales_banner_bg_color: e.target.value })}
                        placeholder="#C9A961"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={shopSettings.sales_banner_text_color}
                        onChange={(e) => setShopSettings({ ...shopSettings, sales_banner_text_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={shopSettings.sales_banner_text_color}
                        onChange={(e) => setShopSettings({ ...shopSettings, sales_banner_text_color: e.target.value })}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Banner Position (উপরে/নিচে)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShopSettings({ ...shopSettings, sales_banner_position: "top" })}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        shopSettings.sales_banner_position === "top"
                          ? "border-gold bg-gold/10 ring-2 ring-gold"
                          : "border-border hover:border-gold/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="w-full h-2 bg-gold rounded" />
                        <div className="w-full h-6 bg-muted rounded" />
                        <div className="w-full h-6 bg-muted rounded" />
                      </div>
                      <span className="font-medium text-sm">Top (উপরে)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShopSettings({ ...shopSettings, sales_banner_position: "bottom" })}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        shopSettings.sales_banner_position === "bottom"
                          ? "border-gold bg-gold/10 ring-2 ring-gold"
                          : "border-border hover:border-gold/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="w-full h-6 bg-muted rounded" />
                        <div className="w-full h-6 bg-muted rounded" />
                        <div className="w-full h-2 bg-gold rounded" />
                      </div>
                      <span className="font-medium text-sm">Bottom (নিচে)</span>
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div
                    className="p-4 rounded-lg text-center font-medium"
                    style={{
                      backgroundColor: shopSettings.sales_banner_bg_color,
                      color: shopSettings.sales_banner_text_color,
                    }}
                  >
                    {shopSettings.sales_banner_text || "Sales Banner Preview"}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Promo Image Banner */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Promo Image Banner</CardTitle>
                  <CardDescription>Image banner for promotions (sidebar or top/bottom)</CardDescription>
                </div>
                <Switch
                  checked={shopSettings.show_promo_banner}
                  onCheckedChange={(checked) => setShopSettings({ ...shopSettings, show_promo_banner: checked })}
                />
              </div>
            </CardHeader>
            {shopSettings.show_promo_banner && (
              <CardContent className="space-y-4">
                <ImageUploadZone
                  value={shopSettings.promo_banner_image}
                  onChange={(url) => setShopSettings({ ...shopSettings, promo_banner_image: url })}
                  onRemove={() => setShopSettings({ ...shopSettings, promo_banner_image: "" })}
                  label="Banner Image"
                  bucket="media"
                  folder="banners"
                  aspectRatio="portrait"
                />

                <div className="space-y-2">
                  <Label>Banner Link (optional)</Label>
                  <Input
                    value={shopSettings.promo_banner_link}
                    onChange={(e) => setShopSettings({ ...shopSettings, promo_banner_link: e.target.value })}
                    placeholder="/collections/new"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Banner Position</Label>
                  <Select
                    value={shopSettings.promo_banner_position}
                    onValueChange={(value) => setShopSettings({ ...shopSettings, promo_banner_position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bannerPositionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            )}
          </Card>

          <Button variant="gold" onClick={handleSaveLayoutSettings} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Banner Settings"}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-gold/5 border-gold/20">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground mb-2">Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Filter Order:</strong> Use arrows to reorder filters. Top filters appear first.</li>
            <li>• <strong>Filter Position:</strong> Choose left or right sidebar for filter placement.</li>
            <li>• <strong>Sales Banner:</strong> Text-based banner for promotional messages.</li>
            <li>• <strong>Promo Banner:</strong> Image banner for visual promotions.</li>
            <li>• Changes apply instantly to both desktop and mobile views.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFilterSettings;