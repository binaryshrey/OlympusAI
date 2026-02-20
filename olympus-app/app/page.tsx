import { FeatureOne } from "@/components/FeatureOne";
import { FeatureThree } from "@/components/FeatureThree";

import FeatureFive from "@/components/FeatureFive";
import { FeatureFour } from "@/components/FeatureFour";
import { FeatureTwo } from "@/components/FeatureTwo";
import HeroSection from "@/components/hero-section";
import { LogoMarquee } from "@/components/LogoMarquee";
import { CTA } from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <LogoMarquee />
      <FeatureOne />
      <FeatureTwo />
      <FeatureThree />
      <FeatureFour />
      <FeatureFive />
      <CTA />
      <Footer />
    </div>
  );
}
