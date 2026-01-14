import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import NewArrivalsSection from "@/components/home/NewArrivalsSection";
import FeaturedSection from "@/components/home/FeaturedSection";
import MakingSection from "@/components/home/MakingSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import InstagramSection from "@/components/home/InstagramSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CategorySection />
        <NewArrivalsSection />
        <FeaturedSection />
        <MakingSection />
        <TestimonialsSection />
        <InstagramSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
