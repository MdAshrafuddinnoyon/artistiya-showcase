import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import heroImage from "@/assets/hero-artisan.jpg";

const collections = [
  {
    id: 1,
    name: "New Arrivals",
    description: "Discover our latest handcrafted treasures",
    image: heroImage,
    count: 24,
  },
  {
    id: 2,
    name: "Best Sellers",
    description: "Our most loved pieces by customers",
    image: categoryJewelry,
    count: 18,
  },
  {
    id: 3,
    name: "Gift Ideas",
    description: "Perfect presents for your loved ones",
    image: categoryBags,
    count: 32,
  },
];

const Collections = () => {
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
            className="text-center mb-16"
          >
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              Curated For You
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-foreground mt-4">
              Our <span className="text-gold">Collections</span>
            </h1>
          </motion.div>

          {/* Collections Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link
                  to={`/collections/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group block relative aspect-[3/4] overflow-hidden rounded-lg"
                >
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/50 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center">
                    <span className="text-gold text-xs tracking-widest uppercase mb-2">
                      {collection.count} Products
                    </span>
                    <h3 className="font-display text-3xl text-foreground mb-2">
                      {collection.name}
                    </h3>
                    <p className="text-muted-foreground font-body">
                      {collection.description}
                    </p>
                    <div className="mt-4 w-0 h-0.5 bg-gold group-hover:w-16 transition-all duration-500" />
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

export default Collections;
