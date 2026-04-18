"use client";

import { format } from "date-fns";
import { useFeeSettings } from "@/hooks/use-fee-settings";
import type { PaymentScheduleFormData } from "@/components/dashboard/payments/new-payment-form";
import { TokenAvatar } from "@/components/shared/token-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Coins, User } from "lucide-react";

interface ReviewStepProps {
  data: PaymentScheduleFormData;
}

export default function ReviewStep({ data }: ReviewStepProps) {
  const {
    getFeePercentage,
    calculateFee,
    loading: feeLoading,
  } = useFeeSettings();

  const feePercentage = getFeePercentage();
  const feeAmount = calculateFee(data.payment.amount);
  const totalAmount = data.payment.amount + feeAmount;
  const totalForAllPayments = totalAmount * data.schedule.selectedDates.length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Recipient */}
        <section className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">Recipient</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                Label
              </div>
              <div className="mt-0.5 text-sm text-white">{data.recipient.name}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                Address
              </div>
              <div className="mt-0.5 break-all font-mono text-xs text-slate-400">
                {data.recipient.address}
              </div>
            </div>
          </div>
        </section>

        {/* Funding */}
        <section className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Coins className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">Funding</span>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span>Token</span>
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
            <div className="flex items-center justify-between text-slate-400">
              <span>Amount</span>
              <span className="text-white">
                {data.payment.amount} {data.payment.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Fee {feeLoading ? "" : `(${feePercentage}%)`}</span>
              <span className="text-white">
                {feeLoading ? (
                  <Skeleton className="h-4 w-16 bg-white/10" />
                ) : (
                  `${feeAmount.toFixed(4)} ${data.payment.symbol}`
                )}
              </span>
            </div>
            <div className="border-t border-white/[0.06] pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Per payment</span>
                <span className="text-base font-semibold text-white">
                  {feeLoading ? (
                    <Skeleton className="h-5 w-20 bg-white/10" />
                  ) : (
                    `${totalAmount.toFixed(4)} ${data.payment.symbol}`
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">Schedule</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">
                {data.schedule.selectedDates.length} payments
              </span>
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs capitalize text-slate-300">
                {data.schedule.frequency}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              {data.schedule.selectedDates.slice(0, 5).map((date) => (
                <div key={date.toISOString()} className="flex items-center justify-between">
                  <span>{format(date, "MMM d, yyyy")}</span>
                  <span className="text-slate-500">{format(date, "EEE")}</span>
                </div>
              ))}
            </div>
            {data.schedule.selectedDates.length > 5 && (
              <div className="text-[11px] text-slate-500">
                +{data.schedule.selectedDates.length - 5} more
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Total */}
      <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-primary/[0.04] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">
            Total Locked
          </div>
          <div className="mt-1 flex items-center gap-2">
            <TokenAvatar
              symbol={data.payment.symbol}
              mint={data.payment.token}
              isSol={data.payment.symbol.toUpperCase() === "SOL"}
              size={20}
              className="h-5 w-5"
            />
            <span className="text-xl font-semibold text-white">
              {feeLoading ? (
                <Skeleton className="h-7 w-36 bg-white/10" />
              ) : (
                `${totalForAllPayments.toFixed(4)} ${data.payment.symbol}`
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Includes all {data.schedule.selectedDates.length} payments + platform fees.
          </p>
        </div>
        {data.payment.memo && (
          <div className="max-w-sm rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
            <span className="text-slate-500">Memo: </span>{data.payment.memo}
          </div>
        )}
      </div>
    </div>
  );
}
