# AutoSOl Codebase Audit

Reviewed on April 15, 2026.

## Executive Summary

AutoSOl already has the skeleton of a real product: two Anchor programs, a Next.js app, an event monitor, a worker, and an executor service. The main risk is not lack of surface area, it is inconsistency across those surfaces. The web app, executor, worker, tests, and on-chain programs are not fully aligned on wallet authority, token support, event encoding, and production-readiness.

The highest-priority product bugs are:

1. The authentication flow is replayable and should not be trusted for production identity.
2. On-chain payment records store the executor public key in `tx_signature`, not the transaction signature.
3. The worker encodes public keys as base64 while the monitor emits base58 strings.
4. Tests and program constants disagree on the required executor wallet.
5. The dashboard API path is still mock-only, while the app already contains migration hooks that imply it is real.

## Repo Shape

- `apps/web`: Next.js frontend, wallet auth, dashboard, payment creation.
- `apps/worker`: Redis + Prisma event processor.
- `apps/executer`: scheduled keeper/executor for due payments.
- `apps/blockchain_monitor`: Rust log scraper that pushes events into Redis.
- `packages/auto-sol`: SOL Anchor program.
- `packages/auto-sol-2`: SOL + USDC Anchor program.
- `apps/http`: partially scaffolded backend; `src/index.ts` is empty.

## Validation Notes

- `yarn check-types` fails immediately in `packages/ui` because `tsc` cannot find the `minimatch` type definitions.
- `cargo check` could not be completed for the Rust projects because crates.io access is blocked in the current network sandbox.

## Findings

### BUG-001 High

Location:
- `packages/auto-sol/programs/auto-sol/src/lib.rs:204`
- `packages/auto-sol-2/programs/auto-sol-2/src/lib.rs:311`
- `packages/auto-sol-2/programs/auto-sol-2/src/lib.rs:417`

Evidence:

```rust
payment_schedule.payments[payment_index as usize].tx_signature =
    Some(ctx.accounts.executor.key());
```

Impact:
The contract persists the executor wallet public key where the UI and downstream systems expect a transaction identifier. That breaks explorer links, reconciliation, and auditability.

Recommended fix:
Rename the field to something like `executed_by` if that is what you intend, or emit/store the actual transaction signature off-chain via event ingestion because the program cannot directly read the final signature inside the instruction.

### BUG-002 High

Location:
- `apps/worker/index.ts:16-21`
- `apps/worker/index.ts:24-36`
- `apps/blockchain_monitor/src/main.rs:324-399`

Evidence:

```ts
const pubkeyArrayToString = (arr: number[]): string => {
  const uint8Array = new Uint8Array(arr);
  return Buffer.from(uint8Array).toString("base64");
};
```

Impact:
The Rust monitor serializes pubkeys as base58 strings, while the worker fallback path transforms byte arrays into base64. The same schedule or account can therefore be stored in two incompatible formats depending on event shape, which will corrupt joins, duplicate detection, and analytics.

Recommended fix:
Normalize all public keys to base58 end-to-end. The worker should use `bs58.encode(arr)` rather than base64.

### BUG-003 High

Location:
- `packages/auto-sol/tests/auto-sol.ts:30-32`
- `packages/auto-sol/programs/auto-sol/src/lib.rs:6`

Evidence:

```ts
const HTTP_BACKEND_WALLET = new PublicKey(
  "8dRCBu5V2v6JHR3HxN9zjN91WoX4FfGzgdM8nXawUbqt"
);
```

```rust
const HTTP_BACKEND_WALLET: &str = "G8UmesEhavARgE6xTWbDq6iHvdp8W2yo4pbrW4jLsHxh";
```

Impact:
The test suite for `packages/auto-sol` is wired to a different executor wallet than the deployed program constant. That makes local test setup brittle and likely causes false failures or misleading fixes.

Recommended fix:
Move wallet constants into a single source of truth per program version and generate tests/CLI config from it.

### BUG-004 Medium

Location:
- `packages/auto-sol/programs/auto-sol/src/lib.rs:66-71`
- `packages/auto-sol-2/programs/auto-sol-2/src/lib.rs:72-77`
- `packages/auto-sol-2/programs/auto-sol-2/src/lib.rs:163-168`

