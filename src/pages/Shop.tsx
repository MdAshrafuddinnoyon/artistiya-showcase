import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Filter, Grid, LayoutGrid, ShoppingBag, X, Heart, Search, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
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
  is_showcase: boolean | null;
  showcase_description: string | null;
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

interface ProductColor {
  id: string;
  name: string;
  name_bn: string | null;
  color_code: string;
}

interface ProductSize {
  id: string;
  name: string;
  name_bn: string | null;
}

interface ShopSettings {
  min_price: number;
  max_price: number;
  price_step: number;
  default_sort: string;
  products_per_page: number;
  show_out_of_stock: boolean;
  show_showcase_products: boolean;
  // Layout settings
  filter_position: string;
  // Sales banner settings
  show_sales_banner: boolean;
  sales_banner_position: string;
  sales_banner_text: string;
  sales_banner_text_bn: string;
  sales_banner_link: string;
  sales_banner_bg_color: string;
  sales_banner_text_color: string;
  // Promo banner settings
  show_promo_banner: boolean;
  promo_banner_position: string;
  promo_banner_image: string;
  promo_banner_link: string;
}

interface ShopPageSettings {
  hero_background_image: string | null;
  hero_title: string;
  hero_title_bn: string | null;
  hero_subtitle: string;
  hero_subtitle_bn: string | null;
  hero_overlay_opacity: number;
  sales_banner_enabled: boolean;
  sales_banner_image: string | null;
  sales_banner_title: string | null;
  sales_banner_title_bn: string | null;
  sales_banner_link: string | null;
}

interface FilterSettingConfig {
  id: string;
  filter_key: string;
  filter_name: string;
  filter_type: string;
  is_active: boolean;
  display_order: number;
  options: Record<string, any>;
}

