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
    columns_mobile: 2,
  });
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('categories_section')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_display_settings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  if (loading) {
    return (
      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <div className="h-3 w-24 bg-muted rounded mx-auto mb-3 animate-pulse" />
            <div className="h-6 w-48 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-16 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-10"
        >
          {settings.show_subtitle && (
            <span className="text-gold text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em] uppercase font-body">
              {settings.section_subtitle}
            </span>
          )}
          <h2 className="font-display text-xl md:text-2xl lg:text-3xl text-foreground mt-1 md:mt-2">
            {settings.section_title}
          </h2>
        </motion.div>

        {/* Grid Mode - Always use grid for consistent design */}
        <div className={`grid gap-2 md:gap-4 ${
          displayCategories.length <= 2 
            ? 'grid-cols-2' 
            : displayCategories.length === 3 
              ? 'grid-cols-3' 
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {displayCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
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
      className={`group block relative aspect-[4/5] overflow-hidden ${shapeClass}`}
    >
      {/* Image */}
      <img
        src={category.image_url || defaultImage}
        alt={category.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep/90 via-charcoal-deep/30 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end p-2 md:p-4 text-center">
        <span className="text-gold text-[8px] md:text-[10px] tracking-wider uppercase mb-0.5 md:mb-1 font-body">
          Handcrafted
        </span>
        <h3 className="font-display text-xs md:text-base lg:text-lg text-foreground">
          {category.name}
        </h3>
        {showDescription && category.description && (
          <p className="hidden md:block text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
            {category.description}
          </p>
        )}
        
        {/* Hover line */}
        <div className="mt-1.5 md:mt-2 w-0 h-0.5 bg-gold group-hover:w-6 md:group-hover:w-10 transition-all duration-400" />
      </div>
    </Link>
  );
};

export default CategorySection;
