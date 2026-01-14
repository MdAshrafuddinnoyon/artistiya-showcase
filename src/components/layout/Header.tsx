import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, ShoppingBag, Menu, X, ChevronDown, LogOut, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/modals/CartDrawer";
import CustomOrderModal from "@/components/modals/CustomOrderModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { name: "Home", href: "/" },
  {
    name: "Shop",
    href: "/shop",
    submenu: [
      { name: "Jewelry", href: "/shop/jewelry", items: ["Necklace", "Earrings", "Rings", "Bracelets"] },
      { name: "Resin Art", href: "/shop/resin-art", items: ["Rings", "Bracelets", "Coasters", "Trays"] },
      { name: "Home Decor", href: "/shop/home-decor", items: ["Wall Hangings", "Candle Holders", "Frames"] },
      { name: "Fine Art", href: "/shop/fine-art", items: ["Paintings", "3D Art", "Canvas Coasters"] },
    ],
  },
  { name: "Collections", href: "/collections" },
  { name: "Our Story", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        {/* Announcement Bar */}
        <div className="bg-gold/10 border-b border-gold/20 py-2">
          <p className="text-center text-sm text-gold tracking-wide font-body">
            ✨ ৳৫,০০০+ অর্ডারে ফ্রি শিপিং ✨
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
                    className="flex items-center gap-1 text-sm font-body tracking-wide text-foreground/80 hover:text-gold transition-colors duration-300 py-2"
                  >
                    {item.name}
                    {item.submenu && <ChevronDown className="h-4 w-4" />}
                  </Link>

                  {/* Mega Menu */}
                  <AnimatePresence>
                    {item.submenu && activeMenu === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-[500px] bg-card border border-border rounded-lg shadow-elevated p-6"
                      >
                        <div className="grid grid-cols-2 gap-8">
                          {item.submenu.map((category) => (
                            <div key={category.name}>
                              <Link
                                to={category.href}
                                className="font-display text-lg text-gold hover:text-gold-light transition-colors"
                              >
                                {category.name}
                              </Link>
                              <ul className="mt-3 space-y-2">
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>

            {/* Right Icons */}
            <div className="flex items-center gap-2">
              {/* Custom Order Button - Desktop */}
              <Button 
                variant="gold-outline" 
                size="sm" 
                className="hidden md:flex items-center gap-2"
                onClick={() => setCustomOrderOpen(true)}
              >
                <Palette className="h-4 w-4" />
                কাস্টম ডিজাইন
              </Button>

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
                      <Link to="/orders" className="cursor-pointer">
                        আমার অর্ডার
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/custom-orders" className="cursor-pointer">
                        কাস্টম রিকোয়েস্ট
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      লগআউট
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
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-gold text-charcoal-deep text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
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
                  className="w-full mb-4 flex items-center justify-center gap-2"
                  onClick={() => {
                    setCustomOrderOpen(true);
                    setIsOpen(false);
                  }}
                >
                  <Palette className="h-4 w-4" />
                  কাস্টম ডিজাইন রিকোয়েস্ট
                </Button>

                <ul className="space-y-4">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="block text-lg font-display text-foreground hover:text-gold transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Mobile Auth */}
                <div className="mt-6 pt-6 border-t border-border">
                  {user ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        লগআউট
                      </Button>
                    </div>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="gold-outline" className="w-full">
                        লগইন / সাইন আপ
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
