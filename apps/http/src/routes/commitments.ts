import { Router } from "express";
import { prisma } from "@autosol/db";

const router = Router();

const serializeProposal = (proposal: any) => ({
  id: proposal.id,
  owner: proposal.owner,
  recipient: proposal.recipient,
  mint: proposal.mint,
  isSol: proposal.isSol,
  paymentAmount: Number(proposal.paymentAmount),
  paymentCount: proposal.paymentCount,
  scheduleTimes: Array.isArray(proposal.scheduleTimes)
    ? proposal.scheduleTimes
    : [],
  memo: proposal.memo,
  noteUri: proposal.noteUri,
  status: proposal.status.toLowerCase(),
  acceptedAt: proposal.acceptedAt?.toISOString() ?? null,
  activatedAt: proposal.activatedAt?.toISOString() ?? null,
  createdAt: proposal.createdAt.toISOString(),
  scheduleId: proposal.activatedSchedule?.id ?? null,
  scheduleStatus: proposal.activatedSchedule?.status?.toLowerCase() ?? null,
  schedulePolicy:
    proposal.activatedSchedule?.schedulePolicy.toLowerCase() ?? null,
});

router.get("/sent/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    const proposals = await prisma.paymentCommitmentProposal.findMany({
      where: { owner: address },
      include: { activatedSchedule: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ commitments: proposals.map(serializeProposal) });
  } catch (error) {
    console.error("Error fetching sent commitments:", error);
    res.status(500).json({ error: "Failed to fetch sent commitments" });
  }
});

router.get("/received/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    const proposals = await prisma.paymentCommitmentProposal.findMany({
      where: { recipient: address },
      include: { activatedSchedule: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ commitments: proposals.map(serializeProposal) });
  } catch (error) {
    console.error("Error fetching received commitments:", error);
    res.status(500).json({ error: "Failed to fetch received commitments" });
  }
});

router.get("/:proposalId", async (req, res) => {
  try {
    const { proposalId } = req.params;
    if (!proposalId) {
      return res.status(400).json({ error: "Proposal id required" });
    }

    const proposal = await prisma.paymentCommitmentProposal.findUnique({
      where: { id: proposalId },
      include: { activatedSchedule: true },
    });

    if (!proposal) {
      return res.status(404).json({ error: "Commitment proposal not found" });
    }

    res.json({ commitment: serializeProposal(proposal) });
  } catch (error) {
    console.error("Error fetching commitment proposal:", error);
    res.status(500).json({ error: "Failed to fetch commitment proposal" });
  }
});

export default router;
