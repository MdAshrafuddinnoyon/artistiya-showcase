import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    category: "Orders & Shipping",
    items: [
      {
        question: "How long does shipping take?",
        answer: "For Dhaka city, delivery typically takes 2-3 business days. For areas outside Dhaka, delivery takes 3-5 business days. Custom orders may require additional production time of 7-14 days.",
      },
      {
        question: "What are the shipping charges?",
        answer: "Shipping is ৳80 for Dhaka city and ৳130 for outside Dhaka. Orders over ৳5,000 qualify for free shipping across Bangladesh.",
      },
      {
        question: "Can I track my order?",
        answer: "Yes! Once your order is shipped, you'll receive a tracking link via email and SMS. You can also track your order from your account dashboard.",
      },
      {
        question: "Do you ship internationally?",
        answer: "Currently, we only ship within Bangladesh. International shipping will be available soon. Subscribe to our newsletter for updates.",
      },
    ],
  },
  {
    category: "Products & Quality",
    items: [
      {
        question: "Are your products handmade?",
        answer: "Yes, all our products are 100% handcrafted by skilled local artisans. Each piece is unique and may have slight variations, which is a hallmark of authentic handmade craftsmanship.",
      },
      {
        question: "What materials do you use?",
        answer: "We use high-quality materials including genuine leather, natural gemstones, eco-friendly resins, pure cotton, and sustainable materials. Each product description includes detailed material information.",
      },
      {
        question: "How do I care for my purchase?",
        answer: "Care instructions are provided with each product. Generally, avoid direct sunlight and moisture. For jewelry, store in a dry place. For bags, clean with a soft cloth. For fabric items, follow the washing instructions on the label.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      {
        question: "What is your return policy?",
        answer: "We accept returns within 7 days of delivery for unused items in original condition with tags attached. Custom orders and personalized items are non-returnable.",
      },
      {
        question: "How do I initiate a return?",
        answer: "Contact us via WhatsApp or email with your order number and reason for return. Our team will guide you through the process and arrange for pickup.",
      },
      {
        question: "When will I receive my refund?",
        answer: "Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method.",
      },
    ],
  },
  {
    category: "Custom Orders",
    items: [
      {
        question: "Can I request a custom design?",
        answer: "Absolutely! We love creating unique pieces. Use our Custom Design feature to share your ideas, reference images, and budget. Our artisans will work with you to bring your vision to life.",
      },
      {
        question: "How long do custom orders take?",
        answer: "Custom orders typically take 14-21 days depending on complexity. Rush orders may be accommodated for an additional fee. We'll provide a timeline estimate when confirming your order.",
      },
      {
        question: "Is there a minimum order for customization?",
        answer: "There's no minimum for individual custom pieces. For bulk orders (corporate gifts, wedding favors, etc.), please contact us for special pricing.",
      },
    ],
  },
  {
    category: "Payment",
    items: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept bKash, Nagad, and Cash on Delivery (COD). Online card payments (Visa/Mastercard) will be available soon.",
      },
      {
        question: "Is Cash on Delivery available?",
        answer: "Yes, COD is available for all orders within Bangladesh. A ৳50 COD fee may apply for orders under ৳1,000.",
      },
      {
        question: "Do you offer installment payments?",
        answer: "Currently, we don't offer installment plans. However, we occasionally run special promotions with flexible payment options. Follow us on social media for updates.",
      },
    ],
  },
];

const FAQ = () => {
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
              Help Center
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-4 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground">
              Find answers to common questions about our products, orders, and services.
            </p>
          </motion.div>

          {/* FAQ Categories */}
          <div className="max-w-3xl mx-auto space-y-8">
            {faqs.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="font-display text-xl text-gold mb-4">
                  {category.category}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={itemIndex}
                      value={`${categoryIndex}-${itemIndex}`}
                      className="border-border"
                    >
                      <AccordionTrigger className="text-left text-foreground hover:text-gold">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for?
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              Contact our support team →
            </a>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
