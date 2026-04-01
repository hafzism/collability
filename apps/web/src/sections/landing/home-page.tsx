import { CallToActionSection } from "./call-to-action-section";
import { FaqSection } from "./faq-section";
import { FeaturesSection } from "./features-section";
import { FooterSection } from "./footer-section";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { TestimonialsSection } from "./testimonials-section";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FaqSection />
      <CallToActionSection />
      <FooterSection />
    </>
  );
}
