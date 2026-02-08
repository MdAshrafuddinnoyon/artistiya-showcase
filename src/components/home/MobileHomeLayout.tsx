import { useIsMobile } from "@/hooks/use-mobile";
import MobileHeroSlider from "./MobileHeroSlider";
import MobileCategorySlider from "./MobileCategorySlider";
import MobileProductSlider from "./MobileProductSlider";
import MobileRecentlyViewed from "./MobileRecentlyViewed";
import MobileTestimonialsSlider from "./MobileTestimonialsSlider";
import DynamicHomepageSections from "./DynamicHomepageSections";

const MobileHomeLayout = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="md:hidden bg-background min-h-screen pb-20">
      {/* Hero Slider - Dynamic from hero_slides table */}
      <MobileHeroSlider />

      {/* Category Slider with Images/Icons - Dynamic from categories table */}
      <MobileCategorySlider />

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

      {/* Testimonials Slider - Dynamic */}
      <MobileTestimonialsSlider />

      {/* Recently Viewed / Featured Grid - Dynamic */}
      <MobileRecentlyViewed />

      {/* All Products Section with Slider */}
      <MobileProductSlider 
        title="Explore More" 
        queryType="all" 
        showViewAll={true}
      />

      {/* Dynamic Sections - YouTube, Blog, FAQ etc. from admin panel */}
      <DynamicHomepageSections />
    </div>
  );
};

export default MobileHomeLayout;
