import Hero from "@/components/hero";
import Features from "@/components/features";
import HowItWorks from "@/components/how-it-works";
import TechnicalHighlights from "@/components/technical-highlights";
import Testimonials from "@/components/testimonials";
import Pricing from "@/components/pricing";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="">
      <Hero />
      <Features />
      <HowItWorks />
      <TechnicalHighlights />
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  );
}
