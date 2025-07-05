"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import DashboardHeader from "@/components/dashboard/header";
import NewPaymentForm from "@/components/dashboard/payments/new-payment-form";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NewPaymentPage() {
  const { connected } = useWallet();

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Create Payment Schedule
          </h1>
          <p className="text-white/70 mt-1">
            Set up automated recurring payments on Solana
          </p>
        </div>

        {!connected ? (
          <div className="max-w-4xl mx-auto">
            <Alert className="bg-dark-200 border-white/10 mb-6">
              <AlertCircle className="h-5 w-5 text-[#6E56CF]" />
              <AlertTitle>Wallet connection required</AlertTitle>
              <AlertDescription>
                Please connect your wallet to create a payment schedule.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center p-12 bg-dark-200 border border-white/10 rounded-lg">
              <WalletMultiButton className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white px-6 py-6 h-auto text-lg rounded-lg">
                Connect Wallet
              </WalletMultiButton>
            </div>
          </div>
        ) : (
          <NewPaymentForm />
        )}
      </div>
    </div>
  );
}
