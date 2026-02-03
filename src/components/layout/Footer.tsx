import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, Facebook, Mail, Twitter, Youtube, Linkedin, MessageCircle, Pin, Music, Globe, Phone, Send, Camera, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileAppFooter from "@/components/mobile/MobileAppFooter";
import { useToast } from "@/hooks/use-toast";
interface SiteBranding {
  logo_url: string | null;
  logo_text: string;
  logo_text_secondary: string;
  show_logo_text: boolean;
  footer_description: string;
  footer_copyright: string;
  footer_logo_size: string;
  footer_banner_url: string | null;
  footer_banner_link: string | null;
  footer_banner_height: number;
  footer_left_logo_url: string | null;
  footer_left_logo_link: string | null;
  footer_right_logo_url: string | null;
  footer_right_logo_link: string | null;
  payment_methods: string[];
  social_instagram: string;
  social_facebook: string;
  social_email: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon_name: string | null;
  is_active: boolean;
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

const platformIcons: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  pinterest: Pin,
  tiktok: Music,
  telegram: Send,
  snapchat: Camera,
  email: Mail,
  phone: Phone,
  website: Globe,
  other: ExternalLink,
};

const logoSizes: Record<string, string> = {
  small: "h-6",
  medium: "h-8",
  large: "h-12",
  xlarge: "h-16",
};

interface NewsletterSettings {
  is_enabled: boolean;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  placeholder_text: string | null;
  success_message: string | null;
}

