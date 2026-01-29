import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
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
    slug: string;
  } | null;
}

const NewArrivalsSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, name_bn, slug, price, compare_at_price, images, description,
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

    // Realtime subscription
    const channel = supabase
      .channel('new_arrivals_products')
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

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(productId);
  };

  const handleQuickView = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  if (loading) {
    return (
      <section className="py-24 bg-charcoal hidden md:block">
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
    <>
      <section className="py-16 md:py-24 bg-charcoal hidden md:block">
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

          {/* Products Grid */}
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
                      className="absolute top-3 right-3 p-2 bg-background/80 rounded-full hover:bg-background transition-colors z-10"
                    >
                      <Heart 
                        className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-gold text-gold" : "text-foreground"}`} 
                      />
                    </button>
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.is_new_arrival && (
                        <span className="px-3 py-1 bg-gold text-charcoal-deep text-xs font-semibold tracking-wider uppercase rounded">
                          New
                        </span>
                      )}
                      {product.stock_quantity === 0 && product.is_preorderable && (
                        <span className="px-3 py-1 bg-bronze text-white text-xs font-semibold rounded">
                          Pre-order
                        </span>
                      )}
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <Button 
                        variant="gold" 
                        size="sm"
                        onClick={(e) => handleAddToCart(e, product.id)}
                      >
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-background/80"
                        onClick={(e) => handleQuickView(e, product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <div onClick={(e) => e.preventDefault()}>
                        <WhatsAppOrderButton product={product} variant="icon" />
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    {product.category && (
                      <span className="text-xs text-gold tracking-wider uppercase">
                        {product.category.name}
                      </span>
                    )}
                    <h3 className="font-display text-lg text-foreground group-hover:text-gold transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-gold font-semibold">
                        ৳{product.price.toLocaleString()}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-muted-foreground line-through text-sm">
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

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
};

export default NewArrivalsSection;
