import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  description: string | null;
  image_url: string | null;
  productCount?: number;
}

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
    slug: string;
  } | null;
}

// Fallback images
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryWoven from "@/assets/category-woven.jpg";
import categoryArt from "@/assets/category-art.jpg";
import heroImage from "@/assets/hero-artisan.jpg";

const fallbackImages: Record<string, string> = {
  "jewelry": categoryJewelry,
  "bags-accessories": categoryBags,
  "woven-tales": categoryWoven,
  "fine-art": categoryArt,
  "resin-art": categoryBags,
  "home-decor": categoryWoven,
  "polymer-clay": categoryJewelry,
};

const Collections = () => {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch categories with realtime subscription
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: cats, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (!error && cats) {
        // Get product counts
        const catsWithCount = await Promise.all(
          cats.map(async (cat) => {
            const { count } = await supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("category_id", cat.id)
              .eq("is_active", true);
            return { ...cat, productCount: count || 0 };
          })
        );
        setCategories(catsWithCount);
      }
    };

    fetchCategories();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('collections_categories_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => fetchCategories()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle slug-based category selection
  useEffect(() => {
    if (slug && categories.length > 0) {
      const cat = categories.find(c => c.slug === slug);
      if (cat) {
        setSelectedCategory(cat);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [slug, categories]);

  // Fetch products when category is selected
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedCategory) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, name_bn, slug, price, compare_at_price, images, 
          is_new_arrival, stock_quantity, is_preorderable,
          category:categories (name, slug)
        `)
        .eq("category_id", selectedCategory.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error) {
        setProducts((data || []) as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [selectedCategory]);

  // Set initial loading to false when categories load
  useEffect(() => {
    if (categories.length > 0 && !slug) {
      setLoading(false);
    }
  }, [categories, slug]);

  const getCategoryName = (cat: Category) => {
    return language === "bn" && cat.name_bn ? cat.name_bn : cat.name;
  };

  const getProductName = (product: Product) => {
    return language === "bn" && product.name_bn ? product.name_bn : product.name;
  };

  const getCategoryImage = (cat: Category) => {
    return cat.image_url || fallbackImages[cat.slug] || heroImage;
  };

  // Show products for a specific collection
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20 md:pt-32 pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            {/* Back Link */}
            <Link 
              to="/collections" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-gold mb-4 md:mb-8 transition-colors"
            >
              ← {language === "bn" ? "সব কালেকশন" : "All Collections"}
            </Link>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-6 md:mb-12"
            >
              <span className="text-gold text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase font-body">
                {language === "bn" ? "কালেকশন" : "Collection"}
              </span>
              <h1 className={`font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-foreground mt-2 md:mt-4 ${language === "bn" ? "font-bengali" : ""}`}>
                {getCategoryName(selectedCategory)}
              </h1>
              {selectedCategory.description && (
                <p className="text-muted-foreground text-sm md:text-base mt-2 md:mt-4 max-w-2xl mx-auto">
                  {selectedCategory.description}
                </p>
              )}
            </motion.div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className={`text-muted-foreground text-lg ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn" ? "এই কালেকশনে কোনো পণ্য নেই" : "No products in this collection"}
                </p>
                <Link to="/shop">
                  <Button variant="gold" className="mt-4">
                    {language === "bn" ? "সব পণ্য দেখুন" : "View All Products"}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                      <Link to={`/product/${product.slug}`} className="block">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-4">
                          <img
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={getProductName(product)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          
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
                          <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Button variant="gold" size="sm">
                              <ShoppingBag className="h-4 w-4 mr-1" />
                              {t("shop.viewDetails")}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className={`font-display text-lg text-foreground group-hover:text-gold transition-colors ${language === "bn" ? "font-bengali" : ""}`}>
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
        </main>

        <Footer />
      </div>
    );
  }

  // Show all collections
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-16"
          >
            <span className={`text-gold text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase font-body ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" ? "আপনার জন্য বাছাই করা" : "Curated For You"}
            </span>
            <h1 className={`font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-foreground mt-2 md:mt-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" ? "আমাদের " : "Our "}
              <span className="text-gold">{language === "bn" ? "কালেকশন" : "Collections"}</span>
            </h1>
          </motion.div>

          {/* Collections Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link
                    to={`/collections/${category.slug}`}
                    className="group block relative aspect-[3/4] overflow-hidden rounded-lg"
                  >
                    <img
                      src={getCategoryImage(category)}
                      alt={getCategoryName(category)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/50 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-3 md:p-8 text-center">
                      <span className="text-gold text-[9px] md:text-xs tracking-widest uppercase mb-1 md:mb-2">
                        {category.productCount} {language === "bn" ? "টি পণ্য" : "Products"}
                      </span>
                      <h3 className={`font-display text-base sm:text-lg md:text-2xl lg:text-3xl text-foreground mb-1 md:mb-2 ${language === "bn" ? "font-bengali" : ""}`}>
                        {getCategoryName(category)}
                      </h3>
                      {category.description && (
                        <p className="text-muted-foreground font-body text-[10px] md:text-sm line-clamp-2 hidden sm:block">
                          {category.description}
                        </p>
                      )}
                      <div className="mt-2 md:mt-4 w-0 h-0.5 bg-gold group-hover:w-8 md:group-hover:w-16 transition-all duration-500" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Collections;
