import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

const MobileRecentlyViewed = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      // Get featured products as "recently viewed" placeholder
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, images")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(4);

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();

    // Subscribe to realtime changes
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

  if (loading || products.length === 0) return null;

  return (
    <section className="md:hidden px-4 py-4">
      {/* Section Header */}
      <h2 className="text-base font-display text-foreground mb-3">Recently viewed</h2>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {products.slice(0, 4).map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.slug}`}
            className="relative"
          >
            {/* Product Card */}
            <div className="relative aspect-square bg-card rounded-xl overflow-hidden border border-border/50">
              <img
                src={product.images?.[0] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Wishlist Button */}
              <button
                onClick={(e) => handleWishlistClick(e, product.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <Heart 
                  className={`h-4 w-4 ${
                    isInWishlist(product.id) 
                      ? "fill-gold text-gold" 
                      : "text-muted-foreground"
                  }`} 
                />
              </button>
            </div>

            {/* Product Info */}
            <h3 className="text-xs text-foreground font-medium mt-2 line-clamp-1">
              {product.name}
            </h3>
            <span className="text-sm font-semibold text-gold">
              ৳{product.price.toLocaleString()}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MobileRecentlyViewed;