const Footer = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [branding, setBranding] = useState<SiteBranding>({
    logo_url: null,
    logo_text: "artistiya",
    logo_text_secondary: ".store",
    show_logo_text: true,
    footer_description: "Where every piece tells a story of tradition, artistry, and elegance.",
    footer_copyright: "© 2026 artistiya.store. All rights reserved.",
    footer_logo_size: "medium",
    footer_banner_url: null,
    footer_banner_link: null,
    footer_banner_height: 80,
    footer_left_logo_url: null,
    footer_left_logo_link: null,
    footer_right_logo_url: null,
    footer_right_logo_link: null,
    payment_methods: ["bKash", "Nagad", "Visa", "Mastercard", "COD"],
    social_instagram: "https://instagram.com",
    social_facebook: "https://facebook.com",
    social_email: "hello@artistiya.store",
  });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [linkGroups, setLinkGroups] = useState<FooterLinkGroup[]>([]);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [newsletterSettings, setNewsletterSettings] = useState<NewsletterSettings>({
    is_enabled: true,
    title: "Join Our Artistic Journey",
    subtitle: "Subscribe to receive updates on new collections and exclusive offers",
    button_text: "Subscribe",
    placeholder_text: "Enter your email",
    success_message: "Thank you for subscribing!",
  });
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetchData();

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_links' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_settings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [brandingRes, groupsRes, linksRes, socialRes, newsletterRes] = await Promise.all([
        supabase.from("site_branding").select("*").single(),
        supabase.from("footer_link_groups").select("*").eq("is_active", true).order("display_order"),
        supabase.from("footer_links").select("*").eq("is_active", true).order("display_order"),
        supabase.from("social_links").select("*").eq("is_active", true).order("display_order"),
        supabase.from("newsletter_settings").select("*").single(),
      ]);

      if (brandingRes.data) {
        const paymentMethodsArray = Array.isArray(brandingRes.data.payment_methods) && brandingRes.data.payment_methods.length > 0
          ? brandingRes.data.payment_methods as string[]
          : ["bKash", "Nagad", "Visa", "Mastercard", "COD"];
        
        setBranding({
          ...brandingRes.data,
          show_logo_text: brandingRes.data.show_logo_text ?? true,
          footer_logo_size: brandingRes.data.footer_logo_size || "medium",
          footer_banner_height: brandingRes.data.footer_banner_height || 80,
          footer_left_logo_url: brandingRes.data.footer_left_logo_url || null,
          footer_left_logo_link: brandingRes.data.footer_left_logo_link || null,
          footer_right_logo_url: brandingRes.data.footer_right_logo_url || null,
          footer_right_logo_link: brandingRes.data.footer_right_logo_link || null,
          payment_methods: paymentMethodsArray,
        });
      }
      if (groupsRes.data) setLinkGroups(groupsRes.data);
      if (linksRes.data) setLinks(linksRes.data);
      if (socialRes.data) setSocialLinks(socialRes.data);
      if (newsletterRes.data) {
        setNewsletterSettings({
          is_enabled: newsletterRes.data.is_enabled ?? true,
          title: newsletterRes.data.title,
          subtitle: newsletterRes.data.subtitle,
          button_text: newsletterRes.data.button_text,
          placeholder_text: newsletterRes.data.placeholder_text,
          success_message: newsletterRes.data.success_message,
        });
      }
    } catch (error) {
      console.error("Error fetching footer data:", error);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSubscribing(true);
    
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: email.toLowerCase().trim(),
        source: "footer",
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter",
          });
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        setEmail("");
        toast({
          title: "Success!",
          description: newsletterSettings.success_message || "Thank you for subscribing!",
        });
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const getLinksForGroup = (groupId: string) => {
    return links.filter(l => l.group_id === groupId);
  };

  const getIconForPlatform = (platform: string) => {
    return platformIcons[platform] || Globe;
  };

  const getPaymentColor = (method: string) => {
    const colors: Record<string, string> = {
      bKash: "bg-pink-600",
      Nagad: "bg-orange-500",
      Visa: "bg-blue-600",
      Mastercard: "bg-red-500",
      COD: "bg-green-600",
    };
    return colors[method] || "bg-gray-500";
  };

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
  const logoSizeClass = logoSizes[branding.footer_logo_size] || "h-8";

  // Show mobile footer for mobile devices
  if (isMobile) {
    return <MobileAppFooter />;
  }

  return (
    <footer className="bg-charcoal border-t border-border">
      {/* Footer Banner */}
      {branding.footer_banner_url && (
        <div className="border-b border-border">
          <div className="container mx-auto px-4 lg:px-8">
            {branding.footer_banner_link ? (
              <Link to={branding.footer_banner_link}>
                <img 
                  src={branding.footer_banner_url} 
                  alt="Promotional Banner"
                  className="w-full object-cover"
                  style={{ height: `${branding.footer_banner_height}px` }}
                />
              </Link>
            ) : (
              <img 
                src={branding.footer_banner_url} 
                alt="Promotional Banner"
                className="w-full object-cover"
                style={{ height: `${branding.footer_banner_height}px` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      {newsletterSettings.is_enabled && (
        <div className="border-b border-border">
          <div className="container mx-auto px-4 lg:px-8 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-3xl md:text-4xl text-foreground mb-4"
              >
                {newsletterSettings.title || "Join Our Artistic Journey"}
              </motion.h3>
              <p className="text-muted-foreground mb-8">
                {newsletterSettings.subtitle || "Subscribe to receive updates on new collections and exclusive offers"}
              </p>
              
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-green-500"
                >
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-medium">
                    {newsletterSettings.success_message || "Thank you for subscribing!"}
                  </span>
                </motion.div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={newsletterSettings.placeholder_text || "Enter your email"}
                    className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-gold"
                    disabled={subscribing}
                    required
                  />
                  <Button variant="gold" className="px-8" disabled={subscribing}>
                    {subscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      newsletterSettings.button_text || "Subscribe"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Footer */}
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              {branding.logo_url && (
                <img 
                  src={branding.logo_url} 
                  alt="Logo" 
                  className={`${logoSizeClass} w-auto`}
                />
              )}
              {branding.show_logo_text && (
                <h2 className="font-display text-2xl">
                  <span className="text-gold">{branding.logo_text}</span>
                  <span className="text-foreground">{branding.logo_text_secondary}</span>
                </h2>
              )}
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {branding.footer_description}
            </p>
            
            {/* Dynamic Social Links */}
            <div className="flex flex-wrap gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => {
                  const IconComponent = getIconForPlatform(link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold transition-colors"
                    >
                      <IconComponent className="h-5 w-5" />
                    </a>
                  );
                })
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Dynamic Link Groups from Database */}
          {linkGroups.length > 0 ? (
            linkGroups.map((group) => {
              const groupLinks = getLinksForGroup(group.id);
              if (groupLinks.length === 0) return null;

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
            })
          ) : (
            /* Fallback to default links if database is empty */
            defaultGroups.map((group) => {
              const groupLinks = defaultLinks[group.id] || [];

              return (
                <div key={group.id}>
                  <h4 className="font-display text-lg text-foreground mb-4">
                    {group.title}
                  </h4>
                  <ul className="space-y-3">
                    {groupLinks.map((link, i) => (
                      <li key={`${group.id}-${i}`}>
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
            })
          )}
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
              {branding.payment_methods.map((method, index) => (
                <div
                  key={index}
                  className={`${getPaymentColor(method)} px-4 py-2 rounded-md text-white text-xs font-semibold tracking-wide`}
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Authorization Logos */}
      {(branding.footer_left_logo_url || branding.footer_right_logo_url) && (
        <div className="border-t border-border py-6">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between gap-8">
              {/* Left Logo */}
              <div className="flex-1 flex justify-start">
                {branding.footer_left_logo_url && (
                  branding.footer_left_logo_link ? (
                    <a href={branding.footer_left_logo_link} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={branding.footer_left_logo_url} 
                        alt="Authorization" 
                        className="h-12 md:h-16 w-auto object-contain"
                      />
                    </a>
                  ) : (
                    <img 
                      src={branding.footer_left_logo_url} 
                      alt="Authorization" 
                      className="h-12 md:h-16 w-auto object-contain"
                    />
                  )
                )}
              </div>

              {/* Right Logo */}
              <div className="flex-1 flex justify-end">
                {branding.footer_right_logo_url && (
                  branding.footer_right_logo_link ? (
                    <a href={branding.footer_right_logo_link} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={branding.footer_right_logo_url} 
                        alt="Signature" 
                        className="h-12 md:h-16 w-auto object-contain"
                      />
                    </a>
                  ) : (
                    <img 
                      src={branding.footer_right_logo_url} 
                      alt="Signature" 
                      className="h-12 md:h-16 w-auto object-contain"
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
              <span>•</span>
              <Link to="/gallery" className="hover:text-gold transition-colors">
                Gallery
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;