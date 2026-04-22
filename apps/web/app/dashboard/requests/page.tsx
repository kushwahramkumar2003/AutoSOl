"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/header";
import MarkdownContractPreview from "@/components/shared/markdown-contract-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchRequestsResilient,
  type PaymentRequestProposal,
} from "@/lib/resilient-data";
import { useProgram } from "@/hooks/use-program";
import { toast } from "sonner";
import {
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Plus,
  Link2,
} from "lucide-react";
import { formatRawTokenAmount, getTokenLabel } from "@/lib/token-registry";
import { getTransactionErrorMessage, isDuplicateTransactionError } from "@/lib/transaction-errors";

export default function RequestsPage() {
  const wallet = useWallet();
  const { program } = useProgram();
  const [requests, setRequests] = useState<PaymentRequestProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!wallet.publicKey) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchRequestsResilient(wallet.publicKey, program);
      setRequests(result.data);
      setDataNotice(result.notice);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load payment requests");
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const grouped = useMemo(() => {
    const address = wallet.publicKey?.toBase58();
    return {
      received: requests.filter((request) => request.payer === address),
      sent: requests.filter((request) => request.requester === address),
    };
  }, [requests, wallet.publicKey]);

  const handleAccept = async (request: PaymentRequestProposal) => {
    if (!program) {
      toast.error("Program not ready");
      return;
    }

    setWorkingId(request.id);
    try {
      if (request.isSol) {
        await program.acceptPaymentRequestProposal(new PublicKey(request.id));
      } else {
        await program.acceptSplPaymentRequestProposal(
          new PublicKey(request.id),
          new PublicKey(request.mint)
        );
      }
      toast.success("Request approved and funded");
      await fetchRequests();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description:
            "Wallet approval was already sent. Refreshing requests to verify the latest on-chain state.",
        });
        await fetchRequests();
      } else {
        toast.error(getTransactionErrorMessage(error, "Failed to accept request"));
      }
    } finally {
      setWorkingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!program) {
      toast.error("Program not ready");
      return;
    }
    setWorkingId(requestId);
    try {
      await program.declinePaymentRequestProposal(new PublicKey(requestId));
      toast.success("Request declined");
      await fetchRequests();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing requests to verify whether the decline already succeeded.",
        });
        await fetchRequests();
      } else {
        toast.error(getTransactionErrorMessage(error, "Failed to decline request"));
      }
    } finally {
      setWorkingId(null);
    }
  };

  const handleRevoke = async (requestId: string) => {
    if (!program) {
      toast.error("Program not ready");
      return;
    }
    setWorkingId(requestId);
    try {
      await program.revokePaymentRequestProposal(new PublicKey(requestId));
      toast.success("Request revoked");
      await fetchRequests();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing requests to verify whether the revoke already succeeded.",
        });
        await fetchRequests();
      } else {
        toast.error(getTransactionErrorMessage(error, "Failed to revoke request"));
      }
    } finally {
      setWorkingId(null);
    }
  };

  const copyAcceptLink = async (requestId: string) => {
    const link = `${window.location.origin}/dashboard/requests/${requestId}`;
    await navigator.clipboard.writeText(link);
    toast.success("Acceptance link copied");
  };

  const renderRequest = (
    request: PaymentRequestProposal,
    audience: "sent" | "received"
  ) => {
    const canAccept = audience === "received" && request.status === "proposed";
    const canDecline = audience === "received" && request.status === "proposed";
    const canRevoke = audience === "sent" && request.status === "proposed";
    const tokenLabel = getTokenLabel(request.mint, request.isSol);
    const paymentAmountUi = formatRawTokenAmount(
      request.paymentAmount,
      request.mint,
      request.isSol
    );

    return (
      <div
        key={request.id}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                Request
              </Badge>
              <Badge variant="outline" className="border-white/10 text-slate-300">
                {request.status}
              </Badge>
            </div>

            <div>
              <div className="text-lg font-semibold text-white">
                {request.paymentCount} payments of {paymentAmountUi} {tokenLabel}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {audience === "sent"
                  ? `Awaiting payer approval from ${request.payer}`
                  : `Requested by ${request.requester}`}
              </div>
            </div>

            <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <div>Created: {new Date(request.createdAt).toLocaleString()}</div>
              <div>
                Dates: {request.scheduleTimes.slice(0, 3).map((date) => new Date(date).toLocaleDateString()).join(", ")}
                {request.scheduleTimes.length > 3 ? ` +${request.scheduleTimes.length - 3} more` : ""}
              </div>
              <div>Purpose: {request.memo || "No memo"}</div>
              <div>Request ID: {request.id}</div>
            </div>

            <MarkdownContractPreview
              noteUri={request.noteUri}
              title="Request Terms"
              className="max-w-3xl"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl border-white/[0.08] bg-white/[0.03]"
            >
              <Link href={`/dashboard/requests/${request.id}`}>Open</Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-white/[0.08] bg-white/[0.03]"
              onClick={() => void copyAcceptLink(request.id)}
            >
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              Copy Link
            </Button>

            {canAccept && (
              <Button
                size="sm"
                className="rounded-xl"
                disabled={workingId === request.id}
                onClick={() => void handleAccept(request)}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Approve & Fund
              </Button>
            )}

            {canDecline && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-red-500/30 text-red-300"
                disabled={workingId === request.id}
                onClick={() => void handleDecline(request.id)}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Decline
              </Button>
            )}

            {canRevoke && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-amber-500/30 text-amber-200"
                disabled={workingId === request.id}
                onClick={() => void handleRevoke(request.id)}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Revoke
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />

      <div className="app-page page-stack flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-white">Payment Requests</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Review incoming requests you need to approve and outgoing requests you have sent.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-white/[0.08] bg-white/[0.03]"
              onClick={() => void fetchRequests()}
              disabled={loading}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/requests/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Payment Request
              </Link>
            </Button>
          </div>
        </div>

        {dataNotice && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-slate-400">
            {dataNotice}
          </div>
        )}

        <section className="space-y-4">
          <div className="text-sm font-medium text-white">Incoming Requests (You Pay)</div>
          {loading ? (
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.04]" />
          ) : grouped.received.length > 0 ? (
            grouped.received.map((request) => renderRequest(request, "received"))
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-500">
              No incoming payment requests to approve.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="text-sm font-medium text-white">Outgoing Requests (You Receive)</div>
          {loading ? (
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.04]" />
          ) : grouped.sent.length > 0 ? (
            grouped.sent.map((request) => renderRequest(request, "sent"))
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-500">
              No outgoing payment requests yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
