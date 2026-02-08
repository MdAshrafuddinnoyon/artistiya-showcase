import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  FolderTree,
  Menu,
  LogOut,
  ChevronRight,
  ChevronDown,
  Home,
  FileText,
  Mail,
  Image,
  Receipt,
  Youtube,
  Megaphone,
  Users,
  Truck,
  CreditCard,
  DollarSign,
  FolderOpen,
  Instagram,
  Gift,
  Star,
  Palette,
  Globe,
  Layers,
  ShoppingBag,
  MessageSquare,
  Sliders,
  X,
  Award,
  ImageIcon,
  BarChart3,
  Building2,
  QrCode,
  Shield,
  Palette as PaletteIcon,
  Tag,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";

// Admin Components
import AdminDashboardHome from "@/components/admin/AdminDashboardHome";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCategories from "@/components/admin/AdminCategories";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminHomepageCMS from "@/components/admin/AdminHomepageCMS";
import AdminEmailTemplates from "@/components/admin/AdminEmailTemplates";
import AdminInvoiceSettings from "@/components/admin/AdminInvoiceSettings";
import AdminBlogPosts from "@/components/admin/AdminBlogPosts";
import AdminYouTubeVideos from "@/components/admin/AdminYouTubeVideos";
import AdminMarketingSettings from "@/components/admin/AdminMarketingSettings";
import AdminLeads from "@/components/admin/AdminLeads";
import AdminDeliveryProviders from "@/components/admin/AdminDeliveryProviders";
import AdminPaymentProviders from "@/components/admin/AdminPaymentProviders";
import AdminCurrencySettings from "@/components/admin/AdminCurrencySettings";
import AdminHeroSlider from "@/components/admin/AdminHeroSlider";
import AdminCategorySettings from "@/components/admin/AdminCategorySettings";
import AdminSiteBranding from "@/components/admin/AdminSiteBranding";
import AdminMenuManager from "@/components/admin/AdminMenuManager";
import AdminCheckoutSettings from "@/components/admin/AdminCheckoutSettings";
import AdminMediaManager from "@/components/admin/AdminMediaManager";
import AdminContentPages from "@/components/admin/AdminContentPages";
import AdminInstagramPosts from "@/components/admin/AdminInstagramPosts";
import AdminUpsellOffers from "@/components/admin/AdminUpsellOffers";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminThemeSettings from "@/components/admin/AdminThemeSettings";
import AdminHomepageSections from "@/components/admin/AdminHomepageSections";
import AdminDeliveryZones from "@/components/admin/AdminDeliveryZones";
import AdminTeamMembers from "@/components/admin/AdminTeamMembers";
import AdminFAQs from "@/components/admin/AdminFAQs";
import AdminFooterLinks from "@/components/admin/AdminFooterLinks";
import AdminCustomers from "@/components/admin/AdminCustomers";
import AdminAnnouncementBar from "@/components/admin/AdminAnnouncementBar";
import AdminGoogleIntegrations from "@/components/admin/AdminGoogleIntegrations";
import AdminEmailSettings from "@/components/admin/AdminEmailSettings";
import AdminFeaturedSection from "@/components/admin/AdminFeaturedSection";
import AdminMakingSection from "@/components/admin/AdminMakingSection";
import AdminCollections from "@/components/admin/AdminCollections";
import AdminCertifications from "@/components/admin/AdminCertifications";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminCRM from "@/components/admin/AdminCRM";
import AdminDeliveryPartners from "@/components/admin/AdminDeliveryPartners";
import AdminQRSettings from "@/components/admin/AdminQRSettings";
import AdminFraudSettings from "@/components/admin/AdminFraudSettings";
import AdminProductReviews from "@/components/admin/AdminProductReviews";
import AdminShopSettings from "@/components/admin/AdminShopSettings";
import AdminBundles from "@/components/admin/AdminBundles";
import AdminAbandonedCarts from "@/components/admin/AdminAbandonedCarts";
import AdminProductVariants from "@/components/admin/AdminProductVariants";
import AdminNewsletterSubscribers from "@/components/admin/AdminNewsletterSubscribers";
import AdminFilterSettings from "@/components/admin/AdminFilterSettings";
import AdminPromoCodes from "@/components/admin/AdminPromoCodes";
import AdminNotifications from "@/components/admin/AdminNotifications";

