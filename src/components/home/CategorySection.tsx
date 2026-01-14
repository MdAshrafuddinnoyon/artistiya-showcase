import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryWoven from "@/assets/category-woven.jpg";
import categoryArt from "@/assets/category-art.jpg";

const categories = [
  {
    name: "Jewelry",
    subtitle: "Handcrafted",
    description: "Exquisite handcrafted pieces",
    image: categoryJewelry,
    href: "/shop/jewelry",
  },
  {
    name: "Hand-painted Bags",
    subtitle: "Artisan",
    description: "Wearable art pieces",
    image: categoryBags,
    href: "/shop/bags",
  },
  {
    name: "Woven Tales",
    subtitle: "Traditional",
    description: "Crochet, Macramé & Handloom",
    image: categoryWoven,
    href: "/shop/woven",
  },
  {
    name: "Fine Art",
    subtitle: "Original",
    description: "Paintings & Showpieces",
    image: categoryArt,
    href: "/shop/art",
  },
];

const CategorySection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
            Explore Our World
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mt-4">
            Shop by Category
          </h2>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link
                to={category.href}
                className="group block relative aspect-square overflow-hidden rounded-lg"
              >
                {/* Image */}
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
                  <span className="text-gold text-xs tracking-widest uppercase mb-2 font-body">
                    {category.subtitle}
                  </span>
                  <h3 className="font-display text-xl md:text-2xl text-foreground mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {category.description}
                  </p>
                  
                  {/* Hover line */}
                  <div className="mt-4 w-0 h-0.5 bg-gold group-hover:w-16 transition-all duration-500" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
