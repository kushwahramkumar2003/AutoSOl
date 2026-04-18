# HTTP Local Postgres Setup

Reviewed on April 16, 2026.

## Context

`apps/http` had two local-runtime gaps:

- it had no `dev` script, so `bun run dev` failed immediately
- Prisma client generation was not wired, and the tracked `.env` pointed to a remote Supabase database

## Local baseline

For local development, `apps/http` now assumes:

- database name: `autosol`
- username: `postgres`
- password: `postgres`
- connection string: `postgresql://postgres:postgres@localhost:5432/autosol`

## Contract alignment

The local SQL bootstrap migration now lives in `packages/db/prisma/migrations/20250701154843_init/migration.sql`, which is the canonical schema history shared by HTTP and worker.

## Remaining runtime dependencies

- PostgreSQL must be running locally on `localhost:5432`
- `npx prisma generate` must be rerun after future schema changes

## Verification limits

The sandbox blocked direct localhost verification and Prisma cache writes, so final database checks and Prisma generation were completed outside the sandbox.
