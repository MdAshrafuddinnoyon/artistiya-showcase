import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-artisan.jpg";

interface HeroSlide {
  id: string;
  title: string | null;
  title_highlight: string | null;
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

        if (!error && data && data.length > 0) {
          setSlides(data);
        }
      } catch (error) {
        console.error("Error fetching slides:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
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
        <div className="rounded-2xl overflow-hidden bg-gray-200 animate-pulse aspect-[16/9]" />
      </div>
    );
  }

  // Default slide if no slides in database
  const defaultSlide: HeroSlide = {
    id: "default",
    title: "Handcrafted",
    title_highlight: "Elegance",
    description: "Discover authentic artisan creations",
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
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center p-5">
              {currentSlide.badge_text && (
                <span className="inline-block px-2 py-0.5 bg-green-400 text-green-900 text-[10px] font-semibold uppercase rounded w-fit mb-2">
                  {currentSlide.badge_text}
                </span>
              )}
              
              <h2 className="text-white text-lg font-bold leading-tight">
                {currentSlide.title}
                {currentSlide.title_highlight && (
                  <span className="text-yellow-300"> {currentSlide.title_highlight}</span>
                )}
              </h2>
              
              {currentSlide.description && (
                <p className="text-white/80 text-xs mt-1 line-clamp-2 max-w-[60%]">
                  {currentSlide.description}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {activeSlides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeSlides.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Slide Info Text */}
      <p className="text-center text-gray-400 text-[10px] mt-2">
        *Valid offers available. Check terms & conditions
      </p>

      {/* Pagination Dots */}
      {activeSlides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex 
                  ? "w-5 bg-orange-500" 
                  : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MobileHeroSlider;
