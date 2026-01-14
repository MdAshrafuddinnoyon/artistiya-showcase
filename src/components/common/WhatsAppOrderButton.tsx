import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface WhatsAppOrderButtonProps {
  items?: OrderItem[];
  productName?: string;
  productPrice?: number;
  quantity?: number;
  whatsappNumber?: string;
  className?: string;
  variant?: "default" | "outline" | "gold" | "gold-outline";
  size?: "default" | "sm" | "lg" | "icon";
}

const WhatsAppOrderButton = ({
  items,
  productName,
  productPrice,
  quantity = 1,
  whatsappNumber = "8801XXXXXXXXX",
  className = "",
  variant = "gold",
  size = "lg",
}: WhatsAppOrderButtonProps) => {
  const { t } = useLanguage();

  const handleWhatsAppOrder = () => {
    let message = "🛍️ *New Order from artistiya.store*\n\n";
    
    if (items && items.length > 0) {
      // Cart order
      message += "*Order Items:*\n";
      let total = 0;
      items.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n   Qty: ${item.quantity} × ৳${item.price.toLocaleString()} = ৳${(item.price * item.quantity).toLocaleString()}\n`;
        total += item.price * item.quantity;
      });
      message += `\n*Subtotal:* ৳${total.toLocaleString()}`;
    } else if (productName && productPrice) {
      // Single product order
      message += `*Product:* ${productName}\n`;
      message += `*Quantity:* ${quantity}\n`;
      message += `*Price:* ৳${productPrice.toLocaleString()}\n`;
      message += `*Total:* ৳${(productPrice * quantity).toLocaleString()}`;
    }

    message += "\n\n---\n*Customer Details:*\nName:\nPhone:\nAddress:\nPayment Method: COD / bKash / Nagad";

    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, "_blank");
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleWhatsAppOrder}
    >
      <MessageCircle className="h-5 w-5 mr-2" />
      {t("product.orderViaWhatsapp")}
    </Button>
  );
};

export default WhatsAppOrderButton;
