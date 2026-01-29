import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, Heart, Share2, Star, Minus, Plus, 
  ShoppingBag, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import WhatsAppOrderButton from "@/components/product/WhatsAppOrderButton";
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
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

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
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const isOutOfStock = product.stock_quantity === 0 && !product.is_preorderable;

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

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleWishlist}
              className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
            >
              <Heart 
                className={`h-5 w-5 ${
                  isInWishlist(product.id) 
                    ? "fill-gold text-gold" 
                    : "text-foreground"
                }`} 
              />
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"
            >
              <Share2 className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Image Slider */}
      <div className="pt-16">
        <div className="relative aspect-square bg-muted overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedImage}
              src={productImages[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>

          {/* Navigation Arrows */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
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
                  className={`h-1.5 rounded-full transition-all ${
                    selectedImage === idx 
                      ? "w-6 bg-gold" 
                      : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {productImages.length > 1 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImage === idx ? "border-gold" : "border-transparent"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-4 space-y-4">
        {/* Title & Price */}
        <div>
          <h1 className="font-display text-xl text-foreground leading-tight">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold text-gold">
              ৳{product.price.toLocaleString()}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-base text-muted-foreground line-through">
                ৳{product.compare_at_price.toLocaleString()}
              </span>
            )}
            <span className="text-xs text-muted-foreground">| Including taxes</span>
          </div>
        </div>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="font-medium text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({reviewCount})</span>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Quantity Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Quantity:</span>
          <div className="flex items-center border border-border rounded-full">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-l-full transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-r-full transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* WhatsApp Order */}
        <WhatsAppOrderButton 
          product={product} 
          quantity={quantity}
          className="w-full" 
        />
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 space-y-2 z-40">
        <Button
          variant="outline"
          size="lg"
          className="w-full bg-charcoal-deep text-white border-none hover:bg-charcoal-deep/90"
          onClick={handleAddToCart}
          disabled={addingToCart || isOutOfStock}
        >
          {addingToCart ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Adding...
            </span>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
        
        <Button
          variant="gold"
          size="lg"
          className="w-full"
          onClick={handleBuyNow}
          disabled={addingToCart || isOutOfStock}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
};

export default MobileProductDetail;
