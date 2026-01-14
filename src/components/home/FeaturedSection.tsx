import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import categoryBags from "@/assets/category-bags.jpg";

const FeaturedSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-lg overflow-hidden">
              <img
                src={categoryBags}
                alt="Featured hand-painted bag"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative Frame */}
            <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-gold/30 rounded-lg -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:pl-12"
          >
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              Signature Collection
            </span>
            
            <h2 className="font-display text-4xl md:text-5xl text-foreground mt-4 mb-6">
              The Floral Bloom
              <br />
              <span className="text-gold">Tote Collection</span>
            </h2>

            <p className="text-muted-foreground text-lg mb-6 font-body">
              Each bag in this collection is a canvas of nature's beauty, hand-painted with 
              meticulous attention to detail. Inspired by the vibrant flora of Bengal, these 
              pieces transform everyday accessories into wearable art.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "100% Genuine Leather",
                "Hand-painted by skilled artisans",
                "Water-resistant coating",
                "Limited edition pieces"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Link to="/collections/floral-bloom">
                <Button variant="hero" size="lg">
                  Explore Collection
                </Button>
              </Link>
              <span className="flex items-center text-gold font-display text-2xl">
                From ৳3,800
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
