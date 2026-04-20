import HeroSection from "@/components/features/landing/HeroSection";
import HowItWorksSection from "@/components/features/landing/HowItWorksSection";
import PreviewSection from "@/components/features/landing/PreviewSection";
import SocialProofSection from "@/components/features/landing/SocialProofSection";
import FaqSection from "@/components/features/landing/FaqSection";
import CtaBannerSection from "@/components/features/landing/CtaBannerSection";
import FooterSection from "@/components/features/landing/FooterSection";

const Landing = () => (
  <div className="min-h-screen bg-background font-sans text-foreground">
    <main>
      <HeroSection />
      <HowItWorksSection />
      <PreviewSection />
      <SocialProofSection />
      <FaqSection />
      <CtaBannerSection />
    </main>
    <FooterSection />
  </div>
);

export default Landing;
