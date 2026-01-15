import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Default images
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryWoven from "@/assets/category-woven.jpg";
import categoryArt from "@/assets/category-art.jpg";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

interface CategorySettings {
  section_title: string;
  section_subtitle: string;
  items_to_show: number;
  card_shape: string;
  enable_slider: boolean;
  auto_slide: boolean;
  slide_interval: number;
  show_description: boolean;
  show_subtitle: boolean;
  columns_desktop: number;
  columns_tablet: number;
  columns_mobile: number;
}

const defaultImages = [categoryJewelry, categoryBags, categoryWoven, categoryArt];

const CategorySection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<CategorySettings>({
    section_title: "Shop by Category",
    section_subtitle: "Explore Our World",
    items_to_show: 4,
    card_shape: "square",
    enable_slider: false,
    auto_slide: false,
    slide_interval: 5000,
    show_description: true,
    show_subtitle: true,
    columns_desktop: 4,
    columns_tablet: 2,
    columns_mobile: 1,
  });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, settingsRes] = await Promise.all([
        supabase.from("categories").select("*").order("display_order"),
        supabase.from("category_display_settings").select("*").single(),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayCategories = categories.slice(0, settings.items_to_show);

  const nextSlide = useCallback(() => {
    if (displayCategories.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % displayCategories.length);
    }
  }, [displayCategories.length]);

  const prevSlide = useCallback(() => {
    if (displayCategories.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + displayCategories.length) % displayCategories.length);
    }
  }, [displayCategories.length]);

  // Auto-slide
  useEffect(() => {
    if (!settings.enable_slider || !settings.auto_slide || displayCategories.length <= 1) return;

    const interval = setInterval(nextSlide, settings.slide_interval);
    return () => clearInterval(interval);
  }, [settings.enable_slider, settings.auto_slide, settings.slide_interval, displayCategories.length, nextSlide]);

  const getShapeClass = () => {
    switch (settings.card_shape) {
      case "circle":
        return "rounded-full";
      case "rounded":
        return "rounded-3xl";
      default:
        return "rounded-lg";
    }
  };

  const getGridCols = () => {
    return `grid-cols-${settings.columns_mobile} md:grid-cols-${settings.columns_tablet} lg:grid-cols-${settings.columns_desktop}`;
  };

  if (loading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-4 w-32 bg-muted rounded mx-auto mb-4 animate-pulse" />
            <div className="h-8 w-64 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {settings.show_subtitle && (
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              {settings.section_subtitle}
            </span>
          )}
          <h2 className="font-display text-4xl md:text-5xl text-foreground mt-4">
            {settings.section_title}
          </h2>
        </motion.div>

        {/* Slider Mode */}
        {settings.enable_slider ? (
          <div className="relative">
            {/* Navigation Arrows */}
            {displayCategories.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card border border-border text-foreground hover:bg-gold hover:text-background hover:border-gold transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card border border-border text-foreground hover:bg-gold hover:text-background hover:border-gold transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Slider Content */}
            <div className="overflow-hidden" ref={sliderRef}>
              <motion.div
                className="flex"
                animate={{ x: `-${currentIndex * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {displayCategories.map((category, index) => (
                  <div key={category.id} className="w-full flex-shrink-0 px-2">
                    <CategoryCard
                      category={category}
                      index={index}
                      shapeClass={getShapeClass()}
                      showDescription={settings.show_description}
                      defaultImage={defaultImages[index % defaultImages.length]}
                    />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {displayCategories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? "w-8 bg-gold" : "w-2 bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Grid Mode */
          <div 
            className="grid gap-6"
            style={{
              gridTemplateColumns: `repeat(${settings.columns_mobile}, 1fr)`,
            }}
          >
            <style>{`
              @media (min-width: 768px) {
                .category-grid {
                  grid-template-columns: repeat(${settings.columns_tablet}, 1fr) !important;
                }
              }
              @media (min-width: 1024px) {
                .category-grid {
                  grid-template-columns: repeat(${settings.columns_desktop}, 1fr) !important;
                }
              }
            `}</style>
            <div 
              className="category-grid grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${settings.columns_mobile}, 1fr)`,
              }}
            >
              {displayCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <CategoryCard
                    category={category}
                    index={index}
                    shapeClass={getShapeClass()}
                    showDescription={settings.show_description}
                    defaultImage={defaultImages[index % defaultImages.length]}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

interface CategoryCardProps {
  category: Category;
  index: number;
  shapeClass: string;
  showDescription: boolean;
  defaultImage: string;
}

const CategoryCard = ({ category, index, shapeClass, showDescription, defaultImage }: CategoryCardProps) => {
  return (
    <Link
      to={`/shop/${category.slug}`}
      className={`group block relative aspect-square overflow-hidden ${shapeClass}`}
    >
      {/* Image */}
      <img
        src={category.image_url || defaultImage}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
        <span className="text-gold text-xs tracking-widest uppercase mb-2 font-body">
          Handcrafted
        </span>
        <h3 className="font-display text-xl md:text-2xl text-foreground mb-2">
          {category.name}
        </h3>
        {showDescription && category.description && (
          <p className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {category.description}
          </p>
        )}
        
        {/* Hover line */}
        <div className="mt-4 w-0 h-0.5 bg-gold group-hover:w-16 transition-all duration-500" />
      </div>
    </Link>
  );
};

export default CategorySection;
