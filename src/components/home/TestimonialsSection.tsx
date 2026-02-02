import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Quote, ShoppingBag, User, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  text: string;
  rating: number;
  customer_photo_url: string | null;
  verified_purchase: boolean;
}

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: "start",
    slidesToScroll: 1,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, name, location, text, rating, customer_photo_url, verified_purchase")
          .eq("is_active", true)
          .order("display_order")
          .limit(10);

        if (error) throw error;
        setTestimonials(data || []);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();

    // Realtime subscription
    const channel = supabase
      .channel("testimonials_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "testimonials" },
        () => fetchTestimonials()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-charcoal">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-8 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-6" />
                <div className="h-20 bg-muted rounded mb-6" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-24 bg-charcoal overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-16"
        >
          <span className="text-gold text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase font-body">
            Customer Love
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground mt-2 md:mt-4">
            What Our Customers Say
          </h2>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Navigation Arrows - Desktop */}
          <div className="hidden md:flex absolute -left-4 lg:-left-12 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="h-12 w-12 rounded-full bg-card border-gold/30 hover:bg-gold hover:text-charcoal-deep transition-all shadow-lg"
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>
          <div className="hidden md:flex absolute -right-4 lg:-right-12 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="h-12 w-12 rounded-full bg-card border-gold/30 hover:bg-gold hover:text-charcoal-deep transition-all shadow-lg"
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Carousel */}
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0"
                >
                  <div className="relative bg-card border border-border rounded-lg p-8 h-full">
                    {/* Quote Icon */}
                    <Quote className="absolute top-6 right-6 h-8 w-8 text-gold/20" />

                    {/* Stars */}
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-foreground/90 mb-6 font-body leading-relaxed line-clamp-4">
                      "{testimonial.text}"
                    </p>

                    {/* Author */}
                    <div className="border-t border-border pt-4 flex items-center gap-4">
                      {testimonial.customer_photo_url ? (
                        <img
                          src={testimonial.customer_photo_url}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-lg text-foreground">
                            {testimonial.name}
                          </p>
                          {testimonial.verified_purchase && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <ShoppingBag className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        {testimonial.location && (
                          <p className="text-sm text-muted-foreground">
                            {testimonial.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile Navigation Arrows */}
          <div className="flex md:hidden items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              className="h-10 w-10 rounded-full bg-card border-gold/30 hover:bg-gold hover:text-charcoal-deep"
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {/* Dots Indicator */}
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => emblaApi?.scrollTo(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? "bg-gold w-6" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              className="h-10 w-10 rounded-full bg-card border-gold/30 hover:bg-gold hover:text-charcoal-deep"
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
