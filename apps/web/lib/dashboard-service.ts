/*eslint no-unused-vars: "error"*/

import { AutoSolProgram, PaymentType } from "./program";
import { PublicKey } from "@solana/web3.js";
import { ScheduleStatus } from "./program";
import { getTokenDecimals, getTokenLabel } from "./token-registry";

/** Resolve a human-readable token label from on-chain schedule data. */
function getTokenLabelFromSchedule(schedule: Schedule): string {
  const data = schedule.data as any;
  const paymentType = data.paymentType;
  const mint = data.mint?.toString?.() || "";
  return getTokenLabel(
    mint,
    paymentType === PaymentType.Sol || !paymentType || paymentType === "Sol"
  );
}

function getScheduleDecimals(schedule: Schedule): number {
  const data = schedule.data as any;
  const paymentType = data.paymentType;
  const mint = data.mint?.toString?.() || "";
  return getTokenDecimals(
    mint,
    paymentType === PaymentType.Sol || !paymentType || paymentType === "Sol"
  );
}

function amountToUi(schedule: Schedule, rawAmount: number): number {
  return rawAmount / Math.pow(10, getScheduleDecimals(schedule));
}

export interface TokenAmountBreakdown {
  token: string;
  mint?: string;
  isSol?: boolean;
  amount: number;
}

