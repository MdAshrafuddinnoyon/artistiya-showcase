import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "bn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.shop": { en: "Shop", bn: "শপ" },
  "nav.collections": { en: "Collections", bn: "কালেকশন" },
  "nav.about": { en: "Our Story", bn: "আমাদের কথা" },
  "nav.contact": { en: "Contact", bn: "যোগাযোগ" },
  
  // Shop
  "shop.title": { en: "Shop All", bn: "সব দেখুন" },
  "shop.filter": { en: "Filter", bn: "ফিল্টার" },
  "shop.sort": { en: "Sort", bn: "সাজান" },
  "shop.all": { en: "All", bn: "সব" },
  "shop.newest": { en: "Newest", bn: "সর্বশেষ" },
  "shop.priceLowHigh": { en: "Price: Low to High", bn: "মূল্য: কম থেকে বেশি" },
  "shop.priceHighLow": { en: "Price: High to Low", bn: "মূল্য: বেশি থেকে কম" },
  "shop.preorder": { en: "Pre-order Available", bn: "প্রি-অর্ডার" },
  "shop.viewDetails": { en: "View Details", bn: "বিস্তারিত" },
  "shop.noProducts": { en: "No products found", bn: "কোনো পণ্য পাওয়া যায়নি" },
  
  // Product
  "product.addToCart": { en: "Add to Cart", bn: "কার্টে যোগ করুন" },
  "product.buyNow": { en: "Buy Now", bn: "এখনই কিনুন" },
  "product.preorder": { en: "Pre-Order Now", bn: "প্রি-অর্ডার করুন" },
  "product.orderViaWhatsapp": { en: "Order via WhatsApp", bn: "WhatsApp এ অর্ডার" },
  "product.inStock": { en: "In Stock", bn: "স্টকে আছে" },
  "product.outOfStock": { en: "Out of Stock", bn: "স্টক শেষ" },
  "product.wishlist": { en: "Add to Wishlist", bn: "উইশলিস্টে রাখুন" },
  "product.wishlisted": { en: "In Wishlist", bn: "উইশলিস্টে আছে" },
  "product.story": { en: "Story", bn: "গল্প" },
  "product.specs": { en: "Specifications", bn: "বিবরণ" },
  "product.reviews": { en: "Reviews", bn: "রিভিউ" },
  "product.related": { en: "You May Also Like", bn: "আপনার পছন্দ হতে পারে" },
  "product.materials": { en: "Materials", bn: "উপকরণ" },
  "product.dimensions": { en: "Dimensions", bn: "মাপ" },
  "product.care": { en: "Care Instructions", bn: "যত্ন নির্দেশনা" },
  "product.customizable": { en: "Customizable", bn: "কাস্টমাইজেবল" },
  "product.shipping": { en: "Shipping Info", bn: "ডেলিভারি তথ্য" },
  "product.shippingDetails": { en: "Dhaka ৳80 • Outside Dhaka ৳130 • Free on ৳5,000+", bn: "ঢাকায় ৳৮০ • ঢাকার বাইরে ৳১৩০ • ৳৫,০০০+ অর্ডারে ফ্রি" },
  "product.noReviews": { en: "No reviews yet", bn: "এখনো কোনো রিভিউ নেই" },
  "product.firstReview": { en: "Be the first to review", bn: "প্রথম রিভিউ দিন" },
  "product.notFound": { en: "Product not found", bn: "পণ্য পাওয়া যায়নি" },
  "product.backToShop": { en: "Back to Shop", bn: "শপে ফিরে যান" },
  "product.estimatedTime": { en: "Estimated", bn: "আনুমানিক" },
  
  // Cart
  "cart.title": { en: "Your Cart", bn: "আপনার কার্ট" },
  "cart.empty": { en: "Your cart is empty", bn: "আপনার কার্ট খালি" },
  "cart.checkout": { en: "Checkout", bn: "চেকআউট" },
  "cart.continueShopping": { en: "Continue Shopping", bn: "শপিং চালিয়ে যান" },
  "cart.subtotal": { en: "Subtotal", bn: "সাবটোটাল" },
  
  // Checkout
  "checkout.title": { en: "Checkout", bn: "চেকআউট" },
  "checkout.guestCheckout": { en: "Guest Checkout", bn: "গেস্ট চেকআউট" },
  "checkout.address": { en: "Delivery Address", bn: "ডেলিভারি ঠিকানা" },
  "checkout.fullName": { en: "Full Name", bn: "পুরো নাম" },
  "checkout.phone": { en: "Mobile Number", bn: "মোবাইল নম্বর" },
  "checkout.division": { en: "Division", bn: "বিভাগ" },
  "checkout.district": { en: "District", bn: "জেলা" },
  "checkout.thana": { en: "Thana", bn: "থানা" },
  "checkout.addressLine": { en: "Full Address", bn: "সম্পূর্ণ ঠিকানা" },
  "checkout.payment": { en: "Payment Method", bn: "পেমেন্ট পদ্ধতি" },
  "checkout.cod": { en: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
  "checkout.codDesc": { en: "Pay when you receive", bn: "পণ্য হাতে পেয়ে টাকা দিন" },
  "checkout.transactionId": { en: "Transaction ID", bn: "ট্রানজেকশন আইডি" },
  "checkout.notes": { en: "Additional Notes", bn: "অতিরিক্ত নোট" },
  "checkout.placeOrder": { en: "Place Order", bn: "অর্ডার করুন" },
  "checkout.processing": { en: "Processing...", bn: "প্রসেসিং..." },
  "checkout.success": { en: "Order Successful!", bn: "অর্ডার সফল হয়েছে!" },
  "checkout.orderNumber": { en: "Your Order Number", bn: "আপনার অর্ডার নম্বর" },
  "checkout.preorderNote": { en: "This order contains pre-order items", bn: "এই অর্ডারে প্রি-অর্ডার আইটেম আছে" },
  "checkout.contact": { en: "We will contact you soon", bn: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব" },
  "checkout.moreShopping": { en: "More Shopping", bn: "আরো শপিং" },
  "checkout.goHome": { en: "Go Home", bn: "হোম যান" },
  "checkout.fillAll": { en: "Please fill all fields", bn: "সব তথ্য পূরণ করুন" },
  "checkout.enterTxn": { en: "Enter Transaction ID", bn: "ট্রানজেকশন আইডি দিন" },
  "checkout.error": { en: "Order failed", bn: "অর্ডার করতে সমস্যা হয়েছে" },
  "checkout.orderViaWhatsapp": { en: "Order via WhatsApp", bn: "WhatsApp এ অর্ডার করুন" },
  
  // Header
  "header.freeShipping": { en: "✨ Free shipping on orders over ৳5,000 ✨", bn: "✨ ৳৫,০০০+ অর্ডারে ফ্রি শিপিং ✨" },
  "header.customDesign": { en: "Custom Design", bn: "কাস্টম ডিজাইন" },
  "header.myOrders": { en: "My Orders", bn: "আমার অর্ডার" },
  "header.customRequests": { en: "Custom Requests", bn: "কাস্টম রিকোয়েস্ট" },
  "header.logout": { en: "Logout", bn: "লগআউট" },
  "header.loginSignup": { en: "Login / Sign Up", bn: "লগইন / সাইন আপ" },
  "header.search": { en: "Search", bn: "অনুসন্ধান" },
  
  // Footer
  "footer.newsletter": { en: "Join Our Artistic Journey", bn: "আমাদের সাথে যুক্ত হোন" },
  "footer.newsletterDesc": { en: "Subscribe to receive updates on new collections and exclusive offers", bn: "নতুন কালেকশন এবং বিশেষ অফারের আপডেট পেতে সাবস্ক্রাইব করুন" },
  "footer.subscribe": { en: "Subscribe", bn: "সাবস্ক্রাইব" },
  "footer.enterEmail": { en: "Enter your email", bn: "আপনার ইমেইল দিন" },
  "footer.shop": { en: "Shop", bn: "শপ" },
  "footer.help": { en: "Help", bn: "সাহায্য" },
  "footer.company": { en: "Company", bn: "কোম্পানি" },
  "footer.shippingInfo": { en: "Shipping Info", bn: "শিপিং তথ্য" },
  "footer.returnPolicy": { en: "Return Policy", bn: "রিটার্ন নীতি" },
  "footer.trackOrder": { en: "Track Order", bn: "অর্ডার ট্র্যাক" },
  "footer.faq": { en: "FAQs", bn: "প্রশ্নোত্তর" },
  "footer.ourStory": { en: "Our Story", bn: "আমাদের কথা" },
  "footer.contactUs": { en: "Contact Us", bn: "যোগাযোগ" },
  "footer.terms": { en: "Terms of Service", bn: "শর্তাবলী" },
  "footer.privacy": { en: "Privacy Policy", bn: "গোপনীয়তা নীতি" },
  "footer.tagline": { en: "Where every piece tells a story of tradition, artistry, and elegance.", bn: "শৈল্পিক বুননে, আভিজাত্যের ছোঁয়া।" },
  "footer.weAccept": { en: "We Accept:", bn: "পেমেন্ট:" },
  "footer.rights": { en: "All rights reserved.", bn: "সর্বস্বত্ব সংরক্ষিত।" },
  
  // Common
  "common.login": { en: "Login", bn: "লগইন" },
  "common.signup": { en: "Sign Up", bn: "সাইন আপ" },
  "common.loading": { en: "Loading...", bn: "লোড হচ্ছে..." },
  "common.error": { en: "An error occurred", bn: "একটি সমস্যা হয়েছে" },
  "common.required": { en: "Required", bn: "আবশ্যক" },
  "common.optional": { en: "Optional", bn: "ঐচ্ছিক" },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Default to English for now - Bengali translations will be added later
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    localStorage.setItem("artistiya-language", language);
    // Update document lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