Evidence:

```rust
let total_amount = payment_amount * (schedule_times.len() as u64);
let fee_amount = (total_amount * fee_settings.fee_percentage as u64) / 10000;
let deposit_amount = total_amount + fee_amount;
```

Impact:
These monetary calculations use unchecked arithmetic. Large values can overflow and wrap, which is a financial correctness bug and can become a security issue.

Recommended fix:
Use `checked_mul` and `checked_add`, and map failures to explicit program errors.

### BUG-005 Medium

Location:
- `apps/executer/index.ts:321-325`
- `apps/executer/index.ts:339-345`

Evidence:

```ts
if (process.env.SOLANA_PRIVATE_KEY) {
  const privateKeyArray = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
  return new anchor.Wallet(
    Keypair.fromSecretKey(Uint8Array.from(privateKeyArray))
  );
}
```

Impact:
When the executor loads from `SOLANA_PRIVATE_KEY`, it skips the wallet identity check that exists for the file-based path. A misconfigured secret can therefore start the executor with the wrong signer.

Recommended fix:
Apply the same `HTTP_BACKEND_WALLET` equality check to both loading branches.

### BUG-006 Medium

Location:
- `apps/web/app/api/dashboard/[address]/route.ts:86-106`
- `apps/web/lib/dashboard-service.ts:457-463`

Evidence:

```ts
const mockDashboardData = {
  stats: { totalBalance: 0, activePayments: 0, ... },
  paymentActivity: { labels: [], datasets: [] },
  recentTransactions: [],
  upcomingPayments: [],
  tokenDistribution: [],
};
```

Impact:
The app already contains a migration path to fetch dashboard data from `/api/dashboard/:address`, but that endpoint still returns all-zero mock data. If another part of the app switches to the API path, users will see silently wrong analytics.

Recommended fix:
Either remove the API path until it is real, or implement the route behind authentication and feature flags.

### BUG-007 Medium

Location:
- `apps/web/components/dashboard/payments/new-payment-form.tsx:189-195`

Evidence:

```ts
setError(
  err instanceof Error ? err.message : "Failed to create payment schedule"
);

toast.error(`Failed to create payment schedule: ${error}`);
```

Impact:
The toast uses stale React state instead of the caught error, so users can see `null` or the previous failure message.

Recommended fix:
Derive the message from `err` directly before calling `setError`.

### BUG-008 Medium

Location:
- `apps/web/config/index.ts:9`
- `README.md:2`
- `Idea.md:24`
- `apps/web/components/dashboard/payments/new-payment-form.tsx:171-177`

Impact:
The current product docs say the platform is about USDC/USDT recurring payments, but the live web flow still creates only SOL schedules. The second program supports USDC, but the main app path does not expose it as a real end-to-end flow.

Recommended fix:
Decide whether `packages/auto-sol-2` is the production target. If yes, switch the web app and executor onto that program and update all docs.

### BUG-009 Low

Location:
- `apps/http/src/index.ts:1`
- `apps/http/package.json:5-7`

Impact:
The HTTP service is scaffolded but effectively non-existent. This is not a runtime bug yet, but it increases confusion because the repo implies an API tier that is not actually implemented.

Recommended fix:
Either remove `apps/http` from the active roadmap for now or turn it into a minimal health-checked service with a clear purpose.

### BUG-010 Low

Location:
- `packages/ui`

Impact:
The workspace typecheck is blocked by missing `minimatch` type definitions before it even reaches the product packages. That makes the monorepo harder to trust during future bug-fix work.

Recommended fix:
Fix the UI package type dependency issue first so `yarn check-types` can become a standard gate.

## Suggested Fix Order

1. Fix auth replay and secret hygiene before shipping more features.
2. Correct on-chain/off-chain data model mismatches: `tx_signature`, pubkey encoding, executor wallet identity.
3. Align the chosen production program version across frontend, executor, tests, and docs.
4. Make the monorepo verifiable: typecheck, program tests, worker fixtures, and one end-to-end payment flow.
