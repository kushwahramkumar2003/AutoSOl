# Shared DB Package

Reviewed on April 18, 2026.

## Purpose

AutoSOl previously kept separate Prisma schema and migration trees under `apps/http` and `apps/worker` even though both services use the same PostgreSQL database. That drift risked:

- incompatible generated Prisma clients
- migrations being applied from one service but not the other
- duplicated schema edits for every pipeline change

## Canonical Layout

The shared database contract now lives under `packages/db`:

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/*`
- `packages/db/src/index.ts`

This package is the only canonical source for:

- Prisma schema
- Prisma migration history
- Prisma client construction/export

## Service Usage

- `apps/http` imports Prisma from `packages/db/src/index.ts`
- `apps/worker` imports Prisma types/client access from `packages/db/src/index.ts`
- app-level Prisma scripts now point at `packages/db/prisma/schema.prisma`

## Operational Commands

Apply migrations:

```bash
cd packages/db
../../node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma
```

Regenerate Prisma client:

```bash
cd packages/db
../../node_modules/.bin/prisma generate --schema ./prisma/schema.prisma
```

## Follow-up Rule

Any future DB schema or migration change must be made only in `packages/db` and then consumed by `apps/http`, `apps/worker`, and any future services through that package.
