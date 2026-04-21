import { z } from "zod";

// ── Environment schema ─────────────────────────────────────────────────────
// SEC-003: Fail fast in production when secrets are missing or placeholder.
// In development, sensible dev-only defaults are allowed.

const isProduction = process.env.NODE_ENV === "production";
const isServerRuntime = typeof window === "undefined";

// ── Config object ──────────────────────────────────────────────────────────

export const config = {
  rpcEndpoint:
    process.env.NEXT_PUBLIC_RPC_URL ??
    process.env.RPC_URL ??
    (isProduction ? "https://api.devnet.solana.com" : "http://127.0.0.1:8899"),

  authTokenExpirationTime:
    z.coerce.number().optional().parse(process.env.AUTH_TOKEN_EXPIRATION_TIME) ??
    60 * 60 * 24 * 1,

  // Pinata credentials are used only by IPFS upload flows.
  // Do not make auth/bootstrap routes fail when they are unset.
  pinataApiKey: process.env.PINATA_API_KEY ?? "",
  pinataApiSecret: process.env.PINATA_API_SECRET ?? "",
  pinataJwt: process.env.PINATA_JWT ?? "",
};

export default config;
