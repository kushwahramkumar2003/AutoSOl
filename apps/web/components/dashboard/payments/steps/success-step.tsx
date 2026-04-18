"use client";

import { useState } from "react";
import { useFeeSettings } from "@/hooks/use-fee-settings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentScheduleFormData } from "@/components/dashboard/payments/new-payment-form";
import { TokenAvatar } from "@/components/shared/token-avatar";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle,
  Copy,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

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

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const feePercentage = getFeePercentage();
  const feeAmount = calculateFee(data.payment.amount);
  const totalAmount = data.payment.amount + feeAmount;
  const totalForAllPayments = totalAmount * data.schedule.selectedDates.length;

  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
    : "#";

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(label);
    toast.success(`${label} copied.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Schedule Created
            </h2>
            <p className="mt-1 max-w-lg text-sm text-slate-400">
              Funds have been locked on-chain and payments will execute on schedule.
            </p>
          </div>
        </div>
        <Button
          onClick={onDone}
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Go to Payments
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-slate-400">Locked Amount</span>
          </div>
          <div className="flex items-center gap-2">
            <TokenAvatar
              symbol={data.payment.symbol}
              mint={data.payment.token}
              isSol={data.payment.symbol.toUpperCase() === "SOL"}
              size={20}
              className="h-5 w-5"
            />
            <span className="text-xl font-semibold text-white">
              {feeLoading ? (
                <Skeleton className="h-7 w-28 bg-white/10" />
              ) : (
                `${totalForAllPayments.toFixed(4)} ${data.payment.symbol}`
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {feeLoading ? null : `Includes ${feePercentage}% fee`}
          </span>
        </div>

        <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-slate-400">Schedule</span>
          </div>
          <div className="text-white">
            <div className="font-medium">{data.recipient.name}</div>
            <div className="mt-1 text-sm text-slate-400">
              {data.schedule.selectedDates.length} payment{data.schedule.selectedDates.length === 1 ? "" : "s"} planned
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <span className="text-xs font-medium text-slate-400">Actions</span>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-between rounded-xl border-white/[0.08] bg-white/[0.03] text-xs hover:bg-white/[0.06]"
              onClick={() => window.open(explorerUrl, "_blank")}
              disabled={!txSignature}
            >
              View Transaction
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-between rounded-xl border-white/[0.08] bg-white/[0.03] text-xs hover:bg-white/[0.06]"
              onClick={onDone}
            >
              Open Payments
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Addresses */}
      {scheduleAddress && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Schedule Address</div>
            <div className="mt-1 break-all font-mono text-xs text-slate-400">{scheduleAddress}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 self-start rounded-lg text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white"
            onClick={() => copyValue(scheduleAddress, "Schedule address")}
          >
            {copiedField === "Schedule address" ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            Copy
          </Button>
        </div>
      )}

      {txSignature && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Transaction Signature</div>
            <div className="mt-1 break-all font-mono text-xs text-slate-400">{txSignature}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 self-start rounded-lg text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white"
            onClick={() => copyValue(txSignature, "Transaction signature")}
          >
            {copiedField === "Transaction signature" ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="mr-1.5 h-3.5 w-3.5" />
            )}
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}
