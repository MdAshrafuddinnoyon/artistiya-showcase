import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-artisan.jpg";

interface HeroSlide {
  id: string;
  title: string | null;
  title_highlight: string | null;
  title_end: string | null;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  badge_text: string | null;
}

const MobileHeroSlider = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const { data, error } = await supabase
          .from("hero_slides")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (!error && data) {
          setSlides(data);
        }
      } catch (error) {
        console.error("Error fetching slides:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('hero_slides_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_slides' },
        () => {
          fetchSlides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) {
    return (
      <div className="md:hidden pt-16 px-4">
        <div className="rounded-2xl overflow-hidden bg-muted animate-pulse aspect-[16/9]" />
      </div>
    );
  }

  // Default slide if no slides in database
  const defaultSlide: HeroSlide = {
    id: "default",
    title: "Discover",
    title_highlight: "Handcrafted",
    title_end: "Elegance",
    description: "Authentic artisan creations from Bangladesh",
    image_url: heroImage,
    button_text: "Shop Now",
    button_link: "/shop",
    badge_text: "New Collection",
  };

  const activeSlides = slides.length > 0 ? slides : [defaultSlide];
  const currentSlide = activeSlides[currentIndex];

  return (
    <section className="md:hidden pt-16 px-4">
      <div className="relative rounded-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[16/9]"
          >
            {/* Background Image */}
            <img
              src={currentSlide.image_url || heroImage}
              alt={currentSlide.title || "Promo"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Gradient Overlay - Using brand colors */}
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal-deep/90 via-charcoal/70 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center p-5">
              {currentSlide.badge_text && (
                <span className="inline-block px-2.5 py-0.5 bg-gold/20 text-gold text-[10px] font-semibold uppercase rounded-full w-fit mb-2 border border-gold/30">
                  {currentSlide.badge_text}
                </span>
              )}
              
              <h2 className="text-foreground text-lg font-display leading-tight">
                {currentSlide.title}
                {currentSlide.title_highlight && (
                  <span className="text-gold"> {currentSlide.title_highlight}</span>
                )}
                {currentSlide.title_end && (
                  <span className="text-foreground"> {currentSlide.title_end}</span>
                )}
              </h2>
              
              {currentSlide.description && (
                <p className="text-muted-foreground text-xs mt-1 line-clamp-2 max-w-[65%]">
                  {currentSlide.description}
                </p>
              )}

              {currentSlide.button_text && currentSlide.button_link && (
                <Link to={currentSlide.button_link} className="mt-3">
                  <Button variant="gold" size="sm" className="h-8 text-xs">
                    {currentSlide.button_text}
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {activeSlides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-background/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-border/30"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeSlides.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-background/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-border/30"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {activeSlides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex 
                  ? "w-5 bg-gold" 
                  : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MobileHeroSlider;
