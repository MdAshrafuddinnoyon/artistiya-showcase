import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import makingImage from "@/assets/making-process.jpg";

const MakingSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={makingImage}
          alt="Artisan crafting jewelry"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal-deep/85" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block text-gold text-sm tracking-[0.3em] uppercase font-body mb-6"
          >
            Behind the Craft
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6"
          >
            প্রতিটি পণ্যের পেছনে
            <br />
            <span className="text-gold">কারিগরের গল্প</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground mb-10 font-body"
          >
            Every piece at artistiya.store is born from hours of dedication, traditional techniques 
            passed down through generations, and a passion for perfection. From selecting the finest 
            materials to the final finishing touches, our artisans pour their heart into each creation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/about">
              <Button variant="hero" size="lg">
                Read Our Story
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/30"
          >
            {[
              { number: "500+", label: "Handcrafted Pieces" },
              { number: "15+", label: "Skilled Artisans" },
              { number: "1000+", label: "Happy Customers" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <span className="block font-display text-3xl md:text-4xl text-gold mb-2">
                  {stat.number}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MakingSection;
