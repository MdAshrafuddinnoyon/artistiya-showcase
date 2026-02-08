import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, ShoppingBag, Menu, ChevronDown, LogOut, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import CartDrawer from "@/components/modals/CartDrawer";
import CustomOrderModal from "@/components/modals/CustomOrderModal";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileAppBottomNav from "@/components/mobile/MobileAppBottomNav";
import MobileDrawer from "@/components/mobile/MobileDrawer";
import LanguageToggle from "@/components/common/LanguageToggle";
import InlineSearch from "@/components/search/InlineSearch";
import AnnouncementBar from "./AnnouncementBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import category images as fallbacks
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryWoven from "@/assets/category-woven.jpg";
import categoryArt from "@/assets/category-art.jpg";

interface SiteBranding {
  logo_url: string | null;
  logo_text: string;
  logo_text_secondary: string;
  show_logo_text: boolean;
  header_announcement_text: string;
  header_announcement_active: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  href: string;
  is_mega_menu: boolean;
  banner_title: string | null;
  banner_subtitle: string | null;
  banner_link: string | null;
  banner_image_url: string | null;
  is_active: boolean;
}

interface MenuSubItem {
  id: string;
  menu_item_id: string;
  name: string;
  href: string;
  image_url: string | null;
  items: string[] | null;
  is_active: boolean;
}

