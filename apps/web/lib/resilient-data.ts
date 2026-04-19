import { LAMPORTS_PER_SOL, PublicKey, type Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { DashboardService, type DashboardData } from "@/lib/dashboard-service";
import {
  AutoSolProgram,
  PaymentCommitmentStatus,
  PaymentType,
  SchedulePolicy,
  ScheduleStatus,
} from "@/lib/program";
import {
  getTokenDecimals,
  getTokenLabel,
  getTokenLogo,
  getTokenName,
  isSolMint,
  rawTokenAmountToUi,
  WRAPPED_SOL_MINT,
} from "@/lib/token-registry";

export type DataSource = "backend" | "rpc";

export interface ResilientResult<T> {
  data: T;
  source: DataSource;
  notice: string | null;
}

export interface WalletSchedule {
  id: string;
  owner: string;
  recipient: string;
  token: string;
  mint: string;
  isSol: boolean;
  totalAmount: number;
  paymentAmount: number;
  feeAmount: number;
  paymentCount: number;
  paymentsExecuted: number;
  remainingAmount: number;
  status: string;
  schedulePolicy: string;
  proposalId: string | null;
  createdAt: string;
  memo: string;
}

export interface CommitmentProposal {
  id: string;
  owner: string;
  recipient: string;
  mint: string;
  isSol: boolean;
  paymentAmount: number;
  paymentCount: number;
  scheduleTimes: string[];
  memo: string;
  noteUri: string;
  status: string;
  acceptedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  scheduleId: string | null;
  scheduleStatus?: string | null;
}

export interface PaymentRequestProposal {
  id: string;
  requester: string;
  payer: string;
  mint: string;
  isSol: boolean;
  paymentAmount: number;
  paymentCount: number;
  scheduleTimes: string[];
  memo: string;
  noteUri: string;
  status: string;
  decisionedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  scheduleId: string | null;
  scheduleStatus?: string | null;
}

export interface WalletTransaction {
  id: string;
  scheduleId: string;
  paymentIndex: number;
  amount: number;
  token: string;
  mint: string;
  isSol: boolean;
  recipient: string;
  executedAt: string;
  executedBy: string;
  signature: string;
  isIncoming: boolean;
  scheduleOwner: string;
  scheduleStatus: string;
  memo: string;
}

export interface CalendarPayment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  mint?: string;
  isSol?: boolean;
  date: Date;
  status: "pending" | "completed" | "failed";
  scheduleAddress?: string;
}

export interface WalletToken {
  symbol: string;
  name: string;
  balance: number;
  iconUrl: string | null;
  dollarValue: number;
  mintAddress: string;
  decimals: number;
}

const BACKEND_TIMEOUT_MS = 4_000;
const BACKEND_COOLDOWN_MS = 15_000;

let backendUnavailableUntil = 0;

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
}

function getBackendFallbackNotice(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "backend request failed";
  return `Backend unavailable, showing live RPC data. ${message}`;
}

async function fetchBackendJson<T>(path: string): Promise<T> {
  if (Date.now() < backendUnavailableUntil) {
    throw new Error("backend is in cooldown");
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`backend returned ${response.status}`);
    }

    backendUnavailableUntil = 0;
    return (await response.json()) as T;
  } catch (error) {
    backendUnavailableUntil = Date.now() + BACKEND_COOLDOWN_MS;
    throw error;
  }
}

function mapScheduleStatus(status: ScheduleStatus): string {
  switch (status) {
    case ScheduleStatus.Active:
      return "active";
    case ScheduleStatus.Paused:
      return "paused";
    case ScheduleStatus.Completed:
      return "completed";
    case ScheduleStatus.Cancelled:
      return "cancelled";
    default:
      return "active";
  }
}

function toIsoDate(value: number): string {
  return new Date(value * 1000).toISOString();
}

async function getScheduleContext(address: PublicKey, program: AutoSolProgram) {
  const [ownerResult, recipientResult, feeSettingsResult] =
    await Promise.allSettled([
      program.getSchedulesForOwner(address),
      program.getSchedulesForRecipient(address),
      program.getFeeSettings(),
    ]);

  if (
    ownerResult.status === "rejected" &&
    recipientResult.status === "rejected"
  ) {
    throw ownerResult.reason || recipientResult.reason;
  }

  const ownerSchedules =
    ownerResult.status === "fulfilled" ? ownerResult.value : [];
  const recipientSchedules =
    recipientResult.status === "fulfilled" ? recipientResult.value : [];
  const feePercentage =
    feeSettingsResult.status === "fulfilled"
      ? feeSettingsResult.value.feePercentage
      : 0;

  return { ownerSchedules, recipientSchedules, feePercentage };
}

function mapRpcSchedule(
  scheduleWithAddress: Awaited<
    ReturnType<AutoSolProgram["getSchedulesForOwner"]>
  >[number],
  feePercentage: number
): WalletSchedule {
  const mint = scheduleWithAddress.data.mint.toString();
  const isSol =
    scheduleWithAddress.data.paymentType === PaymentType.Sol || isSolMint(mint);
  const totalAmount = scheduleWithAddress.data.totalAmount.toNumber();
  const paymentAmount = scheduleWithAddress.data.paymentAmount.toNumber();
  const paymentsExecuted = scheduleWithAddress.data.payments.filter(
    (payment) => payment.executed
  ).length;

  return {
    id: scheduleWithAddress.address.toString(),
    owner: scheduleWithAddress.data.owner.toString(),
    recipient: scheduleWithAddress.data.recipient.toString(),
    token: getTokenLabel(mint, isSol),
    mint,
    isSol,
    totalAmount,
    paymentAmount,
    feeAmount: Math.floor((totalAmount * feePercentage) / 10_000),
    paymentCount: scheduleWithAddress.data.payments.length,
    paymentsExecuted,
    remainingAmount: scheduleWithAddress.data.remainingAmount.toNumber(),
    status: mapScheduleStatus(scheduleWithAddress.data.status),
    schedulePolicy:
      scheduleWithAddress.data.schedulePolicy === SchedulePolicy.Commitment
        ? "commitment"
        : scheduleWithAddress.data.schedulePolicy === SchedulePolicy.Request
          ? "request"
        : "standard",
    proposalId: scheduleWithAddress.data.proposalId?.toBase58() ?? null,
    createdAt: toIsoDate(scheduleWithAddress.data.createdAt.toNumber()),
    memo: scheduleWithAddress.data.memo || "",
  };
}

function dedupeSchedules(schedules: WalletSchedule[]): WalletSchedule[] {
  const seen = new Map<string, WalletSchedule>();
  schedules.forEach((schedule) => {
    seen.set(schedule.id, schedule);
  });
  return Array.from(seen.values()).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

async function fetchSchedulesFromRpc(
  address: PublicKey,
  program: AutoSolProgram
): Promise<WalletSchedule[]> {
  const { ownerSchedules, recipientSchedules, feePercentage } =
    await getScheduleContext(address, program);

  return dedupeSchedules(
    [...ownerSchedules, ...recipientSchedules].map((schedule) =>
      mapRpcSchedule(schedule, feePercentage)
    )
  );
}

async function fetchTransactionsFromRpc(
  address: PublicKey,
  program: AutoSolProgram
): Promise<WalletTransaction[]> {
  const { ownerSchedules, recipientSchedules } = await getScheduleContext(
    address,
    program
  );

  const addressBase58 = address.toBase58();
  const transactions = new Map<string, WalletTransaction>();

  [...ownerSchedules, ...recipientSchedules].forEach((scheduleWithAddress) => {
    const scheduleAddress = scheduleWithAddress.address.toString();
    const schedule = scheduleWithAddress.data;
    const mint = schedule.mint.toString();
    const isSol =
      schedule.paymentType === PaymentType.Sol || isSolMint(mint);
    const isIncoming = schedule.owner.toBase58() !== addressBase58;

    schedule.payments.forEach((payment, paymentIndex) => {
      if (!payment.executed) {
        return;
      }

      const id = `${scheduleAddress}-${paymentIndex}`;
      transactions.set(id, {
        id,
        scheduleId: scheduleAddress,
        paymentIndex,
        amount: schedule.paymentAmount.toNumber(),
        token: getTokenLabel(mint, isSol),
        mint,
        isSol,
        recipient: schedule.recipient.toBase58(),
        executedAt: toIsoDate(payment.executionTime.toNumber()),
        executedBy: payment.executedBy?.toBase58() || "",
        signature: "",
        isIncoming,
        scheduleOwner: schedule.owner.toBase58(),
        scheduleStatus: mapScheduleStatus(schedule.status),
        memo: schedule.memo || "",
      });
    });
  });

  return Array.from(transactions.values()).sort(
    (left, right) =>
      new Date(right.executedAt).getTime() - new Date(left.executedAt).getTime()
  );
}

function mapCommitmentStatus(status: PaymentCommitmentStatus): string {
  switch (status) {
    case PaymentCommitmentStatus.Accepted:
      return "accepted";
    case PaymentCommitmentStatus.Activated:
      return "activated";
    case PaymentCommitmentStatus.Proposed:
    default:
      return "proposed";
  }
}

function deriveCommitmentStatus(
  baseStatus: string,
  scheduleStatus?: string | null
): string {
  if (baseStatus === "activated") {
    if (scheduleStatus === "completed") {
      return "completed";
    }
    if (scheduleStatus === "cancelled") {
      return "cancelled";
    }
  }

  return baseStatus;
}

async function fetchCommitmentsFromRpc(
  address: PublicKey,
  program: AutoSolProgram
): Promise<CommitmentProposal[]> {
  const { ownerSchedules, recipientSchedules } = await getScheduleContext(
    address,
    program
  );
  const scheduleStatusById = new Map<string, string>();
  [...ownerSchedules, ...recipientSchedules].forEach((scheduleWithAddress) => {
    scheduleStatusById.set(
      scheduleWithAddress.address.toBase58(),
      mapScheduleStatus(scheduleWithAddress.data.status)
    );
  });

  const [sent, received] = await Promise.all([
    program.getCommitmentProposalsForOwner(address),
    program.getCommitmentProposalsForRecipient(address),
  ]);

  const proposals = new Map<string, CommitmentProposal>();

  [...sent, ...received].forEach((proposalWithAddress) => {
    const proposal = proposalWithAddress.data;
    const scheduleId = proposal.activatedSchedule?.toBase58() ?? null;
    const scheduleStatus = scheduleId ? scheduleStatusById.get(scheduleId) ?? null : null;
    const status = deriveCommitmentStatus(
      mapCommitmentStatus(proposal.status),
      scheduleStatus
    );

    proposals.set(proposalWithAddress.address.toBase58(), {
      id: proposalWithAddress.address.toBase58(),
      owner: proposal.owner.toBase58(),
      recipient: proposal.recipient.toBase58(),
      mint: proposal.mint.toBase58(),
      isSol: proposal.paymentType === PaymentType.Sol,
      paymentAmount: proposal.paymentAmount.toNumber(),
      paymentCount: proposal.scheduleTimes.length,
      scheduleTimes: proposal.scheduleTimes.map((time) =>
        toIsoDate(time.toNumber())
      ),
      memo: proposal.memo,
      noteUri: proposal.noteUri,
      status,
      acceptedAt: proposal.acceptedAt
        ? toIsoDate(proposal.acceptedAt.toNumber())
        : null,
      activatedAt: proposal.activatedAt
        ? toIsoDate(proposal.activatedAt.toNumber())
        : null,
      createdAt: toIsoDate(proposal.createdAt.toNumber()),
      scheduleId,
      scheduleStatus,
    });
  });

  return Array.from(proposals.values()).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function mapDashboardUpcomingToCalendar(
  dashboardData: DashboardData
): CalendarPayment[] {
  const items: CalendarPayment[] = [];

  dashboardData.upcomingPayments.forEach((payment) => {
    const date = new Date(payment.nextDate);
    if (!Number.isNaN(date.getTime())) {
      items.push({
        id: payment.id || payment.scheduleAddress,
        recipient: payment.recipient,
        amount: payment.amount,
        token: payment.token,
        mint: (payment as { mint?: string }).mint,
        isSol: (payment as { isSol?: boolean }).isSol,
        date,
        status: "pending",
        scheduleAddress: payment.scheduleAddress || payment.id,
      });
    }
  });

  dashboardData.recentTransactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    if (!Number.isNaN(date.getTime())) {
      items.push({
        id: transaction.id,
        recipient: transaction.recipient,
        amount: transaction.amount,
        token: transaction.token,
        mint: (transaction as { mint?: string }).mint,
        isSol: (transaction as { isSol?: boolean }).isSol,
        date,
        status: transaction.status === "failed" ? "failed" : "completed",
      });
    }
  });

  return items.sort((left, right) => left.date.getTime() - right.date.getTime());
}

async function fetchCalendarPaymentsFromRpc(
  address: PublicKey,
  program: AutoSolProgram
): Promise<CalendarPayment[]> {
  const { ownerSchedules, recipientSchedules } = await getScheduleContext(
    address,
    program
  );

  const items = new Map<string, CalendarPayment>();
  const addressBase58 = address.toBase58();

  [...ownerSchedules, ...recipientSchedules].forEach((scheduleWithAddress) => {
    const scheduleAddress = scheduleWithAddress.address.toBase58();
    const schedule = scheduleWithAddress.data;
    const mint = schedule.mint.toBase58();
    const isSol =
      schedule.paymentType === PaymentType.Sol || isSolMint(mint);
    const token = getTokenLabel(mint, isSol);
    const amount = rawTokenAmountToUi(
      schedule.paymentAmount.toNumber(),
      mint,
      isSol
    );
    const recipient = schedule.recipient.toBase58();
    const owner = schedule.owner.toBase58();
    const counterparty = owner === addressBase58 ? recipient : owner;

    schedule.payments.forEach((payment, paymentIndex) => {
      const date = new Date(
        (payment.executed
          ? payment.executionTime.toNumber()
          : payment.scheduledTime.toNumber()) * 1000
      );

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const status: CalendarPayment["status"] = payment.executed
        ? "completed"
        : "pending";
      const id = `${scheduleAddress}-${paymentIndex}-${status}`;

      items.set(id, {
        id,
        recipient: counterparty,
        amount,
        token,
        date,
        status,
        scheduleAddress,
      });
    });
  });

  return Array.from(items.values()).sort(
    (left, right) => left.date.getTime() - right.date.getTime()
  );
}

async function fetchWalletTokensFromRpc(
  address: PublicKey,
  connection: Connection
): Promise<WalletToken[]> {
  const balances: WalletToken[] = [];

  try {
    const solLamports = await connection.getBalance(address, "confirmed");
    balances.push({
      symbol: "SOL",
      name: "Solana",
      balance: solLamports / LAMPORTS_PER_SOL,
      iconUrl: getTokenLogo(WRAPPED_SOL_MINT, true),
      dollarValue: 0,
      mintAddress: WRAPPED_SOL_MINT,
      decimals: 9,
    });
  } catch {
    // Keep going so SPL balances can still be shown.
  }

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    address,
    { programId: TOKEN_PROGRAM_ID },
    "confirmed"
  );

  tokenAccounts.value.forEach(({ account }) => {
    const tokenInfo = account.data.parsed?.info;
    if (!tokenInfo) {
      return;
    }

    const mintAddress = tokenInfo.mint as string;
    const balance = Number(tokenInfo.tokenAmount?.uiAmount ?? 0);
    const decimals =
      Number(tokenInfo.tokenAmount?.decimals ?? getTokenDecimals(mintAddress)) ||
      getTokenDecimals(mintAddress);

    if (balance <= 0) {
      return;
    }

    balances.push({
      symbol: getTokenLabel(mintAddress),
      name: getTokenName(mintAddress),
      balance,
      iconUrl: getTokenLogo(mintAddress),
      dollarValue: 0,
      mintAddress,
      decimals,
    });
  });

  return balances.sort((left, right) => {
    if (left.symbol === "SOL") {
      return -1;
    }
    if (right.symbol === "SOL") {
      return 1;
    }
    return right.balance - left.balance;
  });
}

export async function fetchDashboardDataResilient(
  address: PublicKey,
  program: AutoSolProgram | null
): Promise<ResilientResult<DashboardData>> {
  try {
    const data = await fetchBackendJson<DashboardData>(
      `/dashboard/${address.toBase58()}`
    );
    return { data, source: "backend", notice: null };
  } catch (error) {
    if (!program) {
      throw error;
    }

    const dashboardService = new DashboardService(program);
    const data = await dashboardService.fetchDashboardData(address);
    return {
      data,
      source: "rpc",
      notice: getBackendFallbackNotice(error),
    };
  }
}

export async function fetchSchedulesResilient(
  address: PublicKey,
  program: AutoSolProgram | null
): Promise<ResilientResult<WalletSchedule[]>> {
  try {
    const data = await fetchBackendJson<{ schedules: WalletSchedule[] }>(
      `/dashboard/schedules/${address.toBase58()}`
    );
    return { data: data.schedules || [], source: "backend", notice: null };
  } catch (error) {
    if (!program) {
      throw error;
    }

    const schedules = await fetchSchedulesFromRpc(address, program);
    return {
      data: schedules,
      source: "rpc",
      notice: getBackendFallbackNotice(error),
    };
  }
}

export async function fetchTransactionsResilient(
  address: PublicKey,
  program: AutoSolProgram | null
): Promise<ResilientResult<WalletTransaction[]>> {
  try {
    const data = await fetchBackendJson<{ transactions: WalletTransaction[] }>(
      `/dashboard/transactions/${address.toBase58()}`
    );
    return {
      data: data.transactions || [],
      source: "backend",
      notice: null,
    };
  } catch (error) {
    if (!program) {
      throw error;
    }

    const transactions = await fetchTransactionsFromRpc(address, program);
    return {
      data: transactions,
      source: "rpc",
      notice: getBackendFallbackNotice(error),
    };
  }
}

export async function fetchCalendarPaymentsResilient(
  address: PublicKey,
  program: AutoSolProgram | null
): Promise<ResilientResult<CalendarPayment[]>> {
  if (program) {
    try {
      const items = await fetchCalendarPaymentsFromRpc(address, program);
      return {
        data: items,
        source: "rpc",
        notice: null,
      };
    } catch (error) {
      const dashboardResult = await fetchDashboardDataResilient(address, program);
      return {
        data: mapDashboardUpcomingToCalendar(dashboardResult.data),
        source: dashboardResult.source,
        notice: getBackendFallbackNotice(error),
      };
    }
  }

  const result = await fetchDashboardDataResilient(address, program);
  return {
    data: mapDashboardUpcomingToCalendar(result.data),
    source: result.source,
    notice: result.notice,
  };
}

export async function fetchWalletTokensResilient(
  address: PublicKey,
  connection: Connection
): Promise<ResilientResult<WalletToken[]>> {
  try {
    const data = await fetchBackendJson<{
      tokens: Array<{
        symbol: string;
        name: string;
        balance: number;
        logoURI: string | null;
        priceUSD: number;
        mintAddress: string;
        decimals: number;
      }>;
    }>(`/tokens/balances/${address.toBase58()}`);

    const tokens = (data.tokens || []).map((token) => ({
      symbol: token.symbol,
      name: token.name,
      balance: token.balance,
      iconUrl: token.logoURI ?? null,
      dollarValue: token.priceUSD,
      mintAddress: token.mintAddress,
      decimals: token.decimals,
    }));

    return { data: tokens, source: "backend", notice: null };
  } catch (error) {
    const tokens = await fetchWalletTokensFromRpc(address, connection);
    return {
      data: tokens,
      source: "rpc",
      notice: getBackendFallbackNotice(error),
    };
  }
}

