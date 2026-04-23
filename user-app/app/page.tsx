import HeroSection from "@/components/landing/HeroSection";
import SolutionSection from "@/components/landing/SolutionsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ProblemSection from "@/components/landing/ProblemSection";
import LiveProofSection from "@/components/landing/LiveProofSection";
import CTASection from "@/components/landing/CTASection";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <LiveProofSection />
      <CTASection />
    </main>
  )
}