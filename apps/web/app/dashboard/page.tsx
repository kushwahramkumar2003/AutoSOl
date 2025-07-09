"use client";

import { useState, useCallback } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { TokenDistributionCard } from "@/components/dashboard/token-distribution";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CreditCard,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Settings,
  Bell,
  Download,
  BarChart3,
  LineChart,
  Users,
  Wallet,
  Zap,
  Target,
  Award,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Register Chart.js components
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

// Types for callback functions
interface Transaction {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  type: "incoming" | "outgoing";
  status: string;
  date: string;
}

interface Payment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  frequency: string;
  nextDate: string;
}

interface Token {
  symbol: string;
  amount: number;
  value: number;
  color: string;
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
  } = useDashboardData();

  const [timeRange, setTimeRange] = useState("7d");
  const [chartLoading, setChartLoading] = useState(false);

  const handleRefresh = useCallback(() => {
    setChartLoading(true);
    // Simulate refresh
    setTimeout(() => setChartLoading(false), 1000);
  }, []);

  const handleExport = useCallback(() => {
    // Export functionality
    console.log("Exporting dashboard data...");
  }, []);

  const handleTransactionClick = useCallback((transaction: Transaction) => {
    console.log("Transaction clicked:", transaction);
  }, []);

  const handlePaymentClick = useCallback((payment: Payment) => {
    console.log("Payment clicked:", payment);
  }, []);

  const handleTokenClick = useCallback((token: Token) => {
    console.log("Token clicked:", token);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Enhanced payment activity data with more time ranges
  const enhancedPaymentActivity = {
    ...paymentActivity,
    datasets: paymentActivity.datasets.map((dataset) => ({
      ...dataset,
      borderColor: dataset.backgroundColor,
      borderWidth: 2,
      tension: 0.4,
    })),
  };

  // Success rate chart data
  const successRateData = {
    labels: paymentActivity.labels,
    datasets: [
      {
        label: "Success Rate",
        data: paymentActivity.labels.map(() => Math.random() * 20 + 80), // Mock data
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Spending trend data
  const spendingTrendData = {
    labels: paymentActivity.labels,
    datasets: [
      {
        label: "Daily Spending",
        data: paymentActivity.labels.map(() => Math.random() * 10 + 5), // Mock data
        borderColor: "#6E56CF",
        backgroundColor: "rgba(110, 86, 207, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your payment schedules and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={chartLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", chartLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => {
              router.push("/payments/new");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Payments"
          value={stats.activePayments.toString()}
          description={`${stats.totalScheduled.toFixed(2)} SOL scheduled`}
          icon={<Activity className="h-4 w-4" />}
          trend={{ value: 8.2, isPositive: true, period: "vs last week" }}
        />

        <StatsCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          description={`${stats.totalCompleted} completed payments`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: 2.1, isPositive: true, period: "vs last month" }}
          variant="success"
        />

        <StatsCard
          title="Monthly Spending"
          value={`${stats.monthlySpending.toFixed(2)} SOL`}
          description="Last 30 days"
          icon={<CreditCard className="h-4 w-4" />}
          trend={{ value: 15.3, isPositive: false, period: "vs last month" }}
          variant="warning"
        />
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <ChartCard
          title="Payment Activity"
          description="Incoming vs Outgoing payments"
          chartType="bar"
          data={enhancedPaymentActivity}
          className="col-span-4"
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={handleRefresh}
          onExport={handleExport}
          loading={chartLoading}
        />

        <div className="col-span-3 space-y-4">
          <ChartCard
            title="Success Rate Trend"
            description="Payment success over time"
            chartType="line"
            data={successRateData}
            showControls={false}
          />

          <ChartCard
            title="Spending Trend"
            description="Daily spending pattern"
            chartType="line"
            data={spendingTrendData}
            showControls={false}
          />
        </div>
      </div>

      {/* Token Distribution and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <TokenDistributionCard
          tokens={tokenDistribution}
          className="md:col-span-2"
          onTokenClick={handleTokenClick}
          onExport={handleExport}
        />

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create New Schedule
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Recipients
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Payment Settings
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs Section */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4">
          <TabsTrigger
            value="transactions"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Recent Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Upcoming Payments</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center space-x-2"
          >
            <LineChart className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <RecentTransactions
            transactions={recentTransactions}
            onTransactionClick={handleTransactionClick}
            onViewAll={() => console.log("View all transactions")}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <UpcomingPayments
            payments={upcomingPayments}
            onPaymentClick={handlePaymentClick}
            onEditPayment={(payment) => console.log("Edit payment:", payment)}
            onCancelPayment={(payment) =>
              console.log("Cancel payment:", payment)
            }
            onViewAll={() => console.log("View all payments")}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Payment Performance
                </CardTitle>
                <CardDescription>Key metrics and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Success Rate
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.activePayments}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Schedules
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Scheduled</span>
                    <span className="text-sm font-medium">
                      {stats.totalScheduled.toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Completed</span>
                    <span className="text-sm font-medium">
                      {stats.totalCompleted.toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Cancelled</span>
                    <span className="text-sm font-medium">
                      {stats.totalCancelled.toFixed(2)} SOL
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest payment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 3).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center space-x-3"
                    >
                      <div
                        className={cn(
                          "p-2 rounded-full",
                          transaction.type === "outgoing"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        )}
                      >
                        {transaction.type === "outgoing" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {transaction.recipient}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {transaction.type === "outgoing" ? "-" : "+"}
                          {transaction.amount.toFixed(4)} {transaction.token}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-600" />
                  Top Recipients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 3).map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {transaction.recipient}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.amount.toFixed(4)} {transaction.token}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.activePayments}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Schedules
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Success Rate
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Wallet className="h-5 w-5 mr-2 text-purple-600" />
                  Balance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Balance</span>
                    <span className="text-sm font-medium">
                      {stats.totalBalance.toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Scheduled</span>
                    <span className="text-sm font-medium">
                      {stats.totalScheduled.toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Available</span>
                    <span className="text-sm font-medium text-green-600">
                      {(stats.totalBalance - stats.totalScheduled).toFixed(2)}{" "}
                      SOL
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Scheduled
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalScheduled.toFixed(2)} SOL
            </div>
            <p className="text-xs text-muted-foreground">
              Across {stats.activePayments} active schedules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCompleted.toFixed(2)} SOL
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCancelled.toFixed(2)} SOL
            </div>
            <p className="text-xs text-muted-foreground">Cancelled schedules</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
