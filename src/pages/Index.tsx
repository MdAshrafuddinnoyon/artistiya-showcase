import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
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
      
      {/* Desktop Layout - All sections now dynamic from database */}
      {!isMobile && (
        <main>
          <HeroSection />
          <DynamicHomepageSections />
        </main>
      )}
      
      <Footer />
    </div>
  );
};

export default Index;
