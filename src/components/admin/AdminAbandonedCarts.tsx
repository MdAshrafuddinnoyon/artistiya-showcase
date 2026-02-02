import { useState, useEffect } from "react";
import { ShoppingCart, Mail, Phone, Calendar, User, Download, RefreshCw, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AbandonedCart {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  cart_data: unknown;
  cart_total: number;
  last_activity_at: string;
  is_recovered: boolean | null;
  created_at: string;
}

const AdminAbandonedCarts = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .order("last_activity_at", { ascending: false });

      if (error) throw error;
      setCarts(data || []);
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
      toast.error("Failed to load abandoned carts");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(carts.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} abandoned cart(s)?`)) return;

    try {
      const { error } = await supabase
        .from("abandoned_carts")
        .delete()
        .in("id", ids);

      if (error) throw error;
      toast.success(`Deleted ${ids.length} abandoned cart(s)`);
      setSelectedIds([]);
      fetchCarts();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete");
    }
  };

  const markAsRecovered = async (id: string) => {
    try {
      const { error } = await supabase
        .from("abandoned_carts")
        .update({ is_recovered: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Marked as recovered");
      fetchCarts();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update");
    }
  };

  const exportToCSV = () => {
    if (carts.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Cart Total", "Last Activity", "Status", "Created"];
    const rows = carts.map((c) => [
      c.full_name || "Guest",
      c.email || "",
      c.phone || "",
      c.cart_total,
      new Date(c.last_activity_at).toLocaleString(),
      c.is_recovered ? "Recovered" : "Abandoned",
      new Date(c.created_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `abandoned_carts_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Exported abandoned carts");
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

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
        <div>
          <h2 className="font-display text-xl text-foreground">Abandoned Carts</h2>
          <p className="text-sm text-muted-foreground">
            Customers who added items but didn't complete purchase
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCarts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(selectedIds)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{carts.length}</p>
            <p className="text-xs text-muted-foreground">Total Abandoned</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gold">
              ৳{carts.reduce((sum, c) => sum + c.cart_total, 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Lost Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {carts.filter((c) => c.is_recovered).length}
            </p>
            <p className="text-xs text-muted-foreground">Recovered</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {carts.filter((c) => c.email || c.phone).length}
            </p>
            <p className="text-xs text-muted-foreground">Contactable</p>
          </CardContent>
        </Card>
      </div>

      {/* Select All */}
      {carts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectedIds.length === carts.length}
            onCheckedChange={(checked) => handleSelectAll(!!checked)}
          />
          <span className="text-sm text-muted-foreground">
            Select all ({carts.length})
          </span>
        </div>
      )}

      {/* Cart List */}
      <div className="space-y-3">
        {carts.map((cart) => (
          <Card
            key={cart.id}
            className={`bg-card border-border ${cart.is_recovered ? "opacity-60" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedIds.includes(cart.id)}
                  onCheckedChange={(checked) => handleSelectOne(cart.id, !!checked)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className="font-medium text-foreground">
                      {cart.full_name || "Guest Customer"}
                    </span>
                    <Badge variant={cart.is_recovered ? "default" : "secondary"}>
                      {cart.is_recovered ? "Recovered" : "Abandoned"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(cart.last_activity_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                    {cart.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {cart.email}
                      </span>
                    )}
                    {cart.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cart.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gold">
                      ৳{cart.cart_total.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {!cart.is_recovered && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRecovered(cart.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Recovered
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete([cart.id])}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {carts.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No abandoned carts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAbandonedCarts;
