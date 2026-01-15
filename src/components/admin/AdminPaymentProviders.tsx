import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X, CreditCard } from "lucide-react";
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

interface PaymentProvider {
  id: string;
  name: string;
  provider_type: string;
  store_id: string | null;
  store_password: string | null;
  is_active: boolean;
  is_sandbox: boolean;
  config: any;
}

const providerTypes = [
  { value: "cod", label: "Cash on Delivery", logo: "💵", requiresApi: false },
  { value: "bkash", label: "bKash", logo: "🔴", requiresApi: true },
  { value: "nagad", label: "Nagad", logo: "🟠", requiresApi: true },
  { value: "sslcommerz", label: "SSLCommerz", logo: "🔒", requiresApi: true },
  { value: "stripe", label: "Stripe", logo: "💳", requiresApi: true },
  { value: "paypal", label: "PayPal", logo: "🅿️", requiresApi: true },
  { value: "bank_transfer", label: "Bank Transfer", logo: "🏦", requiresApi: false },
];

const AdminPaymentProviders = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    provider_type: "",
    store_id: "",
    store_password: "",
    is_active: false,
    is_sandbox: true,
    // bKash specific
    bkash_username: "",
    bkash_password: "",
    // Nagad specific
    nagad_public_key: "",
    nagad_private_key: "",
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_providers")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to fetch payment providers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Build config based on provider type
      let config: Record<string, string> = {};
      if (formData.provider_type === "bkash") {
        config = {
          username: formData.bkash_username,
          password: formData.bkash_password,
        };
      } else if (formData.provider_type === "nagad") {
        config = {
          public_key: formData.nagad_public_key,
          private_key: formData.nagad_private_key,
        };
      }

      const providerData = {
        name: formData.name,
        provider_type: formData.provider_type,
        store_id: formData.store_id || null,
        store_password: formData.store_password || null,
        is_active: formData.is_active,
        is_sandbox: formData.is_sandbox,
        config,
      };

      if (editingProvider) {
        const { error } = await supabase
          .from("payment_providers")
          .update(providerData)
          .eq("id", editingProvider.id);

        if (error) throw error;
        toast.success("Provider updated!");
      } else {
        const { error } = await supabase.from("payment_providers").insert(providerData);

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

  const handleEdit = (provider: PaymentProvider) => {
    setEditingProvider(provider);
    const config = provider.config || {};
    setFormData({
      name: provider.name,
      provider_type: provider.provider_type,
      store_id: provider.store_id || "",
      store_password: provider.store_password || "",
      is_active: provider.is_active,
      is_sandbox: provider.is_sandbox,
      bkash_username: config.username || "",
      bkash_password: config.password || "",
      nagad_public_key: config.public_key || "",
      nagad_private_key: config.private_key || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) return;

    try {
      const { error } = await supabase.from("payment_providers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Provider deleted!");
      fetchProviders();
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast.error("Failed to delete provider");
    }
  };

  const toggleActive = async (provider: PaymentProvider) => {
    try {
      const { error } = await supabase
        .from("payment_providers")
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
      store_id: "",
      store_password: "",
      is_active: false,
      is_sandbox: true,
      bkash_username: "",
      bkash_password: "",
      nagad_public_key: "",
      nagad_private_key: "",
    });
  };

  const getProviderInfo = (type: string) => {
    return providerTypes.find((p) => p.value === type) || { label: type, logo: "💳", requiresApi: false };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Payment Providers</h1>
          <p className="text-muted-foreground">
            Configure payment gateway integrations
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
                {editingProvider ? "Edit Provider" : "Add Payment Provider"}
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

              {formData.provider_type && getProviderInfo(formData.provider_type).requiresApi && (
                <>
                  {/* bKash specific fields */}
                  {formData.provider_type === "bkash" && (
                    <>
                      <div>
                        <Label htmlFor="store_id">App Key</Label>
                        <Input
                          id="store_id"
                          value={formData.store_id}
                          onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                          placeholder="bKash App Key"
                        />
                      </div>

                      <div>
                        <Label htmlFor="store_password">App Secret</Label>
                        <Input
                          id="store_password"
                          type="password"
                          value={formData.store_password}
                          onChange={(e) =>
                            setFormData({ ...formData, store_password: e.target.value })
                          }
                          placeholder="bKash App Secret"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bkash_username">Username</Label>
                        <Input
                          id="bkash_username"
                          value={formData.bkash_username}
                          onChange={(e) => setFormData({ ...formData, bkash_username: e.target.value })}
                          placeholder="bKash Username"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bkash_password">Password</Label>
                        <Input
                          id="bkash_password"
                          type="password"
                          value={formData.bkash_password}
                          onChange={(e) => setFormData({ ...formData, bkash_password: e.target.value })}
                          placeholder="bKash Password"
                        />
                      </div>
                    </>
                  )}

                  {/* Nagad specific fields */}
                  {formData.provider_type === "nagad" && (
                    <>
                      <div>
                        <Label htmlFor="store_id">Merchant ID</Label>
                        <Input
                          id="store_id"
                          value={formData.store_id}
                          onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                          placeholder="Nagad Merchant ID"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nagad_public_key">Public Key</Label>
                        <textarea
                          id="nagad_public_key"
                          value={formData.nagad_public_key}
                          onChange={(e) => setFormData({ ...formData, nagad_public_key: e.target.value })}
                          placeholder="-----BEGIN PUBLIC KEY-----"
                          className="w-full h-24 px-3 py-2 text-sm border border-input rounded-md bg-background"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nagad_private_key">Private Key</Label>
                        <textarea
                          id="nagad_private_key"
                          value={formData.nagad_private_key}
                          onChange={(e) => setFormData({ ...formData, nagad_private_key: e.target.value })}
                          placeholder="-----BEGIN PRIVATE KEY-----"
                          className="w-full h-24 px-3 py-2 text-sm border border-input rounded-md bg-background"
                        />
                      </div>
                    </>
                  )}

                  {/* Generic fields for other providers */}
                  {!["bkash", "nagad"].includes(formData.provider_type) && (
                    <>
                      <div>
                        <Label htmlFor="store_id">Store ID / API Key</Label>
                        <Input
                          id="store_id"
                          value={formData.store_id}
                          onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                          placeholder="Enter store ID or API key"
                        />
                      </div>

                      <div>
                        <Label htmlFor="store_password">Store Password / Secret Key</Label>
                        <Input
                          id="store_password"
                          type="password"
                          value={formData.store_password}
                          onChange={(e) =>
                            setFormData({ ...formData, store_password: e.target.value })
                          }
                          placeholder="Enter store password or secret"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_sandbox}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_sandbox: checked })
                      }
                    />
                    <Label>Sandbox / Test Mode</Label>
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
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No payment providers configured</p>
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
                      {provider.is_sandbox && info.requiresApi && (
                        <Badge variant="outline" className="text-yellow-500">
                          Sandbox
                        </Badge>
                      )}
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

export default AdminPaymentProviders;