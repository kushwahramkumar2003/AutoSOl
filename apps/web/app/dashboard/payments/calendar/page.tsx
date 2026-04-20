"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import DashboardHeader from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarDays, ChevronLeft, ChevronRight, ExternalLink,
  Plus, RefreshCw, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgram } from "@/hooks/use-program";
import { fetchCalendarPaymentsResilient } from "@/lib/resilient-data";
import { TokenAvatar } from "@/components/shared/token-avatar";

interface CalendarPayment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  mint?: string;
  isSol?: boolean;
  date: Date;
  status: "pending" | "completed" | "failed";
  scheduleAddress?: string;
}

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-primary/10 text-primary border-primary/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function CalendarPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { program } = useProgram();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [detailPayment, setDetailPayment] = useState<CalendarPayment | null>(null);

  const [payments, setPayments] = useState<CalendarPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataNotice, setDataNotice] = useState<string | null>(null);

  const fetchCalendarData = useCallback(async () => {
    if (!publicKey) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchCalendarPaymentsResilient(publicKey, program);
      setPayments(result.data);
      setDataNotice(result.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [program, publicKey]);

  useEffect(() => { fetchCalendarData(); }, [fetchCalendarData]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dayPayments = (day: Date) => payments.filter((p) => isSameDay(p.date, day));

  const agenda = useMemo(
    () => selectedDay ? payments.filter((p) => isSameDay(p.date, selectedDay)) : [],
    [payments, selectedDay]
  );

  // Not connected
  if (!connected) {
    return (
      <div className="app-shell flex min-h-screen flex-col">
        <DashboardHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <Wallet className="h-8 w-8 text-slate-500" />
          <p className="text-sm text-slate-400">Connect your wallet to view the calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />

      <div className="app-page page-stack flex-1">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr),280px]">
          {/* Calendar grid */}
          <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="min-w-[160px] text-center text-lg font-semibold text-white">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <button type="button" onClick={() => setCurrentMonth(new Date())}
                  className="ml-2 rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors">
                  Today
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  onClick={fetchCalendarData} disabled={loading}>
                  <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                </Button>
                <Button size="sm" className="rounded-xl bg-primary text-xs hover:bg-primary/90"
                  onClick={() => router.push("/dashboard/payments/new")}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> New Payment
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            {dataNotice && (
              <div className="mb-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                {dataNotice}
              </div>
            )}

            {/* Loading state - skeleton calendar */}
            {loading ? (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="py-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="h-[100px] animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.015]" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="py-1.5">{d}</div>
                  ))}
                </div>

                {/* Grid */}
                <div className="mobile-scroll">
                  <div className="grid min-w-[640px] grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const dp = dayPayments(day);
                      const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                      const inMonth = isSameMonth(day, currentMonth);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={cn(
                            "min-h-[100px] rounded-xl border p-2 text-left transition-all duration-150",
                            isSelected
                              ? "border-primary/30 bg-primary/[0.08] ring-1 ring-primary/20"
                              : "border-white/[0.05] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.03]",
                            !inMonth && "opacity-30"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium",
                              isToday ? "bg-primary text-primary-foreground" : "text-slate-400"
                            )}>
                              {format(day, "d")}
                            </span>
                            {dp.length > 0 && (
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-md bg-primary/15 px-1 text-[10px] font-medium text-primary">
                                {dp.length}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 space-y-1">
                            {dp.slice(0, 2).map((p) => {
                              return (
                                <div key={p.id} className={cn("flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]", STATUS_STYLE[p.status] || STATUS_STYLE.pending)}>
                                  <TokenAvatar
                                    symbol={p.token}
                                    mint={p.mint}
                                    isSol={p.isSol}
                                    size={12}
                                    className="h-3 w-3"
                                  />
                                  <span className="truncate font-medium">{p.amount} {p.token}</span>
                                </div>
                              );
                            })}
                            {dp.length > 2 && <div className="text-[10px] text-slate-500">+{dp.length - 2}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-white">
                  {selectedDay ? format(selectedDay, "MMM d, yyyy") : "Select a date"}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {selectedDay ? (
                  agenda.length > 0 ? (
                    agenda.map((p) => {
                      return (
                        <button key={p.id} type="button" onClick={() => setDetailPayment(p)}
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <TokenAvatar
                                symbol={p.token}
                                mint={p.mint}
                                isSol={p.isSol}
                                size={16}
                                className="h-4 w-4 shrink-0"
                              />
                              <span className="truncate text-sm font-medium text-white">{p.recipient}</span>
                            </div>
                            <Badge className={cn("shrink-0 border text-[10px] capitalize", STATUS_STYLE[p.status])}>
                              {p.status}
                            </Badge>
                          </div>
                          <div className="mt-1.5 text-xs text-slate-400">
                            {p.amount} {p.token}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015] p-4 text-center">
                      <p className="text-xs text-slate-500">No payments on this date</p>
                      <Button size="sm" variant="ghost" className="mt-2 rounded-lg text-xs text-primary hover:bg-primary/10"
                        onClick={() => router.push("/dashboard/payments/new")}>
                        <Plus className="mr-1 h-3 w-3" /> Schedule one
                      </Button>
                    </div>
                  )
                ) : (
                  <p className="py-4 text-center text-xs text-slate-500">
                    Click a day to see scheduled payments.
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <div className="text-lg font-semibold text-white">{payments.filter((p) => p.status === "pending").length}</div>
                <div className="text-[11px] text-slate-500">Upcoming</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <div className="text-lg font-semibold text-white">{payments.filter((p) => p.status === "completed").length}</div>
                <div className="text-[11px] text-slate-500">Completed</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Payment detail modal */}
      <Dialog open={!!detailPayment} onOpenChange={() => setDetailPayment(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-white/[0.08] bg-[#0a0a0a] p-0 text-white sm:max-w-lg">
          <DialogHeader>
            <div className="border-b border-white/[0.06] px-6 pb-4 pt-6">
            <DialogTitle className="flex min-w-0 items-center gap-2 pr-8">
              {detailPayment && (
                <TokenAvatar
                  symbol={detailPayment.token}
                  mint={detailPayment.mint}
                  isSol={detailPayment.isSol}
                  size={20}
                  className="h-5 w-5"
                />
              )}
              Payment Details
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {detailPayment && format(detailPayment.date, "MMMM d, yyyy")}
            </DialogDescription>
            </div>
          </DialogHeader>

          {detailPayment && (
            <div className="space-y-4 px-6 py-5">
              <div className="space-y-3 text-sm">
                <div className="grid gap-1.5 sm:grid-cols-[112px,minmax(0,1fr)] sm:items-start">
                  <span className="text-slate-400">Recipient</span>
                  <span className="break-all font-medium text-white">
                    {detailPayment.recipient}
                  </span>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-[112px,minmax(0,1fr)] sm:items-start">
                  <span className="text-slate-400">Amount</span>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <TokenAvatar
                      symbol={detailPayment.token}
                      mint={detailPayment.mint}
                      isSol={detailPayment.isSol}
                      size={14}
                      className="h-3.5 w-3.5"
                    />
                    <span className="break-words font-medium text-white">
                      {detailPayment.amount} {detailPayment.token}
                    </span>
                  </div>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-[112px,minmax(0,1fr)] sm:items-start">
                  <span className="text-slate-400">Status</span>
                  <div>
                    <Badge className={cn("border text-[10px] capitalize", STATUS_STYLE[detailPayment.status])}>
                      {detailPayment.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-[112px,minmax(0,1fr)] sm:items-start">
                  <span className="text-slate-400">Date</span>
                  <span className="break-words text-slate-300">
                    {format(detailPayment.date, "MMM d, yyyy · h:mm a")}
                  </span>
                </div>
                {detailPayment.scheduleAddress && (
                  <div className="grid gap-1.5 sm:grid-cols-[112px,minmax(0,1fr)] sm:items-start">
                    <span className="text-slate-400">Schedule</span>
                    <span className="break-all font-mono text-[11px] text-slate-400">
                      {detailPayment.scheduleAddress}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                {detailPayment.scheduleAddress && (
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl border-white/[0.08] text-xs"
                    onClick={() => window.open(`https://explorer.solana.com/address/${detailPayment.scheduleAddress}?cluster=devnet`, "_blank")}>
                    Explorer <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                )}
                <Button size="sm" className="flex-1 rounded-xl bg-primary text-xs hover:bg-primary/90"
                  onClick={() => { setDetailPayment(null); router.push("/dashboard/payments/new"); }}>
                  <Plus className="mr-1 h-3 w-3" /> New Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
