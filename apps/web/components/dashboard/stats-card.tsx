import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    period?: string;
  };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value === 0) {
      return <Minus className="h-3.5 w-3.5 text-slate-400" />;
    }

    return trend.isPositive ? (
      <TrendingUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5 text-slate-300" />
    );
  };

  const getTrendColor = () => {
    if (!trend || trend.value === 0) return "text-slate-400";
    return trend.isPositive ? "text-primary" : "text-slate-300";
  };

  return (
    <Card
      className={cn(
        "glass-panel rounded-[28px] border-white/[0.06] text-white shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.03]",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          {title}
        </CardTitle>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100">
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-3xl font-semibold tracking-tight text-white">
              {value}
            </div>
            {description ? (
              <p className="text-sm text-slate-400">{description}</p>
            ) : null}
          </div>
          {trend ? (
            <div className="mb-1 flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1">
              {getTrendIcon()}
              <span className={cn("text-xs font-medium", getTrendColor())}>
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              {trend.period ? (
                <span className="hidden text-xs text-slate-500 sm:inline">
                  {trend.period}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
