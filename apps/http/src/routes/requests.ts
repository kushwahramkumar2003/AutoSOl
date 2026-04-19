import { Router } from "express";
import { prisma } from "@autosol/db";

const router = Router();

const serializeRequest = (request: any) => ({
  id: request.id,
  requester: request.requester,
  payer: request.payer,
  mint: request.mint,
  isSol: request.isSol,
  paymentAmount: Number(request.paymentAmount),
  paymentCount: request.paymentCount,
  scheduleTimes: Array.isArray(request.scheduleTimes) ? request.scheduleTimes : [],
  memo: request.memo,
  noteUri: request.noteUri,
  status: request.status.toLowerCase(),
  decisionedAt: request.decisionedAt?.toISOString() ?? null,
  acceptedAt: request.acceptedAt?.toISOString() ?? null,
  createdAt: request.createdAt.toISOString(),
  scheduleId: request.activatedSchedule?.id ?? null,
  scheduleStatus: request.activatedSchedule?.status?.toLowerCase() ?? null,
});

router.get("/sent/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    const requests = await prisma.paymentRequestProposal.findMany({
      where: { requester: address },
      include: { activatedSchedule: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ requests: requests.map(serializeRequest) });
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    res.status(500).json({ error: "Failed to fetch sent requests" });
  }
});

router.get("/received/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    const requests = await prisma.paymentRequestProposal.findMany({
      where: { payer: address },
      include: { activatedSchedule: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ requests: requests.map(serializeRequest) });
  } catch (error) {
    console.error("Error fetching received requests:", error);
    res.status(500).json({ error: "Failed to fetch received requests" });
  }
});

router.get("/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    if (!requestId) {
      return res.status(400).json({ error: "Request id required" });
    }

    const request = await prisma.paymentRequestProposal.findUnique({
      where: { id: requestId },
      include: { activatedSchedule: true },
    });

    if (!request) {
      return res.status(404).json({ error: "Payment request not found" });
    }

    res.json({ request: serializeRequest(request) });
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

export default router;
