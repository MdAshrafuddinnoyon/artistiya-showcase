import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X, Truck, TestTube, Globe, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  { value: "pathao", label: "Pathao Courier", logo: "🚚", fields: ["client_id", "client_secret", "username", "password"], sandboxInfo: "Sandbox: hermes-api.pathao.com — Get credentials from Pathao Merchant Dashboard > Developers API" },
  { value: "redx", label: "RedX", logo: "🔴", fields: ["access_token"], sandboxInfo: "Sandbox: sandbox.redx.com.bd — Contact RedX for sandbox access token" },
  { value: "paperfly", label: "Paperfly", logo: "✈️", fields: ["username", "password", "merchant_name", "pickup_address", "pickup_phone"], sandboxInfo: "API Key: Paperfly_~La?Rj73FcLm — Get merchant credentials from Paperfly WINGS" },
  { value: "steadfast", label: "Steadfast Courier", logo: "📦", fields: ["api_key", "secret_key"], sandboxInfo: "Get API credentials from Steadfast Merchant Panel" },
  { value: "ecourier", label: "eCourier", logo: "📬", fields: ["api_key", "api_secret", "user_id"], sandboxInfo: "Get credentials from eCourier merchant panel" },
  { value: "dhl", label: "DHL Express", logo: "🌍", fields: ["api_key"], sandboxInfo: "" },
  { value: "fedex", label: "FedEx", logo: "📮", fields: ["api_key"], sandboxInfo: "" },
  { value: "manual", label: "Manual Delivery", logo: "🏍️", fields: [], sandboxInfo: "" },
];

