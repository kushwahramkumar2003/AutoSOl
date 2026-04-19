"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useFeeSettings } from "@/hooks/use-fee-settings";
import { Button } from "@/components/ui/button";
import { TokenAvatar } from "@/components/shared/token-avatar";
import type { PaymentScheduleFormData } from "../new-payment-form";
import { ArrowRight, Check, CheckCircle, Copy, ExternalLink, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

interface Props {
  data: PaymentScheduleFormData;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit?: () => void;
  labels?: {
    summaryTitle?: string;
    counterpartyLabel?: string;
    counterpartyValuePrefix?: string;
    totalLabel?: string;
    submitLabel?: string;
    submittingLabel?: string;
    helperText?: string | null;
  };
  // Success mode
  isSuccess?: boolean;
  txSignature?: string | null;
  scheduleAddress?: string | null;
  onDone?: () => void;
}

export default function SummarySection({
  data,
  isSubmitting,
  error,
  onSubmit,
  labels,
  isSuccess,
  txSignature,
  scheduleAddress,
  onDone,
}: Props) {
  const { getFeePercentage, calculateFee } = useFeeSettings();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const isCommitment = data.workflow.mode === "commitment";
  const summaryTitle = labels?.summaryTitle ?? "Summary";
  const counterpartyLabel = labels?.counterpartyLabel ?? "To";
  const counterpartyValuePrefix = labels?.counterpartyValuePrefix ?? "";
  const totalLabel =
    labels?.totalLabel ?? (isCommitment ? "Activation Deposit" : "Total Locked");
  const submitLabel =
    labels?.submitLabel ?? (isCommitment ? "Create Commitment Proposal" : "Create Schedule");
  const submittingLabel = labels?.submittingLabel ?? "Creating…";
  const helperText =
    labels?.helperText === undefined
      ? isCommitment
        ? "Recipient must accept this proposal before funds are locked."
        : null
      : labels.helperText;

  const fee = calculateFee(data.payment.amount);
  const perPayment = data.payment.amount + fee;
  const total = perPayment * data.schedule.selectedDates.length;

  const copyVal = async (v: string, label: string) => {
    await navigator.clipboard.writeText(v);
    setCopiedField(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Success state ──
  if (isSuccess && txSignature) {
    const explorer = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <h3 className="font-semibold text-white">Schedule Created</h3>
            <p className="mt-1 text-sm text-slate-400">Funds locked on-chain. Payments will execute automatically.</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TokenAvatar
              symbol={data.payment.symbol}
              mint={data.payment.token}
              isSol={data.payment.symbol.toUpperCase() === "SOL"}
              size={18}
              className="h-[18px] w-[18px]"
            />
            <span className="text-lg font-semibold text-white">{total.toFixed(4)} {data.payment.symbol}</span>
            <span className="text-xs text-slate-500">locked</span>
          </div>
          <div className="text-xs text-slate-500">{data.schedule.selectedDates.length} payments to {data.recipient.name} · {getFeePercentage()}% fee</div>
        </div>

        {scheduleAddress && (
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div><div className="text-[10px] uppercase tracking-wider text-slate-500">Schedule</div><div className="mt-0.5 break-all font-mono text-[11px] text-slate-400">{scheduleAddress}</div></div>
            <button onClick={() => copyVal(scheduleAddress, "Address")} className="text-slate-500 hover:text-white transition-colors">
              {copiedField === "Address" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 rounded-xl border-white/[0.08] bg-white/[0.03] text-xs hover:bg-white/[0.06]"
            onClick={() => window.open(explorer, "_blank")} disabled={!txSignature}>
            View on Explorer <ExternalLink className="ml-1.5 h-3 w-3" />
          </Button>
          <Button size="sm" className="flex-1 rounded-xl bg-primary text-xs hover:bg-primary/90" onClick={onDone}>
            Open Payments <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Review + submit state ──
  return (
    <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4 sm:p-5">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">{summaryTitle}</div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{counterpartyLabel}</span>
          <span className="text-white">
            {counterpartyValuePrefix}{data.recipient.name} <span className="text-xs text-slate-500">({data.recipient.address.slice(0, 4)}…{data.recipient.address.slice(-4)})</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Token</span>
          <div className="flex items-center gap-1.5">
            <TokenAvatar
              symbol={data.payment.symbol}
              mint={data.payment.token}
              isSol={data.payment.symbol.toUpperCase() === "SOL"}
              size={14}
              className="h-3.5 w-3.5"
            />
            <span className="font-medium text-white">{data.payment.symbol}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Amount × Payments</span>
          <span className="text-white">{data.payment.amount} × {data.schedule.selectedDates.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Fee ({getFeePercentage()}%)</span>
          <span className="text-slate-300">{fee.toFixed(4)} {data.payment.symbol}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5">
          <span className="text-slate-400">{totalLabel}</span>
          <div className="flex items-center gap-1.5">
            <TokenAvatar
              symbol={data.payment.symbol}
              mint={data.payment.token}
              isSol={data.payment.symbol.toUpperCase() === "SOL"}
              size={16}
              className="h-4 w-4"
            />
            <span className="text-base font-semibold text-white">{total.toFixed(4)} {data.payment.symbol}</span>
          </div>
        </div>
        {data.payment.memo && (
          <div className="text-xs text-slate-500">Memo: {data.payment.memo}</div>
        )}
        {helperText && <div className="text-xs text-amber-300/80">{helperText}</div>}
        <div className="text-[11px] text-slate-500">
          At {String(data.schedule.executionHour).padStart(2, "0")}:
          {String(data.schedule.executionMinute).padStart(2, "0")}{" "}
          {data.schedule.timezone} ·{" "}
          {data.schedule.selectedDates.slice(0, 3).map((d) => format(d, "MMM d")).join(", ")}
          {data.schedule.selectedDates.length > 3 && ` +${data.schedule.selectedDates.length - 3} more`}
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <Button onClick={onSubmit} disabled={isSubmitting} className="mt-4 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 h-11">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {submittingLabel}
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" /> {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
}
