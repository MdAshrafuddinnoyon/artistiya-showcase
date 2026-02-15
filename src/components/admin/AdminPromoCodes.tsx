import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Copy, RefreshCw, Tag, Percent, DollarSign, Calendar, Users, BarChart3, Eye, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  applicable_categories: string[] | null;
  applicable_products: string[] | null;
  created_at: string;
}

interface UsageRecord {
  id: string;
  promo_code_id: string;
  user_id: string;
  order_id: string;
  discount_applied: number;
  used_at: string;
}

const AdminPromoCodes = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [selectedCodeForUsage, setSelectedCodeForUsage] = useState<PromoCode | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 0,
    usage_limit: 0,
    is_active: true,
    starts_at: "",
    expires_at: "",
    applicable_categories: [] as string[],
  });

  useEffect(() => {
    fetchCodes();
    fetchCategories();

    // Realtime subscription
    const channel = supabase
      .channel('promo-codes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_codes' }, () => {
        fetchCodes();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'promo_code_usage' }, () => {
        fetchCodes(); // Refresh counts
        if (selectedCodeForUsage) {
          fetchUsageHistory(selectedCodeForUsage.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    if (data) setCategories(data);
  };

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Failed to fetch promo codes");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageHistory = async (codeId: string) => {
    try {
      const { data, error } = await supabase
        .from("promo_code_usage")
        .select("*")
        .eq("promo_code_id", codeId)
        .order("used_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsageHistory(data || []);
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const codeData: any = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_amount: formData.min_order_amount || null,
        max_discount_amount: formData.max_discount_amount || null,
        usage_limit: formData.usage_limit || null,
        is_active: formData.is_active,
        starts_at: formData.starts_at || null,
        expires_at: formData.expires_at || null,
        applicable_categories: formData.applicable_categories.length > 0 ? formData.applicable_categories : null,
      };

      if (editingCode) {
        const { error } = await supabase.from("promo_codes").update(codeData).eq("id", editingCode.id);
        if (error) throw error;
        toast.success("Promo code updated!");
      } else {
        const { error } = await supabase.from("promo_codes").insert(codeData);
        if (error) throw error;
        toast.success("Promo code created!");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving promo code:", error);
      toast.error(error.message || "Failed to save promo code");
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || "",
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      min_order_amount: code.min_order_amount || 0,
      max_discount_amount: code.max_discount_amount || 0,
      usage_limit: code.usage_limit || 0,
      is_active: code.is_active,
      starts_at: code.starts_at ? code.starts_at.split("T")[0] : "",
      expires_at: code.expires_at ? code.expires_at.split("T")[0] : "",
      applicable_categories: code.applicable_categories || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Promo code deleted!");
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Failed to delete promo code");
    }
  };

  const toggleActive = async (code: PromoCode) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !code.is_active })
        .eq("id", code.id);
      if (error) throw error;
      toast.success(code.is_active ? "Code deactivated" : "Code activated");
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const duplicateCode = async (code: PromoCode) => {
    try {
      const { error } = await supabase.from("promo_codes").insert({
        code: code.code + "-COPY",
        description: code.description,
        discount_type: code.discount_type,
        discount_value: code.discount_value,
        min_order_amount: code.min_order_amount,
        max_discount_amount: code.max_discount_amount,
        usage_limit: code.usage_limit,
        is_active: false,
        starts_at: code.starts_at,
        expires_at: code.expires_at,
        applicable_categories: code.applicable_categories,
        applicable_products: code.applicable_products,
      });
      if (error) throw error;
      toast.success("Code duplicated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const resetForm = () => {
    setEditingCode(null);
    setFormData({
      code: "", description: "", discount_type: "percentage", discount_value: 10,
      min_order_amount: 0, max_discount_amount: 0, usage_limit: 0, is_active: true,
      starts_at: "", expires_at: "", applicable_categories: [],
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isNotStarted = (startsAt: string | null) => {
    if (!startsAt) return false;
    return new Date(startsAt) > new Date();
  };

  // Stats
  const totalCodes = codes.length;
  const activeCodes = codes.filter(c => c.is_active && !isExpired(c.expires_at)).length;
  const totalUsed = codes.reduce((sum, c) => sum + (c.used_count || 0), 0);
  const totalDiscountGiven = codes.reduce((sum, c) => sum + ((c.used_count || 0) * c.discount_value), 0);

  // Filtered codes
  const filteredCodes = codes.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "active") return matchesSearch && c.is_active && !isExpired(c.expires_at);
    if (filterStatus === "expired") return matchesSearch && isExpired(c.expires_at);
    if (filterStatus === "inactive") return matchesSearch && !c.is_active;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Promo Codes</h2>
          <p className="text-sm text-muted-foreground">Create, manage & track discount codes in real-time</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCode ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Code</Label>
                <div className="flex gap-2">
                  <Input id="code" value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20" required className="uppercase" />
                  <Button type="button" variant="outline" size="icon" onClick={generateRandomCode}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="20% off for new customers..." rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type}
                    onValueChange={(val) => setFormData({ ...formData, discount_type: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value {formData.discount_type === "percentage" ? "(%)" : "(৳)"}</Label>
                  <Input type="number" min="0" value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Order Amount (৳)</Label>
                  <Input type="number" min="0" value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Max Discount (৳)</Label>
                  <Input type="number" min="0" value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
                    placeholder="0 = unlimited" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usage Limit</Label>
                  <Input type="number" min="0" value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    placeholder="0 = unlimited" />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Starts At</Label>
                  <Input type="date" value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })} />
                </div>
                <div>
                  <Label>Expires At</Label>
                  <Input type="date" value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} />
                </div>
              </div>

              {/* Category targeting */}
              {categories.length > 0 && (
                <div>
                  <Label>Apply to Categories (optional)</Label>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-2 border border-border rounded-lg">
                    {categories.map(cat => (
                      <Badge key={cat.id} variant={formData.applicable_categories.includes(cat.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const selected = formData.applicable_categories.includes(cat.id)
                            ? formData.applicable_categories.filter(id => id !== cat.id)
                            : [...formData.applicable_categories, cat.id];
                          setFormData({ ...formData, applicable_categories: selected });
                        }}>
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Leave empty = applies to all products</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="gold">{editingCode ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-foreground">{totalCodes}</div>
            <div className="text-xs text-muted-foreground">Total Codes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{activeCodes}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-foreground">{totalUsed}</div>
            <div className="text-xs text-muted-foreground">Times Used</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-gold">৳{totalDiscountGiven.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Est. Discount Given</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search codes..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Usage History Dialog */}
      <Dialog open={!!selectedCodeForUsage} onOpenChange={(open) => !open && setSelectedCodeForUsage(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usage History: {selectedCodeForUsage?.code}</DialogTitle>
          </DialogHeader>
          {usageHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No usage records yet</p>
          ) : (
            <div className="space-y-3">
              {usageHistory.map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Order: {record.order_id?.slice(0, 8)}...</p>
                    <p className="text-xs text-muted-foreground">{new Date(record.used_at).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline">-৳{record.discount_applied}</Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Codes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredCodes.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{searchQuery ? "No matching codes" : "No promo codes created yet"}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCodes.map((code) => {
            const usagePercent = code.usage_limit ? (code.used_count / code.usage_limit) * 100 : 0;

            return (
              <div key={code.id}
                className={`bg-card border border-border rounded-lg p-4 transition-opacity ${
                  !code.is_active || isExpired(code.expires_at) ? "opacity-60" : ""
                }`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-lg font-bold text-gold">{code.code}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(code.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      {code.discount_type === "percentage" ? (
                        <Badge variant="outline" className="gap-1"><Percent className="h-3 w-3" />{code.discount_value}%</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" />৳{code.discount_value}</Badge>
                      )}
                      {!code.is_active && <Badge variant="secondary">Inactive</Badge>}
                      {isExpired(code.expires_at) && <Badge variant="destructive">Expired</Badge>}
                      {isNotStarted(code.starts_at) && <Badge variant="outline" className="text-blue-600 border-blue-300">Scheduled</Badge>}
                    </div>
                    
                    {code.description && (
                      <p className="text-sm text-muted-foreground">{code.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {code.min_order_amount && code.min_order_amount > 0 && (
                        <span>Min: ৳{code.min_order_amount}</span>
                      )}
                      {code.max_discount_amount && code.max_discount_amount > 0 && (
                        <span>Max: ৳{code.max_discount_amount}</span>
                      )}
                      {code.usage_limit ? (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {code.used_count}/{code.usage_limit} used
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {code.used_count || 0} used (unlimited)
                        </span>
                      )}
                      {code.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires: {new Date(code.expires_at).toLocaleDateString()}
                        </span>
                      )}
                      {code.applicable_categories && code.applicable_categories.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {code.applicable_categories.length} categories
                        </Badge>
                      )}
                    </div>

                    {/* Usage progress bar */}
                    {code.usage_limit && code.usage_limit > 0 && (
                      <div className="w-full max-w-xs">
                        <Progress value={usagePercent} className="h-1.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <Switch checked={code.is_active} onCheckedChange={() => toggleActive(code)} />
                    <Button variant="ghost" size="icon" onClick={() => {
                      setSelectedCodeForUsage(code);
                      fetchUsageHistory(code.id);
                    }}>
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => duplicateCode(code)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(code)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(code.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodes;
