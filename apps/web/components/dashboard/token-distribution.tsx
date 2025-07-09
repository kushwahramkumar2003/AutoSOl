"use client";

import { useState, useMemo } from "react";
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
import {
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  PieChart,
} from "lucide-react";
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

  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      switch (sortBy) {
        case "value":
          return b.value - a.value;
        case "amount":
          return b.amount - a.amount;
        case "percentage":
          return b.percentage - a.percentage;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [tokens, sortBy]);

  const chartData = {
    labels: sortedTokens.map((token) => token.symbol),
    datasets: [
      {
        data: sortedTokens.map((token) => token.amount),
        backgroundColor: sortedTokens.map((token) => token.color),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: unknown) => {
            const dataIndex = (context as { dataIndex: number }).dataIndex;
            const token = sortedTokens[dataIndex];
            return [
              `${token.name} (${token.symbol})`,
              `Amount: ${token.amount.toFixed(4)}`,
              `Value: $${token.value.toFixed(2)}`,
              `Percentage: ${token.percentage.toFixed(1)}%`,
            ];
          },
        },
      },
    },
  };

  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
  const totalAmount = tokens.reduce((sum, token) => sum + token.amount, 0);

  const getValueChange = (token: TokenDistribution) => {
    // Mock data - in real app, this would come from historical data
    // Use token symbol to generate consistent random value
    const seed = token.symbol.charCodeAt(0) + token.symbol.charCodeAt(1);
    const change = (seed % 20) - 10; // Random change between -10% and +10%
    return {
      value: Math.abs(change),
      isPositive: change > 0,
    };
  };

  return (
    <Card
      className={cn("transition-all duration-200 hover:shadow-md", className)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Token Distribution
            </CardTitle>
            <CardDescription>
              Distribution of your scheduled payments
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {showControls && (
              <>
                <Select
                  value={viewMode}
                  onValueChange={(value: "chart" | "list") =>
                    setViewMode(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chart">Chart View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Sort by Value</SelectItem>
                    <SelectItem value="amount">Sort by Amount</SelectItem>
                    <SelectItem value="percentage">Sort by %</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                  </SelectContent>
                </Select>
                {onExport && (
                  <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {tokens.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <PieChart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No tokens found</p>
            <p className="text-sm text-muted-foreground">
              No scheduled payments to display
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${totalValue.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {totalAmount.toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Amount
                </div>
              </div>
            </div>

            {/* Chart View */}
            {showChart && viewMode === "chart" && (
              <div className="relative">
                <div className="h-64">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tokens.length}</div>
                    <div className="text-sm text-muted-foreground">Tokens</div>
                  </div>
                </div>
              </div>
            )}

            {/* Token List */}
            <div className="space-y-3">
              {sortedTokens.map((token) => {
                const change = getValueChange(token);

                return (
                  <div
                    key={token.symbol}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg transition-all duration-200 hover:bg-muted/50",
                      onTokenClick && "cursor-pointer"
                    )}
                    onClick={() => onTokenClick?.(token)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: token.color }}
                      >
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{token.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {token.symbol}
                          </Badge>
                          <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {token.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {token.amount.toFixed(4)} {token.symbol}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <p className="text-sm text-muted-foreground">
                            ${token.value.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-medium">
                          ${token.value.toFixed(2)}
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
                          {change.isPositive ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span
                            className={cn(
                              change.isPositive
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {change.isPositive ? "+" : "-"}
                            {change.value.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {onTokenClick && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTokenClick(token);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Stats */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-medium">{tokens.length}</div>
                  <div className="text-muted-foreground">Total Tokens</div>
                </div>
                <div>
                  <div className="font-medium">${totalValue.toFixed(2)}</div>
                  <div className="text-muted-foreground">Total Value</div>
                </div>
                <div>
                  <div className="font-medium">{totalAmount.toFixed(4)}</div>
                  <div className="text-muted-foreground">Total Amount</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
