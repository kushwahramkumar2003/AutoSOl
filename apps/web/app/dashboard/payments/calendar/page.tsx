"use client";
// import type { Metadata } from "next";
import { addDays } from "date-fns";
import { redirect } from "next/navigation";
import CalendarView from "@/components/dashboard/payments/calendar-view";

// export const metadata: Metadata = {
//   title: "Payment Calendar | AutoSOL",
//   description: "View your scheduled payments in calendar view",
// };

// Mock data for payments
const payments = [
  {
    id: "pay-001",
    recipient: "Solana Hosting",
    amount: 25,
    token: "USDC",
    date: new Date(),
    status: "pending" as const,
  },
  {
    id: "pay-002",
    recipient: "SolanaFM",
    amount: 0.5,
    token: "SOL",
    date: addDays(new Date(), 2),
    status: "pending" as const,
  },
  {
    id: "pay-003",
    recipient: "CryptoDevs DAO",
    amount: 5,
    token: "SOL",
    date: addDays(new Date(), 5),
    status: "pending" as const,
  },
  {
    id: "pay-004",
    recipient: "Solana Staking",
    amount: 1,
    token: "SOL",
    date: addDays(new Date(), -2),
    status: "completed" as const,
  },
  {
    id: "pay-005",
    recipient: "NFT Subscription",
    amount: 10,
    token: "USDC",
    date: addDays(new Date(), -5),
    status: "completed" as const,
  },
  {
    id: "pay-006",
    recipient: "Bonk Donation",
    amount: 100000,
    token: "BONK",
    date: addDays(new Date(), 10),
    status: "pending" as const,
  },
  {
    id: "pay-007",
    recipient: "Solana Foundation",
    amount: 2,
    token: "SOL",
    date: addDays(new Date(), -7),
    status: "failed" as const,
  },
];

export default function CalendarPage() {
  const handleDateSelect = (date: Date) => {
    // In a real app, this would navigate to a filtered view or show a modal
    console.log("Selected date:", date);
  };

  const handleAddPayment = () => {
    // In a real app, this would use the router to navigate
    redirect("/dashboard/payments/new");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Payment Calendar</h1>
          <p className="text-white/70 mt-1">
            View and manage your scheduled payments in calendar view
          </p>
        </div>

        <CalendarView
          payments={payments}
          onDateSelect={handleDateSelect}
          onAddPayment={handleAddPayment}
        />
      </div>
    </div>
  );
}
