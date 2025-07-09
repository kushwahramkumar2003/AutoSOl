/*eslint no-unused-vars: "error"*/

import { AutoSolProgram } from "./program";
import { PublicKey } from "@solana/web3.js";
import { ScheduleStatus } from "./program";

interface Schedule {
  address: { toString(): string };
  data: {
    status: unknown;
    createdAt: { toNumber(): number };
    totalAmount: { toNumber(): number };
    paymentAmount: { toNumber(): number };
    payments: Payment[];
    recipient: { toString(): string };
    owner: { toString(): string };
    memo?: string;
  };
}

interface Payment {
  executed: boolean;
  executionTime: { toNumber(): number };
  scheduledTime: { toNumber(): number };
  txSignature?: { toString(): string };
}

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

export interface DashboardData {
  stats: DashboardStats;
  paymentActivity: PaymentActivity;
  recentTransactions: Transaction[];
  upcomingPayments: UpcomingPayment[];
  tokenDistribution: TokenDistribution[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLocalSchedule(swa: any): Schedule {
  return {
    address: { toString: () => swa.address.toString() },
    data: {
      ...swa.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payments: swa.data.payments.map((p: any) => ({
        ...p,
        txSignature: p.txSignature
          ? { toString: () => p.txSignature.toString() }
          : undefined,
      })),
      recipient: { toString: () => swa.data.recipient.toString() },
      owner: { toString: () => swa.data.owner.toString() },
    },
  };
}

export class DashboardService {
  private program: AutoSolProgram;

  constructor(program: AutoSolProgram) {
    this.program = program;
  }

  /**
   * Fetch all dashboard data from the blockchain
   * In the future, this can be easily replaced with API calls to your backend
   */
  async fetchDashboardData(userAddress: PublicKey): Promise<DashboardData> {
    try {
      // Fetch all schedules for the current user
      const [outgoingSchedules, incomingSchedules] = await Promise.all([
        this.program.getSchedulesForOwner(userAddress),
        this.program.getSchedulesForRecipient(userAddress),
      ]);

      const localOutgoing = outgoingSchedules.map(toLocalSchedule);
      const localIncoming = incomingSchedules.map(toLocalSchedule);

      // Calculate all dashboard components
      const stats = this.calculateStats(localOutgoing, localIncoming);
      const paymentActivity = this.calculatePaymentActivity(
        localOutgoing,
        localIncoming
      );
      const recentTransactions = this.getRecentTransactions(
        localOutgoing,
        localIncoming
      );
      const upcomingPayments = this.getUpcomingPayments(localOutgoing);
      const tokenDistribution = this.getTokenDistribution(
        localOutgoing,
        localIncoming
      );

      return {
        stats,
        paymentActivity,
        recentTransactions,
        upcomingPayments,
        tokenDistribution,
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw new Error("Failed to fetch dashboard data");
    }
  }

  /**
   * Calculate dashboard statistics
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateStats(
    outgoingSchedules: Schedule[],
    _incomingSchedules: Schedule[]
  ): DashboardStats {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let activePayments = 0;
    let totalScheduled = 0;
    let totalCompleted = 0;
    let totalCancelled = 0;
    let monthlySpending = 0;
    let successfulPayments = 0;
    let totalPayments = 0;

    console.log(_incomingSchedules);

    // Process outgoing schedules
    outgoingSchedules.forEach((schedule) => {
      const status = (
        schedule as {
          data: { status: unknown; createdAt: { toNumber: () => number } };
        }
      ).data.status;
      const createdAt = new Date(
        (
          schedule as { data: { createdAt: { toNumber: () => number } } }
        ).data.createdAt.toNumber() * 1000
      );

      if (status === ScheduleStatus.Active) {
        activePayments++;
        totalScheduled +=
          (
            schedule as { data: { totalAmount: { toNumber: () => number } } }
          ).data.totalAmount.toNumber() / 1e9; // Convert lamports to SOL
      } else if (status === ScheduleStatus.Completed) {
        totalCompleted +=
          (
            schedule as { data: { totalAmount: { toNumber: () => number } } }
          ).data.totalAmount.toNumber() / 1e9;
      } else if (status === ScheduleStatus.Cancelled) {
        totalCancelled +=
          (
            schedule as { data: { totalAmount: { toNumber: () => number } } }
          ).data.totalAmount.toNumber() / 1e9;
      }

      // Calculate monthly spending
      if (createdAt >= thirtyDaysAgo) {
        monthlySpending +=
          (
            schedule as { data: { totalAmount: { toNumber: () => number } } }
          ).data.totalAmount.toNumber() / 1e9;
      }

      // Calculate success rate
      const executedPayments = (
        schedule as { data: { payments: { executed: boolean }[] } }
      ).data.payments.filter((p: { executed: boolean }) => p.executed).length;
      const totalScheduledPayments = (
        schedule as { data: { payments: unknown[] } }
      ).data.payments.length;

      successfulPayments += executedPayments;
      totalPayments += totalScheduledPayments;
    });

    const successRate =
      totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    return {
      totalBalance: totalScheduled + totalCompleted, // This would need to be fetched from wallet balance
      activePayments,
      monthlySpending,
      successRate: Math.round(successRate * 100) / 100,
      totalScheduled,
      totalCompleted,
      totalCancelled,
    };
  }

  /**
   * Calculate payment activity for charts
   */
  private calculatePaymentActivity(
    outgoingSchedules: Schedule[],
    incomingSchedules: Schedule[]
  ): PaymentActivity {
    const now = new Date();
    const labels = [];
    const outgoingData = [];
    const incomingData = [];

    // Generate last 7 days labels
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));

      // Count payments for this day
      let outgoingCount = 0;
      let incomingCount = 0;

      outgoingSchedules.forEach((schedule) => {
        (schedule as Schedule).data.payments.forEach((payment: Payment) => {
          if (payment.executed) {
            const paymentDate = new Date(
              payment.executionTime.toNumber() * 1000
            );
            if (paymentDate.toDateString() === date.toDateString()) {
              outgoingCount++;
            }
          }
        });
      });

      incomingSchedules.forEach((schedule) => {
        (schedule as Schedule).data.payments.forEach((payment: Payment) => {
          if (payment.executed) {
            const paymentDate = new Date(
              payment.executionTime.toNumber() * 1000
            );
            if (paymentDate.toDateString() === date.toDateString()) {
              incomingCount++;
            }
          }
        });
      });

      outgoingData.push(outgoingCount);
      incomingData.push(incomingCount);
    }

    return {
      labels,
      datasets: [
        {
          label: "Outgoing",
          data: outgoingData,
          backgroundColor: "#6E56CF",
        },
        {
          label: "Incoming",
          data: incomingData,
          backgroundColor: "#10B981",
        },
      ],
    };
  }

