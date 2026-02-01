import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

interface ContactInfo {
  social_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  contact_address_bn: string | null;
  business_hours: string | null;
  business_hours_bn: string | null;
  google_maps_embed_url: string | null;
  contact_page_title: string | null;
  contact_page_title_bn: string | null;
  contact_page_subtitle: string | null;
  contact_page_subtitle_bn: string | null;
}

const Contact = () => {
  const { language } = useLanguage();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const { data, error } = await supabase
          .from("site_branding")
          .select(`
            social_email, contact_phone, contact_address, contact_address_bn,
            business_hours, business_hours_bn, google_maps_embed_url,
            contact_page_title, contact_page_title_bn,
            contact_page_subtitle, contact_page_subtitle_bn
          `)
          .single();

        if (error) throw error;
        setContactInfo(data);
      } catch (error) {
        console.error("Error fetching contact info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error(language === "bn" ? "নাম এবং বার্তা প্রয়োজন" : "Name and message are required");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        message: formData.message,
        source: "contact_form",
      });

      if (error) throw error;

      toast.success(
        language === "bn" 
          ? "আপনার বার্তা সফলভাবে পাঠানো হয়েছে!" 
          : "Your message has been sent successfully!"
      );
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        language === "bn" 
          ? "বার্তা পাঠাতে সমস্যা হয়েছে" 
          : "Failed to send message"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const title = language === "bn" && contactInfo?.contact_page_title_bn
    ? contactInfo.contact_page_title_bn
    : contactInfo?.contact_page_title || "Contact Us";

  const subtitle = language === "bn" && contactInfo?.contact_page_subtitle_bn
    ? contactInfo.contact_page_subtitle_bn
    : contactInfo?.contact_page_subtitle || "Have questions about our products or want to discuss a custom order? We'd love to hear from you.";

  const address = language === "bn" && contactInfo?.contact_address_bn
    ? contactInfo.contact_address_bn
    : contactInfo?.contact_address || "Dhaka, Bangladesh";

  const hours = language === "bn" && contactInfo?.business_hours_bn
    ? contactInfo.business_hours_bn
    : contactInfo?.business_hours || "Sat - Thu: 10:00 AM - 8:00 PM";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
              {language === "bn" ? "যোগাযোগ" : "Get In Touch"}
            </span>
            <h1 className={`font-display text-5xl md:text-6xl text-foreground mt-4 mb-6 ${language === "bn" ? "font-bengali" : ""}`}>
              {title.includes(" ") ? (
                <>
                  {title.split(" ")[0]} <span className="text-gold">{title.split(" ").slice(1).join(" ")}</span>
                </>
              ) : (
                <span className="text-gold">{title}</span>
              )}
            </h1>
            <p className={`text-lg text-muted-foreground font-body ${language === "bn" ? "font-bengali" : ""}`}>
              {subtitle}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-body text-foreground mb-2 ${language === "bn" ? "font-bengali" : ""}`}>
                      {language === "bn" ? "নাম *" : "Name *"}
                    </label>
                    <Input
                      type="text"
                      placeholder={language === "bn" ? "আপনার নাম" : "Your name"}
                      className="bg-muted border-border focus:border-gold"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-body text-foreground mb-2 ${language === "bn" ? "font-bengali" : ""}`}>
                      {language === "bn" ? "ইমেইল" : "Email"}
                    </label>
                    <Input
                      type="email"
                      placeholder={language === "bn" ? "your@email.com" : "your@email.com"}
                      className="bg-muted border-border focus:border-gold"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-body text-foreground mb-2 ${language === "bn" ? "font-bengali" : ""}`}>
                    {language === "bn" ? "ফোন নম্বর" : "Phone"}
                  </label>
                  <Input
                    type="tel"
                    placeholder={language === "bn" ? "০১৭XX-XXXXXX" : "+880 1XXX-XXXXXX"}
                    className="bg-muted border-border focus:border-gold"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-body text-foreground mb-2 ${language === "bn" ? "font-bengali" : ""}`}>
                    {language === "bn" ? "বার্তা *" : "Message *"}
                  </label>
                  <Textarea
                    placeholder={language === "bn" ? "আপনার বার্তা লিখুন..." : "Tell us more..."}
                    rows={6}
                    className="bg-muted border-border focus:border-gold resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full sm:w-auto"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {language === "bn" ? "বার্তা পাঠান" : "Send Message"}
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="bg-card border border-border rounded-lg p-8">
                <h3 className={`font-display text-2xl text-foreground mb-6 ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn" ? "যোগাযোগের তথ্য" : "Contact Information"}
                </h3>
                
                {loading ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="font-body text-sm text-muted-foreground">
                          {language === "bn" ? "ইমেইল" : "Email"}
                        </p>
                        <a 
                          href={`mailto:${contactInfo?.social_email || "hello@artistiya.store"}`} 
                          className="text-foreground hover:text-gold transition-colors"
                        >
                          {contactInfo?.social_email || "hello@artistiya.store"}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="font-body text-sm text-muted-foreground">
                          {language === "bn" ? "ফোন" : "Phone"}
                        </p>
                        <a 
                          href={`tel:${contactInfo?.contact_phone?.replace(/\s/g, "") || "+8801700000000"}`} 
                          className="text-foreground hover:text-gold transition-colors"
                        >
                          {contactInfo?.contact_phone || "+880 1700-000-000"}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="font-body text-sm text-muted-foreground">
                          {language === "bn" ? "ঠিকানা" : "Location"}
                        </p>
                        <p className={`text-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                          {address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="font-body text-sm text-muted-foreground">
                          {language === "bn" ? "কাজের সময়" : "Business Hours"}
                        </p>
                        <p className={`text-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                          {hours}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Google Maps Embed */}
              {contactInfo?.google_maps_embed_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <iframe
                    src={contactInfo.google_maps_embed_url}
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Store Location"
                  />
                </div>
              )}

              {/* FAQ Link */}
              <div className="bg-gold/10 border border-gold/20 rounded-lg p-6 text-center">
                <p className={`text-foreground font-body mb-2 ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn" ? "দ্রুত উত্তর খুঁজছেন?" : "Looking for quick answers?"}
                </p>
                <a href="/faq" className="text-gold hover:text-gold-light transition-colors font-semibold">
                  {language === "bn" ? "আমাদের FAQ দেখুন →" : "Check our FAQs →"}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
