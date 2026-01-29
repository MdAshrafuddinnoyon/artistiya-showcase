import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  price: number;
  images: string[];
  category: {
    name: string;
  } | null;
}

interface InlineSearchProps {
  placeholder?: string;
  className?: string;
}

const InlineSearch = ({ placeholder = "Search products...", className = "" }: InlineSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Search products when query changes
  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id, name, name_bn, slug, price, images,
            category:categories (name)
          `)
          .eq("is_active", true)
          .or(`name.ilike.%${debouncedQuery}%,name_bn.ilike.%${debouncedQuery}%`)
          .limit(8);

        if (!error && data) {
          setResults(data as unknown as Product[]);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-10 bg-muted rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 border border-transparent focus:border-gold/30"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-elevated overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
          >
            {results.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                onClick={handleResultClick}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
              >
                {/* Product Image */}
                <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-1">
                    {product.name}
                  </h4>
                  {product.category && (
                    <p className="text-xs text-muted-foreground">
                      {product.category.name}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-gold mt-0.5">
                    ৳{product.price.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}

            {/* View All Results */}
            <Link
              to={`/shop?search=${encodeURIComponent(query)}`}
              onClick={handleResultClick}
              className="block p-3 text-center text-sm text-gold hover:bg-muted/50 transition-colors font-medium"
            >
              View all results for "{query}"
            </Link>
          </motion.div>
        )}

        {isOpen && query.length >= 2 && results.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-elevated p-6 text-center z-50"
          >
            <p className="text-muted-foreground text-sm">
              No products found for "{query}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InlineSearch;
