import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => {
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
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              Get In Touch
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-foreground mt-4 mb-6">
              Contact <span className="text-gold">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground font-body">
              Have questions about our products or want to discuss a custom order? 
              We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-body text-foreground mb-2">
                      Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      className="bg-muted border-border focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-body text-foreground mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="bg-muted border-border focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-body text-foreground mb-2">
                    Subject
                  </label>
                  <Input
                    type="text"
                    placeholder="How can we help?"
                    className="bg-muted border-border focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body text-foreground mb-2">
                    Message
                  </label>
                  <Textarea
                    placeholder="Tell us more..."
                    rows={6}
                    className="bg-muted border-border focus:border-gold resize-none"
                  />
                </div>

                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Send Message
                </Button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="bg-card border border-border rounded-lg p-8">
                <h3 className="font-display text-2xl text-foreground mb-6">
                  Contact Information
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-muted-foreground">Email</p>
                      <a href="mailto:hello@artistiya.store" className="text-foreground hover:text-gold transition-colors">
                        hello@artistiya.store
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-muted-foreground">Phone</p>
                      <a href="tel:+8801700000000" className="text-foreground hover:text-gold transition-colors">
                        +880 1700-000-000
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-muted-foreground">Location</p>
                      <p className="text-foreground">
                        Dhaka, Bangladesh
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-muted-foreground">Business Hours</p>
                      <p className="text-foreground">
                        Sat - Thu: 10:00 AM - 8:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Link */}
              <div className="bg-gold/10 border border-gold/20 rounded-lg p-6 text-center">
                <p className="text-foreground font-body mb-2">
                  Looking for quick answers?
                </p>
                <a href="/faq" className="text-gold hover:text-gold-light transition-colors font-semibold">
                  Check our FAQs →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
