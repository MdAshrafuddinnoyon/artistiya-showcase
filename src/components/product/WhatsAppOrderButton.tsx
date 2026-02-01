import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// WhatsApp icon SVG
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface Product {
  id: string;
  name: string;
  price: number;
  slug: string;
  images?: string[];
  sku?: string;
}

interface WhatsAppOrderButtonProps {
  product: Product;
  quantity?: number;
  className?: string;
  variant?: "full" | "icon";
}

const WhatsAppOrderButton = ({ product, quantity = 1, className = "", variant = "full" }: WhatsAppOrderButtonProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState("8801XXXXXXXXX");
  const { user } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      // Get from site_branding
      const { data: brandingData } = await supabase
        .from("site_branding")
        .select("social_whatsapp")
        .single();

      if (brandingData?.social_whatsapp) {
        setWhatsappNumber(brandingData.social_whatsapp);
        return;
      }

      // Fallback: try site_settings
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "whatsapp")
        .single();

      if (settingsData?.value && typeof settingsData.value === 'object' && 'number' in settingsData.value) {
        const value = settingsData.value as { number: string };
        if (value.number) {
          setWhatsappNumber(value.number);
        }
      }
    };

    fetchSettings();
  }, []);

  const trackLead = async () => {
    try {
      // Get user info if logged in
      let customerName = "Guest";
      let customerPhone = "";
      let customerEmail = "";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, email")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          customerName = profile.full_name || user.email?.split("@")[0] || "Guest";
          customerPhone = profile.phone || "";
          customerEmail = profile.email || user.email || "";
        }
      }

      // Create lead entry
      const productInfo = `Product: ${product.name}\nSKU: ${product.sku || product.id.slice(0, 8).toUpperCase()}\nPrice: ৳${(product.price * quantity).toLocaleString()}\nQuantity: ${quantity}\nLink: ${window.location.origin}/product/${product.slug}`;

      await supabase.from("leads").insert({
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        message: productInfo,
        source: "whatsapp_click",
        is_contacted: false,
      });
    } catch (error) {
      console.error("Error tracking lead:", error);
    }
  };

  const handleWhatsAppOrder = async () => {
    // Track the lead
    await trackLead();

    const total = product.price * quantity;
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    const sku = product.sku || product.id.slice(0, 8).toUpperCase();
    
    // Create message with product details
    let message = `🛍️ *অর্ডার করতে চাই*\n\n`;
    message += `📦 *প্রোডাক্ট:* ${product.name}\n`;
    message += `🏷️ *SKU:* ${sku}\n`;
    message += `📊 *পরিমাণ:* ${quantity}\n`;
    message += `💰 *মূল্য:* ৳${total.toLocaleString()}\n`;
    message += `🔗 *লিংক:* ${productUrl}\n\n`;
    
    // Add product image link if available
    if (product.images && product.images.length > 0) {
      message += `📷 *ছবি:* ${product.images[0]}\n\n`;
    }
    
    message += `---\n*আমার তথ্য:*\nনাম:\nফোন:\nঠিকানা:\n\nঅনুগ্রহ করে ডেলিভারি সম্পর্কে জানান।`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank");
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleWhatsAppOrder}
        className={`w-9 h-9 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center text-white transition-colors shadow-md ${className}`}
        title="Order via WhatsApp"
      >
        <WhatsAppIcon />
      </button>
    );
  }

  return (
    <button
      onClick={handleWhatsAppOrder}
      className={`w-full h-11 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center gap-2 text-white font-medium transition-colors shadow-md ${className}`}
    >
      <WhatsAppIcon />
      <span>Order via WhatsApp</span>
    </button>
  );
};

export default WhatsAppOrderButton;
