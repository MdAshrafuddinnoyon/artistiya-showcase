import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";

interface Announcement {
  id: string;
  message: string;
  message_bn: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string;
  text_color: string;
  show_on_desktop: boolean;
  show_on_mobile: boolean;
  start_date: string | null;
  end_date: string | null;
}

const AnnouncementBar = () => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements();

    // Real-time subscription
    const channel = supabase
      .channel("announcement_bar_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcement_bar" }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcement_bar")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;

      // Filter by date and platform
      const validAnnouncements = (data || []).filter((ann) => {
        const startOk = !ann.start_date || new Date(ann.start_date) <= new Date();
        const endOk = !ann.end_date || new Date(ann.end_date) >= new Date();
        return startOk && endOk;
      });

      setAnnouncements(validAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  // Auto-rotate announcements
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  // Filter by platform
  const filteredAnnouncements = announcements.filter((ann) => {
    if (isMobile) return ann.show_on_mobile;
    return ann.show_on_desktop;
  }).filter((ann) => !dismissed.includes(ann.id));

  if (!isVisible || filteredAnnouncements.length === 0) return null;

  const currentAnn = filteredAnnouncements[currentIndex % filteredAnnouncements.length];
  if (!currentAnn) return null;

  const message = language === "bn" && currentAnn.message_bn ? currentAnn.message_bn : currentAnn.message;

  const handleDismiss = () => {
    setDismissed((prev) => [...prev, currentAnn.id]);
    if (filteredAnnouncements.length <= 1) {
      setIsVisible(false);
    } else {
      setCurrentIndex((prev) => prev % (filteredAnnouncements.length - 1));
    }
  };

  const content = (
    <div className="flex items-center justify-center gap-2 text-center">
      <span className="text-sm font-medium">{message}</span>
      {currentAnn.link_text && currentAnn.link_url && (
        <Link
          to={currentAnn.link_url}
          className="text-sm font-semibold underline hover:no-underline ml-1"
        >
          {currentAnn.link_text}
        </Link>
      )}
    </div>
  );

  return (
    <div
      className="relative py-2 px-4"
      style={{
        backgroundColor: currentAnn.background_color,
        color: currentAnn.text_color,
      }}
    >
      <div className="container mx-auto flex items-center justify-center relative">
        {/* Navigation for multiple announcements */}
        {filteredAnnouncements.length > 1 && (
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + filteredAnnouncements.length) % filteredAnnouncements.length)}
            className="absolute left-0 p-1 hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {currentAnn.link_url && !currentAnn.link_text ? (
          <Link to={currentAnn.link_url} className="hover:opacity-80 transition-opacity">
            {content}
          </Link>
        ) : (
          content
        )}

        {filteredAnnouncements.length > 1 && (
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % filteredAnnouncements.length)}
            className="absolute right-8 p-1 hover:opacity-70 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-0 p-1 hover:opacity-70 transition-opacity"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Dots indicator */}
      {filteredAnnouncements.length > 1 && (
        <div className="flex justify-center gap-1 mt-1">
          {filteredAnnouncements.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 rounded-full transition-all ${
                idx === currentIndex % filteredAnnouncements.length
                  ? "w-3 opacity-100"
                  : "w-1 opacity-50"
              }`}
              style={{ backgroundColor: currentAnn.text_color }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBar;