import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/use-program";
import {
  DashboardData,
  PaymentActivity,
  TokenAmountBreakdown,
  TokenDistribution,
} from "@/lib/dashboard-service";
import {
  fetchDashboardDataResilient,
  type DataSource,
} from "@/lib/resilient-data";

export interface DashboardStats {
  totalBalance: number;
  activePayments: number;
  monthlySpending: number;
  successRate: number;
  totalScheduled: number;
  totalCompleted: number;
  totalCancelled: number;
  monthlySpendingBreakdown?: TokenAmountBreakdown[];
  activeCommitmentBreakdown?: TokenAmountBreakdown[];
  upcomingCommitmentBreakdown?: TokenAmountBreakdown[];
}

export interface Transaction {
  id: string;
  type: "outgoing" | "incoming";
  amount: number;
  token: string;
  recipient: string;
  date: string;
  status: "completed" | "pending" | "failed";
  executorAddress?: string;
}

export interface UpcomingPayment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  nextDate: string;
  frequency: string;
  scheduleAddress: string;
}

export type { TokenDistribution };

export interface DashboardDataWithState extends DashboardData {
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  source: DataSource | null;
  walletSolBalance: number;
  refresh: () => void;
}

const initialState: Omit<DashboardDataWithState, "refresh"> = {
  stats: {
    totalBalance: 0,
    activePayments: 0,
    monthlySpending: 0,
    successRate: 0,
    totalScheduled: 0,
    totalCompleted: 0,
    totalCancelled: 0,
  },
  paymentActivity: {
    labels: [],
    datasets: [],
  },
  recentTransactions: [],
  upcomingPayments: [],
  tokenDistribution: [],
  loading: true,
  error: null,
  lastUpdated: null,
  source: null,
  walletSolBalance: 0,
};

function buildFallbackActivity(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): PaymentActivity {
  const labels: string[] = [];
  const outgoingData: number[] = [];
  const incomingData: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const target = new Date(referenceDate);
    target.setDate(referenceDate.getDate() - i);

    labels.push(
      target.toLocaleDateString("en-US", {
        weekday: "short",
      })
    );

    let outgoing = 0;
    let incoming = 0;

    transactions.forEach((transaction) => {
      const txDate = new Date(transaction.date);
      if (txDate.toDateString() !== target.toDateString()) {
        return;
      }

      if (transaction.type === "outgoing") {
        outgoing += transaction.amount;
      } else {
        incoming += transaction.amount;
      }
    });

    outgoingData.push(Number(outgoing.toFixed(2)));
    incomingData.push(Number(incoming.toFixed(2)));
  }

  return {
    labels,
    datasets: [
      {
        label: "Outgoing",
        data: outgoingData,
        backgroundColor: "#2563eb",
      },
      {
        label: "Incoming",
        data: incomingData,
        backgroundColor: "#94a3b8",
      },
    ],
  };
}

function buildFallbackTokenDistribution(
  totalScheduled: number,
  monthlySpending: number
): TokenDistribution[] {
  const activeCapital = Math.max(totalScheduled, 0);

  if (activeCapital === 0) {
    return [];
  }

  return [
    {
      name: "Committed Capital",
      symbol: "SOL",
      amount: activeCapital,
      value: activeCapital,
      color: "#2563eb",
      percentage: 100,
    },
  ].filter((item) => item.amount > 0);
}

function normalizeBackendData(backendData: Partial<DashboardData>): DashboardData {
  const stats = {
    totalBalance: Number(backendData.stats?.totalBalance ?? 0),
    activePayments: Number(backendData.stats?.activePayments ?? 0),
    monthlySpending: Number(backendData.stats?.monthlySpending ?? 0),
    successRate: Number(backendData.stats?.successRate ?? 0),
    totalScheduled: Number(backendData.stats?.totalScheduled ?? 0),
    totalCompleted: Number(backendData.stats?.totalCompleted ?? 0),
    totalCancelled: Number(backendData.stats?.totalCancelled ?? 0),
    monthlySpendingBreakdown:
      backendData.stats?.monthlySpendingBreakdown?.map((item) => ({
        token: item.token,
        mint: item.mint,
        isSol: item.isSol,
        amount: Number(item.amount ?? 0),
      })) ?? [],
    activeCommitmentBreakdown:
      backendData.stats?.activeCommitmentBreakdown?.map((item) => ({
        token: item.token,
        mint: item.mint,
        isSol: item.isSol,
        amount: Number(item.amount ?? 0),
      })) ?? [],
    upcomingCommitmentBreakdown:
      backendData.stats?.upcomingCommitmentBreakdown?.map((item) => ({
        token: item.token,
        mint: item.mint,
        isSol: item.isSol,
        amount: Number(item.amount ?? 0),
      })) ?? [],
  };

  const recentTransactions =
    backendData.recentTransactions?.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount ?? 0),
      token: transaction.token || "SOL",
      recipient: transaction.recipient || "Unknown",
      date: transaction.date,
      status: transaction.status,
      executorAddress: transaction.executorAddress,
    })) || [];

  const upcomingPayments =
    backendData.upcomingPayments?.map((payment) => ({
      id: payment.id,
      recipient: payment.recipient || "Unknown",
      amount: Number(payment.amount ?? 0),
      token: payment.token || "SOL",
      nextDate: payment.nextDate,
      frequency: payment.frequency || "scheduled",
      scheduleAddress: payment.scheduleAddress || payment.id,
    })) || [];

  const paymentActivity =
    backendData.paymentActivity?.labels?.length &&
    backendData.paymentActivity.datasets?.length
      ? backendData.paymentActivity
      : buildFallbackActivity(recentTransactions);

  const tokenDistribution =
    backendData.tokenDistribution?.length
      ? backendData.tokenDistribution.map((token, index) => ({
          name: token.name ?? token.symbol ?? `Token ${index + 1}`,
          symbol: token.symbol ?? token.name ?? "TOKEN",
          amount: Number(token.amount ?? 0),
          value: Number(token.value ?? token.amount ?? 0),
          color: token.color ?? "#2563eb",
          percentage: Number(token.percentage ?? 0),
        }))
      : buildFallbackTokenDistribution(
          stats.totalScheduled,
          stats.monthlySpending
        );

  return {
    stats,
    paymentActivity,
    recentTransactions,
    upcomingPayments,
    tokenDistribution,
  };
}

export function useDashboardData(): DashboardDataWithState {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState(initialState);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      if (!publicKey) {
        if (!cancelled) setData({ ...initialState, loading: false });
        return;
      }

      if (!cancelled) setData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [result, solBalanceLamports] = await Promise.all([
          fetchDashboardDataResilient(publicKey, program),
          connection.getBalance(publicKey, "confirmed"),
        ]);
        const backendData = normalizeBackendData(result.data);
        const walletSolBalance = solBalanceLamports / 1e9;

        if (!cancelled) {
          setData({
            ...backendData,
            loading: false,
            error: result.notice,
            lastUpdated: new Date().toISOString(),
            source: result.source,
            walletSolBalance,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Failed to fetch dashboard data",
            source: prev.source,
          }));
        }
      }
    };

    fetchDashboardData();

    return () => { cancelled = true; };
  }, [connection, program, publicKey, refreshKey]);

  return {
    ...data,
    refresh: () => setRefreshKey((value) => value + 1),
  };
}
