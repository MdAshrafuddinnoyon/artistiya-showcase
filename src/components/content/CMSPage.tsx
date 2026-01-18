import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

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

type CMSPageProps = {
  pageKey: string;
  /** Small label above title (e.g. "Legal") */
  eyebrow?: string;
  /** Fallback title when DB content is missing */
  fallbackTitle: string;
  /** Fallback description shown under the title */
  fallbackDescription?: string;
};

const CMSPage = ({
  pageKey,
  eyebrow = "",
  fallbackTitle,
  fallbackDescription,
}: CMSPageProps) => {
  const { language } = useLanguage();
  const [page, setPage] = useState<ContentPageRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPage = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("content_pages")
        .select(
          "id,page_key,title,title_bn,content,content_bn,meta_title,meta_description,is_active,updated_at"
        )
        .eq("page_key", pageKey)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("Failed to load content page:", error);
        setPage(null);
        setLoading(false);
        return;
      }

      setPage((data as unknown as ContentPageRow) || null);
      setLoading(false);
    };

    fetchPage();

    return () => {
      mounted = false;
    };
  }, [pageKey]);

  const title = useMemo(() => {
    if (!page) return fallbackTitle;
    if (language === "bn" && page.title_bn) return page.title_bn;
    return page.title || fallbackTitle;
  }, [fallbackTitle, language, page]);

  const description = useMemo(() => {
    if (page?.meta_description) return page.meta_description;
    return fallbackDescription;
  }, [fallbackDescription, page?.meta_description]);

  const canonicalUrl = useMemo(() => window.location.href, []);

  useDocumentMeta({
    title: page?.meta_title || title,
    description,
    canonicalUrl,
  });

  const content = useMemo(() => {
    const raw =
      language === "bn" && page?.content_bn ? page.content_bn : page?.content;
    return (raw ?? "").trim();
  }, [language, page?.content, page?.content_bn]);

  const showUnavailable = !loading && page && page.is_active === false;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            {eyebrow ? (
              <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">
                {eyebrow}
              </span>
            ) : null}

            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-4">
              {title}
            </h1>

            <p className="text-muted-foreground mt-4">
              {page?.updated_at
                ? `${language === "bn" ? "সর্বশেষ আপডেট" : "Last updated"}: ${new Date(
                    page.updated_at
                  ).toLocaleDateString()}`
                : null}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ) : showUnavailable ? (
                <p className="text-muted-foreground">
                  {language === "bn"
                    ? "এই পেজটি বর্তমানে উপলব্ধ নয়।"
                    : "This page is currently unavailable."}
                </p>
              ) : content ? (
                isProbablyHtml(content) ? (
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-muted-foreground">
                    {content}
                  </div>
                )
              ) : (
                <p className="text-muted-foreground">
                  {language === "bn"
                    ? "এই পেজের কন্টেন্ট এখনো যোগ করা হয়নি।"
                    : "Content for this page hasn't been added yet."}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CMSPage;
