import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

type ProductLite = {
  id: string;
  slug: string;
  name: string;
  name_bn: string | null;
  price: number;
  images: string[] | null;
};

type UpsellOfferRow = {
  id: string;
  title: string;
  description: string | null;
  product_id: string | null;
  discount_percent: number | null;
  trigger_type: string | null;
  trigger_value: string | null;
  product?: ProductLite | null;
};

type ProductBundleRow = {
  id: string;
  name: string;
  description: string | null;
  discount_percent: number | null;
  bundle_products?: Array<{
    id: string;
    product?: ProductLite | null;
  }>;
};

function safeJsonParse<T>(input: string | null): T | null {
  if (!input) return null;
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function applyOfferTrigger(
  offer: UpsellOfferRow,
  cartSubtotal: number
): boolean {
  if (!offer.trigger_type) return true;

  if (offer.trigger_type === "cart_value") {
    const parsed = safeJsonParse<{ min_value?: number }>(offer.trigger_value);
    const minValue = parsed?.min_value;
    if (typeof minValue === "number") return cartSubtotal >= minValue;
    return true;
  }

  // Unknown trigger type => show (admin may be experimenting)
  return true;
}

type CheckoutOffersSidebarProps = {
  cartSubtotal: number;
  cartProductIds: string[];
};

const CheckoutOffersSidebar = ({
  cartSubtotal,
  cartProductIds,
}: CheckoutOffersSidebarProps) => {
  const { addToCart } = useCart();
  const { language } = useLanguage();

  const [offers, setOffers] = useState<UpsellOfferRow[]>([]);
  const [bundles, setBundles] = useState<ProductBundleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);

      const [offersRes, bundlesRes] = await Promise.all([
        supabase
          .from("upsell_offers")
          .select(
            "id,title,description,product_id,discount_percent,trigger_type,trigger_value,product:products(id,slug,name,name_bn,price,images)"
          )
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("product_bundles")
          .select(
            "id,name,description,discount_percent,bundle_products(id,product:products(id,slug,name,name_bn,price,images))"
          )
          .eq("is_active", true)
          .order("display_order"),
      ]);

      if (!mounted) return;

      if (offersRes.error) console.error("Failed to load upsell offers", offersRes.error);
      if (bundlesRes.error) console.error("Failed to load product bundles", bundlesRes.error);

      setOffers((offersRes.data as any) || []);
      setBundles((bundlesRes.data as any) || []);
      setLoading(false);
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredOffers = useMemo(() => {
    return offers
      .filter((o) => o.product && o.product.id)
      .filter((o) => !cartProductIds.includes(o.product!.id))
      .filter((o) => applyOfferTrigger(o, cartSubtotal))
      .slice(0, 3);
  }, [offers, cartProductIds, cartSubtotal]);

  const filteredBundles = useMemo(() => {
    return bundles
      .map((b) => ({
        ...b,
        bundle_products: (b.bundle_products || []).filter((bp) => bp.product?.id),
      }))
      .filter((b) => (b.bundle_products?.length || 0) > 0)
      .slice(0, 2);
  }, [bundles]);

  const handleAddOffer = async (offer: UpsellOfferRow) => {
    if (!offer.product?.id) return;
    await addToCart(offer.product.id, 1);
  };

  const handleAddBundle = async (bundle: ProductBundleRow) => {
    const products = (bundle.bundle_products || [])
      .map((bp) => bp.product)
      .filter(Boolean) as ProductLite[];

    if (products.length === 0) return;

    // Add each item to cart
    for (const p of products) {
      // eslint-disable-next-line no-await-in-loop
      await addToCart(p.id, 1);
    }

    toast.success(
      language === "bn" ? "বান্ডিল কার্টে যোগ হয়েছে" : "Bundle added to cart"
    );
  };

  if (loading) {
    return (
      <div className="border-t border-border pt-4 mt-6 space-y-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  if (filteredOffers.length === 0 && filteredBundles.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border pt-4 mt-6 space-y-6">
      {filteredBundles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-display text-sm ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" ? "বান্ডিল অফার" : "Bundle Offers"}
            </h3>
          </div>

          <div className="space-y-3">
            {filteredBundles.map((bundle) => {
              const products = (bundle.bundle_products || [])
                .map((bp) => bp.product)
                .filter(Boolean) as ProductLite[];
              const original = products.reduce((sum, p) => sum + (p.price || 0), 0);
              const discount = bundle.discount_percent || 0;
              const discounted = Math.round(original * (1 - discount / 100));

              return (
                <div key={bundle.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${language === "bn" ? "font-bengali" : ""}`}>
                        {bundle.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {products.length} {language === "bn" ? "টি আইটেম" : "items"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {discount > 0 ? (
                          <>
                            <span className="text-sm font-semibold text-foreground">
                              ৳{discounted.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              ৳{original.toLocaleString()}
                            </span>
                            <Badge variant="secondary">-{discount}%</Badge>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-foreground">
                            ৳{original.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddBundle(bundle)}
                      className={language === "bn" ? "font-bengali" : ""}
                    >
                      {language === "bn" ? "যোগ করুন" : "Add"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredOffers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-display text-sm ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" ? "আপসেল অফার" : "Recommended Add-ons"}
            </h3>
          </div>

          <div className="space-y-3">
            {filteredOffers.map((offer) => {
              const p = offer.product!;
              const discount = offer.discount_percent || 0;
              const discounted = Math.round(p.price * (1 - discount / 100));
              const img = p.images?.[0];

              return (
                <div key={offer.id} className="rounded-lg border border-border p-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${language === "bn" ? "font-bengali" : ""}`}>
                        {language === "bn" && p.name_bn ? p.name_bn : p.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {offer.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {discount > 0 ? (
                          <>
                            <span className="text-sm font-semibold text-foreground">
                              ৳{discounted.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              ৳{p.price.toLocaleString()}
                            </span>
                            <Badge variant="secondary">-{discount}%</Badge>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-foreground">
                            ৳{p.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOffer(offer)}
                      className={language === "bn" ? "font-bengali" : ""}
                    >
                      {language === "bn" ? "যোগ" : "Add"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutOffersSidebar;
