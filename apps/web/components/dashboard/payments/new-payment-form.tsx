"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/hooks/use-program";
import { AutoSolProgram } from "@/lib/program";
import { useFeeSettings } from "@/hooks/use-fee-settings";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

import RecipientSection from "./sections/recipient-section";
import PaymentSection from "./sections/payment-section";
import ScheduleSection from "./sections/schedule-section";
import SummarySection from "./sections/summary-section";

export interface PaymentScheduleFormData {
  recipient: { address: string; name: string };
  payment: {
    amount: number;
    token: string;
    memo: string;
    symbol: string;
    decimals: number;
  };
  schedule: {
    scheduleTimes: number[];
    selectedDates: Date[];
    frequency: "once" | "daily" | "weekly" | "monthly" | "custom";
    endDate?: Date;
    repeatCount?: number;
  };
}

const reveal = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: "auto", marginTop: 16 },
};

export default function NewPaymentForm() {
  const router = useRouter();
  const { program } = useProgram();
  const { calculateFee } = useFeeSettings();
  const wallet = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [scheduleAddress, setScheduleAddress] = useState<string | null>(null);

  const [formData, setFormData] = useState<PaymentScheduleFormData>({
    recipient: { address: "", name: "" },
    payment: { amount: 0, token: "So11111111111111111111111111111111111111112", memo: "", symbol: "SOL", decimals: 9 },
    schedule: { scheduleTimes: [], selectedDates: [], frequency: "once", repeatCount: 12 },
  });

  // Progressive disclosure flags
  const recipientValid = useMemo(() => {
    try {
      if (!formData.recipient.address || !formData.recipient.name) return false;
      new PublicKey(formData.recipient.address);
      return true;
    } catch { return false; }
  }, [formData.recipient]);

  const paymentValid = useMemo(
    () => recipientValid && formData.payment.amount > 0 && Boolean(formData.payment.token),
    [recipientValid, formData.payment]
  );

  const scheduleValid = useMemo(
    () => paymentValid && formData.schedule.selectedDates.length > 0,
    [paymentValid, formData.schedule.selectedDates]
  );

  const update = (slice: Partial<PaymentScheduleFormData>) =>
    setFormData((prev) => ({ ...prev, ...slice }));

  const handleSubmit = async () => {
    if (!program || !wallet.publicKey || !scheduleValid) return;
    try {
      setIsSubmitting(true);
      setError(null);

      const recipientPk = new PublicKey(formData.recipient.address);
      const decimals = formData.payment.decimals ?? 9;
      const amount = Math.floor(formData.payment.amount * Math.pow(10, decimals));
      if (amount <= 0) throw new Error("Amount must be > 0");

      const isSol = AutoSolProgram.isNativeSol(formData.payment.token);
      const result = isSol
        ? await program.createPaymentSchedule({
            paymentAmount: amount,
            recipientAddress: recipientPk,
            scheduleTimes: formData.schedule.scheduleTimes,
            memo: formData.payment.memo,
          })
        : await program.createSplPaymentSchedule({
            paymentAmount: amount,
            recipientAddress: recipientPk,
            scheduleTimes: formData.schedule.scheduleTimes,
            memo: formData.payment.memo,
            mint: new PublicKey(formData.payment.token),
          });

      setTxSignature(result.txSignature);
      setScheduleAddress(result.scheduleAddress.toString());
      toast.success("Payment schedule created!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create schedule";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (txSignature) {
    return (
      <SummarySection
        data={formData}
        txSignature={txSignature}
        scheduleAddress={scheduleAddress}
        onDone={() => router.push("/dashboard/payments")}
        isSuccess
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-0">
      {/* 1 — Recipient (always visible) */}
      <RecipientSection
        data={formData.recipient}
        updateData={(d) => update({ recipient: d })}
        program={program}
      />

      {/* 2 — Payment (reveals when recipient valid) */}
      <AnimatePresence>
        {recipientValid && (
          <motion.div key="payment" variants={reveal} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.3 }}>
            <PaymentSection
              data={formData.payment}
              updateData={(d) => update({ payment: d })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3 — Schedule (reveals when payment valid) */}
      <AnimatePresence>
        {paymentValid && (
          <motion.div key="schedule" variants={reveal} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.3 }}>
            <ScheduleSection
              data={formData.schedule}
              updateData={(d) => update({ schedule: d })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 — Summary + Submit (reveals when schedule valid) */}
      <AnimatePresence>
        {scheduleValid && (
          <motion.div key="summary" variants={reveal} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.3 }}>
            <SummarySection
              data={formData}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={handleSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
