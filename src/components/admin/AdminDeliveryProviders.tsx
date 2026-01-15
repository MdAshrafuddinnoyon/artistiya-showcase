import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeliveryProvider {
  id: string;
  name: string;
  provider_type: string;
  api_key: string | null;
  api_secret: string | null;
  is_active: boolean;
  config: any;
}

const providerTypes = [
  { value: "pathao", label: "Pathao Courier", logo: "🚚" },
  { value: "steadfast", label: "Steadfast Courier", logo: "📦" },
  { value: "redx", label: "RedX", logo: "🔴" },
  { value: "ecourier", label: "eCourier", logo: "📬" },
  { value: "paperfly", label: "Paperfly", logo: "✈️" },
  { value: "dhl", label: "DHL Express", logo: "🌍" },
  { value: "fedex", label: "FedEx", logo: "📮" },
  { value: "manual", label: "Manual Delivery", logo: "🏍️" },
];

const AdminDeliveryProviders = () => {
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<DeliveryProvider | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    provider_type: "",
    api_key: "",
    api_secret: "",
    is_active: false,
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_providers")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to fetch delivery providers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const providerData = {
        name: formData.name,
        provider_type: formData.provider_type,
        api_key: formData.api_key || null,
        api_secret: formData.api_secret || null,
        is_active: formData.is_active,
      };

      if (editingProvider) {
        const { error } = await supabase
          .from("delivery_providers")
          .update(providerData)
          .eq("id", editingProvider.id);

        if (error) throw error;
        toast.success("Provider updated!");
      } else {
        const { error } = await supabase.from("delivery_providers").insert(providerData);

        if (error) throw error;
        toast.success("Provider added!");
      }

      setDialogOpen(false);
      resetForm();
      fetchProviders();
    } catch (error: any) {
      console.error("Error saving provider:", error);
      toast.error(error.message || "Failed to save provider");
    }
  };

  const handleEdit = (provider: DeliveryProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      provider_type: provider.provider_type,
      api_key: provider.api_key || "",
      api_secret: provider.api_secret || "",
      is_active: provider.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) return;

    try {
      const { error } = await supabase.from("delivery_providers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Provider deleted!");
      fetchProviders();
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast.error("Failed to delete provider");
    }
  };

  const toggleActive = async (provider: DeliveryProvider) => {
    try {
      const { error } = await supabase
        .from("delivery_providers")
        .update({ is_active: !provider.is_active })
        .eq("id", provider.id);

      if (error) throw error;
      toast.success(provider.is_active ? "Provider disabled" : "Provider enabled");
      fetchProviders();
    } catch (error) {
      console.error("Error toggling provider:", error);
      toast.error("Failed to update provider");
    }
  };

  const resetForm = () => {
    setEditingProvider(null);
    setFormData({
      name: "",
      provider_type: "",
      api_key: "",
      api_secret: "",
      is_active: false,
    });
  };

  const getProviderInfo = (type: string) => {
    return providerTypes.find((p) => p.value === type) || { label: type, logo: "📦" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Delivery Providers</h1>
          <p className="text-muted-foreground">
            Configure delivery and courier integrations
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? "Edit Provider" : "Add Delivery Provider"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="provider_type">Provider Type</Label>
                <Select
                  value={formData.provider_type}
                  onValueChange={(value) => {
                    const provider = getProviderInfo(value);
                    setFormData({
                      ...formData,
                      provider_type: value,
                      name: formData.name || provider.label,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.logo}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {formData.provider_type && formData.provider_type !== "manual" && (
                <>
                  <div>
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="Enter API key"
                    />
                  </div>

                  <div>
                    <Label htmlFor="api_secret">API Secret / Password</Label>
                    <Input
                      id="api_secret"
                      type="password"
                      value={formData.api_secret}
                      onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                      placeholder="Enter API secret"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Enable this provider</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold">
                  {editingProvider ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No delivery providers configured</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => {
            const info = getProviderInfo(provider.provider_type);
            return (
              <div
                key={provider.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{info.logo}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{provider.name}</h3>
                      <Badge
                        variant={provider.is_active ? "default" : "secondary"}
                        className={provider.is_active ? "bg-green-500/20 text-green-500" : ""}
                      >
                        {provider.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(provider)}
                  >
                    {provider.is_active ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(provider)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryProviders;