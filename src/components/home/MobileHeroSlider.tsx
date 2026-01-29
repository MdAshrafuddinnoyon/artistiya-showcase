import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-artisan.jpg";

interface HeroSlide {
  id: string;
  title: string | null;
  title_highlight: string | null;
  title_end: string | null;
  badge_text: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  secondary_button_text: string | null;
  secondary_button_link: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

const MobileHeroSlider = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error("Error fetching slides:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Default slide
  const defaultSlide: HeroSlide = {
    id: "default",
    title: "Discover",
    title_highlight: "Handcrafted",
    title_end: "Elegance",
    badge_text: "New Collection",
    description: "Premium artisan jewelry and accessories",
    button_text: "Shop Now",
    button_link: "/shop",
    secondary_button_text: null,
    secondary_button_link: null,
    image_url: null,
    is_active: true,
    display_order: 0,
  };

  const activeSlides = slides.length > 0 ? slides : [defaultSlide];
  const currentSlide = activeSlides[currentIndex];

  if (loading) {
    return (
      <div className="md:hidden pt-28 px-4 pb-4">
        <div className="relative w-full aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <section className="md:hidden pt-28 px-4 pb-4">
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
        {/* Slide Images */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img
              src={currentSlide.image_url || heroImage}
              alt="Hero"
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + "-content"}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {currentSlide.badge_text && (
                <span className="inline-block bg-gold/20 text-gold text-[10px] px-2.5 py-0.5 rounded-full font-medium">
                  {currentSlide.badge_text}
                </span>
              )}

              <h2 className="font-display text-xl text-foreground leading-tight">
                {currentSlide.title}
                {currentSlide.title_highlight && (
                  <span className="text-gold"> {currentSlide.title_highlight}</span>
                )}
              </h2>

              {currentSlide.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {currentSlide.description}
                </p>
              )}

              {currentSlide.button_text && currentSlide.button_link && (
                <Link to={currentSlide.button_link}>
                  <Button variant="gold" size="sm" className="mt-2 h-8 text-xs">
                    {currentSlide.button_text}
                  </Button>
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Indicators */}
        {activeSlides.length > 1 && (
          <div className="absolute top-4 right-4 flex gap-1.5">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-6 bg-gold"
                    : "w-1.5 bg-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <QuickActionCard
          title="New Arrivals"
          subtitle="Fresh designs"
          href="/collections/new-arrivals"
          bgColor="bg-gold/10"
          textColor="text-gold"
        />
        <QuickActionCard
          title="Best Sellers"
          subtitle="Top picks"
          href="/collections/best-sellers"
          bgColor="bg-muted"
          textColor="text-foreground"
        />
      </div>
    </section>
  );
};

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  href: string;
  bgColor: string;
  textColor: string;
}

const QuickActionCard = ({ title, subtitle, href, bgColor, textColor }: QuickActionCardProps) => (
  <Link
    to={href}
    className={`${bgColor} rounded-xl p-3 flex flex-col justify-center active:scale-95 transition-transform`}
  >
    <span className={`font-display text-xs ${textColor}`}>{title}</span>
    <span className="text-[10px] text-muted-foreground">{subtitle}</span>
  </Link>
);

export default MobileHeroSlider;
