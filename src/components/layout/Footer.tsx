import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";

const Footer = () => {
  const { t, language } = useLanguage();

  const footerLinks = {
    shop: [
      { name: language === "bn" ? "জুয়েলারি" : "Jewelry", href: "/shop/jewelry" },
      { name: language === "bn" ? "ব্যাগ ও এক্সেসরিজ" : "Hand-painted Bags", href: "/shop/bags" },
      { name: language === "bn" ? "উইভেন আর্ট" : "Woven Tales", href: "/shop/woven" },
      { name: language === "bn" ? "ফাইন আর্ট" : "Fine Art", href: "/shop/art" },
    ],
    help: [
      { name: t("footer.shippingInfo"), href: "/shipping" },
      { name: t("footer.returnPolicy"), href: "/returns" },
      { name: t("footer.trackOrder"), href: "/track" },
      { name: t("footer.faq"), href: "/faq" },
    ],
    company: [
      { name: t("footer.ourStory"), href: "/about" },
      { name: t("footer.contactUs"), href: "/contact" },
      { name: t("footer.terms"), href: "/terms" },
      { name: t("footer.privacy"), href: "/privacy" },
    ],
  };

  // Payment gateway logos/badges
  const paymentMethods = [
    { name: "bKash", color: "bg-pink-600" },
    { name: "Nagad", color: "bg-orange-500" },
    { name: "Visa", color: "bg-blue-600" },
    { name: "Mastercard", color: "bg-red-500" },
    { name: "COD", color: "bg-green-600" },
  ];

  return (
    <footer className="bg-charcoal border-t border-border">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`font-display text-3xl md:text-4xl text-foreground mb-4 ${language === "bn" ? "font-bengali" : ""}`}
            >
              {t("footer.newsletter")}
            </motion.h3>
            <p className={`text-muted-foreground mb-8 ${language === "bn" ? "font-bengali" : ""}`}>
              {t("footer.newsletterDesc")}
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t("footer.enterEmail")}
                className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-gold"
              />
              <Button variant="gold" className={`px-8 ${language === "bn" ? "font-bengali" : ""}`}>
                {t("footer.subscribe")}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <h2 className="font-display text-2xl">
                <span className="text-gold">artistiya</span>
                <span className="text-foreground">.store</span>
              </h2>
            </Link>
            <p className={`text-muted-foreground mb-6 max-w-sm ${language === "bn" ? "font-bengali" : ""}`}>
              {t("footer.tagline")}
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@artistiya.store"
                className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className={`font-display text-lg text-foreground mb-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {t("footer.shop")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className={`text-muted-foreground hover:text-gold transition-colors text-sm ${language === "bn" ? "font-bengali" : ""}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className={`font-display text-lg text-foreground mb-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {t("footer.help")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className={`text-muted-foreground hover:text-gold transition-colors text-sm ${language === "bn" ? "font-bengali" : ""}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className={`font-display text-lg text-foreground mb-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {t("footer.company")}
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className={`text-muted-foreground hover:text-gold transition-colors text-sm ${language === "bn" ? "font-bengali" : ""}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods Banner */}
      <div className="border-t border-border bg-charcoal-deep/50">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <span className={`text-sm text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
              {t("footer.weAccept")}
            </span>
            <div className="flex flex-wrap justify-center gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className={`${method.color} px-4 py-2 rounded-md text-white text-xs font-semibold tracking-wide`}
                >
                  {method.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className={`text-sm text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
              © 2026 artistiya.store. {t("footer.rights")}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-gold transition-colors">
                {t("footer.terms")}
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-gold transition-colors">
                {t("footer.privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
