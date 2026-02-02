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
        const paymentMethodsArray = Array.isArray(brandingRes.data.payment_methods) 
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

      {/* Dynamic Link Groups */}
      {linkGroups.length > 0 && (
        <div className="px-4 py-4 border-b border-border">
          <div className="grid grid-cols-2 gap-4">
            {linkGroups.slice(0, 4).map((group) => (
              <div key={group.id}>
                <h4 className="text-xs font-semibold text-gold uppercase tracking-wider mb-2">
                  {group.title}
                </h4>
                <div className="space-y-1.5">
                  {getLinksForGroup(group.id).slice(0, 4).map((link) => (
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
            ))}
          </div>
        </div>
      )}

      {/* Quick Links (Fallback if no dynamic groups) */}
      {linkGroups.length === 0 && (
        <div className="px-4 py-4 border-b border-border">
          <div className="grid grid-cols-3 gap-3 text-center">
            {defaultQuickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-xs text-muted-foreground hover:text-gold transition-colors py-1.5"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

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

      {/* Copyright */}
      <div className="text-center py-3">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} {branding.logo_text}{branding.logo_text_secondary}. {language === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
        </p>
      </div>
    </footer>
  );
};

export default MobileAppFooter;
