import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Bell, ShoppingBag, Menu, ChevronLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";

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

const MobileAppHeader = ({
  onSearchClick,
  onCartClick,
  onMenuClick,
  branding,
  showBack = false,
  title,
}: MobileAppHeaderProps) => {
  const location = useLocation();
  const { itemCount } = useCart();
  const isHome = location.pathname === "/";

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Side */}
        <div className="flex items-center gap-2">
          {showBack && !isHome ? (
            <button
              onClick={() => window.history.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/80 text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/80 text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Center - Logo or Title */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          {title ? (
            <h1 className="font-display text-lg text-foreground">{title}</h1>
          ) : branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt="Logo"
              className="h-7 w-auto"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-xl"
            >
              <span className="text-gold">{branding.logo_text}</span>
              <span className="text-foreground">{branding.logo_text_secondary}</span>
            </motion.div>
          )}
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-1">
          <button
            onClick={onSearchClick}
            className="w-9 h-9 flex items-center justify-center rounded-full text-foreground/80 hover:text-gold transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={onCartClick}
            className="w-9 h-9 flex items-center justify-center rounded-full text-foreground/80 hover:text-gold transition-colors relative"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-gold text-background text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Quick Access Bar - Only on home */}
      {isHome && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-none"
        >
          <CategoryPill href="/shop" active>
            All
          </CategoryPill>
          <CategoryPill href="/shop/jewelry">Jewelry</CategoryPill>
          <CategoryPill href="/shop/bags">Bags</CategoryPill>
          <CategoryPill href="/shop/woven">Woven</CategoryPill>
          <CategoryPill href="/shop/art">Art</CategoryPill>
          <CategoryPill href="/collections/new-arrivals">New</CategoryPill>
        </motion.div>
      )}
    </header>
  );
};

interface CategoryPillProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

const CategoryPill = ({ href, children, active }: CategoryPillProps) => (
  <Link
    to={href}
    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
      active
        ? "bg-gold text-background"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    }`}
  >
    {children}
  </Link>
);

export default MobileAppHeader;
