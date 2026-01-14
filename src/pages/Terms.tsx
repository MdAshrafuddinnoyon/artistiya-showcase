import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              Legal
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground mt-4">
              Last updated: January 14, 2026
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto prose prose-invert"
          >
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-8">
              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground">
                  By accessing and using artistiya.store, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our website or services.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  2. Products and Services
                </h2>
                <p className="text-muted-foreground mb-4">
                  All products sold on artistiya.store are handcrafted items. Due to the nature of 
                  handmade products:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Each item may have slight variations in color, size, and design</li>
                  <li>Product images are representative and may not match exactly</li>
                  <li>Custom orders are made to your specifications and may vary from samples</li>
                  <li>Production times may vary based on complexity and demand</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  3. Orders and Payment
                </h2>
                <p className="text-muted-foreground mb-4">
                  When placing an order:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>All prices are in Bangladeshi Taka (৳)</li>
                  <li>Payment must be completed before order processing</li>
                  <li>We accept bKash, Nagad, and Cash on Delivery</li>
                  <li>Order confirmation will be sent via email and SMS</li>
                  <li>We reserve the right to cancel orders due to pricing errors or stock issues</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  4. Shipping and Delivery
                </h2>
                <p className="text-muted-foreground mb-4">
                  Delivery information:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Dhaka delivery: 2-3 business days</li>
                  <li>Outside Dhaka: 3-5 business days</li>
                  <li>Custom orders: 14-21 days plus shipping</li>
                  <li>Free shipping on orders over ৳5,000</li>
                  <li>Risk of loss passes to you upon delivery</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  5. Returns and Refunds
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our return policy:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Returns accepted within 7 days of delivery</li>
                  <li>Items must be unused and in original condition</li>
                  <li>Custom and personalized items are non-returnable</li>
                  <li>Return shipping costs are the customer's responsibility</li>
                  <li>Refunds processed within 5-7 business days</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-muted-foreground">
                  All content on artistiya.store, including designs, images, logos, and text, 
                  is our intellectual property. You may not reproduce, distribute, or use our 
                  content without written permission.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  7. Limitation of Liability
                </h2>
                <p className="text-muted-foreground">
                  artistiya.store shall not be liable for any indirect, incidental, special, or 
                  consequential damages arising from the use of our products or services. Our 
                  maximum liability is limited to the purchase price of the product.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  8. Changes to Terms
                </h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Changes will be 
                  effective immediately upon posting to the website. Continued use of the 
                  website constitutes acceptance of modified terms.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  9. Contact Information
                </h2>
                <p className="text-muted-foreground">
                  For questions about these terms, please contact us at:
                </p>
                <p className="text-muted-foreground mt-2">
                  Email: hello@artistiya.store<br />
                  WhatsApp: +880 1XXXXXXXXX
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
