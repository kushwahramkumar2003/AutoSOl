"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  date: Date;
  status: "pending" | "completed" | "failed";
}

interface CalendarViewProps {
  payments: Payment[];
  onDateSelect: (date: Date) => void;
  onAddPayment: () => void;
}

const statusClass: Record<Payment["status"], string> = {
  completed: "bg-primary/10 text-primary",
  pending: "bg-white/[0.08] text-slate-200",
  failed: "bg-white/[0.04] text-slate-400",
};

export default function CalendarView({
  payments,
  onDateSelect,
  onAddPayment,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const agenda = useMemo(() => {
    if (!selectedDay) return [];
    return payments.filter((payment) => isSameDay(payment.date, selectedDay));
  }, [payments, selectedDay]);

  const getPaymentsForDay = (day: Date) => {
    return payments.filter((payment) => isSameDay(payment.date, day));
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr),300px]">
      <section className="section-surface">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Calendar View
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Review scheduled payments by date without leaving the payments workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={onAddPayment}
              className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Payment
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.14em] text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="mobile-scroll mt-2">
          <div className="grid min-w-[720px] grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const dayPayments = getPaymentsForDay(day);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const isInMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  onDateSelect(day);
                }}
                className={cn(
                  "min-h-[128px] rounded-[24px] border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary/30 bg-primary/10"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]",
                  !isInMonth && "opacity-45"
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-2xl text-sm",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/[0.04] text-slate-200"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  {dayPayments.length > 0 ? (
                    <Badge className="border-white/10 bg-white/[0.06] text-slate-200">
                      {dayPayments.length}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  {dayPayments.slice(0, 2).map((payment) => (
                    <div
                      key={payment.id}
                      className={cn(
                        "rounded-xl px-2 py-1 text-xs",
                        statusClass[payment.status]
                      )}
                    >
                      <div className="truncate font-medium">{payment.recipient}</div>
                      <div className="truncate text-[11px] opacity-80">
                        {payment.amount} {payment.token}
                      </div>
                    </div>
                  ))}
                  {dayPayments.length > 2 ? (
                    <div className="text-xs text-slate-500">
                      +{dayPayments.length - 2} more
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </section>

      <aside className="section-surface">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Selected Date
            </div>
            <div className="mt-1 font-medium text-white">
              {selectedDay ? format(selectedDay, "MMMM d, yyyy") : "Pick a date"}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {selectedDay ? (
            agenda.length > 0 ? (
              agenda.map((payment) => (
                <div key={payment.id} className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">
                        {payment.recipient}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {payment.amount} {payment.token}
                      </div>
                    </div>
                    <Badge className={cn("border-white/10", statusClass[payment.status])}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
                No scheduled payments on this date.
              </div>
            )
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
              Select a day in the calendar to inspect the schedule.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
