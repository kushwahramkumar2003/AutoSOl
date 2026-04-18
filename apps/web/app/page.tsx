"use client";

import Hero from "@/components/hero";
import Features from "@/components/features";
import HowItWorks from "@/components/how-it-works";
import TechnicalHighlights from "@/components/technical-highlights";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import CursorSpotlight from "@/components/cursor-spotlight";

export default function Home() {
  return (
    <CursorSpotlight>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <TechnicalHighlights />
      <Footer />
    </CursorSpotlight>
  );
}
