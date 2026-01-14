import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Filter, Grid, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryWoven from "@/assets/category-woven.jpg";
import categoryArt from "@/assets/category-art.jpg";

const products = [
  { id: 1, name: "Golden Temple Necklace", price: 4500, category: "Jewelry", image: categoryJewelry },
  { id: 2, name: "Floral Bloom Tote", price: 3800, category: "Bags", image: categoryBags },
  { id: 3, name: "Macramé Wall Art", price: 2200, category: "Woven", image: categoryWoven },
  { id: 4, name: "Abstract Gold Canvas", price: 8500, category: "Fine Art", image: categoryArt },
  { id: 5, name: "Royal Heritage Earrings", price: 2800, category: "Jewelry", image: categoryJewelry },
  { id: 6, name: "Midnight Garden Clutch", price: 3200, category: "Bags", image: categoryBags },
  { id: 7, name: "Crochet Dream Basket", price: 1800, category: "Woven", image: categoryWoven },
  { id: 8, name: "Sunset Bloom Painting", price: 12000, category: "Fine Art", image: categoryArt },
];

const categories = ["All", "Jewelry", "Bags", "Woven", "Fine Art"];

const Shop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              Explore Our Collection
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-foreground mt-4">
              Shop <span className="text-gold">All</span>
            </h1>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-12 pb-6 border-b border-border">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={cat === "All" ? "gold" : "gold-outline"}
                  size="sm"
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Filter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Grid className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="group"
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button variant="gold" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs text-gold tracking-wider uppercase">
                      {product.category}
                    </span>
                    <h3 className="font-display text-lg text-foreground group-hover:text-gold transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-gold font-semibold">
                      ৳{product.price.toLocaleString()}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
