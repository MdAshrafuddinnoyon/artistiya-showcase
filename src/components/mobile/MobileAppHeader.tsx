import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InlineSearch from "@/components/search/InlineSearch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  title: string;
  title_bn: string | null;
  message: string;
  message_bn: string | null;
  type: string;
  is_read: boolean;
  link_url: string | null;
  created_at: string;
}

interface MobileAppHeaderProps {
  onSearchClick: () => void;
  onCartClick: () => void;
  onMenuClick: () => void;
  branding: {
    logo_url: string | null;
    logo_text: string;
    logo_text_secondary: string;
  };
  showBack?: boolean;
  title?: string;
}

const MobileAppHeader = ({}: MobileAppHeaderProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`is_global.eq.true${user ? `,user_id.eq.${user.id}` : ""}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500/20 text-green-500";
      case "warning": return "bg-yellow-500/20 text-yellow-500";
      case "error": return "bg-red-500/20 text-red-500";
      case "promo": return "bg-gold/20 text-gold";
      case "order": return "bg-blue-500/20 text-blue-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return language === "bn" ? "এইমাত্র" : "Just now";
    if (minutes < 60) return `${minutes} ${language === "bn" ? "মিনিট আগে" : "min ago"}`;
    if (hours < 24) return `${hours} ${language === "bn" ? "ঘণ্টা আগে" : "hr ago"}`;
    return `${days} ${language === "bn" ? "দিন আগে" : "days ago"}`;
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-top">
        <div className="flex items-center gap-3 h-14 px-4">
          {/* Inline Ajax Search */}
          <InlineSearch 
            placeholder="Search products..." 
            className="flex-1"
          />

          {/* Notification Bell */}
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-muted flex-shrink-0"
          >
            <Bell className="h-5 w-5 text-foreground/80" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-gold text-xs font-bold text-background rounded-full px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] md:hidden"
              onClick={() => setShowNotifications(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background border-l border-border z-[61] md:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border safe-area-top">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gold" />
                  <h2 className="font-display text-lg">
                    {language === "bn" ? "নোটিফিকেশন" : "Notifications"}
                  </h2>
                  {unreadCount > 0 && (
                    <Badge className="bg-gold text-background">{unreadCount}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      {language === "bn" ? "সব পড়া হয়েছে" : "Mark all read"}
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="flex-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center">
                      {language === "bn" ? "কোনো নোটিফিকেশন নেই" : "No notifications yet"}
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          markAsRead(notification.id);
                          if (notification.link_url) {
                            setShowNotifications(false);
                            window.location.href = notification.link_url;
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                          notification.is_read 
                            ? "bg-muted/30" 
                            : "bg-gold/5 border border-gold/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground truncate">
                                {language === "bn" && notification.title_bn 
                                  ? notification.title_bn 
                                  : notification.title}
                              </span>
                              <Badge className={`text-[10px] ${getTypeColor(notification.type)}`}>
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {language === "bn" && notification.message_bn 
                                ? notification.message_bn 
                                : notification.message}
                            </p>
                            <span className="text-[10px] text-muted-foreground mt-1 block">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileAppHeader;
