import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft, ShoppingBag, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [popularCategories, setPopularCategories] = useState<{ name: string; name_bn: string | null; slug: string }[]>([]);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Fetch popular categories
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("name, name_bn, slug")
        .order("display_order", { ascending: true })
        .limit(4);
      
      if (data) setPopularCategories(data);
    };
    fetchCategories();
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center py-12 md:py-20">
            {/* Animated 404 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="relative inline-block">
                <span className="text-[120px] md:text-[180px] font-display font-bold text-gold/20 leading-none select-none">
                  404
                </span>
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <Compass className="h-16 w-16 md:h-24 md:w-24 text-gold" />
                </motion.div>
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="font-display text-2xl md:text-4xl text-foreground mb-4">
                {language === "bn" ? "পেজ খুঁজে পাওয়া যায়নি" : "Page Not Found"}
              </h1>
              <p className="text-muted-foreground text-lg mb-2">
                {language === "bn" 
                  ? "দুঃখিত, আপনি যে পেজটি খুঁজছেন সেটি পাওয়া যায়নি।" 
                  : "Sorry, the page you're looking for doesn't exist or has been moved."}
              </p>
              <p className="text-sm text-muted-foreground/70 mb-8">
                <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code>
              </p>
            </motion.div>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-10"
            >
              <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === "bn" ? "পণ্য খুঁজুন..." : "Search products..."}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="gold">
                  {language === "bn" ? "খুঁজুন" : "Search"}
                </Button>
              </form>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-12"
            >
              <Button asChild variant="outline" size="lg">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  {language === "bn" ? "হোমে যান" : "Go Home"}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/shop">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {language === "bn" ? "দোকানে যান" : "Visit Shop"}
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "bn" ? "পেছনে যান" : "Go Back"}
              </Button>
            </motion.div>

            {/* Popular Categories */}
            {popularCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="border-t border-border pt-8"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  {language === "bn" ? "জনপ্রিয় ক্যাটাগরি দেখুন" : "Explore popular categories"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/shop/${cat.slug}`}
                      className="px-4 py-2 bg-muted hover:bg-gold/20 hover:text-gold rounded-full text-sm transition-colors"
                    >
                      {language === "bn" && cat.name_bn ? cat.name_bn : cat.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
