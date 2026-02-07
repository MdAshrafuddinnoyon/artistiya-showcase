import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, Share2 } from "lucide-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  title_bn: string | null;
  slug: string;
  content: string;
  content_bn: string | null;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  category?: {
    name: string;
    name_bn: string | null;
    slug: string;
  };
}

interface RelatedPost {
  id: string;
  title: string;
  title_bn: string | null;
  slug: string;
  featured_image: string | null;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          id, title, title_bn, slug, content, content_bn, excerpt,
          featured_image, published_at,
          category:blog_categories(name, name_bn, slug)
        `)
        .eq("slug", postSlug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      setPost(data as any);

      // Fetch related posts
      if (data) {
        const { data: related } = await supabase
          .from("blog_posts")
          .select("id, title, title_bn, slug, featured_image")
          .eq("is_published", true)
          .neq("id", data.id)
          .limit(3);

        setRelatedPosts(related || []);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
            <div className="h-12 bg-muted rounded w-3/4 animate-pulse" />
            <div className="aspect-[16/9] bg-muted rounded-xl animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl text-foreground mb-4">Post not found</h1>
          <Link to="/blog">
            <Button variant="gold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            {/* Back Button */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 md:mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              {language === "bn" ? "ব্লগে ফিরে যান" : "Back to Blog"}
            </Link>

            {/* Header */}
            <header className="mb-6 md:mb-8">
              {post.category && (
                <Badge variant="outline" className="mb-3 md:mb-4 text-xs">
                  {language === "bn" && post.category.name_bn
                    ? post.category.name_bn
                    : post.category.name}
                </Badge>
              )}
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground mb-3 md:mb-4">
                {language === "bn" && post.title_bn ? post.title_bn : post.title}
              </h1>
              <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                  {formatDate(post.published_at)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="ml-auto h-8 text-xs"
                >
                  <Share2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  {language === "bn" ? "শেয়ার" : "Share"}
                </Button>
              </div>
            </header>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="aspect-[16/9] rounded-lg md:rounded-xl overflow-hidden mb-6 md:mb-8">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-sm md:prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-a:text-gold"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  language === "bn" && post.content_bn
                    ? post.content_bn
                    : post.content
                ),
              }}
            />
          </motion.article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-3xl mx-auto mt-10 md:mt-16 pt-8 md:pt-12 border-t border-border">
            <h2 className="font-display text-lg md:text-2xl text-foreground mb-4 md:mb-6">
              {language === "bn" ? "সম্পর্কিত পোস্ট" : "Related Posts"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  to={`/blog/${related.slug}`}
                  className="group"
                >
                  <div className="aspect-[16/10] rounded-lg overflow-hidden mb-2 md:mb-3">
                    <img
                      src={related.featured_image || "/placeholder.svg"}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-medium text-xs md:text-sm text-foreground group-hover:text-gold transition-colors line-clamp-2">
                    {language === "bn" && related.title_bn
                      ? related.title_bn
                      : related.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
