import { useIsMobile } from "@/hooks/use-mobile";
import MobileHeroSlider from "./MobileHeroSlider";
import MobileCategoryPills from "./MobileCategoryPills";
import MobileProductSlider from "./MobileProductSlider";
import MobileRecentlyViewed from "./MobileRecentlyViewed";

const MobileHomeLayout = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="md:hidden bg-background min-h-screen pb-20">
      {/* Hero Slider - Dynamic from hero_slides table */}
      <MobileHeroSlider />

      {/* Category Pills - Dynamic from categories table */}
      <MobileCategoryPills />

      {/* Featured Products (Hot Sales) - Dynamic with Slider */}
      <MobileProductSlider 
        title="Hot Sales" 
        queryType="featured" 
        showViewAll={true}
      />

      {/* New Arrivals - Dynamic with Slider */}
      <MobileProductSlider 
        title="New Arrivals" 
        queryType="new_arrivals" 
        showViewAll={true}
      />

      {/* Recently Viewed / Featured Grid - Dynamic */}
      <MobileRecentlyViewed />

      {/* All Products Section with Slider */}
      <MobileProductSlider 
        title="Explore More" 
        queryType="all" 
        showViewAll={true}
      />
    </div>
  );
};

export default MobileHomeLayout;
