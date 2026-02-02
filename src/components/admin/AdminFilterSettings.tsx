import { useState, useEffect } from "react";
import { Plus, GripVertical, Trash2, Edit2, Save, X, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

const filterTypes = [
  { value: "range", label: "Price Range Slider" },
  { value: "toggle", label: "Toggle (On/Off)" },
  { value: "checkbox", label: "Multi-Select Checkboxes" },
  { value: "select", label: "Single Select Dropdown" },
];

const AdminFilterSettings = () => {
  const [filters, setFilters] = useState<FilterSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<FilterSetting | null>(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchFilters();

    // Realtime subscription
    const channel = supabase
      .channel("filter_settings_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "filter_settings" },
        () => fetchFilters()
      )
      .subscribe();

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
        // Update existing
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
        // Create new
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
    const { error } = await supabase
      .from("filter_settings")
      .update({ is_active: !currentState })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update filter status");
    } else {
      toast.success(`Filter ${!currentState ? "enabled" : "disabled"}`);
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

    // Update display_order
    for (let i = 0; i < updatedFilters.length; i++) {
      await supabase
        .from("filter_settings")
        .update({ display_order: i + 1 })
        .eq("id", updatedFilters[i].id);
    }

    toast.success("Filter order updated");
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
          <h1 className="text-2xl font-display text-foreground">Filter Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage shop page filters. Changes will reflect on both desktop and mobile views in real-time.
          </p>
        </div>
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
            These filters appear on the Shop page. Drag to reorder. Toggle to enable/disable.
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
                  <TableHead className="w-12">Order</TableHead>
                  <TableHead>Filter Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filters.map((filter, index) => (
                  <TableRow key={filter.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleReorder(filter.id, "up")}
                          disabled={index === 0}
                        >
                          ▲
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleReorder(filter.id, "down")}
                          disabled={index === filters.length - 1}
                        >
                          ▼
                        </Button>
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

      {/* Info Card */}
      <Card className="bg-gold/5 border-gold/20">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground mb-2">Available Filter Types</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><strong>Price Range Slider:</strong> Min-max slider for price filtering</li>
            <li><strong>Toggle:</strong> On/Off switch (e.g., Pre-order Only, In Stock)</li>
            <li><strong>Multi-Select Checkboxes:</strong> Select multiple options (e.g., Colors, Sizes)</li>
            <li><strong>Single Select Dropdown:</strong> Choose one option from a list</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFilterSettings;
