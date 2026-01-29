import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  category: string;
  category_bn: string | null;
  question: string;
  question_bn: string | null;
  answer: string;
  answer_bn: string | null;
  display_order: number;
  is_active: boolean;
}

// Fallback FAQs for when database is empty
const fallbackFaqs = [
  {
    category: "Orders & Shipping",
    category_bn: "অর্ডার ও শিপিং",
    items: [
      {
        question: "How long does shipping take?",
        question_bn: "শিপিং-এ কতদিন লাগে?",
        answer: "For Dhaka city, delivery typically takes 2-3 business days. For areas outside Dhaka, delivery takes 3-5 business days.",
        answer_bn: "ঢাকা শহরের জন্য সাধারণত ২-৩ কার্যদিবস লাগে। ঢাকার বাইরে ৩-৫ কার্যদিবস লাগে।",
      },
      {
        question: "What are the shipping charges?",
        question_bn: "শিপিং চার্জ কত?",
        answer: "Shipping is ৳80 for Dhaka city and ৳130 for outside Dhaka. Orders over ৳5,000 qualify for free shipping.",
        answer_bn: "ঢাকা শহরে ৳৮০ এবং ঢাকার বাইরে ৳১৩০। ৳৫,০০০ এর উপরে অর্ডারে ফ্রি শিপিং।",
      },
    ],
  },
  {
    category: "Products & Quality",
    category_bn: "পণ্য ও মান",
    items: [
      {
        question: "Are your products handmade?",
        question_bn: "আপনাদের পণ্য কি হাতে তৈরি?",
        answer: "Yes, all our products are 100% handcrafted by skilled local artisans.",
        answer_bn: "হ্যাঁ, আমাদের সব পণ্য দক্ষ স্থানীয় কারিগরদের হাতে তৈরি।",
      },
    ],
  },
  {
    category: "Payment",
    category_bn: "পেমেন্ট",
    items: [
      {
        question: "What payment methods do you accept?",
        question_bn: "আপনারা কোন পেমেন্ট মেথড গ্রহণ করেন?",
        answer: "We accept bKash, Nagad, and Cash on Delivery (COD).",
        answer_bn: "আমরা বিকাশ, নগদ এবং ক্যাশ অন ডেলিভারি (COD) গ্রহণ করি।",
      },
    ],
  },
];

const FAQ = () => {
  const { language, t } = useLanguage();

  const { data: faqItems = [], isLoading } = useQuery({
    queryKey: ["faq-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("display_order");
      if (error) throw error;
      return data as FAQItem[];
    },
  });

  // Group FAQs by category
  const groupedFaqs = faqItems.reduce((acc, faq) => {
    const categoryKey = language === "bn" && faq.category_bn ? faq.category_bn : faq.category;
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  // Use fallback if no items in database
  const hasDatabaseItems = faqItems.length > 0;

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
              {language === "bn" ? "সাহায্য কেন্দ্র" : "Help Center"}
            </span>
            <h1 className={`font-display text-4xl md:text-5xl text-foreground mt-4 mb-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" ? "সচরাচর জিজ্ঞাসা" : "Frequently Asked Questions"}
            </h1>
            <p className={`text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" 
                ? "আমাদের পণ্য, অর্ডার এবং সেবা সম্পর্কে সাধারণ প্রশ্নের উত্তর খুঁজুন।"
                : "Find answers to common questions about our products, orders, and services."}
            </p>
          </motion.div>

          {/* FAQ Categories */}
          {isLoading ? (
            <div className="max-w-3xl mx-auto space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/4 mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasDatabaseItems ? (
            <div className="max-w-3xl mx-auto space-y-8">
              {Object.entries(groupedFaqs).map(([category, categoryFaqs], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h2 className={`font-display text-xl text-gold mb-4 ${language === "bn" ? "font-bengali" : ""}`}>
                    {category}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-2">
                    {categoryFaqs.map((item, itemIndex) => (
                      <AccordionItem
                        key={item.id}
                        value={`${categoryIndex}-${itemIndex}`}
                        className="border-border"
                      >
                        <AccordionTrigger className={`text-left text-foreground hover:text-gold ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" && item.question_bn ? item.question_bn : item.question}
                        </AccordionTrigger>
                        <AccordionContent className={`text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" && item.answer_bn ? item.answer_bn : item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              ))}
            </div>
          ) : (
            // Fallback FAQs
            <div className="max-w-3xl mx-auto space-y-8">
              {fallbackFaqs.map((category, categoryIndex) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h2 className={`font-display text-xl text-gold mb-4 ${language === "bn" ? "font-bengali" : ""}`}>
                    {language === "bn" ? category.category_bn : category.category}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem
                        key={itemIndex}
                        value={`${categoryIndex}-${itemIndex}`}
                        className="border-border"
                      >
                        <AccordionTrigger className={`text-left text-foreground hover:text-gold ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" ? item.question_bn : item.question}
                        </AccordionTrigger>
                        <AccordionContent className={`text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" ? item.answer_bn : item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              ))}
            </div>
          )}

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className={`text-muted-foreground mb-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" 
                ? "আপনার প্রশ্নের উত্তর খুঁজে পাচ্ছেন না?"
                : "Can't find what you're looking for?"}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
            >
              {language === "bn" ? "আমাদের সাথে যোগাযোগ করুন →" : "Contact our support team →"}
            </a>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
