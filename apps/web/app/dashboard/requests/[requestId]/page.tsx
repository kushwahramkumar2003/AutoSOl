"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import DashboardHeader from "@/components/dashboard/header";
import MarkdownContractPreview from "@/components/shared/markdown-contract-preview";
import { TokenAvatar } from "@/components/shared/token-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgram } from "@/hooks/use-program";
import { toast } from "sonner";
import { CheckCircle2, Pause, Play, XCircle } from "lucide-react";
import { formatRawTokenAmount, getTokenLabel } from "@/lib/token-registry";
import type { PaymentRequestProposal } from "@/lib/resilient-data";
import { PaymentRequestStatus } from "@/lib/program";

function toRequestStatus(status: PaymentRequestStatus): PaymentRequestProposal["status"] {
  switch (status) {
    case PaymentRequestStatus.Accepted:
      return "accepted";
    case PaymentRequestStatus.Declined:
      return "declined";
    case PaymentRequestStatus.Revoked:
      return "revoked";
    case PaymentRequestStatus.Proposed:
    default:
      return "proposed";
  }
}

export default function RequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params?.requestId;
  const wallet = useWallet();
  const { program } = useProgram();
  const [request, setRequest] = useState<PaymentRequestProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const fetchRequest = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/requests/${requestId}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(`Request fetch failed (${response.status})`);
      }
      const payload = (await response.json()) as { request?: PaymentRequestProposal };
      let nextRequest = payload.request ?? null;

      if (program && nextRequest) {
        try {
          const liveRequest = await program.getPaymentRequestProposal(
            new PublicKey(requestId)
          );

          const liveScheduleId =
            liveRequest.activatedSchedule?.toBase58() ?? nextRequest.scheduleId ?? null;

          nextRequest = {
            ...nextRequest,
            requester: liveRequest.requester.toBase58(),
            payer: liveRequest.payer.toBase58(),
            mint: liveRequest.mint.toBase58(),
            isSol: liveRequest.paymentType === "Sol",
            paymentAmount: liveRequest.paymentAmount.toNumber(),
            paymentCount: liveRequest.scheduleTimes.length,
            scheduleTimes: liveRequest.scheduleTimes.map((time) =>
              new Date(time.toNumber() * 1000).toISOString()
            ),
            memo: liveRequest.memo,
            noteUri: liveRequest.noteUri,
            status: toRequestStatus(liveRequest.status),
            decisionedAt: liveRequest.decisionedAt
              ? new Date(liveRequest.decisionedAt.toNumber() * 1000).toISOString()
              : null,
            acceptedAt: liveRequest.acceptedAt
              ? new Date(liveRequest.acceptedAt.toNumber() * 1000).toISOString()
              : null,
            createdAt: new Date(liveRequest.createdAt.toNumber() * 1000).toISOString(),
            scheduleId: liveScheduleId,
            scheduleStatus:
              liveRequest.status === PaymentRequestStatus.Accepted
                ? nextRequest.scheduleStatus ?? "active"
                : nextRequest.scheduleStatus ?? null,
          };
        } catch (liveError) {
          console.warn("Live request fetch failed, using API payload", liveError);
        }
      }

      setRequest(nextRequest);
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
      toast.error(error instanceof Error ? error.message : "Accept failed");
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
      toast.error(error instanceof Error ? error.message : "Decline failed");
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
      toast.error(error instanceof Error ? error.message : "Revoke failed");
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
      toast.error(error instanceof Error ? error.message : "Pause failed");
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
      toast.error(error instanceof Error ? error.message : "Resume failed");
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
      toast.error(error instanceof Error ? error.message : "Cancel failed");
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
  const canCancel = request && walletAddress === request.payer && request.scheduleStatus && ["active", "paused"].includes(request.scheduleStatus);

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
                <Button className="rounded-xl" disabled={working} onClick={() => void handleAccept()}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Approve & Fund
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
