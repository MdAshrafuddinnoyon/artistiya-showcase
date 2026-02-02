import { Gift, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";

interface SignupDiscountBannerProps {
  discountPercent?: number;
}

const SignupDiscountBanner = ({ discountPercent = 5 }: SignupDiscountBannerProps) => {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border border-gold/30 rounded-xl p-4 md:p-5"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
            <Gift className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h3 className={`font-semibold text-foreground ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn" 
                ? `একাউন্ট তৈরি করে ${discountPercent}% ডিসকাউন্ট পান!` 
                : `Get ${discountPercent}% OFF by creating an account!`}
            </h3>
            <p className={`text-sm text-muted-foreground mt-1 ${language === "bn" ? "font-bengali" : ""}`}>
              {language === "bn"
                ? "একাউন্ট তৈরি করলে আপনার পরবর্তী অর্ডারে বিশেষ ডিসকাউন্ট পাবেন এবং অর্ডার ট্র্যাক করতে পারবেন।"
                : "Create an account to get exclusive discounts on your orders and track all your purchases."}
            </p>
          </div>
        </div>
        <Link to="/auth?redirect=/checkout">
          <Button variant="gold" size="sm" className="gap-2 whitespace-nowrap">
            <UserPlus className="h-4 w-4" />
            <span className={language === "bn" ? "font-bengali" : ""}>
              {language === "bn" ? "একাউন্ট তৈরি করুন" : "Create Account"}
            </span>
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default SignupDiscountBanner;
