"use client";

import { Button } from "@/components/ui/button";
import type { PaymentScheduleFormData } from "@/components/dashboard/payments/new-payment-form";
import { ArrowRight, Calendar, Check, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface SuccessStepProps {
  data: PaymentScheduleFormData;
  onDone: () => void;
}

export default function SuccessStep({ data, onDone }: SuccessStepProps) {
  // Trigger confetti effect on component mount
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Calculate total amount
  const feePercentage = 0.01; // 1%
  const totalAmount =
    data.payment.amount *
    (1 + feePercentage) *
    data.schedule.selectedDates.length;

  // Generate mock transaction ID
  const txId =
    "5KtP9H1rbj6SrKcvzrdZ7QXgYPnLmbjxCz6aVbg9ZmzWYU8LGQJvuXNsQHbk2FrBrKFh";

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-6">
        <Check className="h-10 w-10 text-[#10B981]" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Payment Schedule Created!</h2>
      <p className="text-white/70 mb-6 max-w-md mx-auto">
        Your payment schedule has been successfully created and funds have been
        securely locked in the payment vault.
      </p>

      <div className="bg-dark-300 rounded-lg p-4 mb-6 inline-block mx-auto">
        <div className="text-center">
          <p className="text-white/70 text-sm mb-1">Total Amount Locked</p>
          <p className="text-2xl font-bold">
            {totalAmount.toFixed(data.payment.token === "BONK" ? 0 : 4)}{" "}
            {data.payment.token}
          </p>
          <p className="text-white/70 text-sm mt-1">
            For {data.schedule.selectedDates.length} payments to{" "}
            {data.recipient.name}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <Button
          variant="outline"
          className="border-white/10 bg-dark-300 hover:bg-white/10"
          onClick={onDone}
        >
          View All Payments
          <Calendar className="ml-2 h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          className="border-white/10 bg-dark-300 hover:bg-white/10"
        >
          View on Explorer
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="text-xs text-white/50">
        <p>Transaction ID</p>
        <p className="font-mono mt-1">{txId}</p>
      </div>

      <Button
        className="mt-8 bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon"
        onClick={onDone}
      >
        Done
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
