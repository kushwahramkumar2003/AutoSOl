"use client";

import { Button } from "@/components/ui/button";
import type { PaymentScheduleFormData } from "@/components/dashboard/payments/new-payment-form";
import { ArrowRight, Calendar, Check, ExternalLink, Copy } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useFeeSettings } from "@/hooks/use-fee-settings";
import { Skeleton } from "@/components/ui/skeleton";

interface SuccessStepProps {
  data: PaymentScheduleFormData;
  txSignature: string | null;
  scheduleAddress: string | null;
  onDone: () => void;
}

export default function SuccessStep({
  data,
  txSignature,
  scheduleAddress,
  onDone,
}: SuccessStepProps) {
  const {
    getFeePercentage,
    calculateFee,
    loading: feeLoading,
  } = useFeeSettings();

  // Trigger confetti effect on component mount
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(() => {
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

  // Calculate total amount including fee
  const feePercentage = getFeePercentage();
  const feeAmount = calculateFee(data.payment.amount);
  const totalAmount = data.payment.amount + feeAmount;
  const totalForAllPayments = totalAmount * data.schedule.selectedDates.length;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} has been copied to your clipboard.`);
  };

  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
    : "#";

  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring" as const,
          stiffness: 300,
          damping: 20,
        }}
        className="w-20 h-20 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-6"
      >
        <Check className="h-10 w-10 text-[#10B981]" />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold mb-2"
      >
        Payment Schedule Created!
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/70 mb-6 max-w-md mx-auto"
      >
        Your payment schedule has been successfully created and funds have been
        securely locked in the payment vault.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-dark-300 rounded-lg p-4 mb-6 inline-block mx-auto"
      >
        <div className="text-center">
          <p className="text-white/70 text-sm mb-1">Total Amount Locked</p>
          <p className="text-2xl font-bold">
            {feeLoading ? (
              <Skeleton className="h-8 w-32 bg-white/10" />
            ) : (
              `${totalForAllPayments.toFixed(data.payment.symbol === "BONK" ? 0 : 4)} ${data.payment.symbol}`
            )}
          </p>
          <p className="text-white/70 text-sm mt-1">
            For {data.schedule.selectedDates.length} payments to{" "}
            {data.recipient.name}
          </p>
          {!feeLoading && (
            <p className="text-xs text-white/50 mt-1">
              Including {feePercentage}% platform fee
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
      >
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
          onClick={() => window.open(explorerUrl, "_blank")}
        >
          View on Explorer
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>

      {scheduleAddress && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-white/50 mb-4"
        >
          <p>Schedule Address</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="font-mono">{scheduleAddress}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-white/10"
              onClick={() =>
                copyToClipboard(scheduleAddress, "Schedule address")
              }
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}

      {txSignature && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-white/50"
        >
          <p>Transaction ID</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="font-mono">
              {txSignature.slice(0, 16)}...{txSignature.slice(-16)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-white/10"
              onClick={() => copyToClipboard(txSignature, "Transaction ID")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}

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
