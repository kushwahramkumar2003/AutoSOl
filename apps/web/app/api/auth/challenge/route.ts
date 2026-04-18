import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { NONCE_TTL_MS, nonceStore } from "@/lib/nonce-store";

// ── Route ──────────────────────────────────────────────────────────────────

const QuerySchema = z.object({
  wallet: z.string().min(32).max(44),
});

/**
 * GET /api/auth/challenge?wallet=<base58-pubkey>
 *
 * Issues a one-time nonce tied to the requesting wallet address.
 * The nonce is stored server-side with a 5-minute TTL and is
 * invalidated after one successful login (consumed in auth.ts).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = QuerySchema.safeParse({ wallet: searchParams.get("wallet") });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid or missing wallet address" },
      { status: 400 }
    );
  }

  const { wallet } = parsed.data;
  const nonce = crypto.randomUUID();

  nonceStore.set(wallet, {
    nonce,
    expiresAt: Date.now() + NONCE_TTL_MS,
  });

  return NextResponse.json({ nonce });
}
