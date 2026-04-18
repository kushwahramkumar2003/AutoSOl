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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Doughnut } from "react-chartjs-2";
import { Download, Eye, PieChart } from "lucide-react";
import type { TokenDistribution } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

interface TokenDistributionProps {
  tokens: TokenDistribution[];
  className?: string;
  showChart?: boolean;
  showControls?: boolean;
  onTokenClick?: (token: TokenDistribution) => void;
  onExport?: () => void;
}

export function TokenDistributionCard({
  tokens,
  className,
  showChart = true,
  showControls = true,
  onTokenClick,
  onExport,
}: TokenDistributionProps) {
  const [sortBy, setSortBy] = useState<string>("value");
  const [viewMode, setViewMode] = useState<"chart" | "list">("chart");

  const normalizedTokens = useMemo(
    () =>
      tokens.map((token, index) => ({
        ...token,
        name: token.name ?? token.symbol ?? `Token ${index + 1}`,
        symbol: token.symbol ?? token.name ?? "TOKEN",
        amount: Number(token.amount ?? 0),
        value: Number(token.value ?? token.amount ?? 0),
        percentage: Number(token.percentage ?? 0),
        color: token.color ?? "#2563eb",
      })),
    [tokens]
  );

  const sortedTokens = useMemo(() => {
    return [...normalizedTokens].sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "percentage":
          return b.percentage - a.percentage;
        case "name":
          return a.name.localeCompare(b.name);
        case "value":
        default:
          return b.value - a.value;
      }
    });
  }, [normalizedTokens, sortBy]);

  const chartData = {
    labels: sortedTokens.map((token) => token.name),
    datasets: [
      {
        data: sortedTokens.map((token) => token.value),
        backgroundColor: sortedTokens.map((token) => token.color),
        borderWidth: 0,
      },
    ],
  };

  const totalValue = normalizedTokens.reduce((sum, token) => sum + token.value, 0);
  const totalAmount = normalizedTokens.reduce((sum, token) => sum + token.amount, 0);

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
              Capital Allocation
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              How your scheduled capital is currently distributed.
            </CardDescription>
          </div>
          {showControls ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={viewMode}
                onValueChange={(value: "chart" | "list") => setViewMode(value)}
              >
                <SelectTrigger className="w-32 border-white/10 bg-white/[0.04] text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black text-slate-100">
                  <SelectItem value="chart">Chart view</SelectItem>
                  <SelectItem value="list">List view</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 border-white/10 bg-white/[0.04] text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-black text-slate-100">
                  <SelectItem value="value">Sort by value</SelectItem>
                  <SelectItem value="amount">Sort by amount</SelectItem>
                  <SelectItem value="percentage">Sort by share</SelectItem>
                  <SelectItem value="name">Sort by name</SelectItem>
                </SelectContent>
              </Select>
              {onExport ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:text-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {normalizedTokens.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05]">
              <PieChart className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-200">
              No allocation data yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Scheduled payments will appear here when your dashboard has active flow.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] px-5 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total value
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {totalValue.toFixed(2)}
                  {normalizedTokens.length === 1
                    ? ` ${normalizedTokens[0]!.symbol}`
                    : " total"}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] px-5 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total amount
                </div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {totalAmount.toFixed(2)}
                  {normalizedTokens.length === 1
                    ? ` ${normalizedTokens[0]!.symbol}`
                    : " total"}
                </div>
              </div>
            </div>

            {showChart && viewMode === "chart" ? (
              <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
                <div className="relative mx-auto h-[260px] w-[260px]">
                  <Doughnut
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "68%",
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "#020617",
                          borderColor: "rgba(148, 163, 184, 0.16)",
                          borderWidth: 1,
                          titleColor: "#f8fafc",
                          bodyColor: "#cbd5e1",
                        },
                      },
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-semibold text-white">
                        {normalizedTokens.length}
                      </div>
                      <div className="text-sm text-slate-500">segments</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {sortedTokens.map((token) => (
                    <div
                      key={token.name}
                      className={cn(
                        "flex items-center justify-between rounded-[22px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-colors",
                        onTokenClick && "cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04]"
                      )}
                      onClick={() => onTokenClick?.(token)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: token.color }}
                        />
                        <div>
                          <div className="font-medium text-white">{token.name}</div>
                          <div className="text-sm text-slate-500">
                            {token.amount.toFixed(2)} {token.symbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {token.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-500">
                          {token.value.toFixed(2)} {token.symbol}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {viewMode === "list" ? (
              <div className="space-y-3">
                {sortedTokens.map((token) => (
                  <div
                    key={token.name}
                    className="flex items-center justify-between rounded-[22px] border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold text-white"
                        style={{ backgroundColor: token.color }}
                      >
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{token.name}</div>
                        <div className="text-sm text-slate-500">
                          {token.amount.toFixed(2)} {token.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="border-white/10 bg-white/[0.05] text-slate-200">
                        {token.percentage.toFixed(1)}%
                      </Badge>
                      {onTokenClick ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white"
                          onClick={() => onTokenClick(token)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
