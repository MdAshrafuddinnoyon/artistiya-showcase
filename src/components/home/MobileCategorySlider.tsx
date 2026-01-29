import { useEffect, useState, useRef } from "react";
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const { language } = useLanguage();
  
  // Dragging state
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      // Fetch ALL categories without limit
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, name_bn, slug, image_url")
        .order("display_order", { ascending: true });

      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();

    const channel = supabase
      .channel("categories_slider_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => fetchCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Touch/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    updateCurrentIndex();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    updateCurrentIndex();
  };

  const updateCurrentIndex = () => {
    if (sliderRef.current) {
      const itemWidth = 80; // w-16 + gap
      const newIndex = Math.round(sliderRef.current.scrollLeft / itemWidth);
      setCurrentIndex(Math.max(0, Math.min(newIndex, displayCategories.length - 3)));
    }
  };

  const scrollToIndex = (index: number) => {
    if (sliderRef.current) {
      const itemWidth = 80;
      sliderRef.current.scrollTo({
        left: index * itemWidth,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const handlePrev = () => {
    const newIndex = Math.max(0, currentIndex - 3);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(displayCategories.length - 3, currentIndex + 3);
    scrollToIndex(newIndex);
  };

  // Default category icons
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

  // Use fetched categories directly - no default fallback
  const displayCategories = categories;

  // Calculate pagination dots
  const dotsCount = Math.ceil(displayCategories.length / 3);
  const activeDot = Math.floor(currentIndex / 3);

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

      {/* Slider Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        {displayCategories.length > 4 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
              style={{ display: currentIndex === 0 ? "none" : "flex" }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>

            <button
              onClick={handleNext}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors"
              style={{ display: currentIndex >= displayCategories.length - 3 ? "none" : "flex" }}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </>
        )}

        {/* Scrollable Categories */}
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto scrollbar-none pb-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onScroll={updateCurrentIndex}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollSnapType: "x mandatory" }}
        >
          {/* All Products */}
          <Link
            to="/shop"
            onClick={(e) => {
              if (isDragging) e.preventDefault();
              else setActiveCategory("all");
            }}
            className="flex-shrink-0 flex flex-col items-center transition-all"
            style={{ scrollSnapAlign: "start" }}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${
                activeCategory === "all" || !activeCategory
                  ? "bg-gold/20 border-gold ring-2 ring-gold/30"
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
              onClick={(e) => {
                if (isDragging) e.preventDefault();
                else setActiveCategory(category.id);
              }}
              className="flex-shrink-0 flex flex-col items-center transition-all"
              style={{ scrollSnapAlign: "start" }}
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
                    draggable={false}
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

        {/* Pagination Dots */}
        {displayCategories.length > 4 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({ length: dotsCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToIndex(idx * 3)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeDot === idx
                    ? "w-5 bg-gold"
                    : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCategorySlider;
