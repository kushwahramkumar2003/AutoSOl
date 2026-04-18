"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import DashboardHeader from "@/components/dashboard/header";
import NewPaymentForm from "@/components/dashboard/payments/new-payment-form";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";

export default function NewPaymentPage() {
  const { connected } = useWallet();

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />

      <div className="app-page flex-1 py-4 sm:py-6">
        {!connected ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">Connect Wallet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Connect your Solana wallet to create payment schedules.
              </p>
            </div>
            <WalletMultiButton className="h-auto rounded-xl bg-primary px-6 py-3 text-sm text-white hover:bg-primary/90">
              Connect Wallet
            </WalletMultiButton>
          </div>
        ) : (
          <NewPaymentForm />
        )}
      </div>
    </div>
  );
}
