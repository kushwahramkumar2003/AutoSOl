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
import { Rocket, CheckCircle2 } from "lucide-react";
import { formatRawTokenAmount, getTokenLabel } from "@/lib/token-registry";
import {
  PaymentCommitmentStatus,
  PaymentType,
  ScheduleStatus,
  type PaymentCommitmentProposalData,
} from "@/lib/program";
import { getTransactionErrorMessage, isDuplicateTransactionError } from "@/lib/transaction-errors";

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
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);

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
      if (data.activatedSchedule) {
        try {
          const schedule = await program.getPaymentSchedule(data.activatedSchedule);
          const mappedStatus =
            schedule.status === ScheduleStatus.Completed
              ? "completed"
              : schedule.status === ScheduleStatus.Cancelled
                ? "cancelled"
                : "active";
          setScheduleStatus(mappedStatus);
        } catch {
          setScheduleStatus(null);
        }
      } else {
        setScheduleStatus(null);
      }
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
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing commitment state to verify whether the acceptance already succeeded.",
        });
        await fetchProposal();
      } else {
        toast.error(getTransactionErrorMessage(error, "Accept failed"));
      }
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
      if (isDuplicateTransactionError(error)) {
        toast.message("Transaction already submitted", {
          description: "Refreshing commitment state to verify whether activation already succeeded.",
        });
        await fetchProposal();
      } else {
        toast.error(getTransactionErrorMessage(error, "Activation failed"));
      }
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
  const baseStatus = proposal ? String(proposal.status).toLowerCase() : null;
  const displayStatus =
    baseStatus === "activated" && scheduleStatus === "completed"
      ? "completed"
      : baseStatus;
  const paymentAmountUi = proposal
    ? formatRawTokenAmount(
        proposal.paymentAmount.toNumber(),
        proposal.mint.toBase58(),
        proposal.paymentType === PaymentType.Sol
      )
    : null;
  const upcomingPayments = useMemo(() => {
    if (!proposal) {
      return [];
    }

    return proposal.scheduleTimes
      .map((time, index) => ({
        id: `${index}-${time.toString()}`,
        index: index + 1,
        date: new Date(time.toNumber() * 1000),
      }))
      .sort((left, right) => left.date.getTime() - right.date.getTime());
  }, [proposal]);
  const tokenLabel = proposal
    ? getTokenLabel(
        proposal.mint.toBase58(),
        proposal.paymentType === PaymentType.Sol
      )
    : "";
  const totalCommitmentUi = proposal
    ? formatRawTokenAmount(
        proposal.paymentAmount.toNumber() * upcomingPayments.length,
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
                {displayStatus ?? proposal.status}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <h1 className="text-2xl font-semibold text-white">
                {proposal.scheduleTimes.length} payments of{" "}
                {paymentAmountUi}{" "}
                {tokenLabel}
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

            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">
                    Upcoming Payments
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Full schedule preview before recipient acceptance
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <TokenAvatar
                    symbol={tokenLabel}
                    mint={proposal.mint.toBase58()}
                    isSol={proposal.paymentType === PaymentType.Sol}
                    size={18}
                    className="h-[18px] w-[18px]"
                  />
                  <div className="text-xs text-slate-400">
                    Per payment:{" "}
                    <span className="font-medium text-white">
                      {paymentAmountUi} {tokenLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {upcomingPayments.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2"
                  >
                    <div className="text-xs text-slate-400">
                      Payment #{item.index}
                    </div>
                    <div className="text-sm text-white">
                      {item.date.toLocaleString()}
                    </div>
                    <div className="text-xs font-medium text-primary">
                      {paymentAmountUi} {tokenLabel}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                <div className="text-xs text-slate-500">
                  Total payments:{" "}
                  <span className="text-slate-300">{upcomingPayments.length}</span>
                </div>
                <div className="text-sm font-medium text-white">
                  Total commitment:{" "}
                  {totalCommitmentUi} {tokenLabel}
                </div>
              </div>
            </div>

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
