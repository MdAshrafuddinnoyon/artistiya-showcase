import { Badge } from "@/components/ui/badge";

interface ProductDiscountBadgeProps {
  price: number;
  compareAtPrice: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ProductDiscountBadge = ({ 
  price, 
  compareAtPrice, 
  className = "",
  size = "md"
}: ProductDiscountBadgeProps) => {
  if (!compareAtPrice || compareAtPrice <= price) return null;

  const discountPercent = Math.round(
    ((compareAtPrice - price) / compareAtPrice) * 100
  );

  if (discountPercent <= 0) return null;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1"
  };

  return (
    <span 
      className={`
        inline-flex items-center font-bold rounded
        bg-destructive text-destructive-foreground
        ${sizeClasses[size]}
        ${className}
      `}
    >
      -{discountPercent}%
    </span>
  );
};

export default ProductDiscountBadge;
