import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import NewArrivalsSection from "@/components/home/NewArrivalsSection";
import FeaturedSection from "@/components/home/FeaturedSection";
import MakingSection from "@/components/home/MakingSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import InstagramSection from "@/components/home/InstagramSection";
import DynamicHomepageSections from "@/components/home/DynamicHomepageSections";
import MobileHomeLayout from "@/components/home/MobileHomeLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Mobile Layout */}
      {isMobile && <MobileHomeLayout />}
      
      {/* Desktop Layout */}
      {!isMobile && (
        <main>
          <HeroSection />
          <CategorySection />
          <NewArrivalsSection />
          <DynamicHomepageSections />
          <FeaturedSection />
          <MakingSection />
          <TestimonialsSection />
          <InstagramSection />
        </main>
      )}
      
      <Footer />
    </div>
  );
};

export default Index;
