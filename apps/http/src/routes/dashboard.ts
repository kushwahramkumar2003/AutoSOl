import { Router } from "express";
import { prisma } from "@autosol/db";

const router = Router();

interface TokenMeta {
  symbol: string;
  decimals: number;
}

interface TokenAmountBreakdown {
  token: string;
  mint: string;
  isSol: boolean;
  amount: number;
}

const SOL_NATIVE_MINT = "11111111111111111111111111111111";
const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
const KNOWN_TOKENS = new Map<string, TokenMeta>([
  [SOL_NATIVE_MINT, { symbol: "SOL", decimals: 9 }],
  [WRAPPED_SOL_MINT, { symbol: "SOL", decimals: 9 }],
  ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", { symbol: "USDC", decimals: 6 }],
  ["4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", { symbol: "USDC", decimals: 6 }],
  ["Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", { symbol: "USDT", decimals: 6 }],
  ["DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", { symbol: "BONK", decimals: 5 }],
  ["JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", { symbol: "JUP", decimals: 6 }],
]);

// Used to return BigInt as JSON correctly
const serializeBigInt = (obj: any) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
};

/** Pretty-print a token label for the dashboard. */
const formatTokenLabel = (mint: string, isSol: boolean): string => {
  if (isSol) return "SOL";
  const known = KNOWN_TOKENS.get(mint);
  if (known) return known.symbol;
  return mint.length > 8 ? `SPL:${mint.slice(0, 6)}` : mint;
};

const getTokenDecimals = (mint: string, isSol: boolean): number => {
  if (isSol || mint === SOL_NATIVE_MINT || mint === WRAPPED_SOL_MINT) {
    return 9;
  }

  return KNOWN_TOKENS.get(mint)?.decimals ?? 9;
};

const toUiAmount = (amount: bigint | number, mint: string, isSol: boolean): number => {
  const rawAmount = typeof amount === "bigint" ? Number(amount) : amount;
  return rawAmount / Math.pow(10, getTokenDecimals(mint, isSol));
};

const addToBreakdown = (
  map: Map<string, TokenAmountBreakdown>,
  mint: string,
  isSol: boolean,
  amount: bigint | number
) => {
  const uiAmount = toUiAmount(amount, mint, isSol);
  const existing = map.get(mint);

  if (existing) {
    existing.amount += uiAmount;
    return;
  }

  map.set(mint, {
    token: formatTokenLabel(mint, isSol),
    mint,
    isSol,
    amount: uiAmount,
  });
};

