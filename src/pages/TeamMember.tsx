import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Facebook, Linkedin, Twitter } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
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
  email: string | null;
  phone: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  is_active: boolean;
}

const TeamMemberPage = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();

  const { data: member, isLoading, error } = useQuery({
    queryKey: ["team-member", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        facebook_url: data.facebook_url || null,
        linkedin_url: data.linkedin_url || null,
        twitter_url: data.twitter_url || null,
      } as TeamMember;
    },
    enabled: !!id,
  });

  const displayName = language === "bn" && member?.name_bn ? member.name_bn : member?.name;
  const displayRole = language === "bn" && member?.role_bn ? member.role_bn : member?.role;
  const displayBio = language === "bn" && member?.bio_bn ? member.bio_bn : member?.bio;

  useDocumentMeta({
    title: member ? `${displayName} - ${displayRole}` : "Team Member",
    description: displayBio || "Meet our team member",
    canonicalUrl: window.location.href,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 md:pt-32 pb-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 w-32 bg-muted rounded" />
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-64 h-64 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-4">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="h-6 w-32 bg-muted rounded" />
                    <div className="h-24 w-full bg-muted rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 md:pt-32 pb-24">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <h1 className="text-2xl font-display text-foreground mb-4">
              {language === "bn" ? "সদস্য পাওয়া যায়নি" : "Member Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {language === "bn" 
                ? "আপনি যে টিম মেম্বার খুঁজছেন সেটি পাওয়া যায়নি।" 
                : "The team member you're looking for couldn't be found."}
            </p>
            <Link to="/about">
              <Button variant="gold">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "bn" ? "আমাদের সম্পর্কে ফিরে যান" : "Back to About"}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasSocialLinks = member.facebook_url || member.linkedin_url || member.twitter_url;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link to="/about">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {language === "bn" ? "আমাদের সম্পর্কে ফিরে যান" : "Back to About"}
                </Button>
              </Link>
            </motion.div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Photo */}
                <div className="md:w-1/3 p-6 md:p-8 flex items-center justify-center bg-muted/30">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={displayName}
                      className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-4 border-gold/30 shadow-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gold/20 flex items-center justify-center border-4 border-gold/30">
                      <span className="text-6xl font-display text-gold">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="md:w-2/3 p-6 md:p-8">
                  <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
                    {language === "bn" ? "টিম মেম্বার" : "Team Member"}
                  </span>
                  
                  <h1 className={`font-display text-3xl md:text-4xl text-foreground mt-2 ${language === "bn" ? "font-bengali" : ""}`}>
                    {displayName}
                  </h1>
                  
                  <p className={`text-xl text-gold mt-1 ${language === "bn" ? "font-bengali" : ""}`}>
                    {displayRole}
                  </p>

                  {displayBio && (
                    <div className={`mt-6 text-muted-foreground leading-relaxed ${language === "bn" ? "font-bengali" : ""}`}>
                      {displayBio.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-3">{paragraph}</p>
                      ))}
                    </div>
                  )}

                  {/* Contact Info */}
                  {(member.email || member.phone) && (
                    <div className="mt-6 pt-6 border-t border-border space-y-3">
                      <h3 className="text-sm font-medium text-foreground">
                        {language === "bn" ? "যোগাযোগ" : "Contact"}
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">{member.email}</span>
                          </a>
                        )}
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{member.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {hasSocialLinks && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h3 className="text-sm font-medium text-foreground mb-3">
                        {language === "bn" ? "সোশ্যাল মিডিয়া" : "Social Media"}
                      </h3>
                      <div className="flex gap-3">
                        {member.facebook_url && (
                          <a
                            href={member.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-muted rounded-full hover:bg-gold/20 hover:text-gold transition-colors"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {member.linkedin_url && (
                          <a
                            href={member.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-muted rounded-full hover:bg-gold/20 hover:text-gold transition-colors"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {member.twitter_url && (
                          <a
                            href={member.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-muted rounded-full hover:bg-gold/20 hover:text-gold transition-colors"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeamMemberPage;
