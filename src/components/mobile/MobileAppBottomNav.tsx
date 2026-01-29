import { Home, ShoppingBag, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface MobileAppBottomNavProps {
  onSearchClick: () => void;
  onCartClick: () => void;
}

const MobileAppBottomNav = ({ onCartClick }: MobileAppBottomNavProps) => {
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = item.href ? location.pathname === item.href : false;
          const Icon = item.icon;

          const content = (
            <div 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                isActive && "bg-gold/20"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-gold" : "text-muted-foreground"
                  )}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 bg-gold text-background text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              {isActive && (
                <span className="text-sm font-medium text-gold">
                  {item.label}
                </span>
              )}
            </div>
          );

          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="relative flex items-center justify-center"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href!}
              className="relative flex items-center justify-center"
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
