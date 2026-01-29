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
      // Get random featured products as "recently viewed" placeholder
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, images")
        .eq("is_active", true)
        .limit(4);

      if (!error && data) {
        setProducts(data);
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

  if (loading || products.length === 0) return null;

  // Pastel background colors
  const bgColors = ["bg-purple-50", "bg-amber-50", "bg-blue-50", "bg-pink-50"];

  return (
    <section className="md:hidden px-4 py-4 bg-white">
      {/* Section Header */}
      <h2 className="text-base font-semibold text-gray-900 mb-3">Recently viewed</h2>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {products.slice(0, 4).map((product, index) => (
          <Link
            key={product.id}
            to={`/product/${product.slug}`}
            className="relative"
          >
            {/* Product Card */}
            <div className={`relative aspect-square ${bgColors[index % bgColors.length]} rounded-xl overflow-hidden`}>
              <img
                src={product.images?.[0] || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
              
              {/* Wishlist Button */}
              <button
                onClick={(e) => handleWishlistClick(e, product.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"
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
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MobileRecentlyViewed;
