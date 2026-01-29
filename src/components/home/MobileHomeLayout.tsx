import { useIsMobile } from "@/hooks/use-mobile";
import MobileHeroSlider from "./MobileHeroSlider";
import MobileCategoryPills from "./MobileCategoryPills";
import MobileProductSection from "./MobileProductSection";
import MobileRecentlyViewed from "./MobileRecentlyViewed";

const MobileHomeLayout = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="md:hidden bg-white min-h-screen pb-20">
      {/* Hero Slider */}
      <MobileHeroSlider />

      {/* Category Pills */}
      <MobileCategoryPills />

      {/* Hot Sales Section */}
      <MobileProductSection 
        title="Hot sales" 
        queryType="featured" 
        showDots={true}
      />

      {/* New Arrivals Section */}
      <MobileProductSection 
        title="New Arrivals" 
        queryType="new_arrivals" 
        showDots={false}
      />

      {/* Recently Viewed */}
      <MobileRecentlyViewed />
    </div>
  );
};

export default MobileHomeLayout;
