import DashboardHeader from "@/components/dashboard/header";
import StatsCard from "@/components/dashboard/stats-card";
import ChartCard from "@/components/dashboard/chart-card";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import UpcomingPayments from "@/components/dashboard/upcoming-payments";
import TokenDistribution from "@/components/dashboard/token-distribution";
import {
  ArrowLeftRight,
  CalendarClock,
  TrendingUp,
  Wallet,
} from "lucide-react";

// Mock data for charts
const paymentActivityData = {
  "7d": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Outgoing",
        data: [18, 25, 12, 30, 15, 22, 10],
        backgroundColor: "#6E56CF",
      },
      {
        label: "Incoming",
        data: [15, 20, 10, 25, 12, 18, 8],
        backgroundColor: "#10B981",
      },
    ],
  },
  "30d": {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Outgoing",
        data: [85, 70, 95, 80],
        backgroundColor: "#6E56CF",
      },
      {
        label: "Incoming",
        data: [65, 80, 55, 90],
        backgroundColor: "#10B981",
      },
    ],
  },
  "90d": {
    labels: ["Jan", "Feb", "Mar"],
    datasets: [
      {
        label: "Outgoing",
        data: [250, 320, 280],
        backgroundColor: "#6E56CF",
      },
      {
        label: "Incoming",
        data: [220, 280, 260],
        backgroundColor: "#10B981",
      },
    ],
  },
  All: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      {
        label: "Outgoing",
        data: [850, 920, 880, 950],
        backgroundColor: "#6E56CF",
      },
      {
        label: "Incoming",
        data: [750, 820, 780, 850],
        backgroundColor: "#10B981",
      },
    ],
  },
};

const paymentSuccessData = {
  "7d": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Success Rate",
        data: [98, 97, 99, 100, 98, 99, 100],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  },
  "30d": {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Success Rate",
        data: [97, 98, 99, 98],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  },
  "90d": {
    labels: ["Jan", "Feb", "Mar"],
    datasets: [
      {
        label: "Success Rate",
        data: [96, 98, 99],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  },
  All: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      {
        label: "Success Rate",
        data: [95, 97, 98, 99],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  },
};

// Mock data for transactions
const transactions = [
  {
    id: "tx-001",
    type: "outgoing",
    amount: 5.2,
    token: "SOL",
    recipient: "CryptoDevs DAO",
    date: "Today, 10:30 AM",
    status: "completed",
  },
  {
    id: "tx-002",
    type: "incoming",
    amount: 100,
    token: "USDC",
    recipient: "John Smith",
    date: "Today, 09:15 AM",
    status: "completed",
  },
  {
    id: "tx-003",
    type: "outgoing",
    amount: 0.5,
    token: "SOL",
    recipient: "SolanaFM",
    date: "Yesterday, 3:45 PM",
    status: "completed",
  },
  {
    id: "tx-004",
    type: "outgoing",
    amount: 25,
    token: "USDC",
    recipient: "Solana Hosting",
    date: "Yesterday, 1:20 PM",
    status: "pending",
  },
  {
    id: "tx-005",
    type: "incoming",
    amount: 2.5,
    token: "SOL",
    recipient: "Alice Johnson",
    date: "Mar 28, 11:30 AM",
    status: "completed",
  },
];

// Mock data for upcoming payments
const upcomingPayments = [
  {
    id: "pay-001",
    recipient: "Solana Hosting",
    amount: 25,
    token: "USDC",
    nextDate: "Apr 1, 2025",
    frequency: "monthly",
  },
  {
    id: "pay-002",
    recipient: "SolanaFM",
    amount: 0.5,
    token: "SOL",
    nextDate: "Apr 2, 2025",
    frequency: "weekly",
  },
  {
    id: "pay-003",
    recipient: "CryptoDevs DAO",
    amount: 5,
    token: "SOL",
    nextDate: "Apr 5, 2025",
    frequency: "monthly",
  },
];

// Mock data for token distribution
const tokens = [
  {
    name: "Solana",
    symbol: "SOL",
    amount: 12.45,
    value: 1245.0,
    color: "#9945FF",
    percentage: 65,
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    amount: 345.67,
    value: 345.67,
    color: "#2775CA",
    percentage: 18,
  },
  {
    name: "Bonk",
    symbol: "BONK",
    amount: 1250000,
    value: 250.0,
    color: "#F7931A",
    percentage: 13,
  },
  {
    name: "Raydium",
    symbol: "RAY",
    amount: 25.5,
    value: 76.5,
    color: "#00C2CE",
    percentage: 4,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <DashboardHeader />

      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Balance"
            value="$1,917.17"
            description="Across all wallets"
            icon={<Wallet className="h-4 w-4" />}
            trend={{ value: 3.2, isPositive: true }}
          />
          <StatsCard
            title="Active Payments"
            value="8"
            description="3 due this week"
            icon={<CalendarClock className="h-4 w-4" />}
          />
          <StatsCard
            title="Monthly Spending"
            value="$432.50"
            description="15% less than last month"
            icon={<ArrowLeftRight className="h-4 w-4" />}
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Success Rate"
            value="99.2%"
            description="Last 30 days"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={{ value: 0.5, isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Payment Activity"
            description="Incoming vs Outgoing payments"
            chartType="bar"
            data={paymentActivityData}
          />
          <ChartCard
            title="Payment Success Rate"
            description="Percentage of successful payments"
            chartType="line"
            data={paymentSuccessData}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentTransactions
            transactions={transactions}
            className="lg:col-span-2"
          />
          <div className="space-y-6">
            <UpcomingPayments payments={upcomingPayments} />
            <TokenDistribution tokens={tokens} />
          </div>
        </div>
      </div>
    </div>
  );
}
