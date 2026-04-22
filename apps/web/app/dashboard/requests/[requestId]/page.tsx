"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import DashboardHeader from "@/components/dashboard/header";
import MarkdownContractPreview from "@/components/shared/markdown-contract-preview";
import { TokenAvatar } from "@/components/shared/token-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProgram } from "@/hooks/use-program";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Loader2, Pause, Play, XCircle } from "lucide-react";
import {
  formatRawTokenAmount,
  getTokenLabel,
} from "@/lib/token-registry";
import { getTransactionErrorMessage, isDuplicateTransactionError } from "@/lib/transaction-errors";
import {
  fetchRequestByIdResilient,
  type PaymentRequestProposal,
} from "@/lib/resilient-data";
import { PaymentRequestStatus } from "@/lib/program";

const PAYMENT_SCHEDULE_ACCOUNT_SPACE = 8 + 806;
const TOKEN_ACCOUNT_SPACE = 165;
const APPROVAL_TX_BUFFER_LAMPORTS = 50_000;

interface FundingCheckState {
  loading: boolean;
  canFund: boolean;
  warnings: string[];
}

export default function RequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params?.requestId;
  const { connection } = useConnection();
  const wallet = useWallet();
  const { program } = useProgram();
  const [request, setRequest] = useState<PaymentRequestProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [fundingCheck, setFundingCheck] = useState<FundingCheckState>({
    loading: false,
    canFund: true,
    warnings: [],
  });

  const fetchRequest = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchRequestByIdResilient(requestId, program);
      setRequest(result.data);
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load payment request");
    } finally {
      setLoading(false);
    }
  }, [program, requestId]);

  useEffect(() => {
    void fetchRequest();
  }, [fetchRequest]);

  useEffect(() => {
    let cancelled = false;

    const checkFunding = async () => {
      const walletAddress = wallet.publicKey?.toBase58();
      if (
        !request ||
        !program ||
        !wallet.publicKey ||
        walletAddress !== request.payer ||
        request.status !== "proposed"
      ) {
        if (!cancelled) {
          setFundingCheck({
            loading: false,
            canFund: true,
            warnings: [],
          });
        }
        return;
      }

      if (request.paymentAmount > Number.MAX_SAFE_INTEGER / Math.max(1, request.paymentCount)) {
        if (!cancelled) {
          setFundingCheck({
            loading: false,
            canFund: false,
            warnings: ["Request amount is too large to verify safely in the browser."],
          });
        }
        return;
      }

      setFundingCheck({
        loading: true,
        canFund: false,
        warnings: [],
      });

      try {
        const paymentCount = request.paymentCount;
        const totalAmountRaw = request.paymentAmount * paymentCount;
        const { feeAmount, totalCost } = await program.calculateTotalCost(
          request.paymentAmount,
          paymentCount
        );

        const warnings: string[] = [];
        let hasBlockingIssue = false;
        const payerLamports = await connection.getBalance(wallet.publicKey, "confirmed");
        const scheduleRent = await connection.getMinimumBalanceForRentExemption(
          PAYMENT_SCHEDULE_ACCOUNT_SPACE
        );

        if (request.isSol) {
          const solVaultRent = await connection.getMinimumBalanceForRentExemption(0);
          const requiredLamports =
            totalCost + scheduleRent + solVaultRent + APPROVAL_TX_BUFFER_LAMPORTS;

          if (payerLamports < requiredLamports) {
            hasBlockingIssue = true;
            warnings.push(
              `You need about ${formatRawTokenAmount(requiredLamports, request.mint, true)} SOL to approve this request, including schedule rent and fees. Your wallet currently has ${formatRawTokenAmount(payerLamports, request.mint, true)} SOL.`
            );
          }
        } else {
          const mint = new PublicKey(request.mint);
          const payerTokenAccount = await getAssociatedTokenAddress(mint, wallet.publicKey);
          const payerTokenBalance = await connection
            .getTokenAccountBalance(payerTokenAccount, "confirmed")
            .catch(() => null);
          const payerTokenRaw = payerTokenBalance
            ? Number.parseInt(payerTokenBalance.value.amount, 10)
            : 0;

          if (!payerTokenBalance) {
            hasBlockingIssue = true;
            warnings.push(
              `Your wallet does not have an associated ${getTokenLabel(request.mint, false)} token account on this network.`
            );
          } else if (payerTokenRaw < totalCost) {
            hasBlockingIssue = true;
            warnings.push(
              `You need ${formatRawTokenAmount(totalCost, request.mint, false)} ${getTokenLabel(request.mint, false)} to approve this request, but only ${formatRawTokenAmount(payerTokenRaw, request.mint, false)} is available.`
            );
          }

          const paymentVaultRent = await connection.getMinimumBalanceForRentExemption(
            TOKEN_ACCOUNT_SPACE
          );
          const feeVaultRent = await connection.getMinimumBalanceForRentExemption(
            TOKEN_ACCOUNT_SPACE
          );
          const requiredLamports =
            scheduleRent +
            paymentVaultRent +
            feeVaultRent +
            APPROVAL_TX_BUFFER_LAMPORTS;

          if (payerLamports < requiredLamports) {
            hasBlockingIssue = true;
            warnings.push(
              `You need about ${formatRawTokenAmount(requiredLamports, request.mint, true)} SOL for schedule rent, token vault setup, and transaction fees. Your wallet currently has ${formatRawTokenAmount(payerLamports, request.mint, true)} SOL.`
            );
          }

          if (feeAmount > 0) {
            warnings.push(
              `Approval will lock ${formatRawTokenAmount(totalAmountRaw, request.mint, false)} ${getTokenLabel(request.mint, false)} for payouts and route ${formatRawTokenAmount(feeAmount, request.mint, false)} ${getTokenLabel(request.mint, false)} to platform fees.`
            );
          }
        }

        if (!cancelled) {
          setFundingCheck({
            loading: false,
            canFund: !hasBlockingIssue,
            warnings,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setFundingCheck({
            loading: false,
            canFund: false,
            warnings: [
              error instanceof Error
                ? `Unable to verify approval funding right now: ${error.message}`
                : "Unable to verify approval funding right now.",
            ],
          });
        }
      }
    };

    void checkFunding();

    return () => {
      cancelled = true;
    };
  }, [connection, program, request, wallet.publicKey]);

  const handleAccept = async () => {
    if (!program || !requestId || !request) return;
    setWorking(true);
    try {
      const liveRequest = await program.getPaymentRequestProposal(new PublicKey(requestId));
      if (liveRequest.status !== PaymentRequestStatus.Proposed) {
        await fetchRequest();
        throw new Error("This payment request is no longer awaiting approval.");
      }

      if (request.isSol) {
        await program.acceptPaymentRequestProposal(new PublicKey(requestId));
      } else {
        await program.acceptSplPaymentRequestProposal(
          new PublicKey(requestId),
          new PublicKey(request.mint)
        );
      }
      toast.success("Request approved and funded");
      await fetchRequest();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing request state to verify whether approval already succeeded.",
        });
        await fetchRequest();
      } else {
        toast.error(getTransactionErrorMessage(error, "Accept failed"));
      }
    } finally {
      setWorking(false);
    }
  };

  const handleDecline = async () => {
    if (!program || !requestId) return;
    setWorking(true);
    try {
      await program.declinePaymentRequestProposal(new PublicKey(requestId));
      toast.success("Request declined");
      await fetchRequest();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing request state to verify whether decline already succeeded.",
        });
        await fetchRequest();
      } else {
        toast.error(getTransactionErrorMessage(error, "Decline failed"));
      }
    } finally {
      setWorking(false);
    }
  };

  const handleRevoke = async () => {
    if (!program || !requestId) return;
    setWorking(true);
    try {
      await program.revokePaymentRequestProposal(new PublicKey(requestId));
      toast.success("Request revoked");
      await fetchRequest();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing request state to verify whether revoke already succeeded.",
        });
        await fetchRequest();
      } else {
        toast.error(getTransactionErrorMessage(error, "Revoke failed"));
      }
    } finally {
      setWorking(false);
    }
  };

  const handlePause = async () => {
    if (!program || !request?.scheduleId) return;
    setWorking(true);
    try {
      await program.pausePaymentSchedule(new PublicKey(request.scheduleId));
      toast.success("Schedule paused");
      await fetchRequest();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing request state to verify whether pause already succeeded.",
        });
        await fetchRequest();
      } else {
        toast.error(getTransactionErrorMessage(error, "Pause failed"));
      }
    } finally {
      setWorking(false);
    }
  };

  const handleResume = async () => {
    if (!program || !request?.scheduleId) return;
    setWorking(true);
    try {
      await program.resumePaymentSchedule(new PublicKey(request.scheduleId));
      toast.success("Schedule resumed");
      await fetchRequest();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing request state to verify whether resume already succeeded.",
        });
        await fetchRequest();
      } else {
        toast.error(getTransactionErrorMessage(error, "Resume failed"));
      }
    } finally {
      setWorking(false);
    }
  };

  const handleCancel = async () => {
    if (!program || !request?.scheduleId) return;
    setWorking(true);
    try {
      await program.cancelSchedule(new PublicKey(request.scheduleId));
      toast.success("Schedule cancelled");
      await fetchRequest();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing request state to verify whether cancellation already succeeded.",
        });
        await fetchRequest();
      } else {
        toast.error(getTransactionErrorMessage(error, "Cancel failed"));
      }
    } finally {
      setWorking(false);
    }
  };

  const walletAddress = wallet.publicKey?.toBase58();
  const canAccept = request && walletAddress === request.payer && request.status === "proposed";
  const canDecline = request && walletAddress === request.payer && request.status === "proposed";
  const canRevoke = request && walletAddress === request.requester && request.status === "proposed";
  const canPause = request && walletAddress === request.payer && request.scheduleStatus === "active";
  const canResume = request && walletAddress === request.payer && request.scheduleStatus === "paused";
  const canCancel = Boolean(
    request &&
      walletAddress === request.payer &&
      request.scheduleStatus &&
      ["active", "paused"].includes(request.scheduleStatus)
  );

  const tokenLabel = request ? getTokenLabel(request.mint, request.isSol) : "";
  const paymentAmountUi = request
    ? formatRawTokenAmount(request.paymentAmount, request.mint, request.isSol)
    : null;

  const upcomingPayments = useMemo(() => {
    if (!request) {
      return [];
    }

    return request.scheduleTimes
      .map((time, index) => ({
        id: `${index}-${time}`,
        index: index + 1,
        date: new Date(time),
      }))
      .sort((left, right) => left.date.getTime() - right.date.getTime());
  }, [request]);

  const totalCommitmentUi = request
    ? formatRawTokenAmount(
        request.paymentAmount * upcomingPayments.length,
        request.mint,
        request.isSol
      )
    : null;
  const approvalBlocked = Boolean(
    canAccept && (!fundingCheck.canFund || fundingCheck.loading)
  );

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />

      <div className="app-page page-stack flex-1">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl bg-white/[0.04]" />
        ) : request ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                Payment Request
              </Badge>
              <Badge variant="outline" className="border-white/10 text-slate-300">
                {request.status}
              </Badge>
              {request.scheduleStatus && (
                <Badge variant="outline" className="border-white/10 text-slate-300">
                  Schedule: {request.scheduleStatus}
                </Badge>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <h1 className="text-2xl font-semibold text-white">
                {request.paymentCount} payments of {paymentAmountUi} {tokenLabel}
              </h1>
              <p className="text-sm text-slate-400">
                Payee {request.requester} · Payer {request.payer}
              </p>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div>Created: {new Date(request.createdAt).toLocaleString()}</div>
              <div>
                Accepted: {request.acceptedAt ? new Date(request.acceptedAt).toLocaleString() : "Pending"}
              </div>
              <div>
                Decision: {request.decisionedAt ? new Date(request.decisionedAt).toLocaleString() : "Pending"}
              </div>
              <div>Approved schedule: {request.scheduleId ?? "Not created yet"}</div>
            </div>

            <MarkdownContractPreview
              noteUri={request.noteUri}
              title="Request Terms"
              defaultOpen
              className="mt-6"
            />

            {canAccept && (fundingCheck.loading || fundingCheck.warnings.length > 0) ? (
              <Alert
                className={`mt-6 border-white/[0.08] ${
                  fundingCheck.canFund
                    ? "bg-white/[0.02] text-slate-200"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-50"
                } [&>svg]:text-current`}
              >
                {fundingCheck.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {fundingCheck.loading
                    ? "Checking payer funding requirements"
                    : fundingCheck.canFund
                      ? "Approval cost preview"
                      : "Approval is blocked"}
                </AlertTitle>
                <AlertDescription>
                  <div className="space-y-1">
                    {fundingCheck.loading ? (
                      <p>Verifying token balances, schedule rent, and setup costs before approval.</p>
                    ) : (
                      fundingCheck.warnings.map((warning) => <p key={warning}>{warning}</p>)
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Upcoming Payments</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Full payout preview before payer approval
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <TokenAvatar
                    symbol={tokenLabel}
                    mint={request.mint}
                    isSol={request.isSol}
                    size={18}
                    className="h-[18px] w-[18px]"
                  />
                  <div className="text-xs text-slate-400">
                    Per payout: <span className="font-medium text-white">{paymentAmountUi} {tokenLabel}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {upcomingPayments.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2"
                  >
                    <div className="text-xs text-slate-400">Payment #{item.index}</div>
                    <div className="text-sm text-white">{item.date.toLocaleString()}</div>
                    <div className="text-xs font-medium text-primary">{paymentAmountUi} {tokenLabel}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                <div className="text-xs text-slate-500">
                  Total payments: <span className="text-slate-300">{upcomingPayments.length}</span>
                </div>
                <div className="text-sm font-medium text-white">
                  Total approval amount: {totalCommitmentUi} {tokenLabel}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {canAccept && (
                <Button
                  className="rounded-xl"
                  disabled={working || approvalBlocked}
                  onClick={() => void handleAccept()}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {fundingCheck.loading ? "Checking funding…" : "Approve & Fund"}
                </Button>
              )}
              {canDecline && (
                <Button variant="outline" className="rounded-xl border-red-500/30 text-red-300" disabled={working} onClick={() => void handleDecline()}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Decline
                </Button>
              )}
              {canRevoke && (
                <Button variant="outline" className="rounded-xl border-amber-500/30 text-amber-200" disabled={working} onClick={() => void handleRevoke()}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Revoke
                </Button>
              )}
              {canPause && (
                <Button variant="outline" className="rounded-xl" disabled={working} onClick={() => void handlePause()}>
                  <Pause className="mr-1.5 h-3.5 w-3.5" />
                  Pause
                </Button>
              )}
              {canResume && (
                <Button variant="outline" className="rounded-xl" disabled={working} onClick={() => void handleResume()}>
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Resume
                </Button>
              )}
              {canCancel && (
                <Button variant="outline" className="rounded-xl border-red-500/30 text-red-300" disabled={working} onClick={() => void handleCancel()}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-500">
            Payment request not found.
          </div>
        )}
      </div>
    </div>
  );
}