router.get("/:address", async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: "Address parameter is required" });
    }

    const dashboardData = await prisma.$transaction(async (tx) => {
      // 1. Get all schedules involving this user
      const schedules = await tx.paymentSchedule.findMany({
        where: {
          OR: [{ owner: address }, { recipient: address }],
        },
        include: {
          payments: true,
        },
      });

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // 2. Compute aggregate stats
      let activePayments = 0;
      let totalCompleted = 0;
      let totalCancelled = 0;
      let totalScheduled = 0;
      let totalBalance = 0;

      // Token distribution map: mint -> { label, totalAmount, isSol }
      const tokenMap = new Map<
        string,
        { label: string; amount: bigint; isSol: boolean }
      >();
      const activeCommitmentMap = new Map<string, TokenAmountBreakdown>();

      schedules.forEach((s) => {
        const totalAmountUi = toUiAmount(s.totalAmount, s.mint, s.isSol);
        const feeAmountUi = toUiAmount(s.feeAmount, s.mint, s.isSol);

        if (s.status === "ACTIVE") activePayments++;
        if (s.status === "COMPLETED") totalCompleted += totalAmountUi;
        if (s.status === "CANCELLED") totalCancelled += totalAmountUi;
        totalScheduled += totalAmountUi;
        totalBalance += totalAmountUi + feeAmountUi;

        // Aggregate per-token
        const label = formatTokenLabel(s.mint, s.isSol);
        const existing = tokenMap.get(s.mint);
        if (existing) {
          existing.amount += s.totalAmount;
        } else {
          tokenMap.set(s.mint, {
            label,
            amount: s.totalAmount,
            isSol: s.isSol,
          });
        }

        if (s.owner === address && s.status === "ACTIVE") {
          addToBreakdown(activeCommitmentMap, s.mint, s.isSol, s.totalAmount);
        }
      });

      const successRate =
        schedules.length > 0
          ? Math.round(
              (schedules.filter((s) => s.status === "COMPLETED").length /
                schedules.length) *
                100
            )
          : 0;

      // 3. Recent transactions
      const transactions = await tx.payment.findMany({
        where: {
          OR: [{ recipient: address }, { schedule: { owner: address } }],
        },
        orderBy: { executedAt: "desc" },
        take: 10,
        include: { schedule: true },
      });

      const monthlyOutgoingPayments = await tx.payment.findMany({
        where: {
          schedule: { owner: address },
          executedAt: { gte: thirtyDaysAgo },
        },
      });

      // 4. Upcoming payments (active schedules owned by address)
      const upcomingPayments = await tx.paymentSchedule.findMany({
        where: {
          owner: address,
          status: "ACTIVE",
          paymentsExecuted: {
            lt: prisma.paymentSchedule.fields.paymentCount,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { payments: true },
      });
      const monthlySpendingMap = new Map<string, TokenAmountBreakdown>();
      const upcomingCommitmentMap = new Map<string, TokenAmountBreakdown>();

      monthlyOutgoingPayments.forEach((payment) => {
        addToBreakdown(monthlySpendingMap, payment.mint, payment.isSol, payment.amount);
      });

      upcomingPayments.forEach((payment) => {
        addToBreakdown(
          upcomingCommitmentMap,
          payment.mint,
          payment.isSol,
          payment.paymentAmount
        );
      });

      // 5. Build token distribution array
      const totalAll = Array.from(tokenMap.values()).reduce(
        (acc, v) => acc + v.amount,
        0n
      );
      const tokenDistribution = Array.from(tokenMap.entries()).map(
        ([mint, info], idx) => {
          const colors = [
            "#2563eb",
            "#94a3b8",
            "#f59e0b",
            "#10b981",
            "#8b5cf6",
            "#ef4444",
          ];
          const pct =
            totalAll > 0n
              ? Number((info.amount * 10000n) / totalAll) / 100
              : 0;
          return {
            name: info.label,
            symbol: info.label,
            mint,
            amount: toUiAmount(info.amount, mint, info.isSol),
            percentage: pct,
            color: colors[idx % colors.length],
            isSol: info.isSol,
          };
        }
      );

      const serializeBreakdown = (map: Map<string, TokenAmountBreakdown>) =>
        Array.from(map.values()).sort((left, right) => right.amount - left.amount);

      return serializeBigInt({
        stats: {
          totalBalance,
          activePayments,
          monthlySpending:
            monthlySpendingMap.size === 1
              ? Array.from(monthlySpendingMap.values())[0]?.amount ?? 0
              : 0,
          successRate,
          totalScheduled,
          totalCompleted,
          totalCancelled,
          monthlySpendingBreakdown: serializeBreakdown(monthlySpendingMap),
          activeCommitmentBreakdown: serializeBreakdown(activeCommitmentMap),
          upcomingCommitmentBreakdown: serializeBreakdown(upcomingCommitmentMap),
        },
        recentTransactions: transactions.map((t) => ({
          id: t.id,
          type: t.schedule.owner === address ? "outgoing" : "incoming",
          amount: toUiAmount(t.amount, t.mint, t.isSol),
          token: formatTokenLabel(t.mint, t.isSol),
          mint: t.mint,
          isSol: t.isSol,
          recipient:
            t.schedule.owner === address ? t.recipient : t.schedule.owner,
          date: t.executedAt.toISOString(),
          status: "completed",
          executorAddress: t.executedBy,
        })),
        upcomingPayments: upcomingPayments.map((p) => ({
          id: p.id,
          recipient: p.recipient,
          amount: toUiAmount(p.paymentAmount, p.mint, p.isSol),
          token: formatTokenLabel(p.mint, p.isSol),
          mint: p.mint,
          isSol: p.isSol,
          nextDate: p.createdAt.toISOString(),
          frequency: "scheduled",
          scheduleAddress: p.id,
        })),
        tokenDistribution,
      });
    });

    res.json(dashboardData);
  } catch (error) {
    console.error("Error generating dashboard stats:", error);
    res.status(500).json({ error: "Internal server error fetching dashboard" });
  }
});

// ── All schedules for a wallet ──────────────────────────────────────────
router.get("/schedules/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) return res.status(400).json({ error: "Address required" });

    const schedules = await prisma.paymentSchedule.findMany({
      where: { OR: [{ owner: address }, { recipient: address }] },
      include: { payments: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = schedules.map((s) => ({
      id: s.id,
      owner: s.owner,
      recipient: s.recipient,
      token: formatTokenLabel(s.mint, s.isSol),
      mint: s.mint,
      isSol: s.isSol,
      totalAmount: Number(s.totalAmount),
      paymentAmount: Number(s.paymentAmount),
      feeAmount: Number(s.feeAmount),
      paymentCount: s.paymentCount,
      paymentsExecuted: s.paymentsExecuted,
      remainingAmount: Number(s.totalAmount) - Number(s.paymentAmount) * s.paymentsExecuted,
      status: s.status.toLowerCase(),
      createdAt: s.createdAt.toISOString(),
      memo: "", // memo is stored on-chain only
    }));

    res.json({ schedules: data });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
});

// ── All transactions for a wallet ───────────────────────────────────────
router.get("/transactions/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) return res.status(400).json({ error: "Address required" });

    const payments = await prisma.payment.findMany({
      where: {
        OR: [{ recipient: address }, { schedule: { owner: address } }],
      },
      include: { schedule: true },
      orderBy: { executedAt: "desc" },
    });

    const data = payments.map((p) => ({
      id: p.id,
      scheduleId: p.scheduleId,
      paymentIndex: p.paymentIndex,
      amount: Number(p.amount),
      token: formatTokenLabel(p.mint, p.isSol),
      mint: p.mint,
      isSol: p.isSol,
      recipient: p.recipient,
      executedAt: p.executedAt.toISOString(),
      executedBy: p.executedBy,
      signature: p.signature,
      isIncoming: p.schedule.owner !== address,
      scheduleOwner: p.schedule.owner,
      scheduleStatus: p.schedule.status.toLowerCase(),
      memo: "",
    }));

    res.json({ transactions: data });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