// Menu sections for organized navigation
const menuSections = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Sales & Orders",
    items: [
      { id: "orders", name: "Orders", icon: ShoppingCart, badge: "new" },
      { id: "crm", name: "CRM Dashboard", icon: BarChart3 },
      { id: "leads", name: "Leads", icon: Users },
      { id: "customers", name: "Customers", icon: Users },
      { id: "abandoned-carts", name: "Abandoned Carts", icon: ShoppingCart },
      { id: "product-reviews", name: "Product Reviews", icon: MessageSquare },
      { id: "fraud-settings", name: "Fraud & Security", icon: Shield },
      { id: "upsells", name: "Upsell Offers", icon: Gift },
      { id: "bundles", name: "Product Bundles", icon: Package },
      { id: "delivery-partners", name: "Delivery Partners", icon: Building2 },
      { id: "promo-codes", name: "Promo Codes", icon: Tag },
      { id: "notifications", name: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Catalog",
    items: [
      { id: "products", name: "Products", icon: Package },
      { id: "product-variants", name: "Color & Size Options", icon: PaletteIcon },
      { id: "categories", name: "Categories", icon: FolderTree },
      { id: "collections", name: "Collections", icon: Layers },
    ],
  },
  {
    title: "Content",
    items: [
      { id: "blog", name: "Blog Posts", icon: FileText },
      { id: "content-pages", name: "Pages (About, Terms)", icon: Globe },
      { id: "team-members", name: "Team Members", icon: Users },
      { id: "faqs", name: "FAQs", icon: MessageSquare },
      { id: "certifications", name: "Certifications", icon: Award },
      { id: "gallery", name: "Gallery / Archive", icon: ImageIcon },
      { id: "media", name: "Media Library", icon: FolderOpen },
    ],
  },
  {
    title: "Homepage",
    items: [
      { id: "hero-slider", name: "Hero Slider", icon: Image },
      { id: "featured-section", name: "Signature Collection", icon: Package },
      { id: "making-section", name: "Behind the Craft", icon: Star },
      { id: "homepage", name: "Sections CMS", icon: Layers },
      { id: "homepage-sections", name: "Homepage Sections", icon: Package },
      { id: "category-settings", name: "Category Display", icon: FolderTree },
      { id: "instagram", name: "Instagram Feed", icon: Instagram },
      { id: "youtube", name: "YouTube Videos", icon: Youtube },
      { id: "testimonials", name: "Testimonials", icon: Star },
    ],
  },
  {
    title: "Appearance",
    items: [
      { id: "theme", name: "Theme Settings", icon: Palette },
      { id: "branding", name: "Site Branding", icon: Palette },
      { id: "announcement", name: "Announcement Bar", icon: Megaphone },
      { id: "menu-manager", name: "Mega Menu", icon: Menu },
      { id: "footer-links", name: "Footer Links", icon: Sliders },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "shop-settings", name: "Shop Page", icon: ShoppingBag },
      { id: "filter-settings", name: "Filter Management", icon: Sliders },
      { id: "checkout", name: "Checkout", icon: ShoppingBag },
      { id: "payments", name: "Payments", icon: CreditCard },
      { id: "delivery", name: "Delivery Providers", icon: Truck },
      { id: "delivery-zones", name: "Delivery Zones", icon: Truck },
      { id: "currency", name: "Currency", icon: DollarSign },
      { id: "email-settings", name: "Email Settings", icon: Mail },
      { id: "newsletter", name: "Newsletter", icon: Mail },
      { id: "email-templates", name: "Email Templates", icon: Mail },
      { id: "invoice", name: "Invoice", icon: Receipt },
      { id: "qr-settings", name: "QR Code Discount", icon: QrCode },
      { id: "integrations", name: "Integrations", icon: Globe },
      { id: "marketing", name: "Marketing", icon: Megaphone },
      { id: "settings", name: "General", icon: Settings },
    ],
  },
];

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isLoading } = useAdmin();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["Overview", "Sales & Orders"]);
  const [branding, setBranding] = useState<{
    logo_url: string | null;
    logo_text: string;
    logo_text_secondary: string;
    show_logo_text: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      const { data } = await supabase
        .from("site_branding")
        .select("logo_url, logo_text, logo_text_secondary, show_logo_text")
        .single();
      if (data) {
        setBranding({
          logo_url: data.logo_url,
          logo_text: data.logo_text || "artistiya",
          logo_text_secondary: data.logo_text_secondary || ".store",
          show_logo_text: data.show_logo_text ?? true,
        });
      }
    };
    fetchBranding();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You don't have admin access.</p>
          <Link to="/">
            <Button variant="gold">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboardHome />;
      case "orders":
        return <AdminOrders />;
      case "crm":
        return <AdminCRM />;
      case "products":
        return <AdminProducts />;
      case "categories":
        return <AdminCategories />;
      case "product-variants":
        return <AdminProductVariants />;
      case "media":
        return <AdminMediaManager />;
      case "blog":
        return <AdminBlogPosts />;
      case "youtube":
        return <AdminYouTubeVideos />;
      case "leads":
        return <AdminLeads />;
      case "customers":
        return <AdminCustomers />;
      case "abandoned-carts":
        return <AdminAbandonedCarts />;
      case "announcement":
        return <AdminAnnouncementBar />;
      case "marketing":
        return <AdminMarketingSettings />;
      case "payments":
        return <AdminPaymentProviders />;
      case "delivery":
        return <AdminDeliveryProviders />;
      case "delivery-zones":
        return <AdminDeliveryZones />;
      case "currency":
        return <AdminCurrencySettings />;
      case "hero-slider":
        return <AdminHeroSlider />;
      case "category-settings":
        return <AdminCategorySettings />;
      case "theme":
        return <AdminThemeSettings />;
      case "branding":
        return <AdminSiteBranding />;
      case "menu-manager":
        return <AdminMenuManager />;
      case "homepage":
        return <AdminHomepageCMS />;
      case "homepage-sections":
        return <AdminHomepageSections />;
      case "featured-section":
        return <AdminFeaturedSection />;
      case "making-section":
        return <AdminMakingSection />;
      case "instagram":
        return <AdminInstagramPosts />;
      case "testimonials":
        return <AdminTestimonials />;
      case "collections":
        return <AdminCollections />;
      case "content-pages":
        return <AdminContentPages />;
      case "team-members":
        return <AdminTeamMembers />;
      case "faqs":
        return <AdminFAQs />;
      case "certifications":
        return <AdminCertifications />;
      case "gallery":
        return <AdminGallery />;
      case "footer-links":
        return <AdminFooterLinks />;
      case "upsells":
        return <AdminUpsellOffers />;
      case "bundles":
        return <AdminBundles />;
      case "delivery-partners":
        return <AdminDeliveryPartners />;
      case "checkout":
        return <AdminCheckoutSettings />;
      case "email-settings":
        return <AdminEmailSettings />;
      case "email-templates":
        return <AdminEmailTemplates />;
      case "integrations":
        return <AdminGoogleIntegrations />;
      case "invoice":
        return <AdminInvoiceSettings />;
      case "qr-settings":
        return <AdminQRSettings />;
      case "fraud-settings":
        return <AdminFraudSettings />;
      case "product-reviews":
        return <AdminProductReviews />;
      case "shop-settings":
        return <AdminShopSettings />;
      case "filter-settings":
        return <AdminFilterSettings />;
      case "newsletter":
        return <AdminNewsletterSubscribers />;
      case "promo-codes":
        return <AdminPromoCodes />;
      case "notifications":
        return <AdminNotifications />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminDashboardHome />;
    }
  };

  // Find active item name
  const activeItem = menuSections
    .flatMap((s) => s.items)
    .find((item) => item.id === activeSection);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${sidebarOpen ? "w-64" : "md:w-16 w-64"}
          bg-card border-r border-border transition-all duration-300 flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {(sidebarOpen || mobileSidebarOpen) && (
            <Link to="/" className="flex items-center gap-2">
              {/* Show logo image if available and text is disabled */}
              {branding?.logo_url && !branding?.show_logo_text && (
                <img src={branding.logo_url} alt="Logo" className="h-8 w-auto" />
              )}
              {/* Show logo text if enabled (takes priority) */}
              {branding?.show_logo_text && (
                <span className="font-display text-xl">
                  <span className="text-gold">{branding?.logo_text || "artistiya"}</span>
                  <span className="text-foreground">{branding?.logo_text_secondary || ".store"}</span>
                </span>
              )}
              {/* Fallback: show default text when neither logo nor text is configured */}
              {!branding?.logo_url && !branding?.show_logo_text && (
                <span className="font-display text-xl">
                  <span className="text-gold">artistiya</span>
                  <span className="text-foreground">.store</span>
                </span>
              )}
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileSidebarOpen(false);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
          >
            <X className="h-5 w-5 md:hidden" />
            <Menu className="h-5 w-5 hidden md:block" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-2">
              {(sidebarOpen || mobileSidebarOpen) && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  {section.title}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${
                      expandedSections.includes(section.title) ? "" : "-rotate-90"
                    }`}
                  />
                </button>
              )}

              {(expandedSections.includes(section.title) || (!sidebarOpen && !mobileSidebarOpen)) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-gold/20 text-gold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      title={(!sidebarOpen && !mobileSidebarOpen) ? item.name : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {(sidebarOpen || mobileSidebarOpen) && (
                        <span className="text-sm flex-1 text-left">{item.name}</span>
                      )}
                      {(sidebarOpen || mobileSidebarOpen) && item.badge && (
                        <Badge variant="secondary" className="text-xs h-5 px-1.5">
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Home className="h-4 w-4 mr-2" />
              {(sidebarOpen || mobileSidebarOpen) && "View Store"}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {(sidebarOpen || mobileSidebarOpen) && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Admin</span>
              <ChevronRight className="h-4 w-4 hidden sm:block" />
              <span className="text-foreground font-medium">{activeItem?.name || "Dashboard"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[150px]">
              {user?.email}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">{renderContent()}</div>
      </main>
    </div>
  );
};

export default Admin;
