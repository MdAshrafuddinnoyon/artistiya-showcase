import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
  is_featured: boolean;
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

const DynamicHomepageSections = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('homepage_sections_frontend')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'homepage_sections' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsRes, productsRes] = await Promise.all([
        supabase
          .from("homepage_sections")
          .select("*")
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("products")
          .select("id, name, slug, price, compare_at_price, images, is_featured")
          .eq("is_active", true)
          .limit(100),
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (productsRes.error) throw productsRes.error;

      setSections(sectionsRes.data || []);
      setProducts(productsRes.data || []);
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
    
    return (
      <Link to={`/product/${product.slug}`} key={product.id}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="group bg-card rounded-lg border border-border overflow-hidden hover:border-gold/50 transition-colors"
        >
          <div className="aspect-square relative overflow-hidden">
            <img
              src={product.images?.[0] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {showBadge && (
              <Badge className="absolute top-2 left-2 bg-gold text-background">
                {showBadge}
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="absolute top-2 right-2 bg-destructive text-white">
                -{discount}%
              </Badge>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium text-foreground group-hover:text-gold transition-colors line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gold font-display text-lg">৳{product.price.toLocaleString()}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-muted-foreground line-through text-sm">
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
        if (selectedProducts.length === 0) return null;

        return (
          <section key={section.id} className="py-16 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl md:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-muted-foreground mt-2">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {selectedProducts.map(p => renderProductCard(p))}
              </div>
            </div>
          </section>
        );
      }

      case "category": {
        // This would need to fetch products by category - simplified for now
        return null;
      }

      case "best_selling": {
        // Get featured products as "best sellers"
        const bestSellers = products
          .filter(p => p.is_featured)
          .slice(0, section.config.limit || 8);
        if (bestSellers.length === 0) return null;

        return (
          <section key={section.id} className="py-16 bg-muted/30">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl md:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-muted-foreground mt-2">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
        if (discountProducts.length === 0) return null;

        return (
          <section key={section.id} className="py-16 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl md:text-4xl text-foreground">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-muted-foreground mt-2">{section.subtitle}</p>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {discountProducts.map(p => renderProductCard(p))}
              </div>
            </div>
          </section>
        );
      }

      case "banner": {
        if (!section.config.image_url) return null;

        return (
          <section key={section.id} className="py-8">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent flex items-center">
                    <div className="p-8 md:p-12 max-w-lg">
                      <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                        {section.title}
                      </h2>
                      {section.subtitle && (
                        <p className="text-muted-foreground mb-6">{section.subtitle}</p>
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
        return (
          <section key={section.id} className="py-8">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Banner 1 */}
                {section.config.banner1_image && (
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
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6">
                          <h3 className="font-display text-2xl text-foreground">
                            {section.config.banner1_title}
                          </h3>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                )}

                {/* Banner 2 */}
                {section.config.banner2_image && (
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
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6">
                          <h3 className="font-display text-2xl text-foreground">
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

      default:
        return null;
    }
  };

  if (loading) {
    return null;
  }

  return <>{sections.map(renderSection)}</>;
};

export default DynamicHomepageSections;
