"use client";

import Hero from "@/components/hero";
import Features from "@/components/features";
import CommitmentPayments from "@/components/commitment-payments";
import PaymentRequests from "@/components/payment-requests";
import HowItWorks from "@/components/how-it-works";
import UseCases from "@/components/use-cases";
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
      <CommitmentPayments />
      <PaymentRequests />
      <HowItWorks />
      <UseCases />
      <TechnicalHighlights />
      <Footer />
    </CursorSpotlight>
  );
}
