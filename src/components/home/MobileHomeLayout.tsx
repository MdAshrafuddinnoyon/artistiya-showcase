import { useIsMobile } from "@/hooks/use-mobile";
import MobileHeroSlider from "./MobileHeroSlider";
import MobileDynamicSections from "./MobileDynamicSections";

const MobileHomeLayout = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="md:hidden bg-background min-h-screen pb-20">
      {/* Hero Slider - Dynamic from hero_slides table */}
      <MobileHeroSlider />

      {/* All Dynamic Sections - Categories, Products, Testimonials, Blog, YouTube, FAQ etc. */}
      {/* Ordered by display_order from homepage_sections table in admin panel */}
      <MobileDynamicSections />
    </div>
  );
};

export default MobileHomeLayout;
