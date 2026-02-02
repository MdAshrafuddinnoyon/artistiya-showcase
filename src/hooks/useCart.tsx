import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

type GuestCartEntry = { product_id: string; quantity: number };

const GUEST_CART_STORAGE_KEY = "artistiya_guest_cart_v1";

const safeReadGuestCart = (): GuestCartEntry[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is GuestCartEntry =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as any).product_id === "string" &&
          typeof (x as any).quantity === "number" &&
          Number.isFinite((x as any).quantity)
      )
      .map((x) => ({ product_id: x.product_id, quantity: Math.max(1, Math.floor(x.quantity)) }));
  } catch {
    return [];
  }
};

const safeWriteGuestCart = (entries: GuestCartEntry[]) => {
  try {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
};

const clearGuestCart = () => {
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const guestItemId = (productId: string) => `guest:${productId}`;

const getGuestProductIdFromItemId = (itemId: string) => {
  if (!itemId.startsWith("guest:")) return null;
  return itemId.slice("guest:".length);
};

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    name_bn: string | null;
    price: number;
    images: string[];
    stock_quantity: number;
    is_preorderable: boolean;
    production_time: string | null;
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    setLoading(true);
    try {
      // Logged-in cart (persisted in DB)
      if (user) {
        const { data, error } = await supabase
          .from("cart_items")
          .select(`
            id,
            product_id,
            quantity,
            product:products (
              id,
              name,
              name_bn,
              price,
              images,
              stock_quantity,
              is_preorderable,
              production_time
            )
          `)
          .eq("user_id", user.id);

        if (error) throw error;
        setItems((data as unknown as CartItem[]) || []);
        return;
      }

      // Guest cart (persisted in localStorage)
      const guestEntries = safeReadGuestCart();
      if (guestEntries.length === 0) {
        setItems([]);
        return;
      }

      const productIds = Array.from(new Set(guestEntries.map((e) => e.product_id)));
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          "id,name,name_bn,price,images,stock_quantity,is_preorderable,production_time"
        )
        .in("id", productIds);

      if (productsError) throw productsError;

      const byId = new Map<string, any>((products || []).map((p: any) => [p.id, p]));
      const nextItems: CartItem[] = guestEntries
        .map((e) => {
          const p = byId.get(e.product_id);
          if (!p) return null;
          return {
            id: guestItemId(e.product_id),
            product_id: e.product_id,
            quantity: e.quantity,
            product: {
              id: p.id,
              name: p.name,
              name_bn: p.name_bn ?? null,
              price: p.price,
              images: (p.images ?? []) as string[],
              stock_quantity: p.stock_quantity,
              is_preorderable: p.is_preorderable,
              production_time: p.production_time ?? null,
            },
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];

      setItems(nextItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const migrateGuestCartToUserCart = async (userId: string) => {
    const guestEntries = safeReadGuestCart();
    if (guestEntries.length === 0) return;

    try {
      const { data: existing, error: existingError } = await supabase
        .from("cart_items")
        .select("id,product_id,quantity")
        .eq("user_id", userId);

      if (existingError) throw existingError;

      const existingByProduct = new Map<string, { id: string; quantity: number }>();
      (existing || []).forEach((row: any) => {
        if (!existingByProduct.has(row.product_id)) {
          existingByProduct.set(row.product_id, { id: row.id, quantity: row.quantity });
        }
      });

      const ops = guestEntries.map(async (e) => {
        const current = existingByProduct.get(e.product_id);
        if (current) {
          return supabase
            .from("cart_items")
            .update({ quantity: current.quantity + e.quantity })
            .eq("id", current.id);
        }

        return supabase.from("cart_items").insert({
          user_id: userId,
          product_id: e.product_id,
          quantity: e.quantity,
        });
      });

      const results = await Promise.all(ops);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      clearGuestCart();
    } catch (error) {
      // If merge fails, keep guest cart to avoid data loss.
      console.error("Error migrating guest cart:", error);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (user) {
        await migrateGuestCartToUserCart(user.id);
      }
      await fetchCart();
    };

    run();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      // Logged-in
      if (user) {
        // Check if item already in cart
        const existingItem = items.find((item) => item.product_id === productId);

        if (existingItem) {
          await updateQuantity(existingItem.id, existingItem.quantity + quantity);
        } else {
          const { error } = await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          });

          if (error) throw error;
          toast.success("Added to cart");
          await fetchCart();
        }

        return;
      }

      // Guest
      const guestEntries = safeReadGuestCart();
      const idx = guestEntries.findIndex((e) => e.product_id === productId);

      if (idx >= 0) {
        guestEntries[idx] = {
          product_id: productId,
          quantity: guestEntries[idx].quantity + quantity,
        };
      } else {
        guestEntries.push({ product_id: productId, quantity });
      }

      safeWriteGuestCart(guestEntries);
      toast.success("Added to cart");
      await fetchCart();
      
      // Track as abandoned cart for marketing
      await trackAbandonedCart(guestEntries);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const trackAbandonedCart = async (cartEntries: GuestCartEntry[]) => {
    try {
      // Only track for guest users with items
      if (user || cartEntries.length === 0) return;

      const productIds = cartEntries.map((e) => e.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id, price")
        .in("id", productIds);

      const cartTotal = cartEntries.reduce((sum, entry) => {
        const product = products?.find((p) => p.id === entry.product_id);
        return sum + (product?.price || 0) * entry.quantity;
      }, 0);

      // Upsert abandoned cart
      await supabase.from("abandoned_carts").upsert(
        {
          cart_data: cartEntries,
          cart_total: cartTotal,
          last_activity_at: new Date().toISOString(),
        },
        { onConflict: "id", ignoreDuplicates: false }
      );
    } catch (error) {
      // Silent fail - don't interrupt user experience
      console.error("Error tracking abandoned cart:", error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const guestProductId = getGuestProductIdFromItemId(itemId);
      if (!user && guestProductId) {
        const guestEntries = safeReadGuestCart().filter((e) => e.product_id !== guestProductId);
        safeWriteGuestCart(guestEntries);
        toast.success("Removed from cart");
        await fetchCart();
        return;
      }

      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
      toast.success("Removed from cart");
      await fetchCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove");
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const guestProductId = getGuestProductIdFromItemId(itemId);
      if (!user && guestProductId) {
        const guestEntries = safeReadGuestCart();
        const idx = guestEntries.findIndex((e) => e.product_id === guestProductId);
        if (idx >= 0) {
          guestEntries[idx] = { product_id: guestProductId, quantity };
          safeWriteGuestCart(guestEntries);
        }
        await fetchCart();
        return;
      }

      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update");
    }
  };

  const clearCart = async () => {
    try {
      if (!user) {
        clearGuestCart();
        setItems([]);
        return;
      }

      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);
      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        itemCount,
        subtotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
