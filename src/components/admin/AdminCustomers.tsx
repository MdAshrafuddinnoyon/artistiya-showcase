import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Search, Crown, Percent, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  discount_percentage: number;
  is_premium_member: boolean;
  premium_expires_at: string | null;
  total_orders: number;
  total_spent: number;
  notes: string | null;
  created_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    discount_percentage: 0,
    is_premium_member: false,
    premium_expires_at: "",
    notes: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update({
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone || null,
            discount_percentage: formData.discount_percentage,
            is_premium_member: formData.is_premium_member,
            premium_expires_at: formData.premium_expires_at || null,
            notes: formData.notes || null,
          })
          .eq("id", editingCustomer.id);

        if (error) throw error;
        toast.success("Customer updated!");
      } else {
        const { error } = await supabase.from("customers").insert({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          discount_percentage: formData.discount_percentage,
          is_premium_member: formData.is_premium_member,
          premium_expires_at: formData.premium_expires_at || null,
          notes: formData.notes || null,
        });

        if (error) throw error;
        toast.success("Customer added!");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Customer deleted");
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      email: customer.email,
      full_name: customer.full_name,
      phone: customer.phone || "",
      discount_percentage: customer.discount_percentage,
      is_premium_member: customer.is_premium_member,
      premium_expires_at: customer.premium_expires_at?.split("T")[0] || "",
      notes: customer.notes || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      email: "",
      full_name: "",
      phone: "",
      discount_percentage: 0,
      is_premium_member: false,
      premium_expires_at: "",
      notes: "",
    });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="font-display text-xl text-foreground">Customer Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+880..."
                />
              </div>
              <div>
                <Label>Discount Percentage (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This customer will get this % discount on all orders
                </p>
              </div>
              <div className="flex items-center justify-between bg-gold/10 p-3 rounded-lg border border-gold/30">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-gold" />
                  <div>
                    <Label className="text-gold">Premium Member</Label>
                    <p className="text-xs text-muted-foreground">Special VIP status</p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_premium_member}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium_member: checked })}
                />
              </div>
              {formData.is_premium_member && (
                <div>
                  <Label>Premium Expires On</Label>
                  <Input
                    type="date"
                    value={formData.premium_expires_at}
                    onChange={(e) => setFormData({ ...formData, premium_expires_at: e.target.value })}
                  />
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes about this customer..."
                  rows={3}
                />
              </div>
              <Button variant="gold" className="w-full" onClick={handleSave} disabled={!formData.email || !formData.full_name}>
                <Save className="h-4 w-4 mr-2" />
                {editingCustomer ? "Update Customer" : "Add Customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{customers.length}</p>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gold">{customers.filter((c) => c.is_premium_member).length}</p>
            <p className="text-xs text-muted-foreground">Premium Members</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{customers.filter((c) => c.discount_percentage > 0).length}</p>
            <p className="text-xs text-muted-foreground">With Discounts</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">৳{customers.reduce((sum, c) => sum + c.total_spent, 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="bg-card border-border hover:border-gold/50 transition-colors cursor-pointer" onClick={() => openEditDialog(customer)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground truncate">{customer.full_name}</h3>
                      {customer.is_premium_member && (
                        <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {customer.discount_percentage > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          {customer.discount_percentage}% off
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Orders: {customer.total_orders}</span>
                      <span>Spent: ৳{customer.total_spent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No customers found" : "No customers yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;