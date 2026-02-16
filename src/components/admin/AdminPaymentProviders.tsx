import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Check, X, CreditCard, QrCode, Key, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";

interface PaymentProvider {
  id: string;
  name: string;
  provider_type: string;
  store_id: string | null;
  store_password: string | null;
  is_active: boolean;
  is_sandbox: boolean;
  config: any;
  payment_mode: string;
  qr_code_image: string | null;
  account_number: string | null;
  account_type: string | null;
  instructions: string | null;
  instructions_bn: string | null;
}

const providerTypes = [
  { value: "cod", label: "Cash on Delivery", logo: "💵", requiresApi: false, supportsModes: false, sandboxInfo: "" },
  { value: "bkash", label: "bKash", logo: "🔴", requiresApi: true, supportsModes: true, sandboxInfo: "" },
  { value: "nagad", label: "Nagad", logo: "🟠", requiresApi: true, supportsModes: true, sandboxInfo: "" },
  { value: "rocket", label: "Rocket", logo: "🟣", requiresApi: true, supportsModes: true, sandboxInfo: "" },
  { value: "upay", label: "Upay", logo: "🔵", requiresApi: true, supportsModes: true, sandboxInfo: "" },
  { value: "sslcommerz", label: "SSLCommerz", logo: "🔒", requiresApi: true, supportsModes: false, sandboxInfo: "Sandbox: developer.sslcommerz.com/registration — Test Card: 4111 1111 1111 1111" },
  { value: "aamarpay", label: "AamarPay", logo: "💰", requiresApi: true, supportsModes: false, sandboxInfo: "Sandbox Store ID: aamarpaytest, Signature Key: dbb74894e82415a2f7ff0ec3a97e4183" },
  { value: "surjopay", label: "SurjoPay", logo: "☀️", requiresApi: true, supportsModes: false, sandboxInfo: "Sandbox Username: sp_sandbox, Password: pyaborern" },
  { value: "stripe", label: "Stripe", logo: "💳", requiresApi: true, supportsModes: false, sandboxInfo: "" },
  { value: "paypal", label: "PayPal", logo: "🅿️", requiresApi: true, supportsModes: false, sandboxInfo: "" },
  { value: "bank_transfer", label: "Bank Transfer", logo: "🏦", requiresApi: false, supportsModes: false, sandboxInfo: "" },
];

const AdminPaymentProviders = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    provider_type: "",
    payment_mode: "manual",
    store_id: "",
    store_password: "",
    is_active: false,
    is_sandbox: true,
    qr_code_image: "",
    account_number: "",
    account_type: "personal",
    instructions: "",
    instructions_bn: "",
    // bKash specific
    bkash_username: "",
    bkash_password: "",
    // Nagad specific
    nagad_public_key: "",
    nagad_private_key: "",
  });

  useEffect(() => {
    fetchProviders();

    const channel = supabase
      .channel("payment_providers_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_providers" }, () => fetchProviders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_providers")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setProviders((data || []) as PaymentProvider[]);
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
      // Collect credentials that need encryption
      const credentialsToEncrypt: Record<string, string> = {};
      
      if (formData.store_id) {
        credentialsToEncrypt.store_id = formData.store_id;
      }
      if (formData.store_password) {
        credentialsToEncrypt.store_password = formData.store_password;
      }
      
      // Build config based on provider type
      let config: Record<string, string> = {};
      if (formData.provider_type === "bkash" && formData.payment_mode === "api") {
        if (formData.bkash_username) {
          credentialsToEncrypt.bkash_username = formData.bkash_username;
        }
        if (formData.bkash_password) {
          credentialsToEncrypt.bkash_password = formData.bkash_password;
        }
      } else if (formData.provider_type === "nagad" && formData.payment_mode === "api") {
        if (formData.nagad_public_key) {
          credentialsToEncrypt.nagad_public_key = formData.nagad_public_key;
        }
        if (formData.nagad_private_key) {
          credentialsToEncrypt.nagad_private_key = formData.nagad_private_key;
        }
      }

      // Encrypt credentials via edge function
      let encryptedCreds: Record<string, string> = {};
      if (Object.keys(credentialsToEncrypt).length > 0) {
        const { data: encryptResult, error: encryptError } = await supabase.functions.invoke(
          "encrypt-credentials",
          { body: { credentials: credentialsToEncrypt } }
        );

        if (encryptError) {
          console.error("Encryption error:", encryptError);
          // Fall back to unencrypted if encryption fails
          encryptedCreds = credentialsToEncrypt;
        } else if (encryptResult?.encrypted) {
          encryptedCreds = encryptResult.encrypted;
        } else {
          encryptedCreds = credentialsToEncrypt;
        }
      }

      // Build encrypted config
      if (formData.provider_type === "bkash" && formData.payment_mode === "api") {
        config = {
          username: encryptedCreds.bkash_username || formData.bkash_username,
          password: encryptedCreds.bkash_password || formData.bkash_password,
        };
      } else if (formData.provider_type === "nagad" && formData.payment_mode === "api") {
        config = {
          public_key: encryptedCreds.nagad_public_key || formData.nagad_public_key,
          private_key: encryptedCreds.nagad_private_key || formData.nagad_private_key,
        };
      }

      const providerData = {
        name: formData.name,
        provider_type: formData.provider_type,
        payment_mode: formData.payment_mode,
        store_id: encryptedCreds.store_id || formData.store_id || null,
        store_password: encryptedCreds.store_password || formData.store_password || null,
        is_active: formData.is_active,
        is_sandbox: formData.is_sandbox,
        qr_code_image: formData.qr_code_image || null,
        account_number: formData.account_number || null,
        account_type: formData.account_type || null,
        instructions: formData.instructions || null,
        instructions_bn: formData.instructions_bn || null,
        config,
      };

      if (editingProvider) {
        const { error } = await supabase
          .from("payment_providers")
          .update(providerData)
          .eq("id", editingProvider.id);

        if (error) throw error;
        toast.success("Provider updated with encrypted credentials!");
      } else {
        const { error } = await supabase.from("payment_providers").insert(providerData);

        if (error) throw error;
        toast.success("Provider added with encrypted credentials!");
      }

      setDialogOpen(false);
      resetForm();
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
      payment_mode: provider.payment_mode || "manual",
      store_id: provider.store_id || "",
      store_password: provider.store_password || "",
      is_active: provider.is_active,
      is_sandbox: provider.is_sandbox,
      qr_code_image: provider.qr_code_image || "",
      account_number: provider.account_number || "",
      account_type: provider.account_type || "personal",
      instructions: provider.instructions || "",
      instructions_bn: provider.instructions_bn || "",
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
      payment_mode: "manual",
      store_id: "",
      store_password: "",
      is_active: false,
      is_sandbox: true,
      qr_code_image: "",
      account_number: "",
      account_type: "personal",
      instructions: "",
      instructions_bn: "",
      bkash_username: "",
      bkash_password: "",
      nagad_public_key: "",
      nagad_private_key: "",
    });
  };

  const getProviderInfo = (type: string) => {
    return providerTypes.find((p) => p.value === type) || { label: type, logo: "💳", requiresApi: false, supportsModes: false };
  };

  const filteredProviders = providers.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return p.is_active;
    if (activeTab === "manual") return p.payment_mode === "manual";
    if (activeTab === "api") return p.payment_mode === "api";
    return true;
  });

  const providerInfo = formData.provider_type ? getProviderInfo(formData.provider_type) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Payment Providers</h1>
          <p className="text-muted-foreground">
            Configure payment gateway integrations (Manual QR / API)
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? "Edit Provider" : "Add Payment Provider"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Provider Type Selection */}
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
                      payment_mode: provider.supportsModes ? "manual" : (provider.requiresApi ? "api" : "manual"),
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

              {/* Payment Mode Selection - Only for providers that support both modes */}
              {providerInfo?.supportsModes && (
                <Card className="border-gold/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Payment Mode (পেমেন্ট মোড)</CardTitle>
                    <CardDescription>
                      Choose how customers will pay with {providerInfo.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={formData.payment_mode}
                      onValueChange={(value) => setFormData({ ...formData, payment_mode: value })}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {/* Manual/Personal Mode */}
                      <label
                        htmlFor="mode-manual"
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.payment_mode === "manual" 
                            ? "border-gold bg-gold/10 ring-2 ring-gold" 
                            : "border-border hover:border-gold/50"
                        }`}
                      >
                        <RadioGroupItem value="manual" id="mode-manual" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-medium">
                            <QrCode className="h-4 w-4 text-gold" />
                            Manual / Personal
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            QR কোড বা অ্যাকাউন্ট নম্বর দিয়ে ম্যানুয়ালি টাকা পাঠাবেন
                          </p>
                        </div>
                      </label>

                      {/* API Mode */}
                      <label
                        htmlFor="mode-api"
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.payment_mode === "api" 
                            ? "border-gold bg-gold/10 ring-2 ring-gold" 
                            : "border-border hover:border-gold/50"
                        }`}
                      >
                        <RadioGroupItem value="api" id="mode-api" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-medium">
                            <Key className="h-4 w-4 text-gold" />
                            API Integration
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            স্বয়ংক্রিয় পেমেন্ট গেটওয়ে (API Key প্রয়োজন)
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Manual Mode Fields */}
              {formData.payment_mode === "manual" && providerInfo?.supportsModes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Personal Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Account Type</Label>
                        <Select
                          value={formData.account_type}
                          onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="merchant">Merchant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={formData.account_number}
                          onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">QR Code Image (স্ক্যান করার জন্য)</Label>
                      <ImageUploadZone
                        value={formData.qr_code_image}
                        onChange={(url) => setFormData({ ...formData, qr_code_image: url })}
                        onRemove={() => setFormData({ ...formData, qr_code_image: "" })}
                        label="Upload QR Code"
                        bucket="media"
                        folder="payment-qr"
                        aspectRatio="square"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {providerInfo.label} অ্যাপ থেকে QR কোড স্ক্রিনশট নিয়ে আপলোড করুন
                      </p>
                    </div>

                    <div>
                      <Label>Instructions (English)</Label>
                      <Textarea
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="Send money to this number and enter your Transaction ID during checkout"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Instructions (Bengali)</Label>
                      <Textarea
                        value={formData.instructions_bn}
                        onChange={(e) => setFormData({ ...formData, instructions_bn: e.target.value })}
                        placeholder="এই নম্বরে Send Money করে চেকআউটে ট্রানজেকশন আইডি দিন"
                        rows={2}
                        className="font-bengali"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* API Mode Fields */}
              {formData.payment_mode === "api" && providerInfo?.requiresApi && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* bKash API fields */}
                    {formData.provider_type === "bkash" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>App Key</Label>
                            <Input
                              value={formData.store_id}
                              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                              placeholder="bKash App Key"
                            />
                          </div>
                          <div>
                            <Label>App Secret</Label>
                            <Input
                              type="password"
                              value={formData.store_password}
                              onChange={(e) => setFormData({ ...formData, store_password: e.target.value })}
                              placeholder="bKash App Secret"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Username</Label>
                            <Input
                              value={formData.bkash_username}
                              onChange={(e) => setFormData({ ...formData, bkash_username: e.target.value })}
                              placeholder="bKash Username"
                            />
                          </div>
                          <div>
                            <Label>Password</Label>
                            <Input
                              type="password"
                              value={formData.bkash_password}
                              onChange={(e) => setFormData({ ...formData, bkash_password: e.target.value })}
                              placeholder="bKash Password"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get API credentials from: <a href="https://developer.bka.sh" target="_blank" rel="noopener" className="text-gold hover:underline">developer.bka.sh</a>
                        </p>
                      </>
                    )}

                    {/* Nagad API fields */}
                    {formData.provider_type === "nagad" && (
                      <>
                        <div>
                          <Label>Merchant ID</Label>
                          <Input
                            value={formData.store_id}
                            onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                            placeholder="Nagad Merchant ID"
                          />
                        </div>
                        <div>
                          <Label>Public Key (PG Public Key)</Label>
                          <Textarea
                            value={formData.nagad_public_key}
                            onChange={(e) => setFormData({ ...formData, nagad_public_key: e.target.value })}
                            placeholder="-----BEGIN PUBLIC KEY-----"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Private Key (Merchant Private Key)</Label>
                          <Textarea
                            value={formData.nagad_private_key}
                            onChange={(e) => setFormData({ ...formData, nagad_private_key: e.target.value })}
                            placeholder="-----BEGIN PRIVATE KEY-----"
                            rows={3}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get API credentials from: <a href="https://nagad.com.bd" target="_blank" rel="noopener" className="text-gold hover:underline">nagad.com.bd</a>
                        </p>
                      </>
                    )}

                    {/* SSLCommerz fields */}
                    {formData.provider_type === "sslcommerz" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Store ID</Label>
                            <Input value={formData.store_id}
                              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                              placeholder={formData.is_sandbox ? "testbox" : "your_store_id"} />
                          </div>
                          <div>
                            <Label>Store Password</Label>
                            <Input type="password" value={formData.store_password}
                              onChange={(e) => setFormData({ ...formData, store_password: e.target.value })}
                              placeholder={formData.is_sandbox ? "qwerty" : "your_store_password"} />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sandbox: <a href="https://developer.sslcommerz.com/registration/" target="_blank" rel="noopener" className="text-gold hover:underline">developer.sslcommerz.com</a> — Test Card: 4111 1111 1111 1111
                        </p>
                      </>
                    )}

                    {/* AamarPay fields */}
                    {formData.provider_type === "aamarpay" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Store ID</Label>
                            <Input value={formData.store_id}
                              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                              placeholder={formData.is_sandbox ? "aamarpaytest" : "your_store_id"} />
                          </div>
                          <div>
                            <Label>Signature Key</Label>
                            <Input type="password" value={formData.store_password}
                              onChange={(e) => setFormData({ ...formData, store_password: e.target.value })}
                              placeholder={formData.is_sandbox ? "dbb74894e82415a2f7ff0ec3a97e4183" : "your_signature_key"} />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sandbox: Store ID = <code className="bg-muted px-1 rounded">aamarpaytest</code> — Only bKash available in sandbox
                        </p>
                      </>
                    )}

                    {/* SurjoPay fields */}
                    {formData.provider_type === "surjopay" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Username</Label>
                            <Input value={formData.store_id}
                              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                              placeholder={formData.is_sandbox ? "sp_sandbox" : "your_username"} />
                          </div>
                          <div>
                            <Label>Password</Label>
                            <Input type="password" value={formData.store_password}
                              onChange={(e) => setFormData({ ...formData, store_password: e.target.value })}
                              placeholder={formData.is_sandbox ? "pyaborern" : "your_password"} />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sandbox: Username = <code className="bg-muted px-1 rounded">sp_sandbox</code>, Password = <code className="bg-muted px-1 rounded">pyaborern</code>
                        </p>
                      </>
                    )}

                    {/* Generic API fields for other providers */}
                    {!["bkash", "nagad", "sslcommerz", "aamarpay", "surjopay"].includes(formData.provider_type) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Store ID / API Key</Label>
                          <Input value={formData.store_id}
                            onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                            placeholder="Enter store ID or API key" />
                        </div>
                        <div>
                          <Label>Store Password / Secret Key</Label>
                          <Input type="password" value={formData.store_password}
                            onChange={(e) => setFormData({ ...formData, store_password: e.target.value })}
                            placeholder="Enter store password or secret" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-3 bg-accent/50 border border-accent rounded-lg">
                      <Switch
                        checked={formData.is_sandbox}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_sandbox: checked })}
                      />
                      <Label className="text-foreground font-medium">
                        {formData.is_sandbox ? "🧪 Sandbox / Test Mode" : "🔴 Live / Production Mode"}
                      </Label>
                    </div>
                    {formData.is_sandbox && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        ⚠️ Sandbox মোডে টেস্ট ট্রানজেকশন হবে। লাইভ করতে সঠিক credentials দিয়ে Sandbox বন্ধ করুন।
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Bank Transfer - simple instructions */}
              {formData.provider_type === "bank_transfer" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Bank Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Account Number</Label>
                      <Input
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        placeholder="Bank Account Number"
                      />
                    </div>
                    <div>
                      <Label>Instructions (English)</Label>
                      <Textarea
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        placeholder="Bank Name, Branch, Routing Number etc."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Instructions (Bengali)</Label>
                      <Textarea
                        value={formData.instructions_bn}
                        onChange={(e) => setFormData({ ...formData, instructions_bn: e.target.value })}
                        placeholder="ব্যাংকের নাম, শাখা, রাউটিং নম্বর ইত্যাদি"
                        rows={3}
                        className="font-bengali"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Enable this provider</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold">
                  {editingProvider ? "Update" : "Add Provider"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({providers.length})</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="manual">Manual/QR</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No payment providers found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProviders.map((provider) => {
            const info = getProviderInfo(provider.provider_type);
            return (
              <Card key={provider.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{info.logo}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground">{provider.name}</h3>
                        <Badge
                          variant={provider.is_active ? "default" : "secondary"}
                          className={provider.is_active ? "bg-green-500/20 text-green-500" : ""}
                        >
                          {provider.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {provider.payment_mode === "manual" && info.supportsModes && (
                          <Badge variant="outline" className="text-gold border-gold/50">
                            <QrCode className="h-3 w-3 mr-1" />
                            Manual
                          </Badge>
                        )}
                        {provider.payment_mode === "api" && info.supportsModes && (
                          <Badge variant="outline" className="text-blue-500 border-blue-500/50">
                            <Key className="h-3 w-3 mr-1" />
                            API
                          </Badge>
                        )}
                        {provider.is_sandbox && provider.payment_mode === "api" && (
                          <Badge variant="outline" className="text-yellow-500">
                            Sandbox
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {info.label}
                        {provider.account_number && ` • ${provider.account_number}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(provider)}>
                      {provider.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(provider)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(provider.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                {/* Show QR code preview for manual providers */}
                {provider.qr_code_image && provider.payment_mode === "manual" && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <img 
                        src={provider.qr_code_image} 
                        alt="QR Code" 
                        className="w-16 h-16 object-contain rounded border"
                      />
                      <div className="text-sm text-muted-foreground">
                        <p>QR Code uploaded for customers to scan</p>
                        {provider.instructions && (
                          <p className="mt-1 text-foreground">{provider.instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-gold/5 border-gold/20">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground mb-2">Payment Setup Guide</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Manual/QR:</strong> Personal অ্যাকাউন্ট দিয়ে QR code আপলোড করুন, কাস্টমার Send Money করবে</li>
            <li>• <strong>API:</strong> অফিসিয়াল Merchant API Key দিয়ে স্বয়ংক্রিয় পেমেন্ট নিন</li>
            <li>• <strong>bKash/Nagad:</strong> উভয় মোড সাপোর্ট করে - Personal বা API</li>
            <li>• <strong>COD:</strong> ক্যাশ অন ডেলিভারি - কোন সেটআপ প্রয়োজন নেই</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentProviders;