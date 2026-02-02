import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import categoryBags from "@/assets/category-bags.jpg";

interface FeaturedData {
  id: string;
  badge_text: string | null;
  title_line1: string | null;
  title_highlight: string | null;
  description: string | null;
  features: string[] | null;
  button_text: string | null;
  button_link: string | null;
  price_text: string | null;
  image_url: string | null;
  layout: string;
  is_active: boolean;
}

const FeaturedSection = () => {
  const [data, setData] = useState<FeaturedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('featured_section_frontend')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'featured_sections' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: sectionData, error } = await supabase
        .from("featured_sections")
        .select("*")
        .eq("section_key", "signature")
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setData(sectionData);
    } catch (error) {
      console.error("Error fetching featured section:", error);
    } finally {
      setLoading(false);
    }
  };

  // Default fallback data
  const defaultData: FeaturedData = {
    id: "default",
    badge_text: "Signature Collection",
    title_line1: "The Floral Bloom",
    title_highlight: "Tote Collection",
    description: "Each bag in this collection is a canvas of nature's beauty, hand-painted with meticulous attention to detail. Inspired by the vibrant flora of Bengal, these pieces transform everyday accessories into wearable art.",
    features: ["100% Genuine Leather", "Hand-painted by skilled artisans", "Water-resistant coating", "Limited edition pieces"],
    button_text: "Explore Collection",
    button_link: "/collections/floral-bloom",
    price_text: "From ৳3,800",
    image_url: null,
    layout: "image-left",
    is_active: true,
  };

  const sectionData = data || defaultData;
  const isImageLeft = sectionData.layout === "image-left";

  if (loading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/5] rounded-lg bg-muted animate-pulse" />
            <div className="space-y-4">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-12 w-64 bg-muted rounded animate-pulse" />
              <div className="h-24 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!sectionData.is_active) return null;

  return (
    <section className="py-12 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-8 md:gap-12 items-center ${!isImageLeft ? "lg:flex-row-reverse" : ""}`}>
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={`relative ${!isImageLeft ? "lg:order-2" : ""}`}
          >
            <div className="aspect-[4/5] md:aspect-[4/5] rounded-lg overflow-hidden">
              <img
                src={sectionData.image_url || categoryBags}
                alt="Featured collection"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Frame - Hidden on mobile */}
            <div className={`hidden md:block absolute -bottom-6 ${isImageLeft ? "-right-6" : "-left-6"} w-full h-full border-2 border-gold/30 rounded-lg -z-10`} />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isImageLeft ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`${isImageLeft ? "lg:pl-12" : "lg:pr-12 lg:order-1"}`}
          >
            {sectionData.badge_text && (
              <span className="text-gold text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase font-body">
                {sectionData.badge_text}
              </span>
            )}
            
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground mt-2 md:mt-4 mb-4 md:mb-6">
              {sectionData.title_line1}
              {sectionData.title_highlight && (
                <>
                  <br />
                  <span className="text-gold">{sectionData.title_highlight}</span>
                </>
              )}
            </h2>

            {sectionData.description && (
              <p className="text-muted-foreground text-sm md:text-lg mb-4 md:mb-6 font-body">
                {sectionData.description}
              </p>
            )}

            {sectionData.features && sectionData.features.length > 0 && (
              <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                {sectionData.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-foreground/80">
                    <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-gold flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              {sectionData.button_text && sectionData.button_link && (
                <Link to={sectionData.button_link}>
                  <Button variant="hero" size="sm" className="md:px-6 md:py-3 md:text-base">
                    {sectionData.button_text}
                  </Button>
                </Link>
              )}
              {sectionData.price_text && (
                <span className="flex items-center text-gold font-display text-lg md:text-2xl">
                  {sectionData.price_text}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
