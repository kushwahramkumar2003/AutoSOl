import { useState, useEffect } from "react";
import { useProgram } from "./use-program";
import { useWallet } from "@solana/wallet-adapter-react";
import { DashboardService, DashboardData } from "@/lib/dashboard-service";

export interface DashboardStats {
  totalBalance: number;
  activePayments: number;
  monthlySpending: number;
  successRate: number;
  totalScheduled: number;
  totalCompleted: number;
  totalCancelled: number;
}

export interface PaymentActivity {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
}

export interface Transaction {
  id: string;
  type: "outgoing" | "incoming";
  amount: number;
  token: string;
  recipient: string;
  date: string;
  status: "completed" | "pending" | "failed";
  txSignature?: string;
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

export interface TokenDistribution {
  name: string;
  symbol: string;
  amount: number;
  value: number;
  color: string;
  percentage: number;
}

export interface DashboardDataWithState extends DashboardData {
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardDataWithState {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const [data, setData] = useState<DashboardDataWithState>({
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
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!program || !publicKey) {
        setData((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        // Create dashboard service instance
        const dashboardService = new DashboardService(program);

        // Fetch all dashboard data
        const dashboardData =
          await dashboardService.fetchDashboardData(publicKey);

        setData({
          ...dashboardData,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch dashboard data",
        }));
      }
    };

    fetchDashboardData();
  }, [program, publicKey]);

  return data;
}