const AdminDeliveryProviders = () => {
  const [providers, setProviders] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<DeliveryProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    provider_type: "",
    api_key: "",
    api_secret: "",
    is_active: false,
    is_sandbox: true,
    // Pathao specific
    client_id: "",
    client_secret: "",
    username: "",
    password: "",
    // Paperfly specific
    merchant_name: "",
    pickup_address: "",
    pickup_phone: "",
    pickup_thana: "",
    pickup_district: "",
  });

  useEffect(() => {
    fetchProviders();
    const channel = supabase
      .channel("delivery_providers_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "delivery_providers" }, () => fetchProviders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
      const credentialsToEncrypt: Record<string, string> = {};
      if (formData.api_key) credentialsToEncrypt.api_key = formData.api_key;
      if (formData.api_secret) credentialsToEncrypt.api_secret = formData.api_secret;

      let encryptedCreds: Record<string, string> = {};
      if (Object.keys(credentialsToEncrypt).length > 0) {
        const { data: encryptResult, error: encryptError } = await supabase.functions.invoke(
          "encrypt-credentials", { body: { credentials: credentialsToEncrypt } }
        );
        if (!encryptError && encryptResult?.encrypted) {
          encryptedCreds = encryptResult.encrypted;
        } else {
          encryptedCreds = credentialsToEncrypt;
        }
      }

      // Build config with provider-specific fields
      const config: Record<string, any> = {
        is_sandbox: formData.is_sandbox,
      };

      if (formData.provider_type === "pathao") {
        config.client_id = formData.client_id || formData.api_key;
        config.client_secret = formData.client_secret || formData.api_secret;
        config.username = formData.username;
        config.password = formData.password;
      } else if (formData.provider_type === "paperfly") {
        config.username = formData.username;
        config.password = formData.password;
        config.merchant_name = formData.merchant_name;
        config.pickup_address = formData.pickup_address;
        config.pickup_phone = formData.pickup_phone;
        config.pickup_thana = formData.pickup_thana;
        config.pickup_district = formData.pickup_district;
      }

      const providerData = {
        name: formData.name,
        provider_type: formData.provider_type,
        api_key: encryptedCreds.api_key || formData.api_key || null,
        api_secret: encryptedCreds.api_secret || formData.api_secret || null,
        is_active: formData.is_active,
        config,
      };

      if (editingProvider) {
        const { error } = await supabase.from("delivery_providers").update(providerData).eq("id", editingProvider.id);
        if (error) throw error;
        toast.success("Provider updated!");
      } else {
        const { error } = await supabase.from("delivery_providers").insert(providerData);
        if (error) throw error;
        toast.success("Provider added!");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving provider:", error);
      toast.error(error.message || "Failed to save provider");
    }
  };

  const handleEdit = (provider: DeliveryProvider) => {
    setEditingProvider(provider);
    const config = provider.config || {};
    setFormData({
      name: provider.name,
      provider_type: provider.provider_type,
      api_key: provider.api_key || "",
      api_secret: provider.api_secret || "",
      is_active: provider.is_active,
      is_sandbox: config.is_sandbox !== false,
      client_id: config.client_id || "",
      client_secret: config.client_secret || "",
      username: config.username || "",
      password: config.password || "",
      merchant_name: config.merchant_name || "",
      pickup_address: config.pickup_address || "",
      pickup_phone: config.pickup_phone || "",
      pickup_thana: config.pickup_thana || "",
      pickup_district: config.pickup_district || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from("delivery_providers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Provider deleted!");
    } catch (error) {
      toast.error("Failed to delete provider");
    }
  };

  const toggleActive = async (provider: DeliveryProvider) => {
    try {
      const { error } = await supabase.from("delivery_providers")
        .update({ is_active: !provider.is_active }).eq("id", provider.id);
      if (error) throw error;
      toast.success(provider.is_active ? "Provider disabled" : "Provider enabled");
    } catch (error) {
      toast.error("Failed to update provider");
    }
  };

  const testConnection = async (provider: DeliveryProvider) => {
    setTestingProvider(provider.id);
    try {
      let action = "";
      if (provider.provider_type === "pathao") action = "cities";
      else if (provider.provider_type === "redx") action = "areas";
      else {
        toast.info("Connection test not available for this provider yet");
        setTestingProvider(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke("delivery-api", {
        body: {
          provider_type: provider.provider_type,
          action,
          provider_id: provider.id,
        },
      });

      if (error) throw error;
      toast.success(`✅ ${provider.name} connection successful!`);
    } catch (error: any) {
      toast.error(`❌ Connection failed: ${error.message}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const resetForm = () => {
    setEditingProvider(null);
    setFormData({
      name: "", provider_type: "", api_key: "", api_secret: "",
      is_active: false, is_sandbox: true, client_id: "", client_secret: "",
      username: "", password: "", merchant_name: "", pickup_address: "",
      pickup_phone: "", pickup_thana: "", pickup_district: "",
    });
  };

  const getProviderInfo = (type: string) => {
    return providerTypes.find((p) => p.value === type) || { label: type, logo: "📦", fields: [], sandboxInfo: "" };
  };

  const currentProviderType = providerTypes.find(p => p.value === formData.provider_type);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Delivery Providers</h1>
          <p className="text-muted-foreground">Configure delivery & courier API integrations</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProvider ? "Edit Provider" : "Add Delivery Provider"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Provider Type</Label>
                <Select value={formData.provider_type}
                  onValueChange={(value) => {
                    const provider = getProviderInfo(value);
                    setFormData({ ...formData, provider_type: value, name: formData.name || provider.label });
                  }}>
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    {providerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.logo}</span> <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Display Name</Label>
                <Input value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              {/* Pathao specific fields */}
              {formData.provider_type === "pathao" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Pathao API Credentials</CardTitle>
                    <CardDescription>Get from Pathao Merchant Dashboard → Developers API</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Client ID</Label>
                        <Input value={formData.client_id}
                          onChange={(e) => setFormData({ ...formData, client_id: e.target.value, api_key: e.target.value })}
                          placeholder="Pathao Client ID" />
                      </div>
                      <div>
                        <Label>Client Secret</Label>
                        <Input type="password" value={formData.client_secret}
                          onChange={(e) => setFormData({ ...formData, client_secret: e.target.value, api_secret: e.target.value })}
                          placeholder="Pathao Client Secret" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Username (Email)</Label>
                        <Input value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="merchant@email.com" />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input type="password" value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Pathao password" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RedX fields */}
              {formData.provider_type === "redx" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">RedX API Credentials</CardTitle>
                    <CardDescription>Contact RedX support for API access token</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Access Token</Label>
                      <Input value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        placeholder="RedX API Access Token" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Paperfly fields */}
              {formData.provider_type === "paperfly" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Paperfly WINGS Credentials</CardTitle>
                    <CardDescription>Get from Paperfly Merchant Panel</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Username</Label>
                        <Input value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value, api_key: e.target.value })}
                          placeholder="Merchant Username" />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input type="password" value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value, api_secret: e.target.value })}
                          placeholder="Merchant Password" />
                      </div>
                    </div>
                    <div>
                      <Label>Merchant/Shop Name</Label>
                      <Input value={formData.merchant_name}
                        onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                        placeholder="Your shop name" />
                    </div>
                    <div>
                      <Label>Pickup Address</Label>
                      <Input value={formData.pickup_address}
                        onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                        placeholder="Pickup location address" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Pickup Phone</Label>
                        <Input value={formData.pickup_phone}
                          onChange={(e) => setFormData({ ...formData, pickup_phone: e.target.value })}
                          placeholder="01XXXXXXXXX" />
                      </div>
                      <div>
                        <Label>Pickup Thana</Label>
                        <Input value={formData.pickup_thana}
                          onChange={(e) => setFormData({ ...formData, pickup_thana: e.target.value })}
                          placeholder="Thana name" />
                      </div>
                      <div>
                        <Label>Pickup District</Label>
                        <Input value={formData.pickup_district}
                          onChange={(e) => setFormData({ ...formData, pickup_district: e.target.value })}
                          placeholder="District" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generic fields for other providers */}
              {formData.provider_type && !["pathao", "redx", "paperfly", "manual"].includes(formData.provider_type) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">API Credentials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>API Key</Label>
                      <Input value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        placeholder="API Key" />
                    </div>
                    <div>
                      <Label>API Secret / Password</Label>
                      <Input type="password" value={formData.api_secret}
                        onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                        placeholder="API Secret" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {formData.provider_type && formData.provider_type !== "manual" && (
                <>
                  <div className="flex items-center gap-2 p-3 bg-accent/50 border border-accent rounded-lg">
                    <Switch checked={formData.is_sandbox}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_sandbox: checked })} />
                    <Label className="font-medium">
                      {formData.is_sandbox ? "🧪 Sandbox / Test Mode" : "🔴 Live / Production Mode"}
                    </Label>
                  </div>
                  {currentProviderType?.sandboxInfo && formData.is_sandbox && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {currentProviderType.sandboxInfo}
                    </p>
                  )}
                </>
              )}

              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label>Enable this provider</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="gold">{editingProvider ? "Update" : "Add"}</Button>
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
            const isSandbox = provider.config?.is_sandbox !== false;
            return (
              <div key={provider.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{info.logo}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground">{provider.name}</h3>
                      <Badge variant={provider.is_active ? "default" : "secondary"}
                        className={provider.is_active ? "bg-primary/20 text-primary" : ""}>
                        {provider.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {isSandbox && (
                        <Badge variant="outline" className="gap-1">
                          <TestTube className="h-3 w-3" /> Sandbox
                        </Badge>
                      )}
                      {!isSandbox && provider.is_active && (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" /> Live
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm"
                    onClick={() => testConnection(provider)}
                    disabled={testingProvider === provider.id || provider.provider_type === "manual"}>
                    {testingProvider === provider.id ? "Testing..." : "Test"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(provider)}>
                    {provider.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(provider)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(provider.id)}>
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
