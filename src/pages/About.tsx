import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, ExternalLink, Download } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

interface TeamMember {
  id: string;
  name: string;
  name_bn: string | null;
  role: string;
  role_bn: string | null;
  bio: string | null;
  bio_bn: string | null;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface Certification {
  id: string;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  file_url: string;
  file_type: string | null;
  display_order: number;
  is_active: boolean;
}

type ContentPageRow = {
  id: string;
  page_key: string;
  title: string;
  title_bn: string | null;
  content: string;
  content_bn: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean | null;
  updated_at: string;
};

function isProbablyHtml(input: string) {
  return /<\w+[^>]*>/.test(input);
}

const About = () => {
  const { language } = useLanguage();
  const [page, setPage] = useState<ContentPageRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch about page content
  useEffect(() => {
    let mounted = true;

    const fetchPage = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("content_pages")
        .select("*")
        .eq("page_key", "about")
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Failed to load about page:", error);
        setPage(null);
        setLoading(false);
        return;
      }

      setPage(data as ContentPageRow | null);
      setLoading(false);
    };

    fetchPage();
    return () => { mounted = false; };
  }, []);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  // Fetch certifications
  const { data: certifications = [] } = useQuery({
    queryKey: ["certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as Certification[];
    },
  });

  const title = useMemo(() => {
    if (!page) return language === "bn" ? "আমাদের সম্পর্কে" : "About Us";
    if (language === "bn" && page.title_bn) return page.title_bn;
    return page.title || "About Us";
  }, [language, page]);

  const content = useMemo(() => {
    const raw = language === "bn" && page?.content_bn ? page.content_bn : page?.content;
    return (raw ?? "").trim();
  }, [language, page?.content, page?.content_bn]);

  useDocumentMeta({
    title: page?.meta_title || title,
    description: page?.meta_description || (language === "bn" ? "আমাদের গল্প, মূল্যবোধ এবং কারুশিল্প সম্পর্কে জানুন।" : "Learn about our story, values, and craftsmanship."),
    canonicalUrl: window.location.href,
  });

  const isPdf = (url: string) => {
    return url?.toLowerCase().endsWith('.pdf');
  };

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
              {language === "bn" ? "আমাদের গল্প" : "Our Story"}
            </span>
            <h1 className={`font-display text-4xl md:text-5xl text-foreground mt-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {title}
            </h1>
            {page?.updated_at && (
              <p className="text-muted-foreground mt-4">
                {language === "bn" ? "সর্বশেষ আপডেট" : "Last updated"}: {new Date(page.updated_at).toLocaleDateString()}
              </p>
            )}
          </motion.div>

          {/* Content Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto mb-16"
          >
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ) : content ? (
                isProbablyHtml(content) ? (
                  <div
                    className={`prose prose-invert max-w-none ${language === "bn" ? "font-bengali" : ""}`}
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <div className={`whitespace-pre-wrap text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                    {content}
                  </div>
                )
              ) : (
                <p className={`text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn"
                    ? "এই পেজের কন্টেন্ট এখনো যোগ করা হয়নি।"
                    : "Content for this page hasn't been added yet."}
                </p>
              )}
            </div>
          </motion.div>

          {/* Certifications Section */}
          {certifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="max-w-4xl mx-auto mb-16"
            >
              <div className="text-center mb-10">
                <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
                  {language === "bn" ? "অনুমোদন ও সার্টিফিকেট" : "Certifications & Authorizations"}
                </span>
                <h2 className={`font-display text-3xl text-foreground mt-2 ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn" ? "আমাদের স্বীকৃতি" : "Our Credentials"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {certifications.map((cert, index) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-gold/50 hover:shadow-lg transition-all group"
                  >
                    {/* Certificate Image/PDF Preview */}
                    <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
                      {isPdf(cert.file_url) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-600/20 to-red-800/20">
                          <FileText className="h-16 w-16 text-red-500 mb-2" />
                          <span className="text-sm text-muted-foreground">PDF Document</span>
                        </div>
                      ) : (
                        <img
                          src={cert.file_url}
                          alt={language === "bn" && cert.title_bn ? cert.title_bn : cert.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      
                      {/* View/Download Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <a
                          href={cert.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center text-gold hover:bg-gold/30 transition-colors"
                          title={language === "bn" ? "দেখুন" : "View"}
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                        <a
                          href={cert.file_url}
                          download
                          className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center text-gold hover:bg-gold/30 transition-colors"
                          title={language === "bn" ? "ডাউনলোড" : "Download"}
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                    
                    {/* Certificate Info */}
                    <div className="p-4">
                      <h3 className={`font-display text-lg text-foreground group-hover:text-gold transition-colors ${language === "bn" ? "font-bengali" : ""}`}>
                        {language === "bn" && cert.title_bn ? cert.title_bn : cert.title}
                      </h3>
                      {(language === "bn" ? cert.description_bn : cert.description) && (
                        <p className={`text-muted-foreground text-sm mt-2 line-clamp-2 ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" && cert.description_bn ? cert.description_bn : cert.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Team Members Section */}
          {teamMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-10">
                <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
                  {language === "bn" ? "আমাদের দল" : "Our Team"}
                </span>
                <h2 className={`font-display text-3xl text-foreground mt-2 ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn" ? "টিম মেম্বার" : "Meet the Team"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member, index) => (
                  <Link to={`/team/${member.id}`} key={member.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-card border border-border rounded-xl p-6 text-center hover:border-gold/50 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={language === "bn" && member.name_bn ? member.name_bn : member.name}
                          className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-gold/30 group-hover:border-gold transition-colors"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 border-2 border-gold/30 group-hover:border-gold transition-colors">
                          <span className="text-2xl font-display text-gold">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h3 className={`font-display text-lg text-foreground group-hover:text-gold transition-colors ${language === "bn" ? "font-bengali" : ""}`}>
                        {language === "bn" && member.name_bn ? member.name_bn : member.name}
                      </h3>
                      <p className={`text-gold text-sm mt-1 ${language === "bn" ? "font-bengali" : ""}`}>
                        {language === "bn" && member.role_bn ? member.role_bn : member.role}
                      </p>
                      {(language === "bn" ? member.bio_bn : member.bio) && (
                        <p className={`text-muted-foreground text-sm mt-3 line-clamp-2 ${language === "bn" ? "font-bengali" : ""}`}>
                          {language === "bn" && member.bio_bn ? member.bio_bn : member.bio}
                        </p>
                      )}
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
