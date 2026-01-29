import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye } from "lucide-react";
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
  stock_quantity: number;
  is_preorderable: boolean;
  is_new_arrival: boolean;
  category: {
    name: string;
  } | null;
}

const MobileRecentlyViewed = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, name_bn, slug, price, compare_at_price, images, description,
          stock_quantity, is_preorderable, is_new_arrival,
          category:categories (name)
        `)
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(4);

      if (!error && data) {
        setProducts(data as unknown as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();

    const channel = supabase
      .channel('products_recently_viewed')
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
  }, []);

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

  if (loading || products.length === 0) return null;

  return (
    <>
      <section className="md:hidden px-4 py-4">
        <h2 className="text-base font-display text-foreground mb-3">Recently viewed</h2>

        <div className="grid grid-cols-2 gap-3">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="relative">
              <Link to={`/product/${product.slug}`}>
                <div className="relative aspect-square bg-card rounded-xl overflow-hidden border border-border/50 group">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5">
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

                    <button
                      onClick={(e) => handleQuickView(e, product)}
                      className="w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* WhatsApp Button */}
                  <div className="absolute bottom-2 right-2" onClick={(e) => e.preventDefault()}>
                    <WhatsAppOrderButton product={product} variant="icon" />
                  </div>
                </div>

                <h3 className="text-xs text-foreground font-medium mt-2 line-clamp-1">
                  {product.name}
                </h3>
                <span className="text-sm font-semibold text-gold">
                  ৳{product.price.toLocaleString()}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
};

export default MobileRecentlyViewed;
