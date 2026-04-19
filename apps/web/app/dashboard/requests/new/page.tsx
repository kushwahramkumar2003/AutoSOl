"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import DashboardHeader from "@/components/dashboard/header";
import RecipientSection from "@/components/dashboard/payments/sections/recipient-section";
import PaymentSection from "@/components/dashboard/payments/sections/payment-section";
import ScheduleSection from "@/components/dashboard/payments/sections/schedule-section";
import SummarySection from "@/components/dashboard/payments/sections/summary-section";
import { useProgram } from "@/hooks/use-program";
import { AutoSolProgram } from "@/lib/program";
import { toast } from "sonner";
import { renderMarkdownPreview } from "@/components/shared/markdown-contract-preview";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadMarkdownToPinata } from "@/lib/ipfs";

interface FormData {
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
  noteMarkdown: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const { program } = useProgram();
  const wallet = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    recipient: { address: "", name: "" },
    payment: {
      amount: 0,
      token: "So11111111111111111111111111111111111111112",
      memo: "",
      symbol: "SOL",
      decimals: 9,
    },
    schedule: {
      scheduleTimes: [],
      selectedDates: [],
      frequency: "once",
      repeatCount: 12,
      executionHour: 9,
      executionMinute: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
    noteMarkdown: "",
  });

  const recipientValid = useMemo(() => {
    try {
      if (!formData.recipient.address || !formData.recipient.name) return false;
      new PublicKey(formData.recipient.address);
      return true;
    } catch {
      return false;
    }
  }, [formData.recipient]);

  const paymentValid = useMemo(
    () => recipientValid && formData.payment.amount > 0 && Boolean(formData.payment.token),
    [recipientValid, formData.payment]
  );

  const scheduleValid = useMemo(
    () => paymentValid && formData.schedule.selectedDates.length > 0,
    [paymentValid, formData.schedule.selectedDates]
  );

  const update = (slice: Partial<FormData>) =>
    setFormData((prev) => ({ ...prev, ...slice }));

  const handleSubmit = async () => {
    if (!program || !wallet.publicKey || !scheduleValid) return;
    try {
      setIsSubmitting(true);
      setError(null);

      const payerPk = new PublicKey(formData.recipient.address);
      const decimals = formData.payment.decimals ?? 9;
      const amount = Math.floor(formData.payment.amount * Math.pow(10, decimals));
      if (amount <= 0) throw new Error("Amount must be > 0");

      const noteMarkdown =
        formData.noteMarkdown.trim() ||
        [
          `# Auto-Payment Request`,
          ``,
          `Requested payer: ${formData.recipient.name}`,
          `Payer wallet: ${formData.recipient.address}`,
          `Requested payee: ${wallet.publicKey.toBase58()}`,
          `Token: ${formData.payment.symbol}`,
          `Amount per payment: ${formData.payment.amount}`,
          `Payments: ${formData.schedule.selectedDates.length}`,
          ``,
          formData.payment.memo || "Created via AutoSol request-to-pay flow.",
        ].join("\n");

      const noteUri = await uploadMarkdownToPinata(noteMarkdown);
      const isSol = AutoSolProgram.isNativeSol(formData.payment.token);

      if (isSol) {
        await program.createPaymentRequestProposal({
          paymentAmount: amount,
          recipientAddress: payerPk,
          scheduleTimes: formData.schedule.scheduleTimes,
          memo: formData.payment.memo,
          noteUri,
        });
      } else {
        await program.createSplPaymentRequestProposal({
          paymentAmount: amount,
          recipientAddress: payerPk,
          scheduleTimes: formData.schedule.scheduleTimes,
          memo: formData.payment.memo,
          noteUri,
          mint: new PublicKey(formData.payment.token),
        });
      }

      toast.success("Payment request created");
      router.push("/dashboard/requests");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create request";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="app-page page-stack flex-1">
        <div>
          <h1 className="text-xl font-semibold text-white">Request Auto-Payment</h1>
          <p className="mt-1 text-sm text-slate-400">
            Send a payment request to a payer so they can approve and fund the schedule.
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-4">
          <RecipientSection
            data={formData.recipient}
            updateData={(d) => update({ recipient: d })}
            program={program}
            title="Payer"
            addressPlaceholder="Wallet that will fund this request"
            namePlaceholder="Payer label"
            recentLabel="Recent payers"
            submitLabel="Create Payment Request"
            nextStepTokenLabel="Requested amount"
            nextStepScheduleLabel="Requested schedule"
          />

          {recipientValid && (
            <PaymentSection
              data={formData.payment}
              updateData={(d) => update({ payment: d })}
            />
          )}

          {paymentValid && (
            <ScheduleSection
              data={formData.schedule}
              updateData={(d) => update({ schedule: d })}
            />
          )}

          {scheduleValid && (
            <>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Request Note (Markdown)
                </label>
                <Tabs defaultValue="write" className="mt-3 w-full">
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
                      value={formData.noteMarkdown}
                      onChange={(event) => update({ noteMarkdown: event.target.value })}
                      rows={8}
                      placeholder={"# Request Terms\n\nDescribe what the payer is approving and what service or obligation this covers."}
                      className="min-h-[220px] border-white/[0.08] bg-black/20 text-sm text-white"
                    />
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="min-h-[220px] space-y-4 rounded-xl border border-white/[0.08] bg-black/20 p-4">
                      {renderMarkdownPreview(formData.noteMarkdown)}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <SummarySection
                data={{
                  ...formData,
                  workflow: { mode: "commitment", noteMarkdown: formData.noteMarkdown },
                }}
                labels={{
                  summaryTitle: "Request Summary",
                  counterpartyLabel: "Payer",
                  totalLabel: "Total to be approved",
                  submitLabel: "Create Payment Request",
                  submittingLabel: "Creating request…",
                  helperText:
                    "The payer must approve this request before any funds are locked or payments start.",
                }}
                isSubmitting={isSubmitting}
                error={error}
                onSubmit={handleSubmit}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