  /**
   * Get recent transactions
   */
  private getRecentTransactions(
    outgoingSchedules: Schedule[],
    incomingSchedules: Schedule[]
  ): Transaction[] {
    const transactions: Transaction[] = [];

    // Process outgoing schedules
    outgoingSchedules.forEach((schedule) => {
      (schedule as Schedule).data.payments.forEach(
        (payment: Payment, index: number) => {
          if (payment.executed) {
            transactions.push({
              id: `${(schedule as Schedule).address.toString()}-${index}`,
              type: "outgoing",
              amount:
                (schedule as Schedule).data.paymentAmount.toNumber() / 1e9,
              token: "SOL", // This would need to be fetched from the actual token data
              recipient:
                (schedule as Schedule).data.memo ||
                `Recipient ${(schedule as Schedule).data.recipient.toString().slice(0, 4)}...`,
              date: new Date(
                payment.executionTime.toNumber() * 1000
              ).toLocaleString(),
              status: "completed",
              txSignature: payment.txSignature?.toString(),
            });
          }
        }
      );
    });

    // Process incoming schedules
    incomingSchedules.forEach((schedule) => {
      (schedule as Schedule).data.payments.forEach(
        (payment: Payment, index: number) => {
          if (payment.executed) {
            transactions.push({
              id: `${(schedule as Schedule).address.toString()}-${index}`,
              type: "incoming",
              amount:
                (schedule as Schedule).data.paymentAmount.toNumber() / 1e9,
              token: "SOL",
              recipient:
                (schedule as Schedule).data.memo ||
                `From ${(schedule as Schedule).data.owner.toString().slice(0, 4)}...`,
              date: new Date(
                payment.executionTime.toNumber() * 1000
              ).toLocaleString(),
              status: "completed",
              txSignature: payment.txSignature?.toString(),
            });
          }
        }
      );
    });

    // Sort by date (most recent first) and take top 10
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  /**
   * Get upcoming payments
   */
  private getUpcomingPayments(
    outgoingSchedules: Schedule[]
  ): UpcomingPayment[] {
    const upcomingPayments: UpcomingPayment[] = [];
    const now = new Date();

    outgoingSchedules.forEach((schedule) => {
      if ((schedule as Schedule).data.status === ScheduleStatus.Active) {
        // Find the next payment
        const nextPayment = (schedule as Schedule).data.payments.find(
          (payment: Payment) =>
            !payment.executed &&
            new Date(payment.scheduledTime.toNumber() * 1000) > now
        );

        if (nextPayment) {
          upcomingPayments.push({
            id: (schedule as Schedule).address.toString(),
            recipient:
              (schedule as Schedule).data.memo ||
              `Recipient ${(schedule as Schedule).data.recipient.toString().slice(0, 4)}...`,
            amount: (schedule as Schedule).data.paymentAmount.toNumber() / 1e9,
            token: "SOL",
            nextDate: new Date(
              nextPayment.scheduledTime.toNumber() * 1000
            ).toLocaleDateString(),
            frequency: "recurring", // This would need to be calculated from the schedule
            scheduleAddress: (schedule as Schedule).address.toString(),
          });
        }
      }
    });

    // Sort by next payment date and take top 5
    return upcomingPayments
      .sort(
        (a, b) =>
          new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime()
      )
      .slice(0, 5);
  }

  /**
   * Get token distribution
   */
  private getTokenDistribution(
    outgoingSchedules: Schedule[],
    incomingSchedules: Schedule[]
  ): TokenDistribution[] {
    // For now, we'll assume all payments are in SOL
    // In the future, this would need to be calculated based on actual token data
    let totalOutgoing = 0;
    let totalIncoming = 0;

    outgoingSchedules.forEach((schedule) => {
      totalOutgoing += (schedule as Schedule).data.totalAmount.toNumber() / 1e9;
    });

    incomingSchedules.forEach((schedule) => {
      totalIncoming += (schedule as Schedule).data.totalAmount.toNumber() / 1e9;
    });

    const total = totalOutgoing + totalIncoming;

    return [
      {
        name: "Solana",
        symbol: "SOL",
        amount: total,
        value: total * 100, // Assuming SOL price of $100
        color: "#9945FF",
        percentage: 100,
      },
    ];
  }

  /**
   * Future: Replace blockchain calls with API calls
   * This method shows how you can easily migrate to a backend API
   */
  async fetchDashboardDataFromAPI(userAddress: string): Promise<DashboardData> {
    // Example of how to migrate to backend API
    const response = await fetch(`/api/dashboard/${userAddress}`);
    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data from API");
    }
    return response.json();
  }
}
