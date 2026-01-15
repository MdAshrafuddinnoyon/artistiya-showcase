import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Gift, Percent, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpsellOffer {
  id: string;
  title: string;
  description: string | null;
  product_id: string | null;
  discount_percent: number;
  trigger_type: string;
  trigger_value: string | null;
  is_active: boolean;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
}

const AdminUpsellOffers = () => {
  const [offers, setOffers] = useState<UpsellOffer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [offersRes, productsRes] = await Promise.all([
        supabase.from("upsell_offers").select("*").order("display_order"),
        supabase.from("products").select("id, name, price, images").eq("is_active", true),
      ]);

      if (offersRes.error) throw offersRes.error;
      if (productsRes.error) throw productsRes.error;

      setOffers(offersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addOffer = async () => {
    try {
      const { error } = await supabase.from("upsell_offers").insert({
        title: "Special Offer",
        description: "Add this item at a special price!",
        discount_percent: 15,
        trigger_type: "cart_value",
        trigger_value: JSON.stringify({ min_value: 1000 }),
        display_order: offers.length,
      });

      if (error) throw error;
      toast.success("Offer added");
      fetchData();
    } catch (error) {
      console.error("Error adding offer:", error);
      toast.error("Failed to add offer");
    }
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Delete this offer?")) return;

    try {
      const { error } = await supabase.from("upsell_offers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Offer deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error("Failed to delete offer");
    }
  };

  const updateOfferField = (id: string, field: keyof UpsellOffer, value: any) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const offer of offers) {
        const { error } = await supabase
          .from("upsell_offers")
          .update({
            title: offer.title,
            description: offer.description,
            product_id: offer.product_id,
            discount_percent: offer.discount_percent,
            trigger_type: offer.trigger_type,
            trigger_value: offer.trigger_value,
            is_active: offer.is_active,
            display_order: offer.display_order,
          })
          .eq("id", offer.id);

        if (error) throw error;
      }
      toast.success("All offers saved");
    } catch (error) {
      console.error("Error saving offers:", error);
      toast.error("Failed to save offers");
    } finally {
      setSaving(false);
    }
  };

  const getProductById = (id: string | null) => products.find((p) => p.id === id);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl text-foreground flex items-center gap-2">
            <Gift className="h-5 w-5 text-gold" />
            Upsell & Bundle Offers
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure checkout upsell offers to increase average order value
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addOffer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Offer
          </Button>
          <Button variant="gold" onClick={saveAll} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {offers.length === 0 ? (
        <Card className="p-12 text-center">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No upsell offers configured</p>
          <Button variant="gold" onClick={addOffer}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Offer
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer, index) => {
            const selectedProduct = getProductById(offer.product_id);
            
            return (
              <Card key={offer.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    {offer.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-lg">{offer.title}</span>
                    <span className="text-gold flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      {offer.discount_percent}% OFF
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={offer.is_active}
                      onCheckedChange={(checked) => updateOfferField(offer.id, "is_active", checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteOffer(offer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Offer Title</Label>
                      <Input
                        value={offer.title}
                        onChange={(e) => updateOfferField(offer.id, "title", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Discount Percent</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={offer.discount_percent}
                        onChange={(e) => updateOfferField(offer.id, "discount_percent", parseInt(e.target.value) || 10)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={offer.description || ""}
                      onChange={(e) => updateOfferField(offer.id, "description", e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Product to Offer</Label>
                      <Select
                        value={offer.product_id || "none"}
                        onValueChange={(value) => updateOfferField(offer.id, "product_id", value === "none" ? null : value)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select a product</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ৳{product.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Trigger Type</Label>
                      <Select
                        value={offer.trigger_type}
                        onValueChange={(value) => updateOfferField(offer.id, "trigger_type", value)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cart_value">Cart Value (minimum)</SelectItem>
                          <SelectItem value="always">Always Show</SelectItem>
                          <SelectItem value="product">Specific Product in Cart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {offer.trigger_type === "cart_value" && (
                    <div>
                      <Label>Minimum Cart Value (৳)</Label>
                      <Input
                        type="number"
                        value={(() => {
                          try {
                            return JSON.parse(offer.trigger_value || "{}")?.min_value || 0;
                          } catch {
                            return 0;
                          }
                        })()}
                        onChange={(e) => updateOfferField(offer.id, "trigger_value", JSON.stringify({ min_value: parseInt(e.target.value) || 0 }))}
                        className="mt-1.5"
                      />
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="bg-muted p-4 rounded-lg flex items-center gap-4">
                      {selectedProduct.images?.[0] && (
                        <img
                          src={selectedProduct.images[0]}
                          alt={selectedProduct.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{selectedProduct.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Original: ৳{selectedProduct.price} → 
                          <span className="text-gold font-medium ml-1">
                            ৳{Math.round(selectedProduct.price * (1 - offer.discount_percent / 100))}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUpsellOffers;
