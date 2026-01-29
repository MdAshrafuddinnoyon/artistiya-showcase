import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileAppFooter from "@/components/mobile/MobileAppFooter";

interface SiteBranding {
  logo_url: string | null;
  logo_text: string;
  logo_text_secondary: string;
  footer_description: string;
  footer_copyright: string;
  social_instagram: string;
  social_facebook: string;
  social_email: string;
}

interface FooterLinkGroup {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

interface FooterLink {
  id: string;
  group_id: string;
  name: string;
  href: string;
  display_order: number;
  is_active: boolean;
}

const Footer = () => {
  const isMobile = useIsMobile();
  const [branding, setBranding] = useState<SiteBranding>({
    logo_url: null,
    logo_text: "artistiya",
    logo_text_secondary: ".store",
    footer_description: "Where every piece tells a story of tradition, artistry, and elegance.",
    footer_copyright: "© 2026 artistiya.store. All rights reserved.",
    social_instagram: "https://instagram.com",
    social_facebook: "https://facebook.com",
    social_email: "hello@artistiya.store",
  });
  const [linkGroups, setLinkGroups] = useState<FooterLinkGroup[]>([]);
  const [links, setLinks] = useState<FooterLink[]>([]);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('footer_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_branding' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'footer_link_groups' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'footer_links' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [brandingRes, groupsRes, linksRes] = await Promise.all([
        supabase.from("site_branding").select("*").single(),
        supabase.from("footer_link_groups").select("*").eq("is_active", true).order("display_order"),
        supabase.from("footer_links").select("*").eq("is_active", true).order("display_order"),
      ]);

      if (brandingRes.data) setBranding(brandingRes.data);
      if (groupsRes.data) setLinkGroups(groupsRes.data);
      if (linksRes.data) setLinks(linksRes.data);
    } catch (error) {
      console.error("Error fetching footer data:", error);
    }
  };

  const getLinksForGroup = (groupId: string) => {
    return links.filter(l => l.group_id === groupId);
  };

  // Payment gateway logos/badges
  const paymentMethods = [
    { name: "bKash", color: "bg-pink-600" },
    { name: "Nagad", color: "bg-orange-500" },
    { name: "Visa", color: "bg-blue-600" },
    { name: "Mastercard", color: "bg-red-500" },
    { name: "COD", color: "bg-green-600" },
  ];

  // Fallback links if database is empty
  const defaultGroups: FooterLinkGroup[] = [
    { id: "shop", title: "Shop", display_order: 0, is_active: true },
    { id: "help", title: "Help", display_order: 1, is_active: true },
    { id: "company", title: "Company", display_order: 2, is_active: true },
  ];

  const defaultLinks: Record<string, { name: string; href: string }[]> = {
    shop: [
      { name: "Jewelry", href: "/shop/jewelry" },
      { name: "Hand-painted Bags", href: "/shop/bags" },
      { name: "Woven Tales", href: "/shop/woven" },
      { name: "Fine Art", href: "/shop/art" },
    ],
    help: [
      { name: "Shipping Info", href: "/shipping" },
      { name: "Return Policy", href: "/returns" },
      { name: "Track Order", href: "/track" },
      { name: "FAQs", href: "/faq" },
    ],
    company: [
      { name: "Our Story", href: "/about" },
      { name: "Contact Us", href: "/contact" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
    ],
  };

  const displayGroups = linkGroups.length > 0 ? linkGroups : defaultGroups;

  // Show mobile footer for mobile devices
  if (isMobile) {
    return <MobileAppFooter branding={branding} />;
  }

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
              className="font-display text-3xl md:text-4xl text-foreground mb-4"
            >
              Join Our Artistic Journey
            </motion.h3>
            <p className="text-muted-foreground mb-8">
              Subscribe to receive updates on new collections and exclusive offers
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-gold"
              />
              <Button variant="gold" className="px-8">
                Subscribe
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
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="h-8 w-auto" />
              ) : (
                <h2 className="font-display text-2xl">
                  <span className="text-gold">{branding.logo_text}</span>
                  <span className="text-foreground">{branding.logo_text_secondary}</span>
                </h2>
              )}
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {branding.footer_description}
            </p>
            <div className="flex gap-4">
              {branding.social_instagram && (
                <a
                  href={branding.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {branding.social_facebook && (
                <a
                  href={branding.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {branding.social_email && (
                <a
                  href={`mailto:${branding.social_email}`}
                  className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Dynamic Link Groups */}
          {displayGroups.map((group) => {
            const groupLinks = linkGroups.length > 0 
              ? getLinksForGroup(group.id)
              : defaultLinks[group.id]?.map((l, i) => ({ 
                  id: `${group.id}-${i}`, 
                  group_id: group.id, 
                  ...l, 
                  display_order: i, 
                  is_active: true 
                })) || [];

            return (
              <div key={group.id}>
                <h4 className="font-display text-lg text-foreground mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {groupLinks.map((link) => (
                    <li key={link.id}>
                      <Link
                        to={link.href}
                        className="text-muted-foreground hover:text-gold transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Methods Banner */}
      <div className="border-t border-border bg-charcoal-deep/50">
        <div className="container mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <span className="text-sm text-muted-foreground">
              We Accept:
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
            <p className="text-sm text-muted-foreground">
              {branding.footer_copyright}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-gold transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-gold transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
