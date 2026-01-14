import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, loading, subtotal, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-gold" />
            <span>আপনার কার্ট</span>
          </SheetTitle>
        </SheetHeader>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-display text-xl text-foreground mb-2">
              লগইন করুন
            </h3>
            <p className="text-muted-foreground mb-6">
              কার্ট দেখতে প্রথমে লগইন করুন
            </p>
            <Link to="/auth" onClick={() => onOpenChange(false)}>
              <Button variant="gold">লগইন করুন</Button>
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-display text-xl text-foreground mb-2">
              কার্ট খালি
            </h3>
            <p className="text-muted-foreground mb-6">
              আপনার কার্টে কোনো পণ্য নেই
            </p>
            <Link to="/shop" onClick={() => onOpenChange(false)}>
              <Button variant="gold">শপিং করুন</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 p-4 bg-muted/50 rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {item.product.name}
                      </h4>
                      
                      {/* Pre-order badge */}
                      {item.product.stock_quantity === 0 && item.product.is_preorderable && (
                        <span className="text-xs text-gold">
                          প্রি-অর্ডার • {item.product.production_time}
                        </span>
                      )}

                      <p className="text-gold font-semibold mt-1">
                        ৳{item.product.price.toLocaleString()}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded bg-muted hover:bg-border transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded bg-muted hover:bg-border transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Cart Footer */}
            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">সাবটোটাল</span>
                <span className="font-semibold text-foreground">
                  ৳{subtotal.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                শিপিং চেকআউটে ক্যালকুলেট হবে
              </p>
              <Link to="/checkout" onClick={() => onOpenChange(false)}>
                <Button variant="gold" className="w-full" size="lg">
                  চেকআউট করুন
                </Button>
              </Link>
              <Link to="/shop" onClick={() => onOpenChange(false)}>
                <Button variant="ghost" className="w-full">
                  শপিং চালিয়ে যান
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
