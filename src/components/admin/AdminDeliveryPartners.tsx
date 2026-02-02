import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Building2, Phone, Mail, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface DeliveryPartner {
  id: string;
  name: string;
  contact_phone: string | null;
  contact_email: string | null;
  api_type: string | null;
  api_key: string | null;
  is_active: boolean;
  notes: string | null;
}

const AdminDeliveryPartners = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_phone: "",
    contact_email: "",
    api_type: "",
    api_key: "",
    is_active: true,
    notes: "",
  });

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_partners")
        .select("*")
        .order("name");

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Failed to fetch delivery partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPartner) {
        const { error } = await supabase
          .from("delivery_partners")
          .update({
            name: formData.name,
            contact_phone: formData.contact_phone || null,
            contact_email: formData.contact_email || null,
            api_type: formData.api_type || null,
            api_key: formData.api_key || null,
            is_active: formData.is_active,
            notes: formData.notes || null,
          })
          .eq("id", editingPartner.id);

        if (error) throw error;
        toast.success("Partner updated successfully");
      } else {
        const { error } = await supabase.from("delivery_partners").insert({
          name: formData.name,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          api_type: formData.api_type || null,
          api_key: formData.api_key || null,
          is_active: formData.is_active,
          notes: formData.notes || null,
        });

        if (error) throw error;
        toast.success("Partner added successfully");
      }

      setDialogOpen(false);
      setEditingPartner(null);
      setFormData({
        name: "",
        contact_phone: "",
        contact_email: "",
        api_type: "",
        api_key: "",
        is_active: true,
        notes: "",
      });
      fetchPartners();
    } catch (error) {
      console.error("Error saving partner:", error);
      toast.error("Failed to save partner");
    }
  };

  const handleEdit = (partner: DeliveryPartner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      contact_phone: partner.contact_phone || "",
      contact_email: partner.contact_email || "",
      api_type: partner.api_type || "",
      api_key: partner.api_key || "",
      is_active: partner.is_active,
      notes: partner.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this delivery partner?")) return;

    try {
      const { error } = await supabase
        .from("delivery_partners")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Partner deleted successfully");
      fetchPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error("Failed to delete partner");
    }
  };

  const toggleActive = async (partner: DeliveryPartner) => {
    try {
      const { error } = await supabase
        .from("delivery_partners")
        .update({ is_active: !partner.is_active })
        .eq("id", partner.id);

      if (error) throw error;
      toast.success(`Partner ${partner.is_active ? "deactivated" : "activated"}`);
      fetchPartners();
    } catch (error) {
      console.error("Error toggling partner:", error);
      toast.error("Failed to update partner");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4 animate-pulse"
          >
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl text-foreground">
            Delivery Partners
          </h1>
          <p className="text-muted-foreground">
            Manage courier and delivery companies
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="gold"
              onClick={() => {
                setEditingPartner(null);
                setFormData({
                  name: "",
                  contact_phone: "",
                  contact_email: "",
                  api_type: "",
                  api_key: "",
                  is_active: true,
                  notes: "",
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? "Edit Partner" : "Add Delivery Partner"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="apiType">API Type</Label>
                <Select
                  value={formData.api_type}
                  onValueChange={(value) => setFormData({ ...formData, api_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select API Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pathao">Pathao</SelectItem>
                    <SelectItem value="steadfast">Steadfast</SelectItem>
                    <SelectItem value="redx">RedX</SelectItem>
                    <SelectItem value="paperfly">Paperfly</SelectItem>
                    <SelectItem value="ecourier">eCourier</SelectItem>
                    <SelectItem value="sundarban">Sundarban Courier</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key / Secret</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API key for real-time tracking"
                  value={formData.api_key}
                  onChange={(e) =>
                    setFormData({ ...formData, api_key: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  API key enables real-time tracking and automated status updates
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              <Button type="submit" variant="gold" className="w-full">
                {editingPartner ? "Update Partner" : "Add Partner"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {partners.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No delivery partners yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first delivery partner to start tracking
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className={`bg-card border rounded-xl p-4 ${
                partner.is_active ? "border-border" : "border-border opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{partner.name}</h3>
                      {partner.api_key && (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                          <Key className="h-3 w-3 mr-1" />
                          API
                        </Badge>
                      )}
                    </div>
                    {partner.api_type && (
                      <span className="text-xs text-muted-foreground uppercase">
                        {partner.api_type}
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={partner.is_active}
                  onCheckedChange={() => toggleActive(partner)}
                />
              </div>

              {(partner.contact_phone || partner.contact_email) && (
                <div className="space-y-1 mb-3 text-sm">
                  {partner.contact_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {partner.contact_phone}
                    </div>
                  )}
                  {partner.contact_email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {partner.contact_email}
                    </div>
                  )}
                </div>
              )}

              {partner.notes && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {partner.notes}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(partner)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(partner.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryPartners;