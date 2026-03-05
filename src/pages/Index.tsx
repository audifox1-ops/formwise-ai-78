import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/features/HeroSection";
import ProblemSolutionSection from "@/components/features/ProblemSolutionSection";
import CoreFeatureSection from "@/components/features/CoreFeatureSection";
import TrustSection from "@/components/features/TrustSection";
import AiFormBuilder from "@/components/features/AiFormBuilder";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <CoreFeatureSection />
        <AiFormBuilder />
        <TrustSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;