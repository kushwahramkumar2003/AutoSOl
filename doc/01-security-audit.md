# AutoSOl Security Audit

Reviewed on April 15, 2026.

## Executive Summary

The biggest security problem is the wallet sign-in design. The app verifies that a wallet signed a nonce, but it does not prove that the nonce was server-issued, single-use, or time-bounded. In practice that means a captured signature can be replayed into a fresh session.

The second major issue is trust boundary drift. The middleware currently treats all `/api/*` routes as public, the app has a weak default auth secret fallback, and sensitive auth material is logged in callbacks. Together these issues make the current web surface unsafe for production exposure.

## Findings

### SEC-001 Critical

Rule ID:
- NEXT-AUTH-REPLAY-001

Location:
- `apps/web/lib/auth.ts:10-14`
- `apps/web/lib/auth.ts:26-58`

Evidence:

```ts
const SigninSchema = z.object({
  publicKey: z.string(),
  signature: z.any(),
  nonce: z.string(),
});
```

```ts
const message = new TextEncoder().encode(`${nonce}`);
const verified = nacl.sign.detached.verify(
  message,
  signatureUint8,
  publicKeyBytes
);
```

Impact:
A valid signature can be replayed because the server does not issue, store, expire, or consume the nonce. Anyone who obtains a previously signed nonce/signature pair can mint a new session for that wallet.

Fix:
Introduce a challenge endpoint that issues a random nonce tied to the wallet address, stores it server-side with TTL, and invalidates it after one successful login. Include domain, statement, chain, issued-at, and expiration fields in the signed payload.

Mitigation:
Until fixed, treat wallet auth as non-production and do not attach privileged operations to it.

### SEC-002 High

Rule ID:
- NEXT-ROUTE-AUTH-001

Location:
- `apps/web/middleware.ts:13-15`

Evidence:

```ts
/^\/api\/auth\/.*/,
/^\/api\/.*/,
```

Impact:
Every current and future API route is treated as public by default. That is acceptable only if every route implements its own authz boundary correctly, which is easy to miss as the codebase grows.

Fix:
Remove the blanket `^\/api\/.*` exemption. Keep only explicit public APIs public.

Mitigation:
Add route-level auth checks in every non-public handler even after middleware is tightened.

### SEC-003 High

Rule ID:
- NEXT-SECRETS-001

Location:
- `apps/web/config/index.ts:13-18`

Evidence:

```ts
nextAuthSecret: process.env.NEXTAUTH_SECRET || "next-auth-secret",
pinataApiKey: process.env.PINATA_API_KEY || "pinata-api-key",
pinataApiSecret: process.env.PINATA_API_SECRET || "pinata",
```

Impact:
Production startup can silently proceed with trivial fallback secrets. That weakens session signing and risks accidental deployment with placeholder credentials.

Fix:
Fail fast in production when required secrets are missing. Reserve dummy defaults for local development only.

Mitigation:
Add environment validation on boot using `zod` or a dedicated config module.

### SEC-004 Medium

Rule ID:
- NEXT-LOGGING-001

Location:
- `apps/web/lib/auth.ts:67-75`

Evidence:

```ts
console.log("JWT Callback", token, user);
```

Impact:
JWT/session claims are written to logs. These logs can leak wallet-linked session data into consoles, log drains, or third-party observability systems.

Fix:
Remove auth payload logging or replace it with redacted structured events.

Mitigation:
Search the repo for other debug logs around auth and secrets before production launch.

### SEC-005 Medium

Rule ID:
- EXEC-KEY-VALIDATION-001

Location:
- `apps/executer/index.ts:321-325`

Impact:
An operator can accidentally start the executor with the wrong private key if `SOLANA_PRIVATE_KEY` is set. The file-based path validates the key identity, the env-based path does not.

Fix:
Validate the derived public key against the configured backend wallet in both branches.

Mitigation:
Log only the derived public key, never the secret material.

### SEC-006 Medium

Rule ID:
- CHAIN-AUTHZ-001

Location:
- `packages/auto-sol/programs/auto-sol/src/lib.rs:6-14`
- `packages/auto-sol-2/programs/auto-sol-2/src/lib.rs:7-15`

Impact:
Critical authorization is hardcoded to fixed wallet addresses and fixed fee-withdrawal allowlists. That is operationally brittle and creates upgrade/governance risk if a key is rotated, lost, or compromised.

Fix:
Move privileged roles into governed on-chain configuration with explicit rotation instructions and event emission.

Mitigation:
At minimum, centralize the constants and document the emergency rotation process.

### SEC-007 Medium

Rule ID:
- CHAIN-MATH-001

Location:
- `packages/auto-sol/programs/auto-sol/src/lib.rs:66-71`
- `packages/auto-sol-2/programs/auto-sol-2/src/lib.rs:72-77`
- `packages/auto-sol-2/programs/auto-sol-2/src/lib.rs:163-168`

Impact:
Unchecked integer arithmetic on money paths can overflow and undermine deposit validation.

Fix:
Use checked arithmetic with explicit error returns.

Mitigation:
Add boundary tests for max schedule count, max payment amount, and fee calculations.

## Additional Notes

- Local `.env` files exist across several app directories. They do not appear in `git ls-files` from the current checkout, which is good, but you should keep secret scanning in CI because accidental commits are still easy.
- I could not complete Rust dependency-based security verification in this environment because crates.io access was blocked.

## Immediate Remediation Backlog

1. Rebuild wallet sign-in around server-issued one-time challenges.
2. Remove the blanket public API matcher.
3. Enforce required env vars in production boot.
4. Remove auth/session debug logging.
5. Replace hardcoded on-chain admin keys with governed configuration.
