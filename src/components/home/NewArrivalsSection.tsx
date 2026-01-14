import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryWoven from "@/assets/category-woven.jpg";
import categoryArt from "@/assets/category-art.jpg";

const products = [
  {
    id: 1,
    name: "Golden Temple Necklace",
    price: 4500,
    originalPrice: 5500,
    image: categoryJewelry,
    category: "Jewelry",
    isNew: true,
  },
  {
    id: 2,
    name: "Floral Bloom Tote",
    price: 3800,
    image: categoryBags,
    category: "Bags",
    isNew: true,
  },
  {
    id: 3,
    name: "Macramé Dream Catcher",
    price: 2200,
    image: categoryWoven,
    category: "Woven",
    isNew: true,
  },
  {
    id: 4,
    name: "Abstract Gold Canvas",
    price: 8500,
    image: categoryArt,
    category: "Fine Art",
    isNew: true,
  },
];

const NewArrivalsSection = () => {
  return (
    <section className="py-24 bg-charcoal">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
        >
          <div>
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              Just Arrived
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mt-4">
              New Arrivals
            </h2>
          </div>
          <Link to="/shop" className="mt-6 md:mt-0">
            <Button variant="gold-outline" className="group">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Link to={`/product/${product.id}`} className="block">
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* New Badge */}
                  {product.isNew && (
                    <span className="absolute top-4 left-4 px-3 py-1 bg-gold text-charcoal-deep text-xs font-semibold tracking-wider uppercase rounded">
                      New
                    </span>
                  )}

                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-charcoal-deep/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button variant="gold" size="sm">
                      Quick View
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <span className="text-xs text-gold tracking-wider uppercase">
                    {product.category}
                  </span>
                  <h3 className="font-display text-lg text-foreground group-hover:text-gold transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gold font-semibold">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-muted-foreground line-through text-sm">
                        ৳{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSection;
