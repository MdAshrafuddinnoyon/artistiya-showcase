import { useState, useEffect, useCallback } from "react";
import { Star, Quote, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  text: string;
  rating: number;
  customer_photo_url: string | null;
  verified_purchase: boolean;
}

const MobileTestimonialsSlider = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, name, location, text, rating, customer_photo_url, verified_purchase")
          .eq("is_active", true)
          .order("display_order")
          .limit(6);

        if (error) throw error;
        setTestimonials(data || []);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!emblaApi || testimonials.length === 0) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [emblaApi, testimonials.length]);

  if (loading) {
    return (
      <section className="md:hidden px-4 py-6">
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="flex-shrink-0 w-[85%] bg-card rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-20 mb-3" />
              <div className="h-16 bg-muted rounded mb-3" />
              <div className="h-4 bg-muted rounded w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  return (
    <section className="md:hidden py-6 bg-charcoal">
      <div className="px-4 mb-4">
        <span className="text-gold text-xs tracking-[0.2em] uppercase">
          Customer Love
        </span>
        <h2 className="text-lg font-display text-foreground mt-1">
          What Our Customers Say
        </h2>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex-shrink-0 w-[85%] min-w-0 pl-4 first:pl-4"
            >
              <div className="bg-card border border-border rounded-xl p-4 relative h-full">
                {/* Quote Icon */}
                <Quote className="absolute top-3 right-3 h-5 w-5 text-gold/20" />

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-sm text-foreground/90 mb-4 line-clamp-3 font-body">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  {testimonial.customer_photo_url ? (
                    <img
                      src={testimonial.customer_photo_url}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-foreground truncate">
                      {testimonial.name}
                    </p>
                    {testimonial.location && (
                      <p className="text-xs text-muted-foreground truncate">
                        {testimonial.location}
                      </p>
                    )}
                  </div>
                  {testimonial.verified_purchase && (
                    <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === selectedIndex
                ? "w-6 bg-gold"
                : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default MobileTestimonialsSlider;
