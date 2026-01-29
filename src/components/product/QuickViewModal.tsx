import { X, ShoppingBag, Heart, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import WhatsAppOrderButton from "./WhatsAppOrderButton";

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
  category: {
    name: string;
  } | null;
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal = ({ product, isOpen, onClose }: QuickViewModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const handleAddToCart = async () => {
    for (let i = 0; i < quantity; i++) {
      await addToCart(product.id);
    }
    onClose();
  };

  const handleWishlistClick = async () => {
    await toggleWishlist(product.id);
  };

  const isOutOfStock = product.stock_quantity === 0 && !product.is_preorderable;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:max-h-[85vh] bg-card border border-border rounded-2xl shadow-elevated z-50 overflow-hidden flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors z-10"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>

            <div className="flex flex-col md:flex-row h-full overflow-auto">
              {/* Image Gallery */}
              <div className="md:w-1/2 p-4">
                <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-3">
                  <img
                    src={product.images?.[selectedImage] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnails */}
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-none">
                    {product.images.slice(0, 5).map((img, idx) => (
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

              {/* Product Details */}
              <div className="md:w-1/2 p-4 md:p-6 flex flex-col">
                {product.category && (
                  <span className="text-xs text-gold uppercase tracking-wider mb-2">
                    {product.category.name}
                  </span>
                )}

                <h2 className="font-display text-xl md:text-2xl text-foreground mb-2">
                  {product.name}
                </h2>

                {/* Price */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-semibold text-gold">
                    ৳{product.price.toLocaleString()}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-lg text-muted-foreground line-through">
                      ৳{product.compare_at_price.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {product.description}
                  </p>
                )}

                {/* Stock Status */}
                {isOutOfStock ? (
                  <p className="text-sm text-destructive mb-4">Out of Stock</p>
                ) : product.stock_quantity > 0 && product.stock_quantity <= 5 ? (
                  <p className="text-sm text-gold mb-4">Only {product.stock_quantity} left!</p>
                ) : null}

                {/* Quantity Selector */}
                {!isOutOfStock && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-muted-foreground">Quantity:</span>
                    <div className="flex items-center border border-border rounded-full">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-l-full transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-r-full transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="flex gap-2">
                    <Button
                      variant="gold"
                      className="flex-1"
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleWishlistClick}
                      className="border-border"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isInWishlist(product.id) ? "fill-gold text-gold" : ""
                        }`}
                      />
                    </Button>
                  </div>

                  {/* WhatsApp Order Button */}
                  <WhatsAppOrderButton product={product} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