function addBreakdownAmount(
  map: Map<string, TokenAmountBreakdown>,
  schedule: Schedule,
  rawAmount: number
) {
  const token = getTokenLabelFromSchedule(schedule);
  const current = map.get(token);
  const amount = amountToUi(schedule, rawAmount);

  if (current) {
    current.amount += amount;
    return;
  }

  const data = schedule.data as any;
  const paymentType = data.paymentType;
  const mint = data.mint?.toString?.() || "";

  map.set(token, {
    token,
    mint,
    isSol:
      paymentType === PaymentType.Sol || !paymentType || paymentType === "Sol",
    amount,
  });
}

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
  executedBy?: { toString(): string };
}

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
        executedBy: p.executedBy
          ? { toString: () => p.executedBy.toString() }
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
      const [outgoingResult, incomingResult] = await Promise.allSettled([
        this.program.getSchedulesForOwner(userAddress),
        this.program.getSchedulesForRecipient(userAddress),
      ]);

      const outgoingSchedules =
        outgoingResult.status === "fulfilled" ? outgoingResult.value : [];
      const incomingSchedules =
        incomingResult.status === "fulfilled" ? incomingResult.value : [];

      if (
        outgoingResult.status === "rejected" &&
        incomingResult.status === "rejected"
      ) {
        throw outgoingResult.reason || incomingResult.reason;
      }

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
    incomingSchedules: Schedule[]
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
    const monthlySpendingMap = new Map<string, TokenAmountBreakdown>();
    const activeCommitmentMap = new Map<string, TokenAmountBreakdown>();
    const upcomingCommitmentMap = new Map<string, TokenAmountBreakdown>();

    // Process outgoing schedules
    outgoingSchedules.forEach((schedule) => {
      const status = (
        schedule as {
          data: { status: unknown };
        }
      ).data.status;
      const totalAmount = (
        schedule as { data: { totalAmount: { toNumber: () => number } } }
      ).data.totalAmount.toNumber();
      const paymentAmount = (
        schedule as { data: { paymentAmount: { toNumber: () => number } } }
      ).data.paymentAmount.toNumber();
      const payments = (
        schedule as { data: { payments: Payment[] } }
      ).data.payments;

      if (status === ScheduleStatus.Active) {
        activePayments++;
        totalScheduled += amountToUi(schedule, totalAmount);
        addBreakdownAmount(activeCommitmentMap, schedule, totalAmount);
      } else if (status === ScheduleStatus.Completed) {
        totalCompleted += amountToUi(schedule, totalAmount);
      } else if (status === ScheduleStatus.Cancelled) {
        totalCancelled += amountToUi(schedule, totalAmount);
      }

      // Calculate success rate
      const executedPayments = (
        schedule as { data: { payments: { executed: boolean }[] } }
      ).data.payments.filter((p: { executed: boolean }) => p.executed).length;
      const totalScheduledPayments = payments.length;

      payments.forEach((payment: Payment) => {
        if (payment.executed) {
          const paymentDate = new Date(payment.executionTime.toNumber() * 1000);
          if (paymentDate >= thirtyDaysAgo) {
            monthlySpending += amountToUi(schedule, paymentAmount);
            addBreakdownAmount(monthlySpendingMap, schedule, paymentAmount);
          }
        }
      });

      if (status === ScheduleStatus.Active) {
        const nextPendingPayment = payments.find(
          (payment: Payment) =>
            !payment.executed &&
            new Date(payment.scheduledTime.toNumber() * 1000) > now
        );

        if (nextPendingPayment) {
          addBreakdownAmount(upcomingCommitmentMap, schedule, paymentAmount);
        }
      }

      successfulPayments += executedPayments;
      totalPayments += totalScheduledPayments;
    });

    const successRate =
      totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    const incomingCommitted = incomingSchedules.reduce((sum, schedule) => {
      return sum + amountToUi(schedule, schedule.data.totalAmount.toNumber());
    }, 0);

    return {
      totalBalance: totalScheduled + totalCompleted + incomingCommitted,
      activePayments,
      monthlySpending,
      successRate: Math.round(successRate * 100) / 100,
      totalScheduled,
      totalCompleted,
      totalCancelled,
      monthlySpendingBreakdown: Array.from(monthlySpendingMap.values()).sort(
        (left, right) => right.amount - left.amount
      ),
      activeCommitmentBreakdown: Array.from(activeCommitmentMap.values()).sort(
        (left, right) => right.amount - left.amount
      ),
      upcomingCommitmentBreakdown: Array.from(upcomingCommitmentMap.values()).sort(
        (left, right) => right.amount - left.amount
      ),
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
              amount: amountToUi(
                schedule,
                (schedule as Schedule).data.paymentAmount.toNumber()
              ),
              token: getTokenLabelFromSchedule(schedule),
              recipient:
                (schedule as Schedule).data.memo ||
                `Recipient ${(schedule as Schedule).data.recipient.toString().slice(0, 4)}...`,
              date: new Date(
                payment.executionTime.toNumber() * 1000
              ).toLocaleString(),
              status: "completed",
              executorAddress: payment.executedBy?.toString(),
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
              amount: amountToUi(
                schedule,
                (schedule as Schedule).data.paymentAmount.toNumber()
              ),
              token: getTokenLabelFromSchedule(schedule),
              recipient:
                (schedule as Schedule).data.memo ||
                `From ${(schedule as Schedule).data.owner.toString().slice(0, 4)}...`,
              date: new Date(
                payment.executionTime.toNumber() * 1000
              ).toLocaleString(),
              status: "completed",
              executorAddress: payment.executedBy?.toString(),
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
            amount: amountToUi(
              schedule,
              (schedule as Schedule).data.paymentAmount.toNumber()
            ),
            token: getTokenLabelFromSchedule(schedule),
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
    // Group by token type using actual mint data
    const tokenMap = new Map<string, { label: string; outgoing: number; incoming: number }>();

    outgoingSchedules.forEach((schedule) => {
      const label = getTokenLabelFromSchedule(schedule);
      const amount = amountToUi(
        schedule,
        (schedule as Schedule).data.totalAmount.toNumber()
      );
      const existing = tokenMap.get(label);
      if (existing) {
        existing.outgoing += amount;
      } else {
        tokenMap.set(label, { label, outgoing: amount, incoming: 0 });
      }
    });

    incomingSchedules.forEach((schedule) => {
      const label = getTokenLabelFromSchedule(schedule);
      const amount = amountToUi(
        schedule,
        (schedule as Schedule).data.totalAmount.toNumber()
      );
      const existing = tokenMap.get(label);
      if (existing) {
        existing.incoming += amount;
      } else {
        tokenMap.set(label, { label, outgoing: 0, incoming: amount });
      }
    });

    const colors = ["#2563eb", "#94a3b8", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
    const totalAll = Array.from(tokenMap.values()).reduce(
      (sum, v) => sum + v.outgoing + v.incoming,
      0
    );

    if (totalAll === 0) return [];

    return Array.from(tokenMap.entries()).map(([symbol, info], idx) => {
      const amount = info.outgoing + info.incoming;
      return {
        name: info.label,
        symbol,
        amount,
        value: amount,
        color: colors[idx % colors.length] || "#2563eb",
        percentage: (amount / totalAll) * 100,
      };
    }).filter((token) => token.amount > 0);
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
