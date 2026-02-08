import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/hooks/useLanguage";
import { Play, Calendar, ArrowRight, Star, Quote, User, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useWishlist } from "@/hooks/useWishlist";

interface HomepageSection {
  id: string;
  section_type: string;
  title: string;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
  config: any;
}

interface Product {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
  icon_emoji: string | null;
  mobile_image_url: string | null;
  image_url: string | null;
}

interface YouTubeVideo {
  id: string;
  title: string;
  title_bn: string | null;
  video_id: string;
  thumbnail_url: string | null;
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

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  text: string;
  rating: number;
  customer_photo_url: string | null;
  verified_purchase: boolean;
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
}

interface MakingSection {
  id: string;
  title_line1: string | null;
  title_highlight: string | null;
  description: string | null;
  background_image_url: string | null;
  badge_text: string | null;
  button_text: string | null;
  button_link: string | null;
  stat1_number: string | null;
  stat1_label: string | null;
  stat2_number: string | null;
  stat2_label: string | null;
  stat3_number: string | null;
  stat3_label: string | null;
}

const MobileDynamicSections = () => {
  const { language } = useLanguage();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [featuredSections, setFeaturedSections] = useState<FeaturedSection[]>([]);
  const [makingSection, setMakingSection] = useState<MakingSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('mobile_homepage_sections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_sections' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'youtube_videos' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faq_items' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_sections' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'making_section' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsRes, productsRes, categoriesRes, youtubeRes, blogRes, faqRes, testimonialRes, featuredRes, makingRes] = await Promise.all([
        supabase.from("homepage_sections").select("*").eq("is_active", true).order("display_order"),
        supabase.from("products").select("id, name, name_bn, slug, price, compare_at_price, images, is_featured, is_new_arrival, category_id").eq("is_active", true).limit(100),
        supabase.from("categories").select("id, name, name_bn, slug, icon_emoji, mobile_image_url, image_url").order("display_order"),
        supabase.from("youtube_videos").select("id, title, title_bn, video_id, thumbnail_url").eq("is_active", true).order("display_order").limit(10),
        supabase.from("blog_posts").select("id, title, title_bn, slug, excerpt, excerpt_bn, featured_image, published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(10),
        supabase.from("faq_items").select("id, question, question_bn, answer, answer_bn, category").eq("is_active", true).order("display_order").limit(10),
        supabase.from("testimonials").select("id, name, location, text, rating, customer_photo_url, verified_purchase").eq("is_active", true).order("display_order").limit(8),
        supabase.from("featured_sections").select("*").eq("is_active", true),
        supabase.from("making_section").select("*").eq("is_active", true).single(),
      ]);

      setSections(sectionsRes.data || []);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setYoutubeVideos(youtubeRes.data || []);
      setBlogPosts(blogRes.data || []);
      setFaqItems(faqRes.data || []);
      setTestimonials(testimonialRes.data || []);
      setFeaturedSections(featuredRes.data || []);
      setMakingSection(makingRes.data || null);
    } catch (error) {
      console.error("Error fetching mobile sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistClick = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  // Navigation scroll helper
  const scrollSlider = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right', itemWidth: number = 150) => {
    if (!ref.current) return;
    const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
    ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Mobile Product Slider Component with Touch Support and Navigation Buttons
  const MobileProductSlider = ({ items, title, showViewAll = true }: { items: Product[], title: string, showViewAll?: boolean }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    
    if (items.length === 0) return null;

    const checkScrollButtons = () => {
      if (!sliderRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
      setScrollLeft(sliderRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
      const walk = (x - startX) * 1.5;
      if (sliderRef.current) {
        sliderRef.current.scrollLeft = scrollLeft - walk;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      checkScrollButtons();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      setIsDragging(true);
      setStartX(e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0));
      setScrollLeft(sliderRef.current?.scrollLeft || 0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      const x = e.touches[0].pageX - (sliderRef.current?.offsetLeft || 0);
      const walk = (x - startX) * 1.5;
      if (sliderRef.current) {
        sliderRef.current.scrollLeft = scrollLeft - walk;
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      checkScrollButtons();
    };

    return (
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display text-foreground">
            {language === "bn" ? (title === "New Arrivals" ? "নতুন পণ্য" : title === "Hot Sales" ? "জনপ্রিয়" : title) : title}
          </h2>
          <div className="flex items-center gap-2">
            {/* Navigation Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => { scrollSlider(sliderRef, 'left', 140); setTimeout(checkScrollButtons, 300); }}
                disabled={!canScrollLeft}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  canScrollLeft 
                    ? "border-gold/50 bg-gold/10 text-gold active:bg-gold active:text-charcoal-deep" 
                    : "border-border bg-muted/50 text-muted-foreground opacity-40"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { scrollSlider(sliderRef, 'right', 140); setTimeout(checkScrollButtons, 300); }}
                disabled={!canScrollRight}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  canScrollRight 
                    ? "border-gold/50 bg-gold/10 text-gold active:bg-gold active:text-charcoal-deep" 
                    : "border-border bg-muted/50 text-muted-foreground opacity-40"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {showViewAll && (
              <Link to="/shop" className="text-gold text-xs font-medium">
                {language === "bn" ? "সব →" : "All →"}
              </Link>
            )}
          </div>
        </div>

        <div 
          ref={sliderRef} 
          className="flex gap-3 overflow-x-auto scrollbar-none pb-2 cursor-grab active:cursor-grabbing" 
          style={{ scrollSnapType: "x mandatory" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onScroll={checkScrollButtons}
        >
          {items.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-32" style={{ scrollSnapAlign: "start" }}>
              <Link 
                to={`/product/${product.slug}`} 
                className="block"
                onClick={(e) => isDragging && e.preventDefault()}
              >
                <div className="relative aspect-square bg-card rounded-lg overflow-hidden mb-1.5 border border-border/50">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <button
                    onClick={(e) => handleWishlistClick(e, product.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center"
                  >
                    <Heart className={`h-3 w-3 ${isInWishlist(product.id) ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                  </button>
                  {product.is_new_arrival && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-gold text-charcoal-deep text-[8px] font-semibold rounded">
                      {language === "bn" ? "নতুন" : "NEW"}
                    </span>
                  )}
                </div>
                <h3 className="text-[11px] text-foreground font-medium line-clamp-1">
                  {language === "bn" && product.name_bn ? product.name_bn : product.name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-semibold text-gold">৳{product.price.toLocaleString()}</span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-[9px] text-muted-foreground line-through">৳{product.compare_at_price.toLocaleString()}</span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Mobile Testimonials Slider
  const MobileTestimonials = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      if (!emblaApi) return;
      emblaApi.on("select", () => setSelectedIndex(emblaApi.selectedScrollSnap()));
    }, [emblaApi]);

    useEffect(() => {
      if (!emblaApi || testimonials.length === 0) return;
      const interval = setInterval(() => emblaApi.scrollNext(), 5000);
      return () => clearInterval(interval);
    }, [emblaApi]);

    if (testimonials.length === 0) return null;

    return (
      <section className="py-5 bg-charcoal">
        <div className="px-4 mb-3">
          <span className="text-gold text-xs tracking-[0.15em] uppercase">
            {language === "bn" ? "গ্রাহকদের মতামত" : "Customer Love"}
          </span>
          <h2 className="text-base font-display text-foreground mt-1">
            {language === "bn" ? "আমাদের গ্রাহকরা যা বলেন" : "What Our Customers Say"}
          </h2>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="flex-shrink-0 w-[85%] min-w-0 pl-4">
                <div className="bg-card border border-border rounded-xl p-4 relative h-full">
                  <Quote className="absolute top-3 right-3 h-5 w-5 text-gold/20" />
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/90 mb-3 line-clamp-3">"{testimonial.text}"</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {testimonial.customer_photo_url ? (
                      <img src={testimonial.customer_photo_url} alt={testimonial.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xs text-foreground truncate">{testimonial.name}</p>
                      {testimonial.location && <p className="text-[10px] text-muted-foreground truncate">{testimonial.location}</p>}
                    </div>
                    {testimonial.verified_purchase && (
                      <span className="text-[9px] text-accent-foreground bg-accent px-1.5 py-0.5 rounded-full">✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-1.5 mt-3">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all ${index === selectedIndex ? "w-5 bg-gold" : "w-1.5 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      </section>
    );
  };

  // Mobile YouTube Section with Touch Support and Navigation Buttons
  const MobileYouTube = ({ videos, title, subtitle }: { videos: YouTubeVideo[], title: string, subtitle?: string }) => {
    const ytSliderRef = useRef<HTMLDivElement>(null);
    const [ytDragging, setYtDragging] = useState(false);
    const [ytStartX, setYtStartX] = useState(0);
    const [ytScrollLeft, setYtScrollLeft] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    if (videos.length === 0) return null;

    const checkScrollButtons = () => {
      if (!ytSliderRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = ytSliderRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    };

    const handleYtTouchStart = (e: React.TouchEvent) => {
      setYtDragging(true);
      setYtStartX(e.touches[0].pageX);
      setYtScrollLeft(ytSliderRef.current?.scrollLeft || 0);
    };

    const handleYtTouchMove = (e: React.TouchEvent) => {
      if (!ytDragging) return;
      const x = e.touches[0].pageX;
      const walk = (x - ytStartX) * 1.5;
      if (ytSliderRef.current) {
        ytSliderRef.current.scrollLeft = ytScrollLeft - walk;
      }
    };

    const handleYtTouchEnd = () => {
      setYtDragging(false);
      checkScrollButtons();
    };

    return (
      <section className="px-4 py-5 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-display text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {/* Navigation Buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => { scrollSlider(ytSliderRef, 'left', 200); setTimeout(checkScrollButtons, 300); }}
              disabled={!canScrollLeft}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                canScrollLeft 
                  ? "border-gold/50 bg-gold/10 text-gold active:bg-gold active:text-charcoal-deep" 
                  : "border-border bg-muted/50 text-muted-foreground opacity-40"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => { scrollSlider(ytSliderRef, 'right', 200); setTimeout(checkScrollButtons, 300); }}
              disabled={!canScrollRight}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                canScrollRight 
                  ? "border-gold/50 bg-gold/10 text-gold active:bg-gold active:text-charcoal-deep" 
                  : "border-border bg-muted/50 text-muted-foreground opacity-40"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div 
          ref={ytSliderRef}
          className="flex gap-3 overflow-x-auto scrollbar-none pb-2 cursor-grab active:cursor-grabbing"
          style={{ scrollSnapType: "x mandatory" }}
          onTouchStart={handleYtTouchStart}
          onTouchMove={handleYtTouchMove}
          onTouchEnd={handleYtTouchEnd}
          onScroll={checkScrollButtons}
        >
          {videos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-48 group"
              style={{ scrollSnapAlign: "start" }}
              onClick={(e) => ytDragging && e.preventDefault()}
            >
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                <img
                  src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-background/30 flex items-center justify-center group-active:bg-background/10">
                  <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
                    <Play className="h-4 w-4 text-destructive-foreground fill-destructive-foreground ml-0.5" />
                  </div>
                </div>
              </div>
              <h3 className="text-xs text-foreground line-clamp-2">
                {language === "bn" && video.title_bn ? video.title_bn : video.title}
              </h3>
            </a>
          ))}
        </div>
      </section>
    );
  };

  // Mobile Blog Section with Touch Support and Navigation Buttons
  const MobileBlog = ({ posts, title, subtitle }: { posts: BlogPost[], title: string, subtitle?: string }) => {
    const blogSliderRef = useRef<HTMLDivElement>(null);
    const [blogDragging, setBlogDragging] = useState(false);
    const [blogStartX, setBlogStartX] = useState(0);
    const [blogScrollLeft, setBlogScrollLeft] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    if (posts.length === 0) return null;

    const checkScrollButtons = () => {
      if (!blogSliderRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = blogSliderRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    };

    const handleBlogTouchStart = (e: React.TouchEvent) => {
      setBlogDragging(true);
      setBlogStartX(e.touches[0].pageX);
      setBlogScrollLeft(blogSliderRef.current?.scrollLeft || 0);
    };

    const handleBlogTouchMove = (e: React.TouchEvent) => {
      if (!blogDragging) return;
      const x = e.touches[0].pageX;
      const walk = (x - blogStartX) * 1.5;
      if (blogSliderRef.current) {
        blogSliderRef.current.scrollLeft = blogScrollLeft - walk;
      }
    };

    const handleBlogTouchEnd = () => {
      setBlogDragging(false);
      checkScrollButtons();
    };

    return (
      <section className="px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-display text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => { scrollSlider(blogSliderRef, 'left', 160); setTimeout(checkScrollButtons, 300); }}
                disabled={!canScrollLeft}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  canScrollLeft 
                    ? "border-gold/50 bg-gold/10 text-gold active:bg-gold active:text-charcoal-deep" 
                    : "border-border bg-muted/50 text-muted-foreground opacity-40"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { scrollSlider(blogSliderRef, 'right', 160); setTimeout(checkScrollButtons, 300); }}
                disabled={!canScrollRight}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  canScrollRight 
                    ? "border-gold/50 bg-gold/10 text-gold active:bg-gold active:text-charcoal-deep" 
                    : "border-border bg-muted/50 text-muted-foreground opacity-40"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Link to="/blog" className="text-gold text-xs">
              {language === "bn" ? "সব →" : "All →"}
            </Link>
          </div>
        </div>

        <div 
          ref={blogSliderRef}
          className="flex gap-3 overflow-x-auto scrollbar-none pb-2 cursor-grab active:cursor-grabbing"
          style={{ scrollSnapType: "x mandatory" }}
          onTouchStart={handleBlogTouchStart}
          onTouchMove={handleBlogTouchMove}
          onTouchEnd={handleBlogTouchEnd}
          onScroll={checkScrollButtons}
        >
          {posts.map((post) => (
            <Link 
              key={post.id} 
              to={`/blog/${post.slug}`} 
              className="flex-shrink-0 w-40 group"
              style={{ scrollSnapAlign: "start" }}
              onClick={(e) => blogDragging && e.preventDefault()}
            >
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-2">
                {post.featured_image ? (
                  <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted"><span className="text-2xl">📝</span></div>
                )}
              </div>
              {post.published_at && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.published_at).toLocaleDateString()}
                </div>
              )}
              <h3 className="text-xs font-medium text-foreground line-clamp-2 group-active:text-gold">
                {language === "bn" && post.title_bn ? post.title_bn : post.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  // Mobile FAQ Section
  const MobileFAQ = ({ items, title, subtitle }: { items: FAQItem[], title: string, subtitle?: string }) => {
    if (items.length === 0) return null;

    return (
      <section className="px-4 py-5 bg-muted/30">
        <div className="mb-3">
          <h2 className="text-base font-display text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {items.slice(0, 5).map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border border-border rounded-lg bg-card px-3">
              <AccordionTrigger className="text-sm text-foreground py-3 [&[data-state=open]]:text-gold">
                {language === "bn" && faq.question_bn ? faq.question_bn : faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground pb-3">
                {language === "bn" && faq.answer_bn ? faq.answer_bn : faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-4">
          <Link to="/faq">
            <Button variant="outline" size="sm" className="text-xs border-gold text-gold">
              {language === "bn" ? "সব প্রশ্ন দেখুন" : "View All FAQs"}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    );
  };

  // Mobile Category Slider with Touch Support and Navigation Buttons
  const MobileCategories = () => {
    const catSliderRef = useRef<HTMLDivElement>(null);
    const [catDragging, setCatDragging] = useState(false);
    const [catStartX, setCatStartX] = useState(0);
    const [catScrollLeft, setCatScrollLeft] = useState(0);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    if (categories.length === 0) return null;

    const checkScrollButtons = () => {
      if (!catSliderRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = catSliderRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    };

    const handleCatMouseDown = (e: React.MouseEvent) => {
      setCatDragging(true);
      setCatStartX(e.pageX - (catSliderRef.current?.offsetLeft || 0));
      setCatScrollLeft(catSliderRef.current?.scrollLeft || 0);
    };

    const handleCatMouseMove = (e: React.MouseEvent) => {
      if (!catDragging) return;
      e.preventDefault();
      const x = e.pageX - (catSliderRef.current?.offsetLeft || 0);
      const walk = (x - catStartX) * 1.5;
      if (catSliderRef.current) {
        catSliderRef.current.scrollLeft = catScrollLeft - walk;
      }
    };

    const handleCatMouseUp = () => {
      setCatDragging(false);
      checkScrollButtons();
    };

    const handleCatTouchStart = (e: React.TouchEvent) => {
      setCatDragging(true);
      setCatStartX(e.touches[0].pageX - (catSliderRef.current?.offsetLeft || 0));
      setCatScrollLeft(catSliderRef.current?.scrollLeft || 0);
    };

    const handleCatTouchMove = (e: React.TouchEvent) => {
      if (!catDragging) return;
      const x = e.touches[0].pageX - (catSliderRef.current?.offsetLeft || 0);
      const walk = (x - catStartX) * 1.5;
      if (catSliderRef.current) {
        catSliderRef.current.scrollLeft = catScrollLeft - walk;
      }
    };

    const handleCatTouchEnd = () => {
      setCatDragging(false);
      checkScrollButtons();
    };

    // Default category icons
    const getCategoryIcon = (slug: string) => {
      const icons: Record<string, string> = {
        jewelry: "💍", bags: "👜", woven: "🧶", art: "🎨", home: "🏠", fashion: "👗", accessories: "✨"
      };
      return icons[slug] || "🛍️";
    };

    return (
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display text-foreground">
            {language === "bn" ? "ক্যাটাগরি" : "Shop by Category"}
          </h2>
          <div className="flex items-center gap-2">
            {/* Navigation Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => { scrollSlider(catSliderRef, 'left', 80); setTimeout(checkScrollButtons, 300); }}
                disabled={!canScrollLeft}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  canScrollLeft 
                    ? "border-gold/50 bg-gold/10 text-gold active:bg-gold active:text-charcoal-deep" 
                    : "border-border bg-muted/50 text-muted-foreground opacity-40"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { scrollSlider(catSliderRef, 'right', 80); setTimeout(checkScrollButtons, 300); }}
                disabled={!canScrollRight}
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  canScrollRight 
                    ? "border-gold/50 bg-gold/10 text-gold active:bg-gold active:text-charcoal-deep" 
                    : "border-border bg-muted/50 text-muted-foreground opacity-40"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Link to="/shop" className="text-gold text-xs">{language === "bn" ? "সব →" : "All →"}</Link>
          </div>
        </div>

        <div 
          ref={catSliderRef}
          className="flex gap-3 overflow-x-auto scrollbar-none pb-2 cursor-grab active:cursor-grabbing"
          style={{ scrollSnapType: "x mandatory" }}
          onMouseDown={handleCatMouseDown}
          onMouseMove={handleCatMouseMove}
          onMouseUp={handleCatMouseUp}
          onMouseLeave={handleCatMouseUp}
          onTouchStart={handleCatTouchStart}
          onTouchMove={handleCatTouchMove}
          onTouchEnd={handleCatTouchEnd}
          onScroll={checkScrollButtons}
        >
          {/* All Products Button */}
          <Link 
            to="/shop" 
            className="flex-shrink-0 text-center group"
            style={{ scrollSnapAlign: "start" }}
            onClick={(e) => {
              if (catDragging) e.preventDefault();
              else setActiveCategory("all");
            }}
          >
            <div className={`w-14 h-14 rounded-full bg-card border-2 overflow-hidden mb-1.5 mx-auto flex items-center justify-center text-xl transition-all ${
              activeCategory === "all" || !activeCategory ? "border-gold bg-gold/10" : "border-border group-active:border-gold"
            }`}>
              🛒
            </div>
            <span className={`text-[10px] font-medium ${activeCategory === "all" || !activeCategory ? "text-gold" : "text-foreground"}`}>
              {language === "bn" ? "সব" : "All"}
            </span>
          </Link>

          {categories.map((category) => (
            <Link 
              key={category.id} 
              to={`/shop/${category.slug}`} 
              className="flex-shrink-0 text-center group"
              style={{ scrollSnapAlign: "start" }}
              onClick={(e) => {
                if (catDragging) e.preventDefault();
                else setActiveCategory(category.id);
              }}
            >
              <div className={`w-14 h-14 rounded-full bg-card border-2 overflow-hidden mb-1.5 mx-auto transition-all ${
                activeCategory === category.id ? "border-gold ring-2 ring-gold/30" : "border-border group-active:border-gold"
              }`}>
                {category.mobile_image_url || category.image_url ? (
                  <img 
                    src={category.mobile_image_url || category.image_url || ""} 
                    alt={category.name} 
                    className="w-full h-full object-cover" 
                    draggable={false}
                  />
                ) : category.icon_emoji ? (
                  <div className="w-full h-full flex items-center justify-center text-xl bg-muted">{category.icon_emoji}</div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-xl">{getCategoryIcon(category.slug)}</div>
                )}
              </div>
              <span className={`text-[10px] font-medium line-clamp-1 max-w-14 ${
                activeCategory === category.id ? "text-gold" : "text-foreground"
              }`}>
                {language === "bn" && category.name_bn ? category.name_bn : category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  // Mobile Banner Section
  const MobileBanner = ({ section }: { section: HomepageSection }) => {
    if (!section.config.image_url) return null;

    return (
      <section className="px-4 py-3">
        <Link to={section.config.link || "#"}>
          <div className="relative rounded-xl overflow-hidden" style={{ height: "180px" }}>
            <img src={section.config.image_url} alt={section.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent flex items-center">
              <div className="p-4 max-w-[60%]">
                <h2 className="font-display text-lg text-foreground mb-1">{section.title}</h2>
                {section.subtitle && <p className="text-xs text-muted-foreground line-clamp-2">{section.subtitle}</p>}
                {section.config.button_text && (
                  <Button size="sm" variant="gold" className="mt-2 text-xs h-7 px-3">{section.config.button_text}</Button>
                )}
              </div>
            </div>
          </div>
        </Link>
      </section>
    );
  };

  // Mobile Featured Section
  const MobileFeatured = ({ featured }: { featured: FeaturedSection }) => {
    return (
      <section className="px-4 py-5 bg-muted/20">
        <div className="rounded-xl overflow-hidden">
          <div className="aspect-[4/3] relative">
            <img src={featured.image_url || "/placeholder.svg"} alt={featured.title_line1 || ""} className="w-full h-full object-cover" />
            {featured.badge_text && (
              <Badge className="absolute top-3 left-3 bg-gold text-background text-[10px] px-2">{featured.badge_text}</Badge>
            )}
          </div>
          <div className="p-4 bg-card">
            <h3 className="font-display text-lg text-foreground">
              {featured.title_line1}
              {featured.title_highlight && <span className="text-gold block">{featured.title_highlight}</span>}
            </h3>
            {featured.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{featured.description}</p>}
            {featured.features && featured.features.length > 0 && (
              <ul className="mt-3 space-y-1">
                {featured.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                    <span className="w-1 h-1 rounded-full bg-gold" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            {featured.price_text && <p className="text-gold font-display text-lg mt-3">{featured.price_text}</p>}
            {featured.button_text && (
              <Link to={featured.button_link || "/shop"}>
                <Button variant="gold" size="sm" className="w-full mt-3">{featured.button_text}</Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  };

  // Mobile Making/Craft Section
  const MobileMaking = () => {
    if (!makingSection) return null;

    return (
      <section className="relative py-8">
        <div className="absolute inset-0">
          <img src={makingSection.background_image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-charcoal-deep/80" />
        </div>
        <div className="relative px-4 text-center">
          {makingSection.badge_text && (
            <span className="inline-block bg-gold/20 text-gold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider mb-2">
              {makingSection.badge_text}
            </span>
          )}
          <h2 className="font-display text-xl text-foreground">
            {makingSection.title_line1}
            {makingSection.title_highlight && <span className="text-gold block mt-1">{makingSection.title_highlight}</span>}
          </h2>
          {makingSection.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{makingSection.description}</p>
          )}

          {(makingSection.stat1_number || makingSection.stat2_number || makingSection.stat3_number) && (
            <div className="flex justify-center gap-6 mt-4">
              {makingSection.stat1_number && (
                <div className="text-center">
                  <p className="font-display text-2xl text-gold">{makingSection.stat1_number}</p>
                  <p className="text-[10px] text-muted-foreground">{makingSection.stat1_label}</p>
                </div>
              )}
              {makingSection.stat2_number && (
                <div className="text-center">
                  <p className="font-display text-2xl text-gold">{makingSection.stat2_number}</p>
                  <p className="text-[10px] text-muted-foreground">{makingSection.stat2_label}</p>
                </div>
              )}
              {makingSection.stat3_number && (
                <div className="text-center">
                  <p className="font-display text-2xl text-gold">{makingSection.stat3_number}</p>
                  <p className="text-[10px] text-muted-foreground">{makingSection.stat3_label}</p>
                </div>
              )}
            </div>
          )}

          {makingSection.button_text && (
            <Link to={makingSection.button_link || "/about"}>
              <Button variant="outline" size="sm" className="mt-4 border-gold text-gold text-xs">
                {makingSection.button_text}
              </Button>
            </Link>
          )}
        </div>
      </section>
    );
  };

  const renderSection = (section: HomepageSection) => {
    switch (section.section_type) {
      case "categories":
        return <MobileCategories key={section.id} />;

      case "new_arrivals": {
        const newProducts = products.filter(p => p.is_new_arrival).slice(0, 12);
        return <MobileProductSlider key={section.id} items={newProducts} title={section.title} />;
      }

      case "best_selling":
      case "featured_static": {
        const featuredProducts = products.filter(p => p.is_featured).slice(0, 12);
        return <MobileProductSlider key={section.id} items={featuredProducts} title={section.title} />;
      }

      case "products": {
        const selectedProducts = products.filter(p => (section.config.product_ids || []).includes(p.id));
        if (selectedProducts.length === 0) return null;
        return <MobileProductSlider key={section.id} items={selectedProducts} title={section.title} />;
      }

      case "category": {
        const categoryProducts = products.filter(p => p.category_id === section.config.category_id).slice(0, 12);
        if (categoryProducts.length === 0) return null;
        return <MobileProductSlider key={section.id} items={categoryProducts} title={section.title} />;
      }

      case "discount": {
        const discountProducts = products.filter(p => {
          if (!p.compare_at_price || p.compare_at_price <= p.price) return false;
          const discount = Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100);
          return discount >= (section.config.min_discount || 10);
        }).slice(0, 12);
        if (discountProducts.length === 0) return null;
        return <MobileProductSlider key={section.id} items={discountProducts} title={section.title} />;
      }

      case "banner":
        return <MobileBanner key={section.id} section={section} />;

      case "testimonials":
        return <MobileTestimonials key={section.id} />;

      case "youtube": {
        const videos = youtubeVideos.slice(0, section.config.limit || 5);
        return <MobileYouTube key={section.id} videos={videos} title={section.title} subtitle={section.subtitle || undefined} />;
      }

      case "blog": {
        const posts = blogPosts.slice(0, section.config.limit || 5);
        return <MobileBlog key={section.id} posts={posts} title={section.title} subtitle={section.subtitle || undefined} />;
      }

      case "faq": {
        return <MobileFAQ key={section.id} items={faqItems} title={section.title} subtitle={section.subtitle || undefined} />;
      }

      case "featured": {
        const featured = featuredSections.find(f => f.section_key === section.config.collection_key || f.id === section.config.collection_id);
        if (!featured) return null;
        return <MobileFeatured key={section.id} featured={featured} />;
      }

      case "making":
        return <MobileMaking key={section.id} />;

      case "instagram":
        // Instagram will be handled by existing component if needed
        return null;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return <>{sections.map(renderSection)}</>;
};

export default MobileDynamicSections;
