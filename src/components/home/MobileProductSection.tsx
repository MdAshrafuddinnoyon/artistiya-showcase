import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import QuickViewModal from "@/components/product/QuickViewModal";
import WhatsAppOrderButton from "@/components/product/WhatsAppOrderButton";

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  description: string | null;
  is_new_arrival: boolean;
  stock_quantity: number;
  is_preorderable: boolean;
  category: {
    name: string;
  } | null;
}

interface MobileProductSectionProps {
  title: string;
  queryType: "new_arrivals" | "featured" | "all";
  showViewAll?: boolean;
}

const MobileProductSection = ({ title, queryType, showViewAll = true }: MobileProductSectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      let query = supabase
        .from("products")
        .select(`
          id, name, name_bn, slug, price, compare_at_price, images, description,
          is_new_arrival, stock_quantity, is_preorderable,
          category:categories (name)
        `)
        .eq("is_active", true)
        .limit(8);

      if (queryType === "new_arrivals") {
        query = query.eq("is_new_arrival", true);
      } else if (queryType === "featured") {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(data as unknown as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`products_${queryType}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryType]);

  const handleWishlistClick = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  const handleQuickView = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  if (loading) {
    return (
      <div className="md:hidden px-4 py-4">
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <div className="aspect-square bg-muted rounded-xl animate-pulse" />
              <div className="h-3 bg-muted rounded mt-2 w-3/4" />
              <div className="h-3 bg-muted rounded mt-1 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <>
      <section className="md:hidden px-4 py-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display text-foreground">{title}</h2>
          {showViewAll && (
            <Link to="/shop" className="flex items-center gap-1 text-gold text-xs font-medium">
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Horizontal Scroll Products */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4">
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-40">
              <Link to={`/product/${product.slug}`} className="block">
                {/* Product Image */}
                <div className="relative aspect-square bg-card rounded-xl overflow-hidden mb-2 border border-border/50 group">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    {/* Wishlist */}
                    <button
                      onClick={(e) => handleWishlistClick(e, product.id)}
                      className="w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          isInWishlist(product.id) 
                            ? "fill-gold text-gold" 
                            : "text-muted-foreground"
                        }`} 
                      />
                    </button>

                    {/* Quick View */}
                    <button
                      onClick={(e) => handleQuickView(e, product)}
                      className="w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* WhatsApp Button - Bottom Right */}
                  <div className="absolute bottom-2 right-2" onClick={(e) => e.preventDefault()}>
                    <WhatsAppOrderButton product={product} variant="icon" />
                  </div>

                  {/* New Badge */}
                  {product.is_new_arrival && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-gold text-charcoal-deep text-[9px] font-semibold rounded">
                      NEW
                    </span>
                  )}

                  {/* Out of Stock */}
                  {product.stock_quantity === 0 && !product.is_preorderable && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-xs text-foreground font-medium">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <h3 className="text-xs text-foreground font-medium line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-semibold text-gold">
                    ৳{product.price.toLocaleString()}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      ৳{product.compare_at_price.toLocaleString()}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
};

export default MobileProductSection;
