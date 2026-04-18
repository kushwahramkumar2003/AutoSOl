"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Clock3,
  Edit,
  Eye,
  Search,
  XCircle,
} from "lucide-react";
import { UpcomingPayment } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[];
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  onViewAll?: () => void;
  onPaymentClick?: (payment: UpcomingPayment) => void;
  onEditPayment?: (payment: UpcomingPayment) => void;
  onCancelPayment?: (payment: UpcomingPayment) => void;
}

export function UpcomingPayments({
  payments,
  className,
  maxItems = 5,
  showFilters = true,
  onViewAll,
  onPaymentClick,
  onEditPayment,
  onCancelPayment,
}: UpcomingPaymentsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        const matchesSearch =
          payment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.token.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFrequency =
          frequencyFilter === "all" ||
          payment.frequency.toLowerCase() === frequencyFilter;

        return matchesSearch && matchesFrequency;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "amount":
            return b.amount - a.amount;
          case "recipient":
            return a.recipient.localeCompare(b.recipient);
          case "date":
          default:
            return (
              new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime()
            );
        }
      })
      .slice(0, maxItems);
  }, [payments, searchTerm, frequencyFilter, sortBy, maxItems]);

  const getDaysUntilPayment = (date: string) => {
    const paymentDate = new Date(date);
    const today = new Date();
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: "Due now", className: "text-slate-200" };
    }
    if (diffDays === 1) {
      return { label: "Tomorrow", className: "text-primary" };
    }
    if (diffDays <= 7) {
      return { label: `${diffDays} days`, className: "text-primary" };
    }

    return { label: `${diffDays} days`, className: "text-slate-300" };
  };

  return (
    <Card
      className={cn(
        "glass-panel rounded-[28px] border-white/[0.06] text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)]",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-white">
              Upcoming Payments
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              Next scheduled payment windows for your active plans.
            </CardDescription>
          </div>
          {onViewAll ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAll}
              className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:text-white"
            >
              View all
            </Button>
          ) : null}
        </div>

        {showFilters ? (
          <div className="flex flex-col gap-2 pt-2 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search recipient or token"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-white/10 bg-white/[0.04] pl-10 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-slate-100 lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black text-slate-100">
                <SelectItem value="all">All frequency</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full border-white/10 bg-white/[0.04] text-slate-100 lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black text-slate-100">
                <SelectItem value="date">Sort by date</SelectItem>
                <SelectItem value="amount">Sort by amount</SelectItem>
                <SelectItem value="recipient">Sort by recipient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-base font-medium text-slate-200">
              No upcoming payments
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create a schedule or adjust the current filters.
            </p>
          </div>
        ) : (
          filteredPayments.map((payment) => {
            const dueState = getDaysUntilPayment(payment.nextDate);

            return (
              <div
                key={payment.id}
                className="flex flex-col gap-4 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{payment.recipient}</p>
                      <Badge className="border-white/10 bg-white/[0.05] text-slate-200">
                        {payment.token}
                      </Badge>
                      <Badge className="border-white/10 bg-white/[0.05] text-slate-300">
                        {payment.frequency}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                      <Clock3 className="h-4 w-4 text-slate-500" />
                      <span>{payment.nextDate}</span>
                      <span className="text-slate-600">•</span>
                      <span className={dueState.className}>{dueState.label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">
                      {payment.amount.toFixed(4)} {payment.token}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      {payment.scheduleAddress.slice(0, 12)}...
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {onPaymentClick ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      onClick={() => onPaymentClick(payment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {onEditPayment ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      onClick={() => onEditPayment(payment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  ) : null}
                  {onCancelPayment ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      onClick={() => onCancelPayment(payment)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
