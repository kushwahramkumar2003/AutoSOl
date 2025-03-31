import type { Metadata } from "next";
import NewPaymentForm from "@/components/dashboard/payments/new-payment-form";

export const metadata: Metadata = {
  title: "Create New Payment Schedule | AutoSOL",
  description: "Schedule automated recurring payments on Solana",
};

export default function NewPaymentPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Create Payment Schedule
          </h1>
          <p className="text-white/70 mt-1">
            Set up automated recurring payments on Solana
          </p>
        </div>

        <NewPaymentForm />
      </div>
    </div>
  );
}
