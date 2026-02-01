import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { Calendar, Image, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryAlbum {
  id: string;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  cover_image_url: string | null;
  published_at: string;
  is_active: boolean;
}

interface GalleryItem {
  id: string;
  album_id: string | null;
  title: string | null;
  title_bn: string | null;
  media_url: string;
  is_active: boolean;
}

const Gallery = () => {
  const { language } = useLanguage();
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useDocumentMeta({
    title: language === "bn" ? "গ্যালারি | হাতে তৈরি কাজ" : "Gallery | Handmade Works",
    description: language === "bn" 
      ? "আমাদের হাতে তৈরি কাজের সংগ্রহ দেখুন" 
      : "Browse our collection of handmade works",
    canonicalUrl: window.location.href,
  });

  const { data: albums = [] } = useQuery({
    queryKey: ["gallery-albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_albums")
        .select("*")
        .eq("is_active", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as GalleryAlbum[];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["gallery-items", selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return [];
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("album_id", selectedAlbum.id)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as GalleryItem[];
    },
    enabled: !!selectedAlbum,
  });

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
              {language === "bn" ? "আর্কাইভ" : "Archive"}
            </span>
            <h1 className={`font-display text-4xl md:text-5xl text-foreground mt-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" ? "গ্যালারি" : "Gallery"}
            </h1>
            <p className={`text-muted-foreground mt-4 ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" 
                ? "আমাদের হাতে তৈরি কাজের সংগ্রহ দেখুন" 
                : "Browse our collection of handmade works"}
            </p>
          </motion.div>

          {selectedAlbum ? (
            /* Album View */
            <div>
              <button
                onClick={() => setSelectedAlbum(null)}
                className="flex items-center gap-2 text-gold hover:text-gold-light mb-6 transition-colors"
              >
                ← {language === "bn" ? "সব অ্যালবাম" : "All Albums"}
              </button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8"
              >
                <h2 className={`font-display text-2xl md:text-3xl text-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                  {language === "bn" && selectedAlbum.title_bn ? selectedAlbum.title_bn : selectedAlbum.title}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedAlbum.published_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    {items.length} {language === "bn" ? "টি আইটেম" : "items"}
                  </span>
                </div>
                {(language === "bn" ? selectedAlbum.description_bn : selectedAlbum.description) && (
                  <p className={`text-muted-foreground mt-4 max-w-2xl ${language === "bn" ? "font-bengali" : ""}`}>
                    {language === "bn" && selectedAlbum.description_bn ? selectedAlbum.description_bn : selectedAlbum.description}
                  </p>
                )}
              </motion.div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => setLightboxImage(item.media_url)}
                  >
                    <img
                      src={item.media_url}
                      alt={item.title || "Gallery item"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* Albums Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedAlbum(album)}
                >
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-4">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className={`font-display text-lg text-foreground group-hover:text-gold transition-colors ${language === "bn" ? "font-bengali" : ""}`}>
                    {language === "bn" && album.title_bn ? album.title_bn : album.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(album.published_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {albums.length === 0 && (
            <div className="text-center py-16">
              <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className={`text-muted-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                {language === "bn" ? "এখনো কোন অ্যালবাম যুক্ত করা হয়নি" : "No albums added yet"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Gallery image"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Gallery;
