import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
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
              Privacy Policy
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
            className="max-w-3xl mx-auto"
          >
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-8">
              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Name, email address, and phone number</li>
                  <li>Shipping and billing addresses</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Order history and preferences</li>
                  <li>Communications with our customer service team</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Process and fulfill your orders</li>
                  <li>Communicate about orders, products, and services</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Improve our products and services</li>
                  <li>Detect and prevent fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  3. Information Sharing
                </h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Delivery partners to fulfill orders</li>
                  <li>Payment processors for secure transactions</li>
                  <li>Service providers who assist our operations</li>
                  <li>Law enforcement when required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  4. Data Security
                </h2>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information. 
                  However, no method of transmission over the Internet is 100% secure. We strive 
                  to use commercially acceptable means to protect your information.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  5. Cookies and Tracking
                </h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Remember your preferences</li>
                  <li>Analyze website traffic and usage</li>
                  <li>Personalize your experience</li>
                  <li>Provide targeted advertisements</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  You can control cookies through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  6. Your Rights
                </h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  7. Children's Privacy
                </h2>
                <p className="text-muted-foreground">
                  Our services are not directed to children under 16. We do not knowingly collect 
                  personal information from children. If you believe we have collected information 
                  from a child, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  8. Changes to This Policy
                </h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of 
                  any changes by posting the new policy on this page and updating the "Last 
                  updated" date.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl text-gold mb-4">
                  9. Contact Us
                </h2>
                <p className="text-muted-foreground">
                  If you have questions about this privacy policy or our data practices, 
                  please contact us at:
                </p>
                <p className="text-muted-foreground mt-2">
                  Email: privacy@artistiya.store<br />
                  Address: Dhaka, Bangladesh
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

export default Privacy;