const defaultImages = [categoryJewelry, categoryBags, categoryWoven, categoryArt];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  const [headerButtonEnabled, setHeaderButtonEnabled] = useState(true);
  
  const [branding, setBranding] = useState<SiteBranding>({
    logo_url: null,
    logo_text: "artistiya",
    logo_text_secondary: ".store",
    show_logo_text: true,
    header_announcement_text: "✨ Free shipping on orders over ৳5,000 ✨",
    header_announcement_active: true,
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [subItems, setSubItems] = useState<MenuSubItem[]>([]);
  
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchCustomizationSettings();
  }, []);

  const fetchCustomizationSettings = async () => {
    try {
      const { data } = await supabase
        .from("customization_settings")
        .select("header_button_enabled")
        .single();
      
      if (data) {
        setHeaderButtonEnabled(data.header_button_enabled ?? true);
      }
    } catch (error) {
      console.error("Error fetching customization settings:", error);
    }
  };

  const fetchData = async () => {
    try {
      const [brandingRes, menuRes, subRes] = await Promise.all([
        supabase.from("site_branding").select("*").single(),
        supabase.from("menu_items").select("*").eq("menu_type", "header").eq("is_active", true).order("display_order"),
        supabase.from("menu_sub_items").select("*").eq("is_active", true).order("display_order"),
      ]);

      if (brandingRes.data) setBranding(brandingRes.data);
      if (menuRes.data) setMenuItems(menuRes.data);
      if (subRes.data) setSubItems(subRes.data);
    } catch (error) {
      console.error("Error fetching header data:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Fallback menu items if database is empty
  const displayMenuItems = menuItems.length > 0 ? menuItems : [
    { id: "1", name: "Home", href: "/", is_mega_menu: false, is_active: true, banner_title: null, banner_subtitle: null, banner_link: null, banner_image_url: null },
    { id: "2", name: "Shop", href: "/shop", is_mega_menu: true, is_active: true, banner_title: "New Collection", banner_subtitle: "Up to 30% Off", banner_link: "/collections/new-arrivals", banner_image_url: null },
    { id: "3", name: "Collections", href: "/collections", is_mega_menu: false, is_active: true, banner_title: null, banner_subtitle: null, banner_link: null, banner_image_url: null },
    { id: "4", name: "Our Story", href: "/about", is_mega_menu: false, is_active: true, banner_title: null, banner_subtitle: null, banner_link: null, banner_image_url: null },
    { id: "5", name: "Contact", href: "/contact", is_mega_menu: false, is_active: true, banner_title: null, banner_subtitle: null, banner_link: null, banner_image_url: null },
  ];

  const getSubItemsForMenu = (menuId: string) => {
    return subItems.filter(s => s.menu_item_id === menuId);
  };

  return (
    <>
      {/* Dynamic Announcement Bar - Desktop & Mobile */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50" style={{ top: 'var(--announcement-height, 0px)' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              {branding.logo_url && (
                <img 
                  src={branding.logo_url} 
                  alt="Logo" 
                  className="h-8 md:h-10 w-auto"
                />
              )}
              {/* Only show text if show_logo_text is true AND either no logo or explicitly enabled */}
              {branding.show_logo_text && !branding.logo_url && (
                <motion.h1 
                  className="font-display text-2xl md:text-3xl tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-gold">{branding.logo_text}</span>
                  <span className="text-foreground">{branding.logo_text_secondary}</span>
                </motion.h1>
              )}
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center gap-8">
              {displayMenuItems.map((item) => (
                <li
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setActiveMenu(item.id)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <Link
                    to={item.href}
                    className="flex items-center gap-1 text-sm font-body tracking-wide text-foreground/80 hover:text-gold transition-colors duration-300 py-2"
                  >
                    {item.name}
                    {item.is_mega_menu && <ChevronDown className="h-4 w-4" />}
                  </Link>

                  {/* Enhanced Mega Menu */}
                  <AnimatePresence>
                    {item.is_mega_menu && activeMenu === item.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[700px] bg-card border border-border rounded-lg shadow-elevated p-6"
                      >
                        <div className="grid grid-cols-3 gap-6">
                          {/* Categories */}
                          <div className="col-span-2 grid grid-cols-2 gap-6">
                            {getSubItemsForMenu(item.id).map((category, idx) => (
                              <div key={category.id} className="group/cat">
                                <Link
                                  to={category.href}
                                  className="flex items-center gap-3 mb-3"
                                >
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                    <img 
                                      src={category.image_url || defaultImages[idx % defaultImages.length]} 
                                      alt={category.name}
                                      className="w-full h-full object-cover group-hover/cat:scale-110 transition-transform duration-300"
                                    />
                                  </div>
                                  <span className="font-display text-lg text-gold hover:text-gold-light transition-colors">
                                    {category.name}
                                  </span>
                                </Link>
                                {category.items && category.items.length > 0 && (
                                  <ul className="space-y-1.5 pl-15">
                                    {category.items.map((subItem) => (
                                      <li key={subItem}>
                                        <Link
                                          to={`${category.href}/${subItem.toLowerCase().replace(/\s+/g, '-')}`}
                                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                          {subItem}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Banner Section */}
                          {item.banner_title && (
                            <div className="col-span-1">
                              <Link 
                                to={item.banner_link || "/"}
                                className="block relative h-full rounded-lg overflow-hidden group/banner"
                              >
                                <img 
                                  src={item.banner_image_url || categoryArt}
                                  alt={item.banner_title}
                                  className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/50 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4 text-center">
                                  <p className="text-gold text-xs uppercase tracking-wider mb-1">
                                    {item.banner_subtitle}
                                  </p>
                                  <p className="font-display text-lg text-foreground">
                                    {item.banner_title}
                                  </p>
                                </div>
                              </Link>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>

            {/* Right Icons */}
            <div className="flex items-center gap-1">
              {/* Custom Order Button - Desktop (conditionally shown) */}
              {headerButtonEnabled && (
                <Button 
                  variant="gold-outline" 
                  size="sm" 
                  className="hidden md:flex items-center gap-2"
                  onClick={() => setCustomOrderOpen(true)}
                >
                  <Palette className="h-4 w-4" />
                  Custom Design
                </Button>
              )}

              {/* Inline Search - Desktop */}
              <div className="hidden lg:block w-64">
                <InlineSearch placeholder="Search..." />
              </div>

              {/* Language Toggle */}
              <LanguageToggle />
              
              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-gold hover:bg-transparent">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/custom-orders" className="cursor-pointer">
                        Custom Requests
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-gold hover:bg-transparent">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              {/* Cart Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-foreground/80 hover:text-gold hover:bg-transparent"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-gold text-background text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile App Header - Shows on mobile only */}
      <MobileAppHeader
        onSearchClick={() => {}}
        onCartClick={() => setCartOpen(true)}
        onMenuClick={() => setIsOpen(true)}
        branding={branding}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCustomOrderClick={() => setCustomOrderOpen(true)}
        branding={branding}
      />

      {/* Modals */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <CustomOrderModal open={customOrderOpen} onOpenChange={setCustomOrderOpen} />
      
      {/* Mobile Bottom Navigation - App style */}
      <MobileAppBottomNav 
        onSearchClick={() => {}} 
        onCartClick={() => setCartOpen(true)} 
      />
    </>
  );
};

export default Header;
