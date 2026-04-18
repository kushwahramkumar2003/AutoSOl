"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  chartType: "bar" | "line" | "doughnut";
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      tension?: number;
      fill?: boolean;
    }>;
  };
  className?: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  loading?: boolean;
  showControls?: boolean;
}

export function ChartCard({
  title,
  description,
  chartType,
  data,
  className,
  showControls = true,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  onExport,
  loading = false,
}: ChartCardProps) {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "start" as const,
        labels: {
          color: "#cbd5e1",
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle" as const,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#020617",
        borderColor: "rgba(148, 163, 184, 0.16)",
        borderWidth: 1,
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        padding: 12,
      },
    },
    scales:
      chartType !== "doughnut"
        ? {
            x: {
              border: {
                display: false,
              },
              grid: {
                display: false,
              },
              ticks: {
                color: "#94a3b8",
              },
            },
            y: {
              beginAtZero: true,
              border: {
                display: false,
              },
              grid: {
                color: "rgba(148, 163, 184, 0.12)",
              },
              ticks: {
                color: "#94a3b8",
              },
            },
          }
        : undefined,
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return <Bar data={data} options={chartOptions} />;
      case "line":
        return <Line data={data} options={chartOptions} />;
      case "doughnut":
        return <Doughnut data={data} options={chartOptions} />;
      default:
        return <Bar data={data} options={chartOptions} />;
    }
  };

  return (
    <Card
      className={cn(
        "glass-panel rounded-[28px] border-white/[0.06] text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.03]",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-white">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="mt-1 text-slate-400">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {showControls ? (
            <div className="flex items-center gap-2">
              {timeRange && onTimeRangeChange ? (
                <Select value={timeRange} onValueChange={onTimeRangeChange}>
                  <SelectTrigger className="w-32 border-white/10 bg-white/[0.04] text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black text-slate-100">
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {onRefresh ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                  className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:text-white"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
                </Button>
              ) : null}
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
        <div className="relative">
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-slate-950/75">
              <div className="flex items-center gap-2 text-slate-200">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          ) : null}
          <div className="h-72">{renderChart()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
