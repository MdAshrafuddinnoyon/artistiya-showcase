import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, MessageCircle, Twitter, Youtube, Linkedin, Pin, Music, Send, Camera, Mail, Phone, Globe, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface SiteBranding {
  logo_url: string | null;
  logo_text: string;
  logo_text_secondary: string;
  footer_description: string;
  footer_copyright: string;
  footer_banner_url: string | null;
  footer_banner_link: string | null;
  footer_banner_height: number;
  footer_left_logo_url: string | null;
  footer_left_logo_link: string | null;
  footer_right_logo_url: string | null;
  footer_right_logo_link: string | null;
  social_instagram: string;
  social_facebook: string;
  social_email: string;
  payment_methods: string[];
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  is_active: boolean;
}

interface FooterLinkGroup {
  id: string;
  title: string;
  display_order: number;
}

interface FooterLink {
  id: string;
  group_id: string;
  name: string;
  href: string;
}

interface NewsletterSettings {
  is_enabled: boolean;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  placeholder_text: string | null;
  success_message: string | null;
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

const MobileAppFooter = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [branding, setBranding] = useState<SiteBranding>({
    logo_url: null,
    logo_text: "artistiya",
    logo_text_secondary: ".store",
    footer_description: "Where every piece tells a story of tradition, artistry, and elegance.",
    footer_copyright: "© 2026 artistiya.store. All rights reserved.",
    footer_banner_url: null,
    footer_banner_link: null,
    footer_banner_height: 60,
    footer_left_logo_url: null,
    footer_left_logo_link: null,
    footer_right_logo_url: null,
    footer_right_logo_link: null,
    social_instagram: "",
    social_facebook: "",
    social_email: "",
    payment_methods: ["bKash", "Nagad", "Visa", "Mastercard", "COD"],
  });
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [linkGroups, setLinkGroups] = useState<FooterLinkGroup[]>([]);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [newsletterSettings, setNewsletterSettings] = useState<NewsletterSettings>({
    is_enabled: true,
    title: null,
    subtitle: null,
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
      .channel('mobile_footer_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_branding' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'footer_link_groups' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'footer_links' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_links' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_settings' }, fetchData)
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
          payment_methods: paymentMethodsArray,
        });
      }
      if (groupsRes.data) setLinkGroups(groupsRes.data);
      if (linksRes.data) setLinks(linksRes.data as FooterLink[]);
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
      console.error("Error fetching mobile footer data:", error);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: language === "bn" ? "ভুল ইমেইল" : "Invalid Email",
        description: language === "bn" ? "সঠিক ইমেইল দিন" : "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSubscribing(true);
    
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({
        email: email.toLowerCase().trim(),
        source: "mobile_footer",
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: language === "bn" ? "ইতোমধ্যে সাবস্ক্রাইব করা" : "Already Subscribed",
            description: language === "bn" ? "এই ইমেইল ইতোমধ্যে সাবস্ক্রাইব করা আছে" : "This email is already subscribed",
          });
        } else {
          throw error;
        }
      } else {
        setSubscribed(true);
        setEmail("");
        toast({
          title: language === "bn" ? "সফল!" : "Success!",
          description: newsletterSettings.success_message || "Thank you for subscribing!",
        });
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "আবার চেষ্টা করুন" : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const getLinksForGroup = (groupId: string) => {
    // Filter out placeholder "New Link" entries just like desktop
    return links.filter(l => l.group_id === groupId && l.name !== "New Link" && l.href !== "/#");
  };

  const getIconForPlatform = (platform: string) => {
    return platformIcons[platform] || Globe;
  };

  // Check if database has properly configured links (not just placeholders)
  const hasProperLinks = links.some(l => l.name !== "New Link" && l.href !== "/#");

  // Fallback links matching desktop footer
  const defaultGroups: FooterLinkGroup[] = [
    { id: "shop", title: "Shop", display_order: 0 },
    { id: "help", title: "Help", display_order: 1 },
    { id: "company", title: "Company", display_order: 2 },
  ];

  const defaultLinkData: Record<string, { name: string; href: string }[]> = {
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

  // Use database groups if they have proper links, otherwise use defaults
  const displayGroups = (linkGroups.length > 0 && hasProperLinks) ? linkGroups : defaultGroups;

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

  // Default quick links
  const defaultQuickLinks = [
    { href: "/about", label: language === "bn" ? "আমাদের সম্পর্কে" : "About Us" },
    { href: "/contact", label: language === "bn" ? "যোগাযোগ" : "Contact" },
    { href: "/faq", label: language === "bn" ? "প্রশ্নোত্তর" : "FAQs" },
    { href: "/blog", label: language === "bn" ? "ব্লগ" : "Blog" },
    { href: "/track", label: language === "bn" ? "অর্ডার ট্র্যাক" : "Track Order" },
    { href: "/gallery", label: language === "bn" ? "গ্যালারি" : "Gallery" },
    { href: "/terms", label: language === "bn" ? "শর্তাবলী" : "Terms" },
    { href: "/privacy", label: language === "bn" ? "গোপনীয়তা" : "Privacy" },
    { href: "/collections", label: language === "bn" ? "কালেকশন" : "Collections" },
  ];

  return (
    <footer className="md:hidden bg-charcoal border-t border-border pb-20">
      {/* Footer Banner */}
      {branding.footer_banner_url && (
        <div className="border-b border-border">
          {branding.footer_banner_link ? (
            <Link to={branding.footer_banner_link}>
              <img 
                src={branding.footer_banner_url} 
                alt="Banner"
                className="w-full object-cover"
                style={{ height: `${branding.footer_banner_height || 60}px` }}
              />
            </Link>
          ) : (
            <img 
              src={branding.footer_banner_url} 
              alt="Banner"
              className="w-full object-cover"
              style={{ height: `${branding.footer_banner_height || 60}px` }}
            />
          )}
        </div>
      )}

      {/* Newsletter Section */}
      {newsletterSettings.is_enabled && (
        <div className="px-4 py-6 border-b border-border">
          <div className="text-center">
            <h3 className="font-display text-lg text-foreground mb-2">
              {newsletterSettings.title || (language === "bn" ? "আমাদের সাথে যুক্ত হন" : "Join Our Journey")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {newsletterSettings.subtitle || (language === "bn" ? "নতুন কালেকশন ও অফার সম্পর্কে জানুন" : "Get updates on new collections & offers")}
            </p>
            
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">
                  {newsletterSettings.success_message || (language === "bn" ? "ধন্যবাদ!" : "Thank you!")}
                </span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={newsletterSettings.placeholder_text || (language === "bn" ? "ইমেইল দিন" : "Enter email")}
                  className="flex-1 h-10 text-sm bg-muted border-border"
                  disabled={subscribing}
                  required
                />
                <Button variant="gold" size="sm" className="h-10 px-4" disabled={subscribing}>
                  {subscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    newsletterSettings.button_text || (language === "bn" ? "সাবস্ক্রাইব" : "Subscribe")
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Link Groups - with fallback like desktop */}
      <div className="px-4 py-4 border-b border-border">
        <div className="grid grid-cols-2 gap-4">
          {displayGroups.slice(0, 4).map((group) => {
            // Get links from database or use defaults
            const groupLinks = (linkGroups.length > 0 && hasProperLinks) 
              ? getLinksForGroup(group.id) 
              : (defaultLinkData[group.id] || []).map((l, idx) => ({ 
                  ...l, 
                  id: `${group.id}-${idx}` 
                }));
            
            if (groupLinks.length === 0) return null;

            return (
              <div key={group.id}>
                <h4 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">
                  {group.title}
                </h4>
                <div className="space-y-1.5">
                  {groupLinks.slice(0, 4).map((link: any) => (
                    <Link
                      key={link.id}
                      to={link.href}
                      className="block text-xs text-muted-foreground hover:text-gold transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social & Brand */}
      <div className="px-4 py-5 text-center border-b border-border">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          {branding.logo_url && (
            <img src={branding.logo_url} alt="Logo" className="h-6 w-auto" />
          )}
          <span className="font-display text-lg">
            <span className="text-gold">{branding.logo_text}</span>
            <span className="text-foreground">{branding.logo_text_secondary}</span>
          </span>
        </Link>
        
        <p className="text-[11px] text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed">
          {branding.footer_description}
        </p>

        {/* Social Icons - Dynamic */}
        <div className="flex justify-center gap-2 flex-wrap">
          {socialLinks.length > 0 ? (
            socialLinks.map((link) => {
              const IconComponent = getIconForPlatform(link.platform);
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-muted/80 transition-colors"
                >
                  <IconComponent className="h-4 w-4" />
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
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-muted/80 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {branding.social_facebook && (
                <a
                  href={branding.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-muted/80 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {branding.social_email && (
                <a
                  href={`mailto:${branding.social_email}`}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-muted/80 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* Partner Logos */}
      {(branding.footer_left_logo_url || branding.footer_right_logo_url) && (
        <div className="px-4 py-3 border-b border-border flex justify-center items-center gap-6">
          {branding.footer_left_logo_url && (
            branding.footer_left_logo_link ? (
              <a href={branding.footer_left_logo_link} target="_blank" rel="noopener noreferrer">
                <img src={branding.footer_left_logo_url} alt="Partner" className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <img src={branding.footer_left_logo_url} alt="Partner" className="h-6 w-auto opacity-70" />
            )
          )}
          {branding.footer_right_logo_url && (
            branding.footer_right_logo_link ? (
              <a href={branding.footer_right_logo_link} target="_blank" rel="noopener noreferrer">
                <img src={branding.footer_right_logo_url} alt="Partner" className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <img src={branding.footer_right_logo_url} alt="Partner" className="h-6 w-auto opacity-70" />
            )
          )}
        </div>
      )}

      {/* Payment Methods - Dynamic */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-center text-[10px] text-muted-foreground mb-2">
          {language === "bn" ? "পেমেন্ট অপশন" : "We Accept"}
        </p>
        <div className="flex justify-center gap-1.5 flex-wrap">
          {branding.payment_methods.map((method) => (
            <div
              key={method}
              className={`${getPaymentColor(method)} px-2.5 py-1 rounded text-white text-[9px] font-medium`}
            >
              {method}
            </div>
          ))}
        </div>
      </div>

      {/* Copyright & Bottom Links */}
      <div className="px-4 py-4 text-center space-y-3">
        {/* Quick Legal Links */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <Link to="/terms" className="hover:text-gold transition-colors">
            {language === "bn" ? "শর্তাবলী" : "Terms"}
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-gold transition-colors">
            {language === "bn" ? "গোপনীয়তা" : "Privacy"}
          </Link>
          <span>•</span>
          <Link to="/gallery" className="hover:text-gold transition-colors">
            {language === "bn" ? "গ্যালারি" : "Gallery"}
          </Link>
        </div>
        
        {/* Copyright Text */}
        <p className="text-[10px] text-muted-foreground">
          {branding.footer_copyright || `© ${new Date().getFullYear()} ${branding.logo_text}${branding.logo_text_secondary}. ${language === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}`}
        </p>
      </div>
    </footer>
  );
};

export default MobileAppFooter;
