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
  is_new_arrival: boolean;
}

interface MobileProductSectionProps {
  title: string;
  queryType: "new_arrivals" | "featured" | "all";
  showDots?: boolean;
}

const MobileProductSection = ({ title, queryType, showDots = true }: MobileProductSectionProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      let query = supabase
        .from("products")
        .select("id, name, slug, price, images, is_new_arrival")
        .eq("is_active", true)
        .limit(6);

      if (queryType === "new_arrivals") {
        query = query.eq("is_new_arrival", true);
      } else if (queryType === "featured") {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [queryType]);

  const handleWishlistClick = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  if (loading) {
    return (
      <div className="md:hidden px-4 py-4">
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-36">
              <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-4 bg-gray-200 rounded mt-2 w-3/4" />
              <div className="h-4 bg-gray-200 rounded mt-1 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="md:hidden px-4 py-4 bg-white">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {showDots && (
          <div className="flex gap-1">
            <span className="w-5 h-1.5 rounded-full bg-orange-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          </div>
        )}
      </div>

      {/* Horizontal Scroll Products */}
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4">
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.slug}`}
            className="flex-shrink-0 w-36"
          >
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2">
              <img
                src={product.images?.[0] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Wishlist Button */}
              <button
                onClick={(e) => handleWishlistClick(e, product.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm"
              >
                <Heart 
                  className={`h-4 w-4 ${
                    isInWishlist(product.id) 
                      ? "fill-orange-500 text-orange-500" 
                      : "text-gray-400"
                  }`} 
                />
              </button>
            </div>

            {/* Product Info */}
            <h3 className="text-sm text-gray-800 font-medium line-clamp-1">
              {product.name}
            </h3>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              ৳ {product.price.toLocaleString()}
            </p>
            <span className="text-xs text-green-600 font-medium">
              Free shipping
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MobileProductSection;
