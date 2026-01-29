import { Link } from "react-router-dom";
import { Instagram, Facebook, MessageCircle } from "lucide-react";

interface MobileAppFooterProps {
  branding: {
    logo_text: string;
    logo_text_secondary: string;
    footer_description: string;
    social_instagram: string;
    social_facebook: string;
  };
}

const MobileAppFooter = ({ branding }: MobileAppFooterProps) => {
  return (
    <footer className="md:hidden bg-charcoal border-t border-border pb-20">
      {/* Quick Links */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <QuickLink href="/about" label="About Us" />
          <QuickLink href="/contact" label="Contact" />
          <QuickLink href="/faq" label="FAQs" />
          <QuickLink href="/track" label="Track Order" />
          <QuickLink href="/terms" label="Terms" />
          <QuickLink href="/privacy" label="Privacy" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border mx-4" />

      {/* Social & Brand */}
      <div className="px-4 py-6 text-center">
        <div className="font-display text-lg mb-2">
          <span className="text-gold">{branding.logo_text}</span>
          <span className="text-foreground">{branding.logo_text_secondary}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
          {branding.footer_description}
        </p>

        {/* Social Icons */}
        <div className="flex justify-center gap-3">
          {branding.social_instagram && (
            <a
              href={branding.social_instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-muted/80 transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>
          )}
          {branding.social_facebook && (
            <a
              href={branding.social_facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-muted/80 transition-colors"
            >
              <Facebook className="h-4 w-4" />
            </a>
          )}
          <a
            href="https://wa.me/8801XXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-muted/80 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="border-t border-border px-4 py-4">
        <p className="text-center text-[10px] text-muted-foreground mb-2">
          We Accept
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <PaymentBadge name="bKash" color="bg-pink-600" />
          <PaymentBadge name="Nagad" color="bg-orange-500" />
          <PaymentBadge name="COD" color="bg-green-600" />
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} {branding.logo_text}{branding.logo_text_secondary}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

const QuickLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    to={href}
    className="text-xs text-muted-foreground hover:text-gold transition-colors py-2"
  >
    {label}
  </Link>
);

const PaymentBadge = ({ name, color }: { name: string; color: string }) => (
  <div
    className={`${color} px-3 py-1 rounded text-white text-[10px] font-medium`}
  >
    {name}
  </div>
);

export default MobileAppFooter;
