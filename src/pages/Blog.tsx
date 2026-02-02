import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface BlogPost {
  id: string;
  title: string;
  title_bn: string | null;
  slug: string;
  excerpt: string | null;
  excerpt_bn: string | null;
  featured_image: string | null;
  published_at: string | null;
  is_featured: boolean | null;
  category?: {
    name: string;
    name_bn: string | null;
    slug: string;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  name_bn: string | null;
  slug: string;
}

const Blog = () => {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        supabase
          .from("blog_posts")
          .select(`
            id, title, title_bn, slug, excerpt, excerpt_bn, 
            featured_image, published_at, is_featured,
            category:blog_categories(name, name_bn, slug)
          `)
          .eq("is_published", true)
          .order("published_at", { ascending: false }),
        supabase
          .from("blog_categories")
          .select("id, name, name_bn, slug")
          .eq("is_active", true)
          .order("display_order"),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setPosts((postsRes.data as any) || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || post.category?.slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts.find((p) => p.is_featured);
  const regularPosts = filteredPosts.filter((p) => p.id !== featuredPost?.id);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Hero */}
          <div className="text-center mb-6 md:mb-12">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground mb-2 md:mb-4">
              {language === "bn" ? "ব্লগ" : "Our Blog"}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              {language === "bn"
                ? "আমাদের সাম্প্রতিক খবর, গল্প এবং অন্তর্দৃষ্টি পড়ুন"
                : "Read our latest news, stories, and insights"}
            </p>
          </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "bn" ? "খুঁজুন..." : "Search posts..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === "all" ? "gold" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              {language === "bn" ? "সব" : "All"}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? "gold" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {language === "bn" && cat.name_bn ? cat.name_bn : cat.name}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {language === "bn"
                ? "কোন পোস্ট পাওয়া যায়নি"
                : "No posts found"}
            </p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="group block bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="aspect-[4/3] md:aspect-auto">
                      <img
                        src={featuredPost.featured_image || "/placeholder.svg"}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <Badge className="w-fit mb-3 bg-gold/20 text-gold border-gold/30">
                        Featured
                      </Badge>
                      <h2 className="font-display text-2xl md:text-3xl text-foreground group-hover:text-gold transition-colors mb-4">
                        {language === "bn" && featuredPost.title_bn
                          ? featuredPost.title_bn
                          : featuredPost.title}
                      </h2>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {language === "bn" && featuredPost.excerpt_bn
                          ? featuredPost.excerpt_bn
                          : featuredPost.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(featuredPost.published_at)}
                        </span>
                        {featuredPost.category && (
                          <Badge variant="outline">
                            {language === "bn" && featuredPost.category.name_bn
                              ? featuredPost.category.name_bn
                              : featuredPost.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Posts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block bg-card border border-border rounded-xl overflow-hidden h-full"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={post.featured_image || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      {post.category && (
                        <Badge variant="outline" className="mb-3">
                          {language === "bn" && post.category.name_bn
                            ? post.category.name_bn
                            : post.category.name}
                        </Badge>
                      )}
                      <h3 className="font-display text-lg text-foreground group-hover:text-gold transition-colors mb-2 line-clamp-2">
                        {language === "bn" && post.title_bn
                          ? post.title_bn
                          : post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {language === "bn" && post.excerpt_bn
                          ? post.excerpt_bn
                          : post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.published_at)}
                        </span>
                        <span className="text-gold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                          {language === "bn" ? "পড়ুন" : "Read"}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
