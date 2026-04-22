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
import { fetchCommitmentsResilient, type CommitmentProposal } from "@/lib/resilient-data";
import { useProgram } from "@/hooks/use-program";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Rocket, RefreshCw } from "lucide-react";
import { formatRawTokenAmount, getTokenLabel } from "@/lib/token-registry";
import { getTransactionErrorMessage, isDuplicateTransactionError } from "@/lib/transaction-errors";

export default function CommitmentsPage() {
  const wallet = useWallet();
  const { program } = useProgram();
  const [commitments, setCommitments] = useState<CommitmentProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const fetchCommitments = useCallback(async () => {
    if (!wallet.publicKey) {
      setCommitments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchCommitmentsResilient(wallet.publicKey, program);
      setCommitments(result.data);
      setDataNotice(result.notice);
    } catch (error) {
      console.error("Error fetching commitments:", error);
      toast.error("Failed to load payment commitments");
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  useEffect(() => {
    void fetchCommitments();
  }, [fetchCommitments]);

  const grouped = useMemo(() => {
    const address = wallet.publicKey?.toBase58();
    return {
      received: commitments.filter((proposal) => proposal.recipient === address),
      sent: commitments.filter((proposal) => proposal.owner === address),
    };
  }, [commitments, wallet.publicKey]);

  const handleAccept = async (proposalId: string) => {
    if (!program) {
      toast.error("Program not ready");
      return;
    }

    setWorkingId(proposalId);
    try {
      await program.acceptPaymentCommitmentProposal(new PublicKey(proposalId));
      toast.success("Commitment proposal accepted");
      await fetchCommitments();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing commitments to verify whether the acceptance already succeeded.",
        });
        await fetchCommitments();
      } else {
        toast.error(getTransactionErrorMessage(error, "Failed to accept commitment"));
      }
    } finally {
      setWorkingId(null);
    }
  };

  const handleActivate = async (proposal: CommitmentProposal) => {
    if (!program) {
      toast.error("Program not ready");
      return;
    }

    setWorkingId(proposal.id);
    try {
      if (proposal.isSol) {
        await program.activatePaymentCommitment(new PublicKey(proposal.id));
      } else {
        await program.activateSplPaymentCommitment(
          new PublicKey(proposal.id),
          new PublicKey(proposal.mint)
        );
      }
      toast.success("Commitment activated and funded");
      await fetchCommitments();
    } catch (error) {
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing commitments to verify whether activation already succeeded.",
        });
        await fetchCommitments();
      } else {
        toast.error(getTransactionErrorMessage(error, "Failed to activate commitment"));
      }
    } finally {
      setWorkingId(null);
    }
  };

  const renderProposal = (proposal: CommitmentProposal, audience: "sent" | "received") => {
    const canAccept = audience === "received" && proposal.status === "proposed";
    const canActivate = audience === "sent" && proposal.status === "accepted";
    const tokenLabel = getTokenLabel(proposal.mint, proposal.isSol);
    const paymentAmountUi = formatRawTokenAmount(
      proposal.paymentAmount,
      proposal.mint,
      proposal.isSol
    );

    return (
      <div
        key={proposal.id}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                Commitment
              </Badge>
              <Badge variant="outline" className="border-white/10 text-slate-300">
                {proposal.status}
              </Badge>
              {proposal.scheduleId && (
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-300">
                  Active
                </Badge>
              )}
            </div>

            <div>
              <div className="text-lg font-semibold text-white">
                {proposal.paymentCount} payments of{" "}
                {paymentAmountUi} {tokenLabel}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {audience === "sent"
                  ? `Recipient ${proposal.recipient}`
                  : `Sender ${proposal.owner}`}
              </div>
            </div>

            <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <div>Created: {new Date(proposal.createdAt).toLocaleString()}</div>
              <div>
                Dates:{" "}
                {proposal.scheduleTimes
                  .slice(0, 3)
                  .map((date) => new Date(date).toLocaleDateString())
                  .join(", ")}
                {proposal.scheduleTimes.length > 3
                  ? ` +${proposal.scheduleTimes.length - 3} more`
                  : ""}
              </div>
              <div>Memo: {proposal.memo || "No memo"}</div>
              <div>Proposal: {proposal.id}</div>
            </div>

            <MarkdownContractPreview
              noteUri={proposal.noteUri}
              title="Commitment Contract"
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
              <Link href={`/dashboard/commitments/${proposal.id}`}>Open</Link>
            </Button>

            {canAccept && (
              <Button
                size="sm"
                className="rounded-xl"
                disabled={workingId === proposal.id}
                onClick={() => void handleAccept(proposal.id)}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Accept
              </Button>
            )}

            {canActivate && (
              <Button
                size="sm"
                className="rounded-xl"
                disabled={workingId === proposal.id}
                onClick={() => void handleActivate(proposal)}
              >
                <Rocket className="mr-1.5 h-3.5 w-3.5" />
                Activate
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
              <h1 className="text-xl font-semibold text-white">Commitments</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Proposals that require recipient acceptance before escrow funding.
            </p>
          </div>

          <Button
            variant="outline"
            className="rounded-xl border-white/[0.08] bg-white/[0.03]"
            onClick={() => void fetchCommitments()}
            disabled={loading}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {dataNotice && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-slate-400">
            {dataNotice}
          </div>
        )}

        <section className="space-y-4">
          <div className="text-sm font-medium text-white">Incoming</div>
          {loading ? (
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.04]" />
          ) : grouped.received.length > 0 ? (
            grouped.received.map((proposal) => renderProposal(proposal, "received"))
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-500">
              No incoming commitment proposals.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="text-sm font-medium text-white">Sent</div>
          {loading ? (
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.04]" />
          ) : grouped.sent.length > 0 ? (
            grouped.sent.map((proposal) => renderProposal(proposal, "sent"))
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-500">
              No sent commitment proposals.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
