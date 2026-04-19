"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import DashboardHeader from "@/components/dashboard/header";
import MarkdownContractPreview from "@/components/shared/markdown-contract-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgram } from "@/hooks/use-program";
import { toast } from "sonner";
import { Rocket, CheckCircle2 } from "lucide-react";
import { formatRawTokenAmount, getTokenLabel } from "@/lib/token-registry";
import {
  PaymentCommitmentStatus,
  PaymentType,
  type PaymentCommitmentProposalData,
} from "@/lib/program";

export default function CommitmentDetailPage() {
  const params = useParams<{ proposalId: string }>();
  const proposalId = params?.proposalId;
  const wallet = useWallet();
  const { program } = useProgram();
  const [proposal, setProposal] = useState<PaymentCommitmentProposalData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const fetchProposal = useCallback(async () => {
    if (!program || !proposalId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await program.getPaymentCommitmentProposal(
        new PublicKey(proposalId)
      );
      setProposal(data);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      toast.error("Failed to load commitment proposal");
    } finally {
      setLoading(false);
    }
  }, [program, proposalId]);

  useEffect(() => {
    void fetchProposal();
  }, [fetchProposal]);

  const handleAccept = async () => {
    if (!program || !proposalId) return;
    setWorking(true);
    try {
      await program.acceptPaymentCommitmentProposal(new PublicKey(proposalId));
      toast.success("Commitment proposal accepted");
      await fetchProposal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Accept failed");
    } finally {
      setWorking(false);
    }
  };

  const handleActivate = async () => {
    if (!program || !proposalId || !proposal) return;
    setWorking(true);
    try {
      if (proposal.paymentType === PaymentType.Sol) {
        await program.activatePaymentCommitment(new PublicKey(proposalId));
      } else {
        await program.activateSplPaymentCommitment(
          new PublicKey(proposalId),
          proposal.mint
        );
      }
      toast.success("Commitment activated");
      await fetchProposal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Activation failed");
    } finally {
      setWorking(false);
    }
  };

  const walletAddress = wallet.publicKey?.toBase58();
  const canAccept =
    proposal &&
    walletAddress === proposal.recipient.toBase58() &&
    proposal.status === PaymentCommitmentStatus.Proposed;
  const canActivate =
    proposal &&
    walletAddress === proposal.owner.toBase58() &&
    proposal.status === PaymentCommitmentStatus.Accepted;
  const paymentAmountUi = proposal
    ? formatRawTokenAmount(
        proposal.paymentAmount.toNumber(),
        proposal.mint.toBase58(),
        proposal.paymentType === PaymentType.Sol
      )
    : null;

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />

      <div className="app-page page-stack flex-1">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-2xl bg-white/[0.04]" />
        ) : proposal ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                Commitment
              </Badge>
              <Badge variant="outline" className="border-white/10 text-slate-300">
                {proposal.status}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <h1 className="text-2xl font-semibold text-white">
                {proposal.scheduleTimes.length} payments of{" "}
                {paymentAmountUi}{" "}
                {getTokenLabel(
                  proposal.mint.toBase58(),
                  proposal.paymentType === PaymentType.Sol
                )}
              </h1>
              <p className="text-sm text-slate-400">
                Sender {proposal.owner.toBase58()} · Recipient{" "}
                {proposal.recipient.toBase58()}
              </p>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div>Created: {new Date(proposal.createdAt.toNumber() * 1000).toLocaleString()}</div>
              <div>
                Accepted:{" "}
                {proposal.acceptedAt
                  ? new Date(proposal.acceptedAt.toNumber() * 1000).toLocaleString()
                  : "Pending"}
              </div>
              <div>
                Activated:{" "}
                {proposal.activatedAt
                  ? new Date(proposal.activatedAt.toNumber() * 1000).toLocaleString()
                  : "Pending"}
              </div>
              <div>
                Schedule:{" "}
                {proposal.activatedSchedule?.toBase58() ?? "Not created yet"}
              </div>
            </div>

            <MarkdownContractPreview
              noteUri={proposal.noteUri}
              title="Commitment Contract"
              defaultOpen
              className="mt-6"
            />

            <div className="mt-6 flex flex-wrap gap-2">
              {canAccept && (
                <Button className="rounded-xl" disabled={working} onClick={() => void handleAccept()}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Accept
                </Button>
              )}

              {canActivate && (
                <Button className="rounded-xl" disabled={working} onClick={() => void handleActivate()}>
                  <Rocket className="mr-1.5 h-3.5 w-3.5" />
                  Activate
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-slate-500">
            Commitment proposal not found.
          </div>
        )}
      </div>
    </div>
  );
}
