import HeroSection from "@/features/landing/components/hero-section";
import StatsSection from "@/features/landing/components/stats-section";
import FeaturesSection from "@/features/landing/components/features-section";
import HowItWorksSection from "@/features/landing/components/how-it-works-section";
import ModulesSection from "@/features/landing/components/modules-section";
import AiShowcaseSection from "@/features/landing/components/ai-showcase-section";
import QrShowcaseSection from "@/features/landing/components/qr-showcase-section";
import TestimonialsSection from "@/features/landing/components/testimonials-section";
import FaqSection from "@/features/landing/components/faq-section";
import CtaSection from "@/features/landing/components/cta-section";

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ModulesSection />
      <AiShowcaseSection />
      <QrShowcaseSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </div>
  );
}
