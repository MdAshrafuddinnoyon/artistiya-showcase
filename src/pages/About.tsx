import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import makingImage from "@/assets/making-process.jpg";
import heroImage from "@/assets/hero-artisan.jpg";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32">
        {/* Hero Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
                Our Story
              </span>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mt-4 mb-6">
                Where Art Meets <span className="text-gold">Tradition</span>
              </h1>
              <p className="text-lg text-muted-foreground font-body">
                artistiya.store was born from a passion for preserving Bengal's rich artistic heritage 
                while creating contemporary pieces that resonate with modern sensibilities.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="aspect-[4/5] rounded-lg overflow-hidden">
                  <img
                    src={makingImage}
                    alt="Artisan at work"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="font-display text-4xl text-foreground mb-6">
                  The Beginning of a <span className="text-gold">Dream</span>
                </h2>
                <div className="space-y-4 text-muted-foreground font-body">
                  <p>
                    What started as a small passion project in a modest studio has grown into a 
                    celebration of Bengali craftsmanship. Every piece we create carries the essence 
                    of our rich cultural heritage.
                  </p>
                  <p>
                    Our artisans are masters of their craft, many having learned their skills from 
                    generations before them. We believe in preserving these traditional techniques 
                    while adapting them for the contemporary world.
                  </p>
                  <p>
                    From intricate gold jewelry inspired by temple architecture to hand-painted bags 
                    that tell stories of Bengal's natural beauty, each creation is a testament to 
                    the endless possibilities of human creativity.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 bg-charcoal">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
                Our Values
              </span>
              <h2 className="font-display text-4xl md:text-5xl text-foreground mt-4">
                What We Stand For
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Artistry",
                  subtitle: "Creative Excellence",
                  description: "Every piece is a work of art, crafted with meticulous attention to detail and an unwavering commitment to quality."
                },
                {
                  title: "Heritage",
                  subtitle: "Cultural Legacy",
                  description: "We honor the traditions passed down through generations while creating designs that speak to modern aesthetics."
                },
                {
                  title: "Sustainability",
                  subtitle: "Ethical Practices",
                  description: "Our commitment to ethical sourcing and sustainable practices ensures beauty that doesn't cost the earth."
                }
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center p-8 border border-border rounded-lg"
                >
                  <span className="text-gold text-xs tracking-widest uppercase">
                    {value.subtitle}
                  </span>
                  <h3 className="font-display text-2xl text-foreground mt-2 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground font-body">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Image */}
        <section className="relative h-[60vh]">
          <img
            src={heroImage}
            alt="Our collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="font-display text-5xl md:text-7xl text-foreground text-center"
            >
              Crafted with Love,
              <br />
              <span className="text-gold">Designed for You</span>
            </motion.h2>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
