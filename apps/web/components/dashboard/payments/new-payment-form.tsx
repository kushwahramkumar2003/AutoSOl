"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/hooks/use-program";
import { AutoSolProgram } from "@/lib/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { renderMarkdownPreview } from "@/components/shared/markdown-contract-preview";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadMarkdownToPinata } from "@/lib/ipfs";

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
    executionHour: number;
    executionMinute: number;
    timezone: string;
    endDate?: Date;
    repeatCount?: number;
  };
  workflow: {
    mode: "standard" | "commitment";
    noteMarkdown: string;
  };
}

const reveal = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: "auto", marginTop: 16 },
};

export default function NewPaymentForm() {
  const router = useRouter();
  const { program } = useProgram();
  const wallet = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [scheduleAddress, setScheduleAddress] = useState<string | null>(null);

  const [formData, setFormData] = useState<PaymentScheduleFormData>({
    recipient: { address: "", name: "" },
    payment: { amount: 0, token: "So11111111111111111111111111111111111111112", memo: "", symbol: "SOL", decimals: 9 },
    schedule: {
      scheduleTimes: [],
      selectedDates: [],
      frequency: "once",
      repeatCount: 12,
      executionHour: 9,
      executionMinute: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
    workflow: { mode: "standard", noteMarkdown: "" },
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
      if (formData.workflow.mode === "commitment") {
        const noteMarkdown =
          formData.workflow.noteMarkdown.trim() ||
          [
            `# Payment Commitment`,
            ``,
            `Recipient: ${formData.recipient.name}`,
            `Wallet: ${formData.recipient.address}`,
            `Token: ${formData.payment.symbol}`,
            `Amount per payment: ${formData.payment.amount}`,
            `Payments: ${formData.schedule.selectedDates.length}`,
            ``,
            formData.payment.memo || "Created via AutoSol commitment flow.",
          ].join("\n");

        const noteUri = await uploadMarkdownToPinata(noteMarkdown);
        if (isSol) {
          await program.createPaymentCommitmentProposal({
              paymentAmount: amount,
              recipientAddress: recipientPk,
              scheduleTimes: formData.schedule.scheduleTimes,
              memo: formData.payment.memo,
              noteUri,
            });
        } else {
          await program.createSplPaymentCommitmentProposal({
              paymentAmount: amount,
              recipientAddress: recipientPk,
              scheduleTimes: formData.schedule.scheduleTimes,
              memo: formData.payment.memo,
              noteUri,
              mint: new PublicKey(formData.payment.token),
            });
        }

        toast.success("Payment commitment proposal created!");
        router.push("/dashboard/commitments");
        return;
      }

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
            <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Workflow
                </div>
                <div className="rounded-full border border-white/[0.06] bg-black/30 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.workflow.mode === "standard" ? "default" : "ghost"}
                    className="h-8 rounded-full text-xs"
                    onClick={() =>
                      update({
                        workflow: { ...formData.workflow, mode: "standard" },
                      })
                    }
                  >
                    Standard
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.workflow.mode === "commitment" ? "default" : "ghost"}
                    className="h-8 rounded-full text-xs"
                    onClick={() =>
                      update({
                        workflow: { ...formData.workflow, mode: "commitment" },
                      })
                    }
                  >
                    Commitment
                  </Button>
                </div>
              </div>

              <p className="text-sm text-slate-400">
                {formData.workflow.mode === "standard"
                  ? "Standard schedules can still be cancelled by the sender while active."
                  : "Commitments require recipient acceptance and become non-cancellable after activation."}
              </p>

              {formData.workflow.mode === "commitment" && (
                <div className="mt-4 space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Commitment Note (Markdown)
                  </label>
                  <Tabs defaultValue="write" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-xl border border-white/[0.06] bg-black/30">
                      <TabsTrigger
                        value="write"
                        className="rounded-lg text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white"
                      >
                        Write
                      </TabsTrigger>
                      <TabsTrigger
                        value="preview"
                        className="rounded-lg text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white"
                      >
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="write">
                      <Textarea
                        value={formData.workflow.noteMarkdown}
                        onChange={(event) =>
                          update({
                            workflow: {
                              ...formData.workflow,
                              noteMarkdown: event.target.value,
                            },
                          })
                        }
                        rows={8}
                        placeholder={"# Scope\n\nDescribe the purpose, service terms, and why this payment commitment exists."}
                        className="min-h-[220px] border-white/[0.08] bg-black/20 text-sm text-white"
                      />
                    </TabsContent>
                    <TabsContent value="preview">
                      <div className="min-h-[220px] space-y-4 rounded-xl border border-white/[0.08] bg-black/20 p-4">
                        {renderMarkdownPreview(formData.workflow.noteMarkdown)}
                      </div>
                    </TabsContent>
                  </Tabs>
                  <p className="text-xs text-slate-500">
                    AutoSol uploads this markdown note to IPFS through Pinata before creating the proposal.
                  </p>
                </div>
              )}
            </div>
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
