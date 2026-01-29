import { Home, ShoppingBag, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface MobileAppBottomNavProps {
  onSearchClick: () => void;
  onCartClick: () => void;
}

const MobileAppBottomNav = ({ onCartClick }: MobileAppBottomNavProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { itemCount } = useCart();

  const accountHref = user ? "/dashboard" : "/auth";

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
      href: "/dashboard"
    },
    { 
      icon: User, 
      label: "Account", 
      href: accountHref 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = item.href ? location.pathname === item.href : false;
          const Icon = item.icon;

          const content = (
            <div 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                isActive && "bg-orange-50"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-orange-500" : "text-gray-400"
                )}
              />
              {isActive && (
                <span className="text-sm font-medium text-orange-500">
                  {item.label}
                </span>
              )}
              {item.badge && item.badge > 0 && !isActive && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
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
