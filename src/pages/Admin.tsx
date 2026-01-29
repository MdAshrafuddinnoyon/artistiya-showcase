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
  AlertTriangle,
  Palette,
  Globe,
  Layers,
  ShoppingBag,
  MessageSquare,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

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
      { id: "leads", name: "Leads", icon: Users },
      { id: "upsells", name: "Upsell Offers", icon: Gift },
    ],
  },
  {
    title: "Catalog",
    items: [
      { id: "products", name: "Products", icon: Package },
      { id: "categories", name: "Categories", icon: FolderTree },
    ],
  },
  {
    title: "Content",
    items: [
      { id: "blog", name: "Blog Posts", icon: FileText },
      { id: "content-pages", name: "Pages (About, Terms)", icon: Globe },
      { id: "team-members", name: "Team Members", icon: Users },
      { id: "faqs", name: "FAQs", icon: MessageSquare },
      { id: "media", name: "Media Library", icon: FolderOpen },
    ],
  },
  {
    title: "Homepage",
    items: [
      { id: "hero-slider", name: "Hero Slider", icon: Image },
      { id: "homepage", name: "Sections CMS", icon: Layers },
      { id: "homepage-sections", name: "Product Sections", icon: Package },
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
      { id: "menu-manager", name: "Mega Menu", icon: Menu },
      { id: "footer-links", name: "Footer Links", icon: Sliders },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "checkout", name: "Checkout", icon: ShoppingBag },
      { id: "payments", name: "Payments", icon: CreditCard },
      { id: "delivery", name: "Delivery Providers", icon: Truck },
      { id: "delivery-zones", name: "Delivery Zones", icon: Truck },
      { id: "currency", name: "Currency", icon: DollarSign },
      { id: "email-templates", name: "Email Templates", icon: Mail },
      { id: "invoice", name: "Invoice", icon: Receipt },
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(["Overview", "Sales & Orders"]);

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
      case "products":
        return <AdminProducts />;
      case "categories":
        return <AdminCategories />;
      case "media":
        return <AdminMediaManager />;
      case "blog":
        return <AdminBlogPosts />;
      case "youtube":
        return <AdminYouTubeVideos />;
      case "leads":
        return <AdminLeads />;
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
      case "instagram":
        return <AdminInstagramPosts />;
      case "testimonials":
        return <AdminTestimonials />;
      case "content-pages":
        return <AdminContentPages />;
      case "team-members":
        return <AdminTeamMembers />;
      case "faqs":
        return <AdminFAQs />;
      case "footer-links":
        return <AdminFooterLinks />;
      case "upsells":
        return <AdminUpsellOffers />;
      case "checkout":
        return <AdminCheckoutSettings />;
      case "email-templates":
        return <AdminEmailTemplates />;
      case "invoice":
        return <AdminInvoiceSettings />;
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
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <Link to="/" className="font-display text-xl">
              <span className="text-gold">artistiya</span>
              <span className="text-foreground">.store</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-2">
              {sidebarOpen && (
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

              {(expandedSections.includes(section.title) || !sidebarOpen) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-gold/20 text-gold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      title={!sidebarOpen ? item.name : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="text-sm flex-1 text-left">{item.name}</span>
                      )}
                      {sidebarOpen && item.badge && (
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
              {sidebarOpen && "View Store"}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{activeItem?.name || "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  );
};

export default Admin;
