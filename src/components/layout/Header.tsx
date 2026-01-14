import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, ShoppingBag, Menu, X, ChevronDown, LogOut, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
import CartDrawer from "@/components/modals/CartDrawer";
import CustomOrderModal from "@/components/modals/CustomOrderModal";
import LanguageToggle from "@/components/common/LanguageToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import category images
import categoryJewelry from "@/assets/category-jewelry.jpg";
import categoryBags from "@/assets/category-bags.jpg";
import categoryWoven from "@/assets/category-woven.jpg";
import categoryArt from "@/assets/category-art.jpg";

const menuItems = [
  { name: "Home", nameBn: "হোম", href: "/" },
  {
    name: "Shop",
    nameBn: "শপ",
    href: "/shop",
    submenu: [
      { name: "Jewelry", nameBn: "জুয়েলারি", href: "/shop/jewelry", items: ["Necklace", "Earrings", "Rings", "Bracelets"], image: categoryJewelry },
      { name: "Resin Art", nameBn: "রেজিন আর্ট", href: "/shop/resin-art", items: ["Rings", "Bracelets", "Coasters", "Trays"], image: categoryBags },
      { name: "Home Decor", nameBn: "হোম ডেকর", href: "/shop/home-decor", items: ["Wall Hangings", "Candle Holders", "Frames"], image: categoryWoven },
      { name: "Fine Art", nameBn: "ফাইন আর্ট", href: "/shop/fine-art", items: ["Paintings", "3D Art", "Canvas Coasters"], image: categoryArt },
    ],
    banner: {
      title: "New Collection",
      titleBn: "নতুন কালেকশন",
      subtitle: "Up to 30% Off",
      subtitleBn: "৩০% পর্যন্ত ছাড়",
      link: "/collections/new-arrivals",
      image: categoryArt,
    }
  },
  { name: "Collections", nameBn: "কালেকশন", href: "/collections" },
  { name: "Our Story", nameBn: "আমাদের কথা", href: "/about" },
  { name: "Contact", nameBn: "যোগাযোগ", href: "/contact" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getMenuName = (item: { name: string; nameBn?: string }) => {
    return language === "bn" && item.nameBn ? item.nameBn : item.name;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        {/* Announcement Bar */}
        <div className="bg-gold/10 border-b border-gold/20 py-2">
          <p className={`text-center text-sm text-gold tracking-wide font-body ${language === "bn" ? "font-bengali" : ""}`}>
            {t("header.freeShipping")}
          </p>
        </div>

        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <motion.h1 
                className="font-display text-2xl md:text-3xl tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-gold">artistiya</span>
                <span className="text-foreground">.store</span>
              </motion.h1>
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden lg:flex items-center gap-8">
              {menuItems.map((item) => (
                <li
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => setActiveMenu(item.name)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center gap-1 text-sm font-body tracking-wide text-foreground/80 hover:text-gold transition-colors duration-300 py-2 ${language === "bn" ? "font-bengali" : ""}`}
                  >
                    {getMenuName(item)}
                    {item.submenu && <ChevronDown className="h-4 w-4" />}
                  </Link>

                  {/* Enhanced Mega Menu */}
                  <AnimatePresence>
                    {item.submenu && activeMenu === item.name && (
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
                            {item.submenu.map((category) => (
                              <div key={category.name} className="group/cat">
                                <Link
                                  to={category.href}
                                  className="flex items-center gap-3 mb-3"
                                >
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                    <img 
                                      src={category.image} 
                                      alt={category.name}
                                      className="w-full h-full object-cover group-hover/cat:scale-110 transition-transform duration-300"
                                    />
                                  </div>
                                  <span className={`font-display text-lg text-gold hover:text-gold-light transition-colors ${language === "bn" ? "font-bengali" : ""}`}>
                                    {getMenuName(category)}
                                  </span>
                                </Link>
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
                              </div>
                            ))}
                          </div>

                          {/* Banner Section */}
                          {item.banner && (
                            <div className="col-span-1">
                              <Link 
                                to={item.banner.link}
                                className="block relative h-full rounded-lg overflow-hidden group/banner"
                              >
                                <img 
                                  src={item.banner.image}
                                  alt={item.banner.title}
                                  className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-deep via-charcoal-deep/50 to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4 text-center">
                                  <p className={`text-gold text-xs uppercase tracking-wider mb-1 ${language === "bn" ? "font-bengali" : ""}`}>
                                    {language === "bn" ? item.banner.subtitleBn : item.banner.subtitle}
                                  </p>
                                  <p className={`font-display text-lg text-foreground ${language === "bn" ? "font-bengali" : ""}`}>
                                    {language === "bn" ? item.banner.titleBn : item.banner.title}
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
              {/* Custom Order Button - Desktop */}
              <Button 
                variant="gold-outline" 
                size="sm" 
                className={`hidden md:flex items-center gap-2 ${language === "bn" ? "font-bengali" : ""}`}
                onClick={() => setCustomOrderOpen(true)}
              >
                <Palette className="h-4 w-4" />
                {t("header.customDesign")}
              </Button>

              {/* Language Toggle */}
              <LanguageToggle />

              <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-gold">
                <Search className="h-5 w-5" />
              </Button>
              
              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-gold">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className={`cursor-pointer ${language === "bn" ? "font-bengali" : ""}`}>
                        {t("header.myOrders")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/custom-orders" className={`cursor-pointer ${language === "bn" ? "font-bengali" : ""}`}>
                        {t("header.customRequests")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className={`text-destructive cursor-pointer ${language === "bn" ? "font-bengali" : ""}`}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("header.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-gold">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              {/* Cart Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-foreground/80 hover:text-gold"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-gold text-charcoal-deep text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </nav>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-card border-t border-border overflow-hidden"
            >
              <div className="container mx-auto px-4 py-6">
                {/* Custom Order Button - Mobile */}
                <Button 
                  variant="gold" 
                  className={`w-full mb-4 flex items-center justify-center gap-2 ${language === "bn" ? "font-bengali" : ""}`}
                  onClick={() => {
                    setCustomOrderOpen(true);
                    setIsOpen(false);
                  }}
                >
                  <Palette className="h-4 w-4" />
                  {t("header.customDesign")}
                </Button>

                <ul className="space-y-4">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`block text-lg font-display text-foreground hover:text-gold transition-colors ${language === "bn" ? "font-bengali" : ""}`}
                        onClick={() => setIsOpen(false)}
                      >
                        {getMenuName(item)}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Mobile Auth */}
                <div className="mt-6 pt-6 border-t border-border">
                  {user ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Button variant="outline" size="sm" onClick={handleSignOut} className={`w-full ${language === "bn" ? "font-bengali" : ""}`}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {t("header.logout")}
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="gold-outline" className={`w-full ${language === "bn" ? "font-bengali" : ""}`}>
                        {t("header.loginSignup")}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Modals */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <CustomOrderModal open={customOrderOpen} onOpenChange={setCustomOrderOpen} />
    </>
  );
};

export default Header;
