import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Copy, RefreshCw, Tag, Percent, DollarSign, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  created_at: string;
}

const AdminPromoCodes = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);

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
  });

  useEffect(() => {
    fetchCodes();
  }, []);

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
      const codeData = {
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
      };

      if (editingCode) {
        const { error } = await supabase
          .from("promo_codes")
          .update(codeData)
          .eq("id", editingCode.id);

        if (error) throw error;
        toast.success("Promo code updated!");
      } else {
        const { error } = await supabase.from("promo_codes").insert(codeData);

        if (error) throw error;
        toast.success("Promo code created!");
      }

      setDialogOpen(false);
      resetForm();
      fetchCodes();
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
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;

    try {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Promo code deleted!");
      fetchCodes();
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
      fetchCodes();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const resetForm = () => {
    setEditingCode(null);
    setFormData({
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
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-foreground">Promo Codes</h2>
          <p className="text-sm text-muted-foreground">Create and manage discount codes</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? "Edit Promo Code" : "Create Promo Code"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    required
                    className="uppercase"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={generateRandomCode}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="20% off for new customers..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(val) => setFormData({ ...formData, discount_type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value {formData.discount_type === "percentage" ? "(%)" : "(৳)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_order_amount">Min Order Amount (৳)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    min="0"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_discount_amount">Max Discount (৳)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    min="0"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="0"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    placeholder="0 = unlimited"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="starts_at">Starts At</Label>
                  <Input
                    id="starts_at"
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Expires At</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold">
                  {editingCode ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promo Codes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No promo codes created yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {codes.map((code) => (
            <div
              key={code.id}
              className={`bg-card border border-border rounded-lg p-4 ${
                !code.is_active || isExpired(code.expires_at) ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-gold">{code.code}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(code.code)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    {code.discount_type === "percentage" ? (
                      <Badge variant="outline" className="gap-1">
                        <Percent className="h-3 w-3" />
                        {code.discount_value}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <DollarSign className="h-3 w-3" />
                        ৳{code.discount_value}
                      </Badge>
                    )}
                    {!code.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {isExpired(code.expires_at) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                  
                  {code.description && (
                    <p className="text-sm text-muted-foreground">{code.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {code.min_order_amount && code.min_order_amount > 0 && (
                      <span>Min: ৳{code.min_order_amount}</span>
                    )}
                    {code.usage_limit && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {code.used_count}/{code.usage_limit} used
                      </span>
                    )}
                    {code.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires: {new Date(code.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={code.is_active}
                    onCheckedChange={() => toggleActive(code)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(code)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(code.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodes;
