import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import makingImage from "@/assets/making-process.jpg";

interface MakingData {
  id: string;
  badge_text: string | null;
  title_line1: string | null;
  title_highlight: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  background_image_url: string | null;
  stat1_number: string | null;
  stat1_label: string | null;
  stat2_number: string | null;
  stat2_label: string | null;
  stat3_number: string | null;
  stat3_label: string | null;
  overlay_opacity: number | null;
  is_active: boolean;
}

const MakingSection = () => {
  const [data, setData] = useState<MakingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('making_section_frontend')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'making_section' },
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
        .from("making_section")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setData(sectionData);
    } catch (error) {
      console.error("Error fetching making section:", error);
    } finally {
      setLoading(false);
    }
  };

  // Default fallback data
  const defaultData: MakingData = {
    id: "default",
    badge_text: "Behind the Craft",
    title_line1: "Behind Every Piece",
    title_highlight: "An Artisan's Story",
    description: "Every piece at artistiya.store is born from hours of dedication, traditional techniques passed down through generations, and a passion for perfection. From selecting the finest materials to the final finishing touches, our artisans pour their heart into each creation.",
    button_text: "Read Our Story",
    button_link: "/about",
    background_image_url: null,
    stat1_number: "500+",
    stat1_label: "Handcrafted Pieces",
    stat2_number: "15+",
    stat2_label: "Skilled Artisans",
    stat3_number: "1000+",
    stat3_label: "Happy Customers",
    overlay_opacity: 85,
    is_active: true,
  };

  const sectionData = data || defaultData;

  if (loading) {
    return (
      <section className="relative py-24 overflow-hidden bg-muted">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="h-4 w-32 bg-muted-foreground/20 rounded mx-auto animate-pulse" />
            <div className="h-12 w-64 bg-muted-foreground/20 rounded mx-auto animate-pulse" />
            <div className="h-24 w-full bg-muted-foreground/20 rounded animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (!sectionData.is_active) return null;

  const stats = [
    { number: sectionData.stat1_number, label: sectionData.stat1_label },
    { number: sectionData.stat2_number, label: sectionData.stat2_label },
    { number: sectionData.stat3_number, label: sectionData.stat3_label },
  ].filter(s => s.number && s.label);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={sectionData.background_image_url || makingImage}
          alt="Artisan crafting"
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0 bg-charcoal-deep" 
          style={{ opacity: (sectionData.overlay_opacity ?? 85) / 100 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {sectionData.badge_text && (
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block text-gold text-sm tracking-[0.3em] uppercase font-body mb-6"
            >
              {sectionData.badge_text}
            </motion.span>
          )}

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6"
          >
            {sectionData.title_line1}
            {sectionData.title_highlight && (
              <>
                <br />
                <span className="text-gold">{sectionData.title_highlight}</span>
              </>
            )}
          </motion.h2>

          {sectionData.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground mb-10 font-body"
            >
              {sectionData.description}
            </motion.p>
          )}

          {sectionData.button_text && sectionData.button_link && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link to={sectionData.button_link}>
                <Button variant="hero" size="lg">
                  {sectionData.button_text}
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/30"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <span className="block font-display text-3xl md:text-4xl text-gold mb-2">
                    {stat.number}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MakingSection;
