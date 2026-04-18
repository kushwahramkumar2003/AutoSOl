# AutoSOl Agent Rules

Reviewed on April 15, 2026.

This file is the human-readable source of truth for AI coding agents working on this repo.

## Mission

Keep AutoSOl focused on becoming a reliable Solana payment orchestration product, not just a demo recurring-payment dApp.

## Core Principles

1. Security and correctness come before adding new flows.
2. Treat on-chain and off-chain schemas as contracts that must stay aligned.
3. Never change authority, fee, wallet, PDA, or seed logic without updating tests and docs in the same task.
4. Prefer explicit failures over silent fallbacks.
5. Preserve auditability: every payment should be explainable from UI to database to chain event.

## Non-Negotiable Rules

### Auth

- Do not ship replayable wallet auth.
- Do not accept client-provided nonces as trusted login challenges.
- Do not log JWTs, session payloads, wallet auth payloads, or secrets.

### Secrets

- Never commit real secrets.
- Do not keep production fallback secrets like `"next-auth-secret"` in active runtime code.
- Validate required env vars at startup.

### Chain Logic

- Use checked arithmetic for all money math.
- Do not hardcode new privileged wallets without a documented reason and migration plan.
- If a field is named `tx_signature`, it must hold a real transaction signature or be renamed.
- Keep event payload formats deterministic and consistent across Rust, TypeScript, DB, and UI.

### Product Scope

- Do not add generic crypto-payment features just because they are easy.
- Bias toward features that improve reliability, auditability, treasury policy, recipient onboarding, or compliance workflows.
- Treat Solana fee abstraction, attestations, and treasury integrations as strategic differentiators.

### Testing

- Every change touching the program, worker, executor, or auth must add or update tests.
- Prefer one end-to-end flow that covers monitor -> Redis -> worker -> dashboard data over isolated mocks.
- Keep `yarn check-types` green before expanding scope.

## Current Architectural Truths

- `packages/auto-sol` and `packages/auto-sol-2` are not interchangeable; agents must confirm which one is the active production target before changing user-facing flows.
- `apps/http` is incomplete and should not be treated as a trusted backend yet.
- `apps/web/app/api/dashboard/[address]/route.ts` is a mock endpoint, not production analytics.
- The worker, executor, and monitor are critical product infrastructure, not optional support scripts.

## Preferred Work Order For Future Sessions

1. Fix auth replay and auth-secret hygiene.
2. Fix worker/event schema mismatches.
3. Align program version, tests, executor, and frontend.
4. Restore reliable typecheck and program test workflows.
5. Only then add differentiating features.

## Good Feature Directions

- attestation-gated schedules
- proof-of-execution receipts
- missed-payment recovery and SLA tooling
- Squads-connected treasury automation
- invoice-to-schedule workflows
- sponsored-fee recipient onboarding

## Bad Feature Directions

- another generic recurring transfer UI without backend reliability
- new wallets or token types before the current execution pipeline is trustworthy
- consumer-only gimmicks that do not strengthen the product moat

## Local Development Environment — Surfpool

AutoSOl uses **Surfpool** as its local Solana node for testing. Surfpool is a drop-in replacement for `solana-test-validator` that fetches mainnet accounts just-in-time as transactions hit the RPC.

- **RPC endpoint**: `http://127.0.0.1:8899` (standard Solana RPC port)
- **Dashboard**: `http://localhost:18488` (TUI + web dashboard, NOT the RPC)
- **Start**: `surfpool` from the `packages/auto-sol-2` directory (auto-detects Anchor project)
- **Key features**: Mainnet forking, cheatcodes for state manipulation, full RPC compatibility
- **Testing**: `anchor test --skip-local-validator` (surfpool provides the validator)
- **Deploy**: `anchor deploy` against `http://127.0.0.1:8899` before running tests
- **Docs**: https://docs.surfpool.run
- **GitHub**: https://github.com/txtx/surfpool

> **Important**: Port 18488 is the dashboard/TUI, NOT the RPC. Always point `ANCHOR_PROVIDER_URL` to port 8899.

## Deliverable Expectations For Agents

- Put major analysis in `/doc`.
- Reference exact files and line numbers for audit findings.
- Separate security findings from product bugs.
- If something cannot be verified because of sandbox or network limits, say that explicitly.
