import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Heart, Share2, Star, Minus, Plus, 
  ShoppingBag, ChevronRight, Truck, Clock, Palette 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import WhatsAppOrderButton from "@/components/product/WhatsAppOrderButton";
import RelatedProducts from "@/components/product/RelatedProducts";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  story: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  images: string[];
  is_preorderable: boolean;
  production_time: string | null;
  allow_customization: boolean;
  materials: string | null;
  dimensions: string | null;
  care_instructions: string | null;
  category_id: string | null;
  category: {
    name: string;
    name_bn: string | null;
    slug: string;
  } | null;
}

interface MobileProductDetailProps {
  product: Product;
  reviewCount?: number;
  avgRating?: number;
}

const MobileProductDetail = ({ product, reviewCount = 0, avgRating = 0 }: MobileProductDetailProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Swipe handling for image gallery
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const productImages = product.images?.length > 0 
    ? product.images 
    : ["/placeholder.svg"];

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      for (let i = 0; i < quantity; i++) {
        await addToCart(product.id);
      }
      toast.success("Added to cart!");
    } catch (error) {
      console.error("Add to cart error:", error);
    }
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    try {
      for (let i = 0; i < quantity; i++) {
        await addToCart(product.id);
      }
      navigate("/checkout");
    } catch (error) {
      console.error("Buy now error:", error);
    }
    setAddingToCart(false);
  };

  const handleWishlist = async () => {
    await toggleWishlist(product.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || "",
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const isOutOfStock = product.stock_quantity === 0 && !product.is_preorderable;
  const canPreorder = product.stock_quantity === 0 && product.is_preorderable;

  // Swipe handlers for image gallery
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedImage < productImages.length - 1) {
        setSelectedImage(prev => prev + 1);
      } else if (diff < 0 && selectedImage > 0) {
        setSelectedImage(prev => prev - 1);
      }
    }
    setIsDragging(false);
  };

  const nextImage = () => {
    setSelectedImage(prev => 
      prev === productImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setSelectedImage(prev => 
      prev === 0 ? productImages.length - 1 : prev - 1
    );
  };

  // Calculate discount percentage
  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation - Floating */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background/90 to-transparent">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => {
              // Smart back navigation: go to category page if product has a category
              if (product.category?.slug) {
                navigate(`/shop/${product.category.slug}`);
              } else {
                // Fallback: check if we came from a shop category page
                const referrer = location.state?.from;
                if (referrer && referrer.startsWith('/shop/')) {
                  navigate(referrer);
                } else {
                  navigate('/shop');
                }
              }
            }}
            className="w-10 h-10 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-lg"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleWishlist}
              className="w-10 h-10 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-lg"
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${
                  isInWishlist(product.id) 
                    ? "fill-gold text-gold" 
                    : "text-foreground"
                }`} 
              />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-lg"
            >
              <Share2 className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Image Gallery - Swipeable */}
      <div className="pt-16">
        <div 
          ref={imageContainerRef}
          className="relative aspect-square bg-muted overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedImage}
              src={productImages[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              draggable={false}
            />
          </AnimatePresence>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-destructive text-destructive-foreground text-sm font-bold rounded">
              -{discountPercent}%
            </div>
          )}

          {/* Pre-order Badge */}
          {canPreorder && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-gold text-charcoal-deep text-sm font-bold rounded" style={{ top: discountPercent > 0 ? '3.5rem' : '1rem' }}>
              Pre-Order
            </div>
          )}

          {/* Navigation Arrows */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-border shadow-lg"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-border shadow-lg"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}

          {/* Pagination Dots */}
          {productImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {productImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    selectedImage === idx 
                      ? "w-6 bg-gold" 
                      : "w-2 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Strip - Gallery Images */}
        {productImages.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  selectedImage === idx 
                    ? "border-gold ring-2 ring-gold/30" 
                    : "border-border hover:border-gold/50"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-5 space-y-4">
        {/* Category & Title */}
        <div>
          {product.category && (
            <span className="text-gold text-xs font-medium uppercase tracking-wider">
              {product.category.name}
            </span>
          )}
          <h1 className="font-display text-xl text-foreground leading-tight mt-1">
            {product.name}
          </h1>
        </div>
        
        {/* Price & Rating Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gold">
              ৳{product.price.toLocaleString()}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-base text-muted-foreground line-through">
                ৳{product.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="font-medium text-foreground">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Including taxes</p>

        {/* Stock Status */}
        <div className={`flex items-center gap-2 text-sm font-medium ${
          isOutOfStock ? "text-destructive" : "text-green-500"
        }`}>
          {isOutOfStock ? (
            <span>Out of Stock</span>
          ) : canPreorder ? (
            <>
              <Clock className="h-4 w-4 text-gold" />
              <span className="text-gold">Pre-Order • {product.production_time || "5-7 days"}</span>
            </>
          ) : (
            <span>In Stock ({product.stock_quantity} available)</span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Customization Notice */}
        {product.allow_customization && (
          <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg flex items-start gap-2">
            <Palette className="h-5 w-5 text-gold mt-0.5" />
            <div>
              <p className="font-medium text-gold text-sm">Customizable</p>
              <p className="text-xs text-muted-foreground">
                This product can be customized. Share details when ordering.
              </p>
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Quantity:</span>
          <div className="flex items-center bg-muted rounded-full">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center hover:bg-border rounded-l-full transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 flex items-center justify-center hover:bg-border rounded-r-full transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
          <Truck className="h-5 w-5 text-gold mt-0.5" />
          <div>
            <p className="font-medium text-sm">Shipping Info</p>
            <p className="text-xs text-muted-foreground">
              Dhaka ৳80 • Outside Dhaka ৳130 • Free on ৳5,000+
            </p>
          </div>
        </div>

        {/* WhatsApp Order */}
        <WhatsAppOrderButton 
          product={product} 
          quantity={quantity}
          className="w-full" 
        />

        {/* Add to Cart & Buy Now - Below WhatsApp */}
        <div className="flex gap-3 mt-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12 bg-charcoal-deep hover:bg-charcoal-deep/90 border-border text-foreground font-semibold"
            onClick={handleAddToCart}
            disabled={addingToCart || isOutOfStock}
          >
            {addingToCart ? (
              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="h-5 w-5 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
          
          <Button
            size="lg"
            className="flex-1 h-12 bg-gold hover:bg-gold/90 text-charcoal-deep font-semibold"
            onClick={handleBuyNow}
            disabled={addingToCart || isOutOfStock}
          >
            {canPreorder ? "Pre-Order" : "Buy Now"}
          </Button>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="px-4 pb-24">
        <RelatedProducts 
          currentProductId={product.id} 
          categoryId={product.category_id}
        />
      </div>
    </div>
  );
};

export default MobileProductDetail;
