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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const menuItems = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "orders", name: "Orders", icon: ShoppingCart },
  { id: "products", name: "Products", icon: Package },
  { id: "categories", name: "Categories", icon: FolderTree },
  { id: "blog", name: "Blog Posts", icon: FileText },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "leads", name: "Leads", icon: Users },
  { id: "marketing", name: "Marketing", icon: Megaphone },
  { id: "payments", name: "Payments", icon: CreditCard },
  { id: "delivery", name: "Delivery", icon: Truck },
  { id: "currency", name: "Currency", icon: DollarSign },
  { id: "hero-slider", name: "Hero Slider", icon: Image },
  { id: "category-settings", name: "Category Display", icon: FolderTree },
  { id: "branding", name: "Site Branding", icon: Home },
  { id: "menu-manager", name: "Menu Manager", icon: Menu },
  { id: "homepage", name: "Homepage CMS", icon: Image },
  { id: "checkout", name: "Checkout Settings", icon: ShoppingCart },
  { id: "email-templates", name: "Email Templates", icon: Mail },
  { id: "invoice", name: "Invoice Settings", icon: Receipt },
  { id: "settings", name: "Settings", icon: Settings },
];

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isLoading } = useAdmin();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      case "currency":
        return <AdminCurrencySettings />;
      case "hero-slider":
        return <AdminHeroSlider />;
      case "category-settings":
        return <AdminCategorySettings />;
      case "branding":
        return <AdminSiteBranding />;
      case "menu-manager":
        return <AdminMenuManager />;
      case "homepage":
        return <AdminHomepageCMS />;
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeSection === item.id
                  ? "bg-gold/20 text-gold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
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
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground capitalize">{activeSection.replace("-", " ")}</span>
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
