import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InstagramPost {
  id: string;
  image_url: string;
  caption: string | null;
  link_url: string | null;
}

const InstagramSection = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [instagramHandle, setInstagramHandle] = useState("@artistiya.store");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Check if Instagram section is active
        const { data: homepageData } = await supabase
          .from("homepage_content")
          .select("is_active, content")
          .eq("section_key", "instagram")
          .single();

        if (homepageData && !homepageData.is_active) {
          setPosts([]);
          setLoading(false);
          return;
        }

        if (homepageData?.content) {
          const content = homepageData.content as { handle?: string };
          if (content.handle) {
            setInstagramHandle(content.handle);
          }
        }

        // Fetch Instagram posts
        const { data, error } = await supabase
          .from("instagram_posts")
          .select("id, image_url, caption, link_url")
          .eq("is_active", true)
          .order("display_order")
          .limit(6);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error("Error fetching Instagram posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
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
          className="text-center mb-12"
        >
          <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
            Follow Our Journey
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mt-4">
            {instagramHandle}
          </h2>
        </motion.div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
          {posts.map((post, index) => (
            <motion.a
              key={post.id}
              href={post.link_url || "https://instagram.com/artistiya.store"}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <img
                src={post.image_url}
                alt={post.caption || "Instagram post"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-charcoal-deep/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                <Instagram className="h-8 w-8 text-gold mb-2" />
                {post.caption && (
                  <p className="text-white text-xs text-center line-clamp-3">
                    {post.caption}
                  </p>
                )}
              </div>
            </motion.a>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <a
            href="https://instagram.com/artistiya.store"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors font-body"
          >
            <Instagram className="h-5 w-5" />
            Follow us on Instagram
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default InstagramSection;
