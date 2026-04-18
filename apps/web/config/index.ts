import { z } from "zod";

// ── Environment schema ─────────────────────────────────────────────────────
// SEC-003: Fail fast in production when secrets are missing or placeholder.
// In development, sensible dev-only defaults are allowed.

const isProduction = process.env.NODE_ENV === "production";

// Placeholder values that must never reach production.
const BANNED_PRODUCTION_VALUES = new Set([
  "next-auth-secret",
  "pinata-api-key",
  "pinata",
  "",
]);

function requireProductionSecret(envVar: string | undefined, name: string): string {
  if (isProduction) {
    if (!envVar || BANNED_PRODUCTION_VALUES.has(envVar)) {
      throw new Error(
        `[AutoSOl] Missing or placeholder secret for "${name}". ` +
          `Set the ${name.toUpperCase().replace(/-/g, "_")} environment variable before starting in production.`
      );
    }
    return envVar;
  }
  // Development: allow placeholder fallbacks with a warning.
  if (!envVar || BANNED_PRODUCTION_VALUES.has(envVar)) {
    console.warn(
      `[AutoSOl] WARNING: "${name}" is using a placeholder value. ` +
        `This is only acceptable in development.`
    );
    return envVar ?? "";
  }
  return envVar;
}

// ── Config object ──────────────────────────────────────────────────────────

export const config = {
  rpcEndpoint: process.env.RPC_URL ?? "http://127.0.0.1:8899",

  nextAuthSecret: requireProductionSecret(
    process.env.NEXTAUTH_SECRET ?? "next-auth-secret",
    "NEXTAUTH_SECRET"
  ),

  authTokenExpirationTime: z.coerce
    .number()
    .optional()
    .parse(process.env.AUTH_TOKEN_EXPIRATION_TIME) ?? (60 * 60 * 24 * 1),

  pinataApiKey: requireProductionSecret(
    process.env.PINATA_API_KEY ?? "pinata-api-key",
    "PINATA_API_KEY"
  ),

  pinataApiSecret: requireProductionSecret(
    process.env.PINATA_API_SECRET ?? "pinata",
    "PINATA_API_SECRET"
  ),

  pinataJwt: process.env.PINATA_JWT ?? "",
};

export default config;
