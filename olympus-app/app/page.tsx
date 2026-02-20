import { FeatureOne } from "@/app/components/FeatureOne";
import { FeatureThree } from "@/app/components/FeatureThree";

import FeatureFive from "@/app/components/FeatureFive";
import { FeatureFour } from "@/app/components/FeatureFour";
import { FeatureTwo } from "@/app/components/FeatureTwo";
import HeroSection from "@/app/components/hero-section";
import { LogoMarquee } from "@/app/components/LogoMarquee";
import { CTA } from "@/app/components/CTA";
import Footer from "@/app/components/Footer";

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
