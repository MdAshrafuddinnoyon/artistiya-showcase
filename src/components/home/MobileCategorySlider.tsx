import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  image_url: string | null;
}

const MobileCategorySlider = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, name_bn, slug, image_url")
        .order("display_order", { ascending: true })
        .limit(10);

      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("categories_slider_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Default category icons if no image
  const getCategoryIcon = (slug: string) => {
    const icons: Record<string, string> = {
      jewelry: "💍",
      bags: "👜",
      woven: "🧶",
      art: "🎨",
      home: "🏠",
      fashion: "👗",
      accessories: "✨",
    };
    return icons[slug] || "🛍️";
  };

  // Default categories if none in database
  const defaultCategories: Category[] = [
    { id: "1", name: "Jewelry", name_bn: "জুয়েলারি", slug: "jewelry", image_url: null },
    { id: "2", name: "Bags", name_bn: "ব্যাগ", slug: "bags", image_url: null },
    { id: "3", name: "Woven", name_bn: "বোনা", slug: "woven", image_url: null },
    { id: "4", name: "Art", name_bn: "শিল্প", slug: "art", image_url: null },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="relative px-4 py-4">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">
          {language === "bn" ? "ক্যাটাগরি" : "Categories"}
        </h3>
        <Link to="/shop" className="text-xs text-gold hover:underline">
          {language === "bn" ? "সব দেখুন" : "View All"}
        </Link>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 mt-2 z-10 w-8 h-8 bg-background/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 mt-2 z-10 w-8 h-8 bg-background/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>

      {/* Scrollable Categories */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* All Products */}
        <Link
          to="/shop"
          onClick={() => setActiveCategory("all")}
          className={`flex-shrink-0 flex flex-col items-center transition-all ${
            activeCategory === "all" || !activeCategory
              ? "scale-105"
              : "opacity-80"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
              activeCategory === "all" || !activeCategory
                ? "bg-gold/20 border-gold"
                : "bg-muted border-border hover:border-gold/50"
            }`}
          >
            🛒
          </div>
          <span
            className={`mt-2 text-xs font-medium text-center ${
              activeCategory === "all" || !activeCategory
                ? "text-gold"
                : "text-muted-foreground"
            }`}
          >
            {language === "bn" ? "সব" : "All"}
          </span>
        </Link>

        {displayCategories.map((category) => (
          <Link
            key={category.id}
            to={`/shop/${category.slug}`}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-shrink-0 flex flex-col items-center transition-all ${
              activeCategory === category.id ? "scale-105" : "opacity-80"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all ${
                activeCategory === category.id
                  ? "border-gold ring-2 ring-gold/30"
                  : "border-border hover:border-gold/50"
              }`}
            >
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl bg-muted w-full h-full flex items-center justify-center">
                  {getCategoryIcon(category.slug)}
                </span>
              )}
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center max-w-[64px] truncate ${
                activeCategory === category.id
                  ? "text-gold"
                  : "text-muted-foreground"
              }`}
            >
              {language === "bn" && category.name_bn
                ? category.name_bn
                : category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileCategorySlider;
