import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, RefreshCw, DollarSign } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CurrencyRate {
  id: string;
  currency_code: string;
  currency_name: string;
  symbol: string;
  rate_to_bdt: number;
  is_active: boolean;
  updated_at: string;
}

const AdminCurrencySettings = () => {
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyRate | null>(null);

  const [formData, setFormData] = useState({
    currency_code: "",
    currency_name: "",
    symbol: "",
    rate_to_bdt: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from("currency_rates")
        .select("*")
        .order("currency_code", { ascending: true });

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast.error("Failed to fetch currencies");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const currencyData = {
        currency_code: formData.currency_code.toUpperCase(),
        currency_name: formData.currency_name,
        symbol: formData.symbol,
        rate_to_bdt: parseFloat(formData.rate_to_bdt),
        is_active: formData.is_active,
      };

      if (editingCurrency) {
        const { error } = await supabase
          .from("currency_rates")
          .update(currencyData)
          .eq("id", editingCurrency.id);

        if (error) throw error;
        toast.success("Currency updated!");
      } else {
        const { error } = await supabase.from("currency_rates").insert(currencyData);

        if (error) throw error;
        toast.success("Currency added!");
      }

      setDialogOpen(false);
      resetForm();
      fetchCurrencies();
    } catch (error: any) {
      console.error("Error saving currency:", error);
      toast.error(error.message || "Failed to save currency");
    }
  };

  const handleEdit = (currency: CurrencyRate) => {
    setEditingCurrency(currency);
    setFormData({
      currency_code: currency.currency_code,
      currency_name: currency.currency_name,
      symbol: currency.symbol,
      rate_to_bdt: currency.rate_to_bdt.toString(),
      is_active: currency.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this currency?")) return;

    try {
      const { error } = await supabase.from("currency_rates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Currency deleted!");
      fetchCurrencies();
    } catch (error) {
      console.error("Error deleting currency:", error);
      toast.error("Failed to delete currency");
    }
  };

  const toggleActive = async (currency: CurrencyRate) => {
    try {
      const { error } = await supabase
        .from("currency_rates")
        .update({ is_active: !currency.is_active })
        .eq("id", currency.id);

      if (error) throw error;
      toast.success(currency.is_active ? "Currency disabled" : "Currency enabled");
      fetchCurrencies();
    } catch (error) {
      console.error("Error toggling currency:", error);
      toast.error("Failed to update currency");
    }
  };

  const resetForm = () => {
    setEditingCurrency(null);
    setFormData({
      currency_code: "",
      currency_name: "",
      symbol: "",
      rate_to_bdt: "",
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Currency Settings</h1>
          <p className="text-muted-foreground">
            Manage currencies and exchange rates (base: BDT)
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Currency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCurrency ? "Edit Currency" : "Add Currency"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency_code">Currency Code</Label>
                  <Input
                    id="currency_code"
                    value={formData.currency_code}
                    onChange={(e) =>
                      setFormData({ ...formData, currency_code: e.target.value })
                    }
                    placeholder="USD"
                    maxLength={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="$"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currency_name">Currency Name</Label>
                <Input
                  id="currency_name"
                  value={formData.currency_name}
                  onChange={(e) =>
                    setFormData({ ...formData, currency_name: e.target.value })
                  }
                  placeholder="US Dollar"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rate_to_bdt">Rate (1 BDT = ?)</Label>
                <Input
                  id="rate_to_bdt"
                  type="number"
                  step="0.0001"
                  value={formData.rate_to_bdt}
                  onChange={(e) =>
                    setFormData({ ...formData, rate_to_bdt: e.target.value })
                  }
                  placeholder="0.0091"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Example: 1 BDT = 0.0091 USD
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold">
                  {editingCurrency ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : currencies.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No currencies configured</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Currency
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Symbol
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Rate (1 BDT)
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((currency) => (
                <tr key={currency.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {currency.currency_code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currency.currency_name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-lg">{currency.symbol}</td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {currency.rate_to_bdt}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={currency.is_active ? "default" : "secondary"}
                      className={
                        currency.is_active ? "bg-green-500/20 text-green-500" : ""
                      }
                    >
                      {currency.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(currency)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(currency)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {currency.currency_code !== "BDT" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(currency.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCurrencySettings;