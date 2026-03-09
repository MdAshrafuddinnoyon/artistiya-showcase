import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";

interface PaymentBanner {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  banner_size: string;
}

const AdminFooterPaymentBanners = () => {
  const [banners, setBanners] = useState<PaymentBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentLabel, setPaymentLabel] = useState("We Accept");
  const [paymentLabelBn, setPaymentLabelBn] = useState("আমরা গ্রহণ করি");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bannersRes, brandingRes] = await Promise.all([
        supabase.from("footer_payment_banners").select("*").order("display_order"),
        supabase.from("site_branding").select("footer_payment_label, footer_payment_label_bn").single(),
      ]);

      if (bannersRes.data) setBanners(bannersRes.data);
      if (brandingRes.data) {
        setPaymentLabel(brandingRes.data.footer_payment_label || "We Accept");
        setPaymentLabelBn(brandingRes.data.footer_payment_label_bn || "আমরা গ্রহণ করি");
      }
    } catch (error) {
      console.error("Error fetching payment banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBanner = async () => {
    const newOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) + 1 : 0;
    const { data, error } = await supabase.from("footer_payment_banners").insert({
      name: "New Payment Method",
      image_url: "/placeholder.svg",
      display_order: newOrder,
    }).select().single();

    if (error) {
      toast.error("Failed to add banner");
      return;
    }
    if (data) setBanners([...banners, data]);
    toast.success("Payment method added");
  };

  const updateBanner = async (id: string, updates: Partial<PaymentBanner>) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const saveBanner = async (banner: PaymentBanner) => {
    const { error } = await supabase.from("footer_payment_banners")
      .update({
        name: banner.name,
        image_url: banner.image_url,
        link_url: banner.link_url,
        display_order: banner.display_order,
        is_active: banner.is_active,
        banner_size: banner.banner_size,
      })
      .eq("id", banner.id);

    if (error) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Saved");
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from("footer_payment_banners").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setBanners(prev => prev.filter(b => b.id !== id));
    toast.success("Deleted");
  };

  const saveLabels = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_branding")
      .update({
        footer_payment_label: paymentLabel,
        footer_payment_label_bn: paymentLabelBn,
      })
      .eq("id", (await supabase.from("site_branding").select("id").single()).data?.id || "");

    if (error) {
      toast.error("Failed to save labels");
    } else {
      toast.success("Labels saved");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-foreground">Payment Banners</h2>
          <p className="text-sm text-muted-foreground">Manage payment method logos shown in the footer</p>
        </div>
        <Button variant="gold" onClick={addBanner}>
          <Plus className="h-4 w-4 mr-2" /> Add Payment Method
        </Button>
      </div>

      {/* Label Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section Label</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Label (English)</Label>
              <Input value={paymentLabel} onChange={e => setPaymentLabel(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Label (বাংলা)</Label>
              <Input value={paymentLabelBn} onChange={e => setPaymentLabelBn(e.target.value)} />
            </div>
          </div>
          <Button size="sm" onClick={saveLabels} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Labels
          </Button>
        </CardContent>
      </Card>

      {/* Banner Items */}
      <div className="space-y-4">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="pt-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="w-32 shrink-0">
                  <ImageUploadZone
                    value={banner.image_url}
                    onChange={(url) => updateBanner(banner.id, { image_url: url })}
                    bucket="product-images"
                    folder="payment-logos"
                    aspectRatio="square"
                    showUrlInput={false}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={banner.name}
                        onChange={e => updateBanner(banner.id, { name: e.target.value })}
                        placeholder="e.g. bKash"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Link URL (optional)</Label>
                      <Input
                        value={banner.link_url || ""}
                        onChange={e => updateBanner(banner.id, { link_url: e.target.value || null })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={checked => updateBanner(banner.id, { is_active: checked })}
                      />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => saveBanner(banner)}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBanner(banner.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No payment banners yet. Click "Add Payment Method" to get started.</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {banners.filter(b => b.is_active).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-charcoal rounded-lg p-4">
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm text-muted-foreground">{paymentLabel}</span>
                <div className="flex flex-wrap justify-center gap-3">
                  {banners.filter(b => b.is_active).sort((a, b) => a.display_order - b.display_order).map(banner => (
                    <img
                      key={banner.id}
                      src={banner.image_url}
                      alt={banner.name}
                      className="h-8 w-auto object-contain"
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminFooterPaymentBanners;
