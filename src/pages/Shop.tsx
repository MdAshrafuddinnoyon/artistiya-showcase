import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Filter, Grid, LayoutGrid, ShoppingBag, X, Heart, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
  is_new_arrival: boolean | null;
  stock_quantity: number | null;
  is_preorderable: boolean | null;
  category: {
    name: string;
    name_bn: string | null;
    slug: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
}

const Shop = () => {
  const { category: categorySlug } = useParams();
  const { t, language } = useLanguage();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showPreorderOnly, setShowPreorderOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, name_bn, slug")
        .order("display_order", { ascending: true });

      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  // Set category from URL
  useEffect(() => {
    if (categorySlug) {
      const found = categories.find(c => c.slug === categorySlug);
      if (found) {
        setSelectedCategory(found.id);
      }
    } else {
      setSelectedCategory("all");
    }
  }, [categorySlug, categories]);

  // Debounced search function
  const searchProducts = useCallback(async () => {
    setSearchLoading(true);
    try {
      let query = supabase
        .from("products")
        .select(`
          id, name, name_bn, slug, price, compare_at_price, images, 
          is_new_arrival, stock_quantity, is_preorderable,
          category:categories (name, name_bn, slug)
        `)
        .eq("is_active", true);

      // Search filter
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Category filter
      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      // Price filter
      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

      // Pre-order filter
      if (showPreorderOnly) {
        query = query.eq("is_preorderable", true).eq("stock_quantity", 0);
      }

      // Sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "price-low":
          query = query.order("price", { ascending: true });
          break;
        case "price-high":
          query = query.order("price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [searchQuery, selectedCategory, priceRange, showPreorderOnly, sortBy]);

  // Debounced search effect
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchProducts]);

  const getCategoryName = (cat: Category | null) => {
    if (!cat) return "";
    return language === "bn" && cat.name_bn ? cat.name_bn : cat.name;
  };

  const getProductName = (product: Product) => {
    return language === "bn" && product.name_bn ? product.name_bn : product.name;
  };

  const activeCategory = categories.find(c => c.id === selectedCategory);

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

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-display text-lg mb-4">Price Range</h3>
        <Slider
          value={priceRange}
          min={0}
          max={50000}
          step={500}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="mb-4"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>৳{priceRange[0].toLocaleString()}</span>
          <span>৳{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Pre-order Filter */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="preorder"
          checked={showPreorderOnly}
          onCheckedChange={(checked) => setShowPreorderOnly(checked as boolean)}
        />
        <label htmlFor="preorder" className="text-sm cursor-pointer">
          Pre-order Only
        </label>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-display text-lg mb-4">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`block w-full text-left px-3 py-2 rounded transition-colors ${
              selectedCategory === "all" ? "bg-gold/20 text-gold" : "hover:bg-muted"
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                selectedCategory === cat.id ? "bg-gold/20 text-gold" : "hover:bg-muted"
              }`}
            >
              {getCategoryName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setSelectedCategory("all");
          setPriceRange([0, 50000]);
          setShowPreorderOnly(false);
          setSearchQuery("");
        }}
      >
        <X className="h-4 w-4 mr-2" />
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              Explore Our Collection
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-foreground mt-4">
              {activeCategory ? getCategoryName(activeCategory) : t("shop.title")}
            </h1>
          </motion.div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-12 pr-12 h-14 text-lg rounded-full border-border bg-card"
              />
              {searchLoading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gold" />
              )}
              {searchQuery && !searchLoading && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-32">
                <FilterContent />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
                {/* Mobile Filter Button */}
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter className="h-4 w-4 mr-2" />
                      {t("shop.filter")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>{t("shop.filter")}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("shop.sort")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t("shop.newest")}</SelectItem>
                      <SelectItem value="price-low">{t("shop.priceLowHigh")}</SelectItem>
                      <SelectItem value="price-high">{t("shop.priceHighLow")}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode("list")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <span className="text-sm text-muted-foreground">
                  {products.length} products
                </span>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-muted rounded-lg mb-4" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery ? `No products found for "${searchQuery}"` : t("shop.noProducts")}
                  </p>
                  <Button 
                    variant="gold" 
                    className="mt-4"
                    onClick={() => {
                      setSelectedCategory("all");
                      setPriceRange([0, 50000]);
                      setShowPreorderOnly(false);
                      setSearchQuery("");
                    }}
                  >
                    View All
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-4 md:gap-6 ${
                  viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                }`}>
                  {products.map((product, index) => {
                    const isOutOfStock = product.stock_quantity === 0;
                    const canPreorder = isOutOfStock && product.is_preorderable;
                    const discount = product.compare_at_price 
                      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                      : 0;

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        className="group"
                      >
                        <Link to={`/product/${product.slug}`} className={`block ${viewMode === "list" ? "flex gap-6" : ""}`}>
                          <div className={`relative overflow-hidden rounded-lg bg-muted ${
                            viewMode === "list" ? "w-48 aspect-square flex-shrink-0" : "aspect-[3/4] mb-4"
                          }`}>
                            <img
                              src={product.images?.[0] || "/placeholder.svg"}
                              alt={getProductName(product)}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            
                            {/* Wishlist Button */}
                            <button
                              onClick={(e) => handleWishlistClick(e, product.id)}
                              className="absolute top-3 right-3 p-2 bg-background/80 rounded-full hover:bg-background transition-colors z-10"
                            >
                              <Heart 
                                className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-foreground"}`} 
                              />
                            </button>
                            
                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-1">
                              {discount > 0 && (
                                <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded">
                                  -{discount}%
                                </span>
                              )}
                              {product.is_new_arrival && (
                                <span className="px-2 py-0.5 bg-gold text-charcoal-deep text-xs font-semibold rounded">
                                  NEW
                                </span>
                              )}
                              {canPreorder && (
                                <span className="px-2 py-0.5 bg-bronze text-white text-xs font-semibold rounded">
                                  Pre-Order
                                </span>
                              )}
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                              <Button 
                                variant="gold" 
                                size="sm"
                                onClick={(e) => handleAddToCart(e, product.id)}
                              >
                                <ShoppingBag className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="bg-background/80">
                                View
                              </Button>
                            </div>
                          </div>
                          
                          <div className={`space-y-2 ${viewMode === "list" ? "flex-1 py-2" : ""}`}>
                            {product.category && (
                              <span className="text-xs text-gold tracking-wider uppercase">
                                {language === "bn" && product.category.name_bn ? product.category.name_bn : product.category.name}
                              </span>
                            )}
                            <h3 className="font-display text-lg text-foreground group-hover:text-gold transition-colors">
                              {getProductName(product)}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-gold font-semibold">
                                ৳{product.price.toLocaleString()}
                              </span>
                              {product.compare_at_price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ৳{product.compare_at_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
