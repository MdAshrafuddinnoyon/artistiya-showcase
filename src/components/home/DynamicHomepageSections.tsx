import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/hooks/useLanguage";
import { Play, Calendar, ArrowRight, Star, Quote, User, Instagram, ShoppingBag, Heart, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import CategorySection from "./CategorySection";
import NewArrivalsSection from "./NewArrivalsSection";
import FeaturedSection from "./FeaturedSection";
import MakingSection from "./MakingSection";
import TestimonialsSection from "./TestimonialsSection";
import InstagramSection from "./InstagramSection";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
  is_featured: boolean;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface HomepageSection {
  id: string;
  section_type: string;
  title: string;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
  config: any;
}

interface FeaturedSection {
  id: string;
  section_key: string;
  title_line1: string | null;
  title_highlight: string | null;
  description: string | null;
  features: string[] | null;
  image_url: string | null;
  badge_text: string | null;
  price_text: string | null;
  button_text: string | null;
  button_link: string | null;
  layout: string | null;
  is_active: boolean;
}

interface YouTubeVideo {
  id: string;
  title: string;
  title_bn: string | null;
  video_id: string;
  thumbnail_url: string | null;
  is_active: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  title_bn: string | null;
  slug: string;
  excerpt: string | null;
  excerpt_bn: string | null;
  featured_image: string | null;
  published_at: string | null;
}

interface FAQItem {
  id: string;
  question: string;
  question_bn: string | null;
  answer: string;
  answer_bn: string | null;
  category: string;
}

const DynamicHomepageSections = () => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredSections, setFeaturedSections] = useState<FeaturedSection[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Real-time subscriptions for all related tables
    const channel = supabase
      .channel('homepage_dynamic_sections')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'homepage_sections' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'featured_sections' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'youtube_videos' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blog_posts' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faq_items' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Skip rendering on mobile - handled by MobileDynamicSections
  if (isMobile) return null;

  const fetchData = async () => {
    try {
      const [sectionsRes, productsRes, categoriesRes, featuredRes, youtubeRes, blogRes, faqRes] = await Promise.all([
        supabase
          .from("homepage_sections")
          .select("*")
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("products")
          .select("id, name, slug, price, compare_at_price, images, is_featured, category_id")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("categories")
          .select("id, name, slug"),
        supabase
          .from("featured_sections")
          .select("*")
          .eq("is_active", true),
        supabase
          .from("youtube_videos")
          .select("id, title, title_bn, video_id, thumbnail_url, is_active")
          .eq("is_active", true)
          .order("display_order")
          .limit(10),
        supabase
          .from("blog_posts")
          .select("id, title, title_bn, slug, excerpt, excerpt_bn, featured_image, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(10),
        supabase
          .from("faq_items")
          .select("id, question, question_bn, answer, answer_bn, category")
          .eq("is_active", true)
          .order("display_order")
          .limit(20),
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setSections(sectionsRes.data || []);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setFeaturedSections(featuredRes.data || []);
      setYoutubeVideos(youtubeRes.data || []);
      setBlogPosts(blogRes.data || []);
      setFaqItems(faqRes.data || []);
    } catch (error) {
      console.error("Error fetching homepage sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDiscountPercent = (price: number, compareAt: number | null) => {
    if (!compareAt || compareAt <= price) return 0;
    return Math.round(((compareAt - price) / compareAt) * 100);
  };

  const renderProductCard = (product: Product, showBadge?: string) => {
    const discount = getDiscountPercent(product.price, product.compare_at_price);
    const hasSecondImage = product.images && product.images.length > 1;
    
    return (
      <Link to={`/product/${product.slug}`} key={product.id}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="group bg-card rounded-lg border border-border overflow-hidden hover:border-gold/50 transition-colors"
        >
          <div className="aspect-square relative overflow-hidden">
            {/* Primary Image */}
            <img
              src={product.images?.[0] || "/placeholder.svg"}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                hasSecondImage 
                  ? "group-hover:opacity-0 group-hover:scale-105" 
                  : "group-hover:scale-105"
              }`}
            />
            {/* Secondary Image - Desktop Hover */}
            {hasSecondImage && (
              <img
                src={product.images[1]}
                alt={`${product.name} - alternate view`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
            )}
            {showBadge && (
              <Badge className="absolute top-2 left-2 bg-gold text-background z-10">
                {showBadge}
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="absolute top-2 right-2 bg-destructive text-white z-10">
                -{discount}%
              </Badge>
            )}
          </div>
          <div className="p-3 md:p-4">
            <h3 className="font-medium text-sm md:text-base text-foreground group-hover:text-gold transition-colors line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gold font-display text-base md:text-lg">৳{product.price.toLocaleString()}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-muted-foreground line-through text-xs md:text-sm">
                  ৳{product.compare_at_price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  };

  const renderSection = (section: HomepageSection) => {
    switch (section.section_type) {
      case "products": {
        const selectedProducts = products.filter(p => 
          (section.config.product_ids || []).includes(p.id)
        );
        // Skip rendering if no products selected
        if (selectedProducts.length === 0) return null;

        return (
          <section key={section.id} className="py-10 md:py-16 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-6 md:mb-10">
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && section.subtitle !== "Add a subtitle" && (
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {selectedProducts.map(p => renderProductCard(p))}
              </div>
            </div>
          </section>
        );
      }

      case "category": {
        // Get products from the selected category
        const categoryId = section.config.category_id;
        // Skip if no category selected
        if (!categoryId) return null;
        
        const categoryProducts = products
          .filter(p => p.category_id === categoryId)
          .slice(0, section.config.limit || 8);
        
        // Skip if no products in this category
        if (categoryProducts.length === 0) return null;

        const category = categories.find(c => c.id === categoryId);

        return (
          <section key={section.id} className="py-10 md:py-16 bg-muted/30">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-6 md:mb-10">
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && section.subtitle !== "Add a subtitle" && (
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {categoryProducts.map(p => renderProductCard(p))}
              </div>
              {category && (
                <div className="text-center mt-8">
                  <Link to={`/shop/${category.slug}`}>
                    <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-background">
                      View All {category.name}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        );
      }

      case "best_selling": {
        // Get featured products as "best sellers"
        const bestSellers = products
          .filter(p => p.is_featured)
          .slice(0, section.config.limit || 8);
        // Skip if no featured products
        if (bestSellers.length === 0) return null;

        return (
          <section key={section.id} className="py-10 md:py-16 bg-muted/30">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-6 md:mb-10">
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && section.subtitle !== "Add a subtitle" && (
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {bestSellers.map(p => renderProductCard(p, section.config.show_badge ? "Best Seller" : undefined))}
              </div>
            </div>
          </section>
        );
      }

      case "discount": {
        const discountProducts = products
          .filter(p => {
            const discount = getDiscountPercent(p.price, p.compare_at_price);
            return discount >= (section.config.min_discount || 10);
          })
          .slice(0, section.config.limit || 8);
        // Skip if no discounted products
        if (discountProducts.length === 0) return null;

        return (
          <section key={section.id} className="py-10 md:py-16 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-6 md:mb-10">
                <span className="inline-block bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-medium mb-3">
                  🔥 Special Offers
                </span>
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && section.subtitle !== "Add a subtitle" && (
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {discountProducts.map(p => renderProductCard(p))}
              </div>
            </div>
          </section>
        );
      }

      case "banner": {
        if (!section.config.image_url) return null;

        return (
          <section key={section.id} className="py-6 md:py-8">
            <div className="container mx-auto px-4 lg:px-8">
              <Link to={section.config.link || "#"}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative rounded-xl overflow-hidden group"
                  style={{ height: section.config.height || "400px" }}
                >
                  <img
                    src={section.config.image_url}
                    alt={section.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent flex items-center">
                    <div className="p-6 md:p-12 max-w-lg">
                      <h2 className="font-display text-2xl md:text-4xl text-foreground mb-2 md:mb-4">
                        {section.title}
                      </h2>
                      {section.subtitle && (
                        <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">{section.subtitle}</p>
                      )}
                      {section.config.button_text && (
                        <Button variant="gold">
                          {section.config.button_text}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          </section>
        );
      }

      case "dual_banner": {
        const hasBanner1 = section.config.banner1_image;
        const hasBanner2 = section.config.banner2_image;
        if (!hasBanner1 && !hasBanner2) return null;

        return (
          <section key={section.id} className="py-6 md:py-8">
            <div className="container mx-auto px-4 lg:px-8">
              {section.title && (
                <div className="text-center mb-6">
                  <h2 className="font-display text-2xl md:text-3xl text-foreground">
                    {section.title}
                  </h2>
                  {section.subtitle && (
                    <p className="text-muted-foreground mt-2 text-sm">{section.subtitle}</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Banner 1 */}
                {hasBanner1 && (
                  <Link to={section.config.banner1_link || "#"}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden group"
                    >
                      <img
                        src={section.config.banner1_image}
                        alt={section.config.banner1_title || "Banner"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {section.config.banner1_title && (
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end p-4 md:p-6">
                          <h3 className="font-display text-xl md:text-2xl text-foreground">
                            {section.config.banner1_title}
                          </h3>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                )}

                {/* Banner 2 */}
                {hasBanner2 && (
                  <Link to={section.config.banner2_link || "#"}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden group"
                    >
                      <img
                        src={section.config.banner2_image}
                        alt={section.config.banner2_title || "Banner"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {section.config.banner2_title && (
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end p-4 md:p-6">
                          <h3 className="font-display text-xl md:text-2xl text-foreground">
                            {section.config.banner2_title}
                          </h3>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                )}
              </div>
            </div>
          </section>
        );
      }

      case "featured": {
        // Render featured collection from featured_sections table
        const featured = featuredSections.find(f => f.section_key === section.config.collection_key || f.id === section.config.collection_id);
        if (!featured) return null;

        const isImageLeft = featured.layout === "image-left";

        return (
          <section key={section.id} className="py-10 md:py-16 bg-muted/20">
            <div className="container mx-auto px-4 lg:px-8">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center ${isImageLeft ? '' : 'lg:flex-row-reverse'}`}>
                {/* Image */}
                <motion.div
                  initial={{ opacity: 0, x: isImageLeft ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`${isImageLeft ? 'lg:order-1' : 'lg:order-2'}`}
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
                    <img
                      src={featured.image_url || "/placeholder.svg"}
                      alt={featured.title_line1 || "Featured"}
                      className="w-full h-full object-cover"
                    />
                    {featured.badge_text && (
                      <Badge className="absolute top-4 left-4 bg-gold text-background px-3 py-1">
                        {featured.badge_text}
                      </Badge>
                    )}
                  </div>
                </motion.div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, x: isImageLeft ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`space-y-6 ${isImageLeft ? 'lg:order-2' : 'lg:order-1'}`}
                >
                  <div>
                    <h2 className="font-display text-2xl md:text-4xl text-foreground">
                      {featured.title_line1}
                      {featured.title_highlight && (
                        <span className="text-gold block mt-1">{featured.title_highlight}</span>
                      )}
                    </h2>
                    {featured.description && (
                      <p className="text-muted-foreground mt-4 text-sm md:text-base leading-relaxed">
                        {featured.description}
                      </p>
                    )}
                  </div>

                  {featured.features && featured.features.length > 0 && (
                    <ul className="space-y-2">
                      {featured.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-foreground text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {featured.price_text && (
                    <p className="text-gold font-display text-2xl">{featured.price_text}</p>
                  )}

                  {featured.button_text && (
                    <Link to={featured.button_link || "/shop"}>
                      <Button variant="gold" size="lg">
                        {featured.button_text}
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          </section>
        );
      }

      case "youtube": {
        const limit = section.config.limit || 3;
        const videos = youtubeVideos.slice(0, limit);
        if (videos.length === 0) return null;

        return (
          <section key={section.id} className="py-10 md:py-16 bg-muted/30">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-6 md:mb-10">
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && section.subtitle !== "Add a subtitle" && (
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <a
                      href={`https://www.youtube.com/watch?v=${video.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                        <img
                          src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-background/30 flex items-center justify-center group-hover:bg-background/10 transition-colors">
                          <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                            <Play className="h-6 w-6 text-white fill-white ml-1" />
                          </div>
                        </div>
                      </div>
                      <h3 className={`font-medium text-foreground mt-3 group-hover:text-gold transition-colors line-clamp-2 ${language === "bn" ? "font-bengali" : ""}`}>
                        {language === "bn" && video.title_bn ? video.title_bn : video.title}
                      </h3>
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "blog": {
        const limit = section.config.limit || 3;
        const posts = blogPosts.slice(0, limit);
        if (posts.length === 0) return null;

        return (
          <section key={section.id} className="py-10 md:py-16 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-6 md:mb-10">
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && section.subtitle !== "Add a subtitle" && (
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/blog/${post.slug}`} className="group block">
                      <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-4">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-4xl">📝</span>
                          </div>
                        )}
                      </div>
                      {post.published_at && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </div>
                      )}
                      <h3 className={`font-display text-lg text-foreground group-hover:text-gold transition-colors line-clamp-2 ${language === "bn" ? "font-bengali" : ""}`}>
                        {language === "bn" && post.title_bn ? post.title_bn : post.title}
                      </h3>
                      {section.config.show_excerpt !== false && (
                        <p className={`text-muted-foreground text-sm mt-2 line-clamp-2 ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" && post.excerpt_bn ? post.excerpt_bn : post.excerpt}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/blog">
                  <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-background">
                    {language === "bn" ? "সব পোস্ট দেখুন" : "View All Posts"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        );
      }

      case "faq": {
        const limit = section.config.limit || 5;
        const pageType = section.config.page_type || "homepage";
        const filteredFaqs = faqItems
          .filter(faq => !pageType || faq.category?.toLowerCase().includes(pageType.toLowerCase()) || pageType === "general")
          .slice(0, limit);
        
        if (filteredFaqs.length === 0) {
          // If no category match, show first N FAQs
          const fallbackFaqs = faqItems.slice(0, limit);
          if (fallbackFaqs.length === 0) return null;
        }

        const displayFaqs = filteredFaqs.length > 0 ? filteredFaqs : faqItems.slice(0, limit);
        if (displayFaqs.length === 0) return null;

        return (
          <section key={section.id} className="py-10 md:py-16 bg-muted/30">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-6 md:mb-10">
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && section.subtitle !== "Add a subtitle" && (
                  <p className="text-muted-foreground mt-2 text-sm md:text-base">{section.subtitle}</p>
                )}
              </div>
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="w-full">
                  {displayFaqs.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <AccordionItem value={faq.id} className="border-border">
                        <AccordionTrigger className={`text-left text-foreground hover:text-gold ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" && faq.question_bn ? faq.question_bn : faq.question}
                        </AccordionTrigger>
                        <AccordionContent className={`text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" && faq.answer_bn ? faq.answer_bn : faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
                <div className="text-center mt-8">
                  <Link to="/faq">
                    <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-background">
                      {language === "bn" ? "সব প্রশ্ন দেখুন" : "View All FAQs"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "categories":
        return <CategorySection key={section.id} />;

      case "new_arrivals":
        return <NewArrivalsSection key={section.id} />;

      case "featured_static":
        return <FeaturedSection key={section.id} />;

      case "making":
        return <MakingSection key={section.id} />;

      case "testimonials":
        return <TestimonialsSection key={section.id} />;

      case "instagram":
        return <InstagramSection key={section.id} />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{sections.map(renderSection)}</>;
};

export default DynamicHomepageSections;
