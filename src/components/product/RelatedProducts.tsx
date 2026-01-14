import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
  is_new_arrival: boolean | null;
  stock_quantity: number | null;
  is_preorderable: boolean | null;
}

interface RelatedProductsProps {
  currentProductId: string;
  categoryId: string | null;
}

const RelatedProducts = ({ currentProductId, categoryId }: RelatedProductsProps) => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("products")
          .select("id, name, name_bn, slug, price, compare_at_price, images, is_new_arrival, stock_quantity, is_preorderable")
          .eq("is_active", true)
          .neq("id", currentProductId)
          .limit(4);

        if (categoryId) {
          query = query.eq("category_id", categoryId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        // If not enough from same category, get more from all
        if ((data?.length || 0) < 4 && categoryId) {
          const remaining = 4 - (data?.length || 0);
          const existingIds = [...(data?.map(p => p.id) || []), currentProductId];
          
          const { data: moreData } = await supabase
            .from("products")
            .select("id, name, name_bn, slug, price, compare_at_price, images, is_new_arrival, stock_quantity, is_preorderable")
            .eq("is_active", true)
            .not("id", "in", `(${existingIds.join(",")})`)
            .order("created_at", { ascending: false })
            .limit(remaining);

          setProducts([...(data || []), ...(moreData || [])] as Product[]);
        } else {
          setProducts((data || []) as Product[]);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [currentProductId, categoryId]);

  if (loading || products.length === 0) return null;

  return (
    <section className="mt-20 pt-12 border-t border-border">
      <h2 className="font-display text-2xl md:text-3xl text-foreground mb-8 text-center">
        {t("product.related")}
      </h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product, index) => {
          const isOutOfStock = product.stock_quantity === 0;
          const canPreorder = isOutOfStock && product.is_preorderable;
          const discount = product.compare_at_price 
            ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
            : 0;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <Link to={`/product/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-3">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {discount > 0 && (
                      <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded">
                        -{discount}%
                      </span>
                    )}
                    {canPreorder && (
                      <span className="px-2 py-0.5 bg-gold text-charcoal-deep text-xs font-semibold rounded">
                        Pre-Order
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button variant="gold" size="sm">
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      {t("shop.viewDetails")}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-display text-sm md:text-base text-foreground group-hover:text-gold transition-colors line-clamp-1">
                    {language === "bn" && product.name_bn ? product.name_bn : product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gold font-semibold text-sm">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ৳{product.compare_at_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedProducts;
