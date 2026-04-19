import HeroSection from "@/components/features/landing/HeroSection";
import HowItWorksSection from "@/components/features/landing/HowItWorksSection";
import PreviewSection from "@/components/features/landing/PreviewSection";

const Landing = () => (
  <main className="min-h-screen bg-background font-sans text-foreground">
    <HeroSection />
    <HowItWorksSection />
    <PreviewSection />
  </main>
);

export default Landing;
