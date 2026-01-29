import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

interface MobileProductSliderProps {
  title: string;
  queryType: "new_arrivals" | "featured" | "all";
  showViewAll?: boolean;
}

const MobileProductSlider = ({ title, queryType, showViewAll = true }: MobileProductSliderProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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
        .limit(12);

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

    // Realtime subscription
    const channel = supabase
      .channel(`products_slider_${queryType}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchProducts()
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

  // Touch/drag handlers for smooth swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    updateCurrentIndex();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    updateCurrentIndex();
  };

  const updateCurrentIndex = () => {
    if (sliderRef.current) {
      const itemWidth = 128 + 12; // width + gap (w-32 = 128px)
      const newIndex = Math.round(sliderRef.current.scrollLeft / itemWidth);
      setCurrentIndex(Math.min(newIndex, Math.max(0, products.length - 3)));
    }
  };

  const scrollToIndex = (index: number) => {
    if (sliderRef.current) {
      const itemWidth = 128 + 12;
      sliderRef.current.scrollTo({
        left: index * itemWidth,
        behavior: "smooth"
      });
      setCurrentIndex(index);
    }
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, currentIndex - 3);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(products.length - 3, currentIndex + 3);
    scrollToIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="md:hidden px-4 py-3">
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="aspect-square bg-muted rounded-lg animate-pulse" />
              <div className="h-2.5 bg-muted rounded mt-1.5 w-3/4" />
              <div className="h-2.5 bg-muted rounded mt-1 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  // Calculate pagination dots
  const dotsCount = Math.ceil(products.length / 3);
  const activeDot = Math.floor(currentIndex / 3);

  return (
    <>
      <section className="md:hidden px-4 py-3">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display text-foreground">{title}</h2>
          {showViewAll && (
            <Link to="/shop" className="text-gold text-xs font-medium">
              View All →
            </Link>
          )}
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          {products.length > 2 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border"
                style={{ display: currentIndex === 0 ? 'none' : 'flex' }}
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </button>
              <button
                onClick={handleNext}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-border"
                style={{ display: currentIndex >= products.length - 2 ? 'none' : 'flex' }}
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </button>
            </>
          )}

          {/* Products Slider */}
          <div
            ref={sliderRef}
            className="flex gap-3 overflow-x-auto scrollbar-none pb-2 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onScroll={updateCurrentIndex}
            style={{ scrollSnapType: "x mandatory" }}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-shrink-0 w-32"
                style={{ scrollSnapAlign: "start" }}
              >
                <Link 
                  to={`/product/${product.slug}`} 
                  className="block"
                  onClick={(e) => isDragging && e.preventDefault()}
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-card rounded-lg overflow-hidden mb-1.5 border border-border/50 group">
                    <img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      draggable={false}
                    />
                    
                    {/* Action Buttons */}
                    <div className="absolute top-1 right-1 flex flex-col gap-1">
                      <button
                        onClick={(e) => handleWishlistClick(e, product.id)}
                        className="w-6 h-6 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                      >
                        <Heart 
                          className={`h-3 w-3 ${
                            isInWishlist(product.id) 
                              ? "fill-gold text-gold" 
                              : "text-muted-foreground"
                          }`} 
                        />
                      </button>
                    </div>

                    {/* Badges */}
                    {product.is_new_arrival && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-gold text-charcoal-deep text-[8px] font-semibold rounded">
                        NEW
                      </span>
                    )}

                    {product.stock_quantity === 0 && !product.is_preorderable && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <span className="text-[10px] text-foreground font-medium">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3 className="text-[11px] text-foreground font-medium line-clamp-1 leading-tight">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-semibold text-gold">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-[9px] text-muted-foreground line-through">
                        ৳{product.compare_at_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          {products.length > 2 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {Array.from({ length: dotsCount }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToIndex(idx * 2)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeDot === idx 
                      ? "w-6 bg-gold" 
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
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

export default MobileProductSlider;
