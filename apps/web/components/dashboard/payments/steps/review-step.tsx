"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, Coins, User } from "lucide-react";
import type { PaymentScheduleFormData } from "@/components/dashboard/payments/new-payment-form";

interface ReviewStepProps {
  data: PaymentScheduleFormData;
}

export default function ReviewStep({ data }: ReviewStepProps) {
  // Calculate total amount including fee
  const feePercentage = 0.01; // 1%
  const feeAmount = data.payment.amount * feePercentage;
  const totalAmount = data.payment.amount + feeAmount;
  const totalForAllPayments = totalAmount * data.schedule.selectedDates.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Review Payment Schedule</h2>
        <p className="text-white/70">
          Please review your payment schedule details before confirming
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-dark-300 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#6E56CF]/20 flex items-center justify-center">
                <User className="h-5 w-5 text-[#6E56CF]" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Recipient</h3>
                <p className="text-white/70 text-sm">Payment destination</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-white/70 mb-1">Recipient Name</h4>
                <p className="font-medium">{data.recipient.name}</p>
              </div>

              <div>
                <h4 className="text-sm text-white/70 mb-1">Wallet Address</h4>
                <p className="font-medium break-all">
                  {data.recipient.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-300 border-white/10 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#6E56CF]/20 flex items-center justify-center">
                <Coins className="h-5 w-5 text-[#6E56CF]" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Payment Details</h3>
                <p className="text-white/70 text-sm">
                  Amount and token information
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-white/70 mb-1">
                  Amount per Payment
                </h4>
                <p className="font-medium">
                  {data.payment.amount} {data.payment.symbol}
                </p>
              </div>

              <div>
                <h4 className="text-sm text-white/70 mb-1">Fee (1%)</h4>
                <p className="font-medium">
                  {feeAmount.toFixed(data.payment.symbol === "BONK" ? 0 : 4)}{" "}
                  {data.payment.symbol}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10">
                <h4 className="text-sm text-white/70 mb-1">
                  Total per Payment
                </h4>
                <p className="font-medium">
                  {totalAmount.toFixed(data.payment.symbol === "BONK" ? 0 : 4)}{" "}
                  {data.payment.symbol}
                </p>
              </div>

              {data.payment.memo && (
                <div className="pt-2 border-t border-white/10">
                  <h4 className="text-sm text-white/70 mb-1">Memo</h4>
                  <p className="text-sm italic">
                    &ldquo;{data.payment.memo}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-dark-300 border-white/10 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#6E56CF]/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#6E56CF]" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Schedule</h3>
              <p className="text-white/70 text-sm">
                Payment execution timeline
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className="bg-[#6E56CF]">
                {data.schedule.selectedDates.length}{" "}
                {data.schedule.selectedDates.length === 1
                  ? "payment"
                  : "payments"}
              </Badge>

              <Badge className="bg-dark-200 text-white/70">
                {data.schedule.frequency === "once"
                  ? "One-time"
                  : data.schedule.frequency === "custom"
                    ? "Custom schedule"
                    : `${data.schedule.frequency.charAt(0).toUpperCase() + data.schedule.frequency.slice(1)} payments`}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm text-white/70 mb-2">First 5 Payments</h4>
                <div className="space-y-2">
                  {data.schedule.selectedDates
                    .slice(0, 5)
                    .map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Calendar className="h-4 w-4 text-[#6E56CF]" />
                        <span>{format(date, "MMM d, yyyy")}</span>
                      </div>
                    ))}
                </div>
              </div>

              {data.schedule.selectedDates.length > 5 && (
                <div>
                  <h4 className="text-sm text-white/70 mb-2">
                    Last 5 Payments
                  </h4>
                  <div className="space-y-2">
                    {data.schedule.selectedDates
                      .slice(-5)
                      .map((date, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Calendar className="h-4 w-4 text-[#6E56CF]" />
                          <span>{format(date, "MMM d, yyyy")}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Total Amount</h4>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {totalForAllPayments.toFixed(
                      data.payment.symbol === "BONK" ? 0 : 4
                    )}{" "}
                    {data.payment.symbol}
                  </p>
                  <p className="text-sm text-white/70">
                    For all {data.schedule.selectedDates.length} payments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-white">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Check className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-medium mb-1">
              Ready to Create Payment Schedule
            </h3>
            <p className="text-sm text-white/70">
              By confirming, you authorize AutoSOL to create this payment
              schedule on the Solana blockchain. The total amount of{" "}
              {totalForAllPayments.toFixed(
                data.payment.symbol === "BONK" ? 0 : 4
              )}{" "}
              {data.payment.symbol}
              (including fees) will be transferred to a secure payment vault.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
