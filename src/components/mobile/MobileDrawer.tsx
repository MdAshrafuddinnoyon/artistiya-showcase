import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, Palette, LogOut, User, ShoppingBag, Heart, Settings, Home, HelpCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomOrderClick: () => void;
  onAuthClick: () => void;
  branding: {
    logo_text: string;
    logo_text_secondary: string;
  };
}

const MobileDrawer = ({ isOpen, onClose, onCustomOrderClick, onAuthClick, branding }: MobileDrawerProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: ShoppingBag, label: "Shop All", href: "/shop" },
    { icon: Package, label: "Collections", href: "/collections" },
    { icon: Heart, label: "Wishlist", href: "/dashboard" },
    { icon: HelpCircle, label: "FAQ", href: "/faq" },
  ];

  const categories = [
    { label: "Jewelry", href: "/shop/jewelry" },
    { label: "Hand-painted Bags", href: "/shop/bags" },
    { label: "Woven Tales", href: "/shop/woven" },
    { label: "Fine Art", href: "/shop/art" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[85%] max-w-sm bg-card border-r border-border overflow-y-auto md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="font-display text-xl">
                <span className="text-gold">{branding.logo_text}</span>
                <span className="text-foreground">{branding.logo_text_secondary}</span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            {user ? (
              <div className="p-4 border-b border-border bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.email}
                    </p>
                    <Link
                      to="/dashboard"
                      onClick={onClose}
                      className="text-xs text-gold"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-border">
                <Button variant="gold" className="w-full" onClick={() => { onAuthClick(); onClose(); }}>
                  Login / Sign Up
                </Button>
              </div>
            )}

            {/* Custom Order Button */}
            <div className="p-4">
              <Button
                variant="gold-outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  onCustomOrderClick();
                  onClose();
                }}
              >
                <Palette className="h-4 w-4" />
                Custom Design Request
              </Button>
            </div>

            {/* Navigation */}
            <div className="px-4 pb-4">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Categories */}
            <div className="px-4 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Categories
              </p>
              <nav className="space-y-1">
                {categories.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className="block px-3 py-2 rounded-lg text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Admin Link */}
            {isAdmin && (
              <div className="px-4 pb-4">
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gold/10 text-gold"
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Admin Dashboard</span>
                </Link>
              </div>
            )}

            {/* Logout */}
            {user && (
              <div className="px-4 pb-8 mt-auto">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 w-full transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
