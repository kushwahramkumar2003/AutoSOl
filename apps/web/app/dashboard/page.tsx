"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { TokenAmountBreakdown } from "@/lib/dashboard-service";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { TokenDistributionCard } from "@/components/dashboard/token-distribution";
import { Button } from "@/components/ui/button";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  Plus,
  RefreshCw,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: "easeOut" as const },
};

function formatSol(value: number) {
  return `${value.toFixed(2)} SOL`;
}

function formatTokenBreakdownValue(
  breakdown: TokenAmountBreakdown[] | undefined,
  fallbackValue: number,
  fallbackToken: string = "SOL"
) {
  const items = (breakdown ?? []).filter((item) => item.amount > 0);

  if (items.length === 0) {
    return `${fallbackValue.toFixed(2)} ${fallbackToken}`;
  }

  if (items.length === 1) {
    const [item] = items;
    return `${item.amount.toFixed(2)} ${item.token}`;
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return `${total.toFixed(2)} across ${items.length} tokens`;
}

function buildTrendValue(values: number[]) {
  if (values.length < 2) return 0;
  const last = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2] ?? 0;
  if (previous === 0) {
    return last === 0 ? 0 : 100;
  }
  return Number((((last - previous) / previous) * 100).toFixed(1));
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    stats,
    paymentActivity,
    recentTransactions,
    upcomingPayments,
    tokenDistribution,
    loading,
    error,
    lastUpdated,
    walletSolBalance,
    refresh,
  } = useDashboardData();

  const [timeRange, setTimeRange] = useState("7d");

  const hasRenderableData =
    stats.activePayments > 0 ||
    stats.totalScheduled > 0 ||
    recentTransactions.length > 0 ||
    upcomingPayments.length > 0 ||
    tokenDistribution.length > 0;

  const activityChart = useMemo(() => {
    const palette = {
      outgoingFill: "rgba(37, 99, 235, 0.22)",
      outgoingStroke: "#2563eb",
      incomingFill: "rgba(148, 163, 184, 0.2)",
      incomingStroke: "#94a3b8",
    };

    return {
      labels: paymentActivity.labels,
      datasets: paymentActivity.datasets.map((dataset) => ({
        ...dataset,
        borderWidth: 2,
        borderRadius: 10,
        tension: 0.35,
        backgroundColor:
          dataset.label === "Outgoing"
            ? palette.outgoingFill
            : palette.incomingFill,
        borderColor:
          dataset.label === "Outgoing"
            ? palette.outgoingStroke
            : palette.incomingStroke,
      })),
    };
  }, [paymentActivity]);

  const scheduleHealthChart = useMemo(() => {
    const values = [
      stats.activePayments,
      stats.totalCompleted,
      stats.totalCancelled,
    ];

    return {
      labels: ["Active", "Completed", "Cancelled"],
      datasets: [
        {
          label: "Schedules",
          data: values,
          backgroundColor: ["#2563eb", "rgba(255,255,255,0.45)", "rgba(255,255,255,0.18)"],
          borderWidth: 0,
        },
      ],
    };
  }, [stats]);

  const upcomingCommitmentChart = useMemo(() => {
    const maxItems =
      timeRange === "7d" ? 5 : timeRange === "30d" ? 8 : timeRange === "90d" ? 10 : 12;

    const items = [...upcomingPayments]
      .sort(
        (a, b) =>
          new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime()
      )
      .slice(0, maxItems);

    return {
      labels: items.map((item) => {
        const date = parseDate(item.nextDate);
        return date
          ? date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : item.nextDate;
      }),
      datasets: [
        {
          label: "Upcoming amount",
          data: items.map((item) => Number(item.amount.toFixed(2))),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.16)",
          borderWidth: 2,
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [timeRange, upcomingPayments]);

  const summary = useMemo(() => {
    const outgoingSeries =
      paymentActivity.datasets.find((dataset) => dataset.label === "Outgoing")
        ?.data || [];
    const incomingSeries =
      paymentActivity.datasets.find((dataset) => dataset.label === "Incoming")
        ?.data || [];

    return {
      outgoingTrend: buildTrendValue(outgoingSeries),
      incomingTrend: buildTrendValue(incomingSeries),
      upcomingValue: upcomingPayments.reduce((sum, item) => sum + item.amount, 0),
      completedRatio:
        stats.totalScheduled > 0
          ? Number(
              ((stats.totalCompleted / stats.totalScheduled) * 100).toFixed(1)
            )
          : 0,
    };
  }, [paymentActivity.datasets, stats, upcomingPayments]);

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      stats,
      paymentActivity,
      recentTransactions,
      upcomingPayments,
      tokenDistribution,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "autosol-dashboard.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="glass-panel h-28 animate-pulse rounded-[32px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="glass-panel h-36 animate-pulse rounded-[28px]"
            />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="glass-panel h-[360px] animate-pulse rounded-[28px] xl:col-span-2" />
          <div className="glass-panel h-[360px] animate-pulse rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (error && !hasRenderableData) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6">
        <div className="glass-panel max-w-md rounded-[32px] border-white/10 p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-white">
            Dashboard data is unavailable
          </h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <Button
            onClick={refresh}
            className="mt-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page page-stack text-white">
        <motion.section
          {...sectionMotion}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" onClick={refresh}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                {hasRenderableData ? "Live" : "No data"}
              </span>
              {lastUpdated && (
                <span className="text-[11px] text-slate-500">
                  · {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="rounded-xl border-white/10 bg-white/[0.03] text-xs hover:bg-white/[0.06]">
              <Download className="mr-1 h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" onClick={() => router.push("/dashboard/payments/new")} className="rounded-xl bg-primary text-xs hover:bg-primary/90">
              <Plus className="mr-1 h-3.5 w-3.5" /> New payment
            </Button>
          </div>

          {error && (
            <div className="w-full rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
              {error}
            </div>
          )}
        </motion.section>

        <motion.section
          {...sectionMotion}
          transition={{ ...sectionMotion.transition, delay: 0.04 }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <StatsCard
            title="Active Schedules"
            value={stats.activePayments}
            description={`${formatTokenBreakdownValue(
              stats.activeCommitmentBreakdown,
              stats.totalScheduled
            )} currently committed`}
            icon={<Activity className="h-4 w-4" />}
            trend={{
              value: Math.abs(summary.outgoingTrend),
              isPositive: summary.outgoingTrend >= 0,
              period: "activity delta",
            }}
          />
          <StatsCard
            title="Success Rate"
            value={`${stats.successRate.toFixed(1)}%`}
            description={`${summary.completedRatio}% of schedules completed`}
            icon={<Target className="h-4 w-4" />}
            trend={{
              value: Math.abs(summary.incomingTrend),
              isPositive: summary.incomingTrend >= 0,
              period: "incoming delta",
            }}
          />
          <StatsCard
            title="Monthly Spending"
            value={formatTokenBreakdownValue(
              stats.monthlySpendingBreakdown,
              stats.monthlySpending
            )}
            description="Executed in the last 30 days"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatsCard
            title="Upcoming Commitments"
            value={formatTokenBreakdownValue(
              stats.upcomingCommitmentBreakdown,
              summary.upcomingValue
            )}
            description={`${upcomingPayments.length} scheduled payments ahead`}
            icon={<CalendarClock className="h-4 w-4" />}
          />
        </motion.section>

        <motion.section
          {...sectionMotion}
          transition={{ ...sectionMotion.transition, delay: 0.08 }}
          className="grid gap-4 xl:grid-cols-3"
        >
          <ChartCard
            title="Payment Activity"
            description="Executed outgoing and incoming flow over the selected window."
            chartType="bar"
            data={activityChart}
            className="xl:col-span-2"
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onRefresh={refresh}
            onExport={handleExport}
          />
          <ChartCard
            title="Schedule Health"
            description="Current mix of active, completed, and cancelled schedules."
            chartType="doughnut"
            data={scheduleHealthChart}
            showControls={false}
          />
        </motion.section>

        <motion.section
          {...sectionMotion}
          transition={{ ...sectionMotion.transition, delay: 0.12 }}
          className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]"
        >
          <ChartCard
            title="Upcoming Commitments"
            description="Projected payment amounts by the next due windows."
            chartType="line"
            data={upcomingCommitmentChart}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            showControls={false}
          />
          <TokenDistributionCard
            tokens={tokenDistribution}
            onExport={handleExport}
            onTokenClick={() => router.push("/dashboard/payments")}
          />
        </motion.section>

        <motion.section
          {...sectionMotion}
          transition={{ ...sectionMotion.transition, delay: 0.16 }}
          className="grid gap-4 xl:grid-cols-[1.25fr,0.95fr]"
        >
          <RecentTransactions
            transactions={recentTransactions}
            onViewAll={() => router.push("/dashboard/transactions")}
            onTransactionClick={() => router.push("/dashboard/transactions")}
          />
          <UpcomingPayments
            payments={upcomingPayments}
            onViewAll={() => router.push("/dashboard/payments")}
            onPaymentClick={() => router.push("/dashboard/payments")}
            onEditPayment={() => router.push("/dashboard/payments")}
            onCancelPayment={() => router.push("/dashboard/payments")}
          />
        </motion.section>

        <motion.section
          {...sectionMotion}
          transition={{ ...sectionMotion.transition, delay: 0.2 }}
          className="grid gap-4 lg:grid-cols-3"
        >
          <div className="section-subtle">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Capital locked</div>
                <div className="mt-0.5 text-xl font-semibold text-white">{formatSol(walletSolBalance)}</div>
              </div>
            </div>
          </div>
          <div className="section-subtle">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Upcoming</div>
                <div className="mt-0.5 text-xl font-semibold text-white">{upcomingPayments.length}</div>
              </div>
            </div>
          </div>
          <div className="section-subtle">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Health</div>
                <div className="mt-0.5 text-xl font-semibold text-white">{stats.successRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </motion.section>
    </div>
  );
}
