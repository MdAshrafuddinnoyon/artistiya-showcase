import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { LanguageProvider } from "@/hooks/useLanguage";
import { WishlistProvider } from "@/hooks/useWishlist";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Shop from "./pages/Shop";
import Collections from "./pages/Collections";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import ProductDetail from "./pages/ProductDetail";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import FAQ from "./pages/FAQ";
import TrackOrder from "./pages/TrackOrder";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import ChatWidgets from "./components/widgets/ChatWidgets";
import ScrollToTop from "./components/common/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/shop/:category" element={<Shop />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/collections/:slug" element={<Collections />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/orders" element={<Dashboard />} />
                    <Route path="/custom-orders" element={<Dashboard />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/track" element={<TrackOrder />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <ChatWidgets whatsappNumber="8801XXXXXXXXX" />
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