export async function fetchCommitmentsResilient(
  address: PublicKey,
  program: AutoSolProgram | null
): Promise<ResilientResult<CommitmentProposal[]>> {
  try {
    const [sent, received] = await Promise.all([
      fetchBackendJson<{ commitments: CommitmentProposal[] }>(
        `/commitments/sent/${address.toBase58()}`
      ),
      fetchBackendJson<{ commitments: CommitmentProposal[] }>(
        `/commitments/received/${address.toBase58()}`
      ),
    ]);

    const combined = new Map<string, CommitmentProposal>();
    [...(sent.commitments || []), ...(received.commitments || [])].forEach(
      (proposal) => {
        combined.set(proposal.id, {
          ...proposal,
          status: deriveCommitmentStatus(
            proposal.status,
            (proposal as CommitmentProposal).scheduleStatus ?? null
          ),
        });
      }
    );

    return {
      data: Array.from(combined.values()).sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
      ),
      source: "backend",
      notice: null,
    };
  } catch (error) {
    if (!program) {
      throw error;
    }

    const commitments = await fetchCommitmentsFromRpc(address, program);
    return {
      data: commitments,
      source: "rpc",
      notice: getBackendFallbackNotice(error),
    };
  }
}

async function fetchRequestsFromRpc(
  address: PublicKey,
  program: AutoSolProgram
): Promise<PaymentRequestProposal[]> {
  const [sent, received] = await Promise.all([
    program.getRequestProposalsForRequester(address),
    program.getRequestProposalsForPayer(address),
  ]);

  const requests = new Map<string, PaymentRequestProposal>();
  [...sent, ...received].forEach((requestWithAddress) => {
    const request = requestWithAddress.data;
    requests.set(requestWithAddress.address.toBase58(), {
      id: requestWithAddress.address.toBase58(),
      requester: request.requester.toBase58(),
      payer: request.payer.toBase58(),
      mint: request.mint.toBase58(),
      isSol: request.paymentType === PaymentType.Sol,
      paymentAmount: request.paymentAmount.toNumber(),
      paymentCount: request.scheduleTimes.length,
      scheduleTimes: request.scheduleTimes.map((time) =>
        toIsoDate(time.toNumber())
      ),
      memo: request.memo,
      noteUri: request.noteUri,
      status: String(request.status).toLowerCase(),
      decisionedAt: request.decisionedAt
        ? toIsoDate(request.decisionedAt.toNumber())
        : null,
      acceptedAt: request.acceptedAt
        ? toIsoDate(request.acceptedAt.toNumber())
        : null,
      createdAt: toIsoDate(request.createdAt.toNumber()),
      scheduleId: request.activatedSchedule?.toBase58() ?? null,
      scheduleStatus: null,
    });
  });

  return Array.from(requests.values()).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export async function fetchRequestsResilient(
  address: PublicKey,
  program: AutoSolProgram | null
): Promise<ResilientResult<PaymentRequestProposal[]>> {
  try {
    const [sent, received] = await Promise.all([
      fetchBackendJson<{ requests: PaymentRequestProposal[] }>(
        `/requests/sent/${address.toBase58()}`
      ),
      fetchBackendJson<{ requests: PaymentRequestProposal[] }>(
        `/requests/received/${address.toBase58()}`
      ),
    ]);

    const combined = new Map<string, PaymentRequestProposal>();
    [...(sent.requests || []), ...(received.requests || [])].forEach((request) => {
      combined.set(request.id, request);
    });

    if (program) {
      try {
        const rpcRequests = await fetchRequestsFromRpc(address, program);
        rpcRequests.forEach((request) => {
          // Prefer RPC state for freshness and to surface proposals the backend has not indexed yet.
          combined.set(request.id, {
            ...combined.get(request.id),
            ...request,
          });
        });
      } catch {
        // Keep backend data if the direct RPC supplement is unavailable.
      }
    }

    return {
      data: Array.from(combined.values()).sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
      source: "backend",
      notice: null,
    };
  } catch (error) {
    if (!program) {
      throw error;
    }

    const requests = await fetchRequestsFromRpc(address, program);
    return {
      data: requests,
      source: "rpc",
      notice: getBackendFallbackNotice(error),
    };
  }
}