const Shop = () => {
  const { category: categorySlug } = useParams();
  const { t, language } = useLanguage();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableColors, setAvailableColors] = useState<ProductColor[]>([]);
  const [availableSizes, setAvailableSizes] = useState<ProductSize[]>([]);
  const [filterConfigs, setFilterConfigs] = useState<FilterSettingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Shop settings from database
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    min_price: 0,
    max_price: 50000,
    price_step: 100,
    default_sort: 'newest',
    products_per_page: 12,
    show_out_of_stock: true,
    show_showcase_products: true,
    // Layout
    filter_position: 'left',
    // Sales banner
    show_sales_banner: false,
    sales_banner_position: 'top',
    sales_banner_text: '',
    sales_banner_text_bn: '',
    sales_banner_link: '',
    sales_banner_bg_color: '#C9A961',
    sales_banner_text_color: '#000000',
    // Promo banner
    show_promo_banner: false,
    promo_banner_position: 'right',
    promo_banner_image: '',
    promo_banner_link: '',
  });

  // Shop page appearance settings
  const [pageSettings, setPageSettings] = useState<ShopPageSettings>({
    hero_background_image: null,
    hero_title: "Shop",
    hero_title_bn: null,
    hero_subtitle: "Explore Our Collection",
    hero_subtitle_bn: null,
    hero_overlay_opacity: 0.5,
    sales_banner_enabled: false,
    sales_banner_image: null,
    sales_banner_title: null,
    sales_banner_title_bn: null,
    sales_banner_link: null,
  });
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showPreorderOnly, setShowPreorderOnly] = useState(false);
  const [showShowcaseOnly, setShowShowcaseOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showCustomOrderOnly, setShowCustomOrderOnly] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");

  // Realtime connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // Track if initial load has happened to prevent overwriting user filter changes
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Fetch shop settings and filter configs - stable function with no dependencies that cause loops
  const fetchSettings = useCallback(async () => {
    try {
      // Fetch all settings in parallel for efficiency
      const [shopResult, pageResult, filterResult] = await Promise.all([
        supabase.from("shop_settings").select("*").single(),
        supabase.from("shop_page_settings").select("*").single(),
        supabase.from("filter_settings").select("*").order("display_order", { ascending: true }),
      ]);

      const { data: shopData } = shopResult;
      const { data: pageData } = pageResult;
      const { data: filterData } = filterResult;
      
      if (shopData) {
        setShopSettings(prev => {
          const newData = shopData as ShopSettings;
          // Deep compare to prevent unnecessary updates
          if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
          return newData;
        });
        
        // Only set price range and sort on very first load
        if (!initialLoadDone) {
          setPriceRange([shopData.min_price || 0, shopData.max_price || 50000]);
          if (shopData.default_sort) {
            setSortBy(shopData.default_sort);
          }
          setInitialLoadDone(true);
        }
      }

      if (pageData) {
        setPageSettings(prev => {
          if (JSON.stringify(prev) === JSON.stringify(pageData)) return prev;
          return pageData as any;
        });
      }

      if (filterData) {
        const configs: FilterSettingConfig[] = filterData.map((f) => ({
          id: f.id,
          filter_key: f.filter_key,
          filter_name: f.filter_name,
          filter_type: f.filter_type,
          is_active: f.is_active ?? true,
          display_order: f.display_order ?? 0,
          options: (typeof f.options === "object" && f.options !== null ? f.options : {}) as Record<string, any>,
        }));
        setFilterConfigs(prev => {
          if (JSON.stringify(prev) === JSON.stringify(configs)) return prev;
          return configs;
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, [initialLoadDone]);

  // Initial settings load - only runs once on mount
  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime subscription - separate from initial load to prevent re-subscription loops
  useEffect(() => {
    let isSubscribed = true;
    
    // Subscribe to realtime changes for shop_page_settings, shop_settings, and filter_settings
    const channel = supabase
      .channel('shop_all_settings_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shop_page_settings' },
        () => {
          if (isSubscribed) fetchSettings();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shop_settings' },
        () => {
          if (isSubscribed) fetchSettings();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'filter_settings' },
        () => {
          if (isSubscribed) fetchSettings();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('connecting');
        }
      });

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  // Fetch categories and variant options
  useEffect(() => {
    const fetchCategoriesAndVariants = async () => {
      const [categoriesRes, colorsRes, sizesRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, name_bn, slug")
          .order("display_order", { ascending: true }),
        supabase
          .from("product_colors")
          .select("id, name, name_bn, color_code")
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("product_sizes")
          .select("id, name, name_bn")
          .eq("is_active", true)
          .order("display_order"),
      ]);

      if (!categoriesRes.error && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (!colorsRes.error && colorsRes.data) {
        setAvailableColors(colorsRes.data);
      }
      if (!sizesRes.error && sizesRes.data) {
        setAvailableSizes(sizesRes.data);
      }
    };

    fetchCategoriesAndVariants();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('categories_variants_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => fetchCategoriesAndVariants()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_colors' },
        () => fetchCategoriesAndVariants()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_sizes' },
        () => fetchCategoriesAndVariants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          is_new_arrival, stock_quantity, is_preorderable, is_showcase, showcase_description,
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

      // Price filter - only for non-showcase products
      if (!showShowcaseOnly) {
        query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);
      }

      // Pre-order filter
      if (showPreorderOnly) {
        query = query.eq("is_preorderable", true).eq("stock_quantity", 0);
      }

      // Showcase filter
      if (showShowcaseOnly) {
        query = query.eq("is_showcase", true);
      }

      // In Stock filter
      if (showInStockOnly) {
        query = query.gt("stock_quantity", 0);
      }

      // Custom Order filter (showcase products that allow custom orders)
      if (showCustomOrderOnly) {
        query = query.eq("is_showcase", true);
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
  }, [searchQuery, selectedCategory, priceRange, showPreorderOnly, showShowcaseOnly, showInStockOnly, showCustomOrderOnly, sortBy]);

  // Debounced search effect with realtime subscription
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchProducts]);

  // Realtime product updates
  useEffect(() => {
    const channel = supabase
      .channel('products_shop_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => searchProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Helper to check if a specific filter is enabled
  const isFilterEnabled = (filterKey: string) => {
    return filterConfigs.some((f) => f.filter_key === filterKey && f.is_active);
  };

  // Render individual filter based on filter_key
  const renderFilter = (filterConfig: FilterSettingConfig) => {
    switch (filterConfig.filter_key) {
      case "price_range":
        return (
          <div key={filterConfig.id}>
            <h3 className="font-display text-lg mb-4">{language === "bn" ? "মূল্য সীমা" : filterConfig.filter_name}</h3>
            <div className="space-y-4">
              <Slider
                value={priceRange}
                min={shopSettings.min_price}
                max={shopSettings.max_price}
                step={shopSettings.price_step}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                className="mb-2"
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="text-center h-9"
                    min={shopSettings.min_price}
                    max={priceRange[1]}
                  />
                </div>
                <span className="text-muted-foreground">—</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="text-center h-9"
                    min={priceRange[0]}
                    max={shopSettings.max_price}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>৳{shopSettings.min_price.toLocaleString()}</span>
                <span>৳{shopSettings.max_price.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );

      case "preorder":
        return (
          <div key={filterConfig.id} className="flex items-center space-x-2">
            <Checkbox
              id="preorder"
              checked={showPreorderOnly}
              onCheckedChange={(checked) => {
                setShowPreorderOnly(checked as boolean);
                if (checked) setShowShowcaseOnly(false);
              }}
            />
            <label htmlFor="preorder" className="text-sm cursor-pointer">
              {language === "bn" ? "শুধু প্রি-অর্ডার" : filterConfig.filter_name}
            </label>
          </div>
        );

      case "showcase":
        return (
          <div key={filterConfig.id} className="flex items-center space-x-2">
            <Checkbox
              id="showcase"
              checked={showShowcaseOnly}
              onCheckedChange={(checked) => {
                setShowShowcaseOnly(checked as boolean);
                if (checked) setShowPreorderOnly(false);
              }}
            />
            <label htmlFor="showcase" className="text-sm cursor-pointer flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-gold" />
              {language === "bn" ? "শোকেস পণ্য" : filterConfig.filter_name}
            </label>
          </div>
        );

      case "colors":
        if (availableColors.length === 0) return null;
        return (
          <div key={filterConfig.id}>
            <h3 className="font-display text-lg mb-4">{language === "bn" ? "রং" : filterConfig.filter_name}</h3>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    setSelectedColors((prev) =>
                      prev.includes(color.name)
                        ? prev.filter((c) => c !== color.name)
                        : [...prev, color.name]
                    );
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    selectedColors.includes(color.name)
                      ? "border-gold bg-gold/20"
                      : "border-border hover:border-gold/50"
                  }`}
                  title={language === "bn" && color.name_bn ? color.name_bn : color.name}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-border shadow-inner"
                    style={{ backgroundColor: color.color_code }}
                  />
                  <span className="text-sm">
                    {language === "bn" && color.name_bn ? color.name_bn : color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case "sizes":
        if (availableSizes.length === 0) return null;
        return (
          <div key={filterConfig.id}>
            <h3 className="font-display text-lg mb-4">{language === "bn" ? "সাইজ" : filterConfig.filter_name}</h3>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => {
                    setSelectedSizes((prev) =>
                      prev.includes(size.name)
                        ? prev.filter((s) => s !== size.name)
                        : [...prev, size.name]
                    );
                  }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSizes.includes(size.name)
                      ? "border-gold bg-gold/20 text-gold"
                      : "border-border hover:border-gold/50"
                  }`}
                >
                  {language === "bn" && size.name_bn ? size.name_bn : size.name}
                </button>
              ))}
            </div>
          </div>
        );

      case "in_stock":
        return (
          <div key={filterConfig.id} className="flex items-center space-x-2">
            <Checkbox
              id="in_stock"
              checked={showInStockOnly}
              onCheckedChange={(checked) => {
                setShowInStockOnly(checked as boolean);
              }}
            />
            <label htmlFor="in_stock" className="text-sm cursor-pointer flex items-center gap-1">
              {language === "bn" ? "স্টকে আছে" : filterConfig.filter_name}
            </label>
          </div>
        );

      case "custom_order":
        return (
          <div key={filterConfig.id} className="flex items-center space-x-2">
            <Checkbox
              id="custom_order"
              checked={showCustomOrderOnly}
              onCheckedChange={(checked) => {
                setShowCustomOrderOnly(checked as boolean);
              }}
            />
            <label htmlFor="custom_order" className="text-sm cursor-pointer flex items-center gap-1">
              {language === "bn" ? "কাস্টম অর্ডার" : filterConfig.filter_name}
            </label>
          </div>
        );

      case "categories":
        return (
          <div key={filterConfig.id}>
            <h3 className="font-display text-lg mb-4">{language === "bn" ? "ক্যাটাগরি" : filterConfig.filter_name}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                  selectedCategory === "all" ? "bg-gold/20 text-gold" : "hover:bg-muted"
                }`}
              >
                {language === "bn" ? "সব পণ্য" : "All Products"}
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
        );

      case "sales_banner":
        if (!shopSettings.show_sales_banner || !shopSettings.sales_banner_text) return null;
        const bannerText = language === "bn" && shopSettings.sales_banner_text_bn ? shopSettings.sales_banner_text_bn : shopSettings.sales_banner_text;
        return (
          <div key={filterConfig.id}>
            {shopSettings.sales_banner_link ? (
              <a href={shopSettings.sales_banner_link} className="block">
                <div 
                  className="py-3 px-4 text-center font-medium rounded-lg"
                  style={{ 
                    backgroundColor: shopSettings.sales_banner_bg_color,
                    color: shopSettings.sales_banner_text_color,
                  }}
                >
                  {bannerText}
                </div>
              </a>
            ) : (
              <div 
                className="py-3 px-4 text-center font-medium rounded-lg"
                style={{ 
                  backgroundColor: shopSettings.sales_banner_bg_color,
                  color: shopSettings.sales_banner_text_color,
                }}
              >
                {bannerText}
              </div>
            )}
          </div>
        );

      // Note: promo_banner not in filter_settings yet, render from shop_settings
      case "promo_banner":
        if (!shopSettings.show_promo_banner || !shopSettings.promo_banner_image) return null;
        const promoContent = (
          <div className="rounded-xl overflow-hidden relative group">
            <img 
              src={shopSettings.promo_banner_image} 
              alt="Promo" 
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        );
        if (shopSettings.promo_banner_link) {
          return <a key={filterConfig.id} href={shopSettings.promo_banner_link} className="block">{promoContent}</a>;
        }
        return <div key={filterConfig.id}>{promoContent}</div>;

      default:
        return null;
    }
  };

  // Get active filters sorted by display order with memoization
  const activeFilters = useMemo(() => {
    const active = filterConfigs
      .filter(f => f.is_active === true)
      .sort((a, b) => a.display_order - b.display_order);
    console.log("Active filters:", active.map(f => f.filter_key).join(", "));
    return active;
  }, [filterConfigs]);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Dynamic Filters - All rendered in display_order (only active ones) */}
      {activeFilters.map(renderFilter)}

      {/* Clear Filters */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setSelectedCategory("all");
          setPriceRange([shopSettings.min_price, shopSettings.max_price]);
          setShowPreorderOnly(false);
          setShowShowcaseOnly(false);
          setShowInStockOnly(false);
          setShowCustomOrderOnly(false);
          setSelectedColors([]);
          setSelectedSizes([]);
          setSearchQuery("");
        }}
      >
        <X className="h-4 w-4 mr-2" />
        {language === "bn" ? "ফিল্টার মুছুন" : "Clear Filters"}
      </Button>
    </div>
  );

  const getPageTitle = () => {
    if (activeCategory) return getCategoryName(activeCategory);
    return language === "bn" && pageSettings.hero_title_bn ? pageSettings.hero_title_bn : pageSettings.hero_title;
  };

  const getPageSubtitle = () => {
    return language === "bn" && pageSettings.hero_subtitle_bn ? pageSettings.hero_subtitle_bn : pageSettings.hero_subtitle;
  };

  // Check if filter should be on left or right
  const isFilterOnRight = shopSettings.filter_position === 'right';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24 pb-24">
        {/* Hero Section with Background - Responsive sizing */}
        <div 
          className="relative py-8 md:py-16 lg:py-24 mb-4 md:mb-8"
          style={{
            backgroundImage: pageSettings.hero_background_image ? `url(${pageSettings.hero_background_image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          {pageSettings.hero_background_image && (
            <div 
              className="absolute inset-0 bg-background"
              style={{ opacity: pageSettings.hero_overlay_opacity }}
            />
          )}
          
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="text-gold text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase font-body">
                {getPageSubtitle()}
              </span>
              <h1 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-foreground mt-2 md:mt-4">
                {getPageTitle()}
              </h1>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8">

          {/* Search Bar - Hidden on mobile since header has search */}
          {!isMobile && (
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
          )}

          {/* Sales banner now rendered dynamically inside FilterContent */}

          <div className={`flex gap-8 ${isFilterOnRight ? 'flex-row-reverse' : ''}`}>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-32 space-y-4">
                {/* All filters including sales banner rendered by display_order */}
                <FilterContent />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">

              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-8 pb-4 md:pb-6 border-b border-border">
                {/* Mobile Filter Button */}
                <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden h-9">
                      <Filter className="h-4 w-4 mr-2" />
                      {t("shop.filter")}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85vw] max-w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>{t("shop.filter")}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      {/* Promo Banner in Filter Sheet */}
                      {shopSettings.show_promo_banner && shopSettings.promo_banner_image && (
                        <a 
                          href={shopSettings.promo_banner_link || "#"} 
                          className="block rounded-lg overflow-hidden relative group"
                          onClick={() => setFilterOpen(false)}
                        >
                          <img 
                            src={shopSettings.promo_banner_image} 
                            alt="Promo" 
                            className="w-full h-auto object-cover"
                          />
                        </a>
                      )}
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex items-center gap-2 md:gap-4">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[130px] md:w-[180px] h-9 text-xs md:text-sm">
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

                <span className="text-xs md:text-sm text-muted-foreground">
                  {products.length} {language === "bn" ? "পণ্য" : "products"}
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
                    {searchQuery 
                      ? (language === "bn" ? `"${searchQuery}" এর জন্য কোনো পণ্য পাওয়া যায়নি` : `No products found for "${searchQuery}"`)
                      : (language === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : t("shop.noProducts"))
                    }
                  </p>
                  <Button 
                    variant="gold" 
                    className="mt-4"
                    onClick={() => {
                      setSelectedCategory("all");
                      setPriceRange([shopSettings.min_price, shopSettings.max_price]);
                      setShowPreorderOnly(false);
                      setShowShowcaseOnly(false);
                      setSearchQuery("");
                    }}
                  >
                    {language === "bn" ? "সব দেখুন" : "View All"}
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
                              {product.is_showcase && (
                                <span className="px-2 py-0.5 bg-gradient-to-r from-gold to-bronze text-charcoal-deep text-xs font-semibold rounded flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  {language === "bn" ? "শোকেস" : "Showcase"}
                                </span>
                              )}
                              {discount > 0 && !product.is_showcase && (
                                <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded">
                                  -{discount}%
                                </span>
                              )}
                              {product.is_new_arrival && !product.is_showcase && (
                                <span className="px-2 py-0.5 bg-gold text-charcoal-deep text-xs font-semibold rounded">
                                  NEW
                                </span>
                              )}
                              {canPreorder && !product.is_showcase && (
                                <span className="px-2 py-0.5 bg-bronze text-white text-xs font-semibold rounded">
                                  {language === "bn" ? "প্রি-অর্ডার" : "Pre-Order"}
                                </span>
                              )}
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                              {product.is_showcase ? (
                                <Button variant="gold" size="sm">
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  {language === "bn" ? "কাস্টম অর্ডার" : "Custom Order"}
                                </Button>
                              ) : (
                                <>
                                  <Button 
                                    variant="gold" 
                                    size="sm"
                                    onClick={(e) => handleAddToCart(e, product.id)}
                                  >
                                    <ShoppingBag className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="bg-background/80">
                                    {language === "bn" ? "দেখুন" : "View"}
                                  </Button>
                                </>
                              )}
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

              {/* Sales banner now rendered dynamically inside FilterContent */}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
