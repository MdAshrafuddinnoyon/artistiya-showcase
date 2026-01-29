import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import heroImage from "@/assets/hero-artisan.jpg";
import MobileHeroSlider from "./MobileHeroSlider";

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

const HeroSection = () => {
  const isMobile = useIsMobile();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

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

  const nextSlide = useCallback(() => {
    if (slides.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }
  }, [slides.length]);

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused, nextSlide]);

  // Fallback slide if no slides in database
  const defaultSlide: HeroSlide = {
    id: "default",
    title: "Artistry Woven,",
    title_highlight: "Elegance",
    title_end: "Defined",
    badge_text: "Premium Handcrafted Collection",
    description: "Discover the artistry of handcrafted jewelry, hand-painted bags, and woven masterpieces. Each piece carries the legacy of Bengali craftsmanship.",
    button_text: "Shop Now",
    button_link: "/shop",
    secondary_button_text: "View Collections",
    secondary_button_link: "/collections",
    image_url: null,
    is_active: true,
    display_order: 0,
  };

  const activeSlides = slides.length > 0 ? slides : [defaultSlide];
  const currentSlide = activeSlides[currentIndex];

  // Show mobile slider for mobile devices
  if (isMobile) {
    return <MobileHeroSlider />;
  }

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-48 bg-muted rounded mb-4" />
          <div className="h-12 w-96 bg-muted rounded mb-4" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </section>
    );
  }

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={currentSlide.image_url || heroImage}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id + "-content"}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              {currentSlide.badge_text && (
                <span className="inline-block text-gold text-sm tracking-[0.3em] uppercase mb-6 font-body">
                  {currentSlide.badge_text}
                </span>
              )}

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6">
                {currentSlide.title}
                {currentSlide.title_highlight && (
                  <>
                    <br />
                    <span className="text-gold">{currentSlide.title_highlight}</span>
                  </>
                )}
                {currentSlide.title_end && ` ${currentSlide.title_end}`}
              </h1>

              {currentSlide.description && (
                <p className="text-lg text-muted-foreground mb-10 max-w-lg font-body">
                  {currentSlide.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4">
                {currentSlide.button_text && currentSlide.button_link && (
                  <Link to={currentSlide.button_link}>
                    <Button variant="hero" size="xl">
                      {currentSlide.button_text}
                    </Button>
                  </Link>
                )}
                {currentSlide.secondary_button_text && currentSlide.secondary_button_link && (
                  <Link to={currentSlide.secondary_button_link}>
                    <Button variant="hero-outline" size="xl">
                      {currentSlide.secondary_button_text}
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-background/50 backdrop-blur-sm border border-border text-foreground hover:bg-gold hover:text-background hover:border-gold transition-all duration-300"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-background/50 backdrop-blur-sm border border-border text-foreground hover:bg-gold hover:text-background hover:border-gold transition-all duration-300"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-gold"
                  : "w-2 bg-foreground/30 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gold/50 rounded-full flex items-start justify-center p-1"
        >
          <motion.div className="w-1.5 h-3 bg-gold rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
