# Frontend RPC Fallback

Reviewed on April 18, 2026.

## Goal

Keep the AutoSOl web app usable when `apps/http` is down, disconnected from Postgres, or simply not running in local development.

The requirement for this pass was:

- backend-first when the HTTP service is healthy
- direct RPC fallback when the backend is unavailable
- no page-level crashes for dashboard reads
- no silent breakage in existing flows

## What Changed

### Shared fallback layer

Added frontend-only helpers:

- `apps/web/lib/resilient-data.ts`
- `apps/web/lib/token-registry.ts`

These helpers now:

- try HTTP backend reads first with a short timeout
- place backend calls into a short cooldown after failure so the UI does not stall on repeated timeouts
- fall back to direct RPC reads through the Anchor client or Solana connection
- return a `notice` string so pages can tell the user when they are running in RPC fallback mode

### Dashboard

`apps/web/hooks/use-dashboard-data.ts` now uses the shared fallback layer.

Behavior:

- healthy backend: dashboard uses indexed backend data
- backend unavailable: dashboard falls back to `DashboardService` on-chain reads

### Payments / Transactions / Calendar

These pages were previously backend-only reads:

- `apps/web/app/dashboard/payments/page.tsx`
- `apps/web/app/dashboard/transactions/page.tsx`
- `apps/web/app/dashboard/payments/calendar/page.tsx`

They now:

- fetch from backend first
- fall back to RPC-derived schedules / executions
- display a non-fatal inline notice when fallback mode is active

### Token balances

`apps/web/hooks/use-fetchToken.ts` now:

- uses backend token balance endpoints when available
- falls back to direct RPC balance reads for SOL and SPL token accounts
- keeps the new payment form usable even when the backend is offline

Price data is not reconstructed from RPC in fallback mode, so token USD values may be zero while the backend is unavailable. Balance reads still work.

### Token amount formatting

`apps/web/lib/dashboard-service.ts` was updated to stop assuming every token uses 9 decimals.

This matters for RPC fallback because:

- SOL uses 9 decimals
- USDC / USDT typically use 6
- BONK uses 5

Without this fix, fallback analytics would misstate SPL token amounts.

## Operational Model

The web app should now behave like this:

1. Try indexed backend data.
2. If backend fails quickly, switch to RPC reads.
3. Render the page with fallback data instead of blocking the user.
4. Show a lightweight notice that fallback mode is active.

This is intentionally explicit. The app does not pretend backend analytics are still available when it is actually serving direct chain reads.

## Verification

Verified with:

- `bunx tsc --noEmit -p apps/web/tsconfig.json`

## Residual Risks

- RPC fallback is correctness-oriented, not speed-oriented. It can be slower than the backend for large wallets.
- Token USD pricing is not reproduced in fallback mode.
- Backend-derived history remains richer than raw on-chain account scans because the backend has indexed event and payment tables.
- If both backend and RPC are unavailable, the UI still fails explicitly rather than masking the outage.
