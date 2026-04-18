# AutoSOl Agent Guide

Use `/doc/03-agent-rules.md` as the canonical project guidance.

## Mandatory Context

- This repo is a Solana payment orchestration product, not a generic dApp demo.
- Security and correctness outrank feature velocity.
- Do not trust the current wallet auth flow for production.
- Keep `packages/auto-sol`, `packages/auto-sol-2`, frontend flows, executor logic, and worker schemas aligned.

## Working Rules

1. Any change to auth, wallet authority, event schemas, seeds, or fee logic must update tests and docs.
2. Do not introduce new silent fallback secrets or placeholder production config.
3. Prefer deterministic, auditable data flows across chain events, Redis, Prisma, and UI.
4. Put substantial analysis in `/doc`.
5. Report sandbox or network verification limits explicitly.
