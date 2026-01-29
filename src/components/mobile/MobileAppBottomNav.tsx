import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface MobileAppBottomNavProps {
  onSearchClick: () => void;
  onCartClick: () => void;
}

const MobileAppBottomNav = ({ onSearchClick, onCartClick }: MobileAppBottomNavProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { wishlistItems } = useWishlist();

  const accountHref = user ? "/dashboard" : "/auth";
  const wishlistCount = wishlistItems?.length || 0;

  const navItems = [
    { 
      icon: Home, 
      label: "Home", 
      href: "/" 
    },
    { 
      icon: Search, 
      label: "Search", 
      action: onSearchClick 
    },
    { 
      icon: ShoppingBag, 
      label: "Cart", 
      action: onCartClick, 
      badge: itemCount > 0 ? itemCount : undefined
    },
    { 
      icon: Heart, 
      label: "Wishlist", 
      href: "/dashboard",
      badge: wishlistCount > 0 ? wishlistCount : undefined
    },
    { 
      icon: User, 
      label: "Account", 
      href: accountHref 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.href ? location.pathname === item.href : false;
          const Icon = item.icon;

          const content = (
            <div className="flex flex-col items-center justify-center relative">
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "text-gold scale-110" : "text-muted-foreground"
                  )}
                />
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-gold text-background text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </motion.span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-colors",
                  isActive ? "text-gold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-gold"
                />
              )}
            </div>
          );

          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex-1 h-full flex items-center justify-center"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href!}
              className="flex-1 h-full flex items-center justify-center"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileAppBottomNav;
