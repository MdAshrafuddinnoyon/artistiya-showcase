import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  is_new_arrival: boolean;
  stock_quantity: number;
  is_preorderable: boolean;
  category: {
    name: string;
    slug: string;
  } | null;
}

const NewArrivalsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, name_bn, slug, price, compare_at_price, images,
          is_new_arrival, stock_quantity, is_preorderable,
          category:categories (name, slug)
        `)
        .eq("is_active", true)
        .eq("is_new_arrival", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!error && data) {
        setProducts(data as unknown as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleWishlistClick = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(productId);
  };

  if (loading) {
    return (
      <section className="py-24 bg-charcoal">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-charcoal">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 md:mb-12"
        >
          <div className="text-center md:text-left">
            <span className="text-gold text-xs md:text-sm tracking-[0.3em] uppercase font-body">
              Just Arrived
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mt-3 md:mt-4">
              New Arrivals
            </h2>
          </div>
          <Link to="/shop" className="mt-4 md:mt-0 self-center md:self-auto">
            <Button variant="gold-outline" size="sm" className="group">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Products Grid - Mobile optimized */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Link to={`/product/${product.slug}`} className="block">
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-3 md:mb-4">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleWishlistClick(e, product.id)}
                    className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 bg-background/80 rounded-full hover:bg-background transition-colors z-10"
                  >
                    <Heart 
                      className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-foreground"}`} 
                    />
                  </button>
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1 md:gap-2">
                    {product.is_new_arrival && (
                      <span className="px-2 py-0.5 md:px-3 md:py-1 bg-gold text-charcoal-deep text-[10px] md:text-xs font-semibold tracking-wider uppercase rounded">
                        New
                      </span>
                    )}
                    {product.stock_quantity === 0 && product.is_preorderable && (
                      <span className="px-2 py-0.5 md:px-3 md:py-1 bg-bronze text-white text-[10px] md:text-xs font-semibold rounded">
                        Pre-order
                      </span>
                    )}
                  </div>

                  {/* Quick View Overlay - Desktop only */}
                  <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-3">
                    <Button 
                      variant="gold" 
                      size="sm"
                      onClick={(e) => handleAddToCart(e, product.id)}
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="bg-background/80">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-1 md:space-y-2">
                  {product.category && (
                    <span className="text-[10px] md:text-xs text-gold tracking-wider uppercase">
                      {product.category.name}
                    </span>
                  )}
                  <h3 className="font-display text-sm md:text-lg text-foreground group-hover:text-gold transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gold font-semibold text-sm md:text-base">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-muted-foreground line-through text-xs md:text-sm">
                        ৳{product.compare_at_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSection;
