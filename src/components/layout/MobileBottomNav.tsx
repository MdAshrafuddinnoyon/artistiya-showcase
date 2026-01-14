import { Home, ShoppingBag, Search, User, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onSearchClick: () => void;
  onCartClick: () => void;
}

const MobileBottomNav = ({ onSearchClick, onCartClick }: MobileNavProps) => {
  const location = useLocation();
  const { itemCount } = useCart();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", action: onSearchClick },
    { icon: ShoppingBag, label: "Cart", action: onCartClick, badge: itemCount },
    { icon: User, label: "Account", href: "/auth" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.href ? location.pathname === item.href : false;
          const Icon = item.icon;

          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-gold" : "text-muted-foreground"
                  )} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-gold text-charcoal-deep text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] mt-1 transition-colors",
                  isActive ? "text-gold" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href!}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-gold" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] mt-1 transition-colors",
                isActive ? "text-gold" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
