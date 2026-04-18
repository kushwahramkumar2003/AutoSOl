# Async Pipeline Hardening

Reviewed on April 18, 2026.

## Scope

This note covers the backend event pipeline changes made to reduce single-process failure modes and align the service layer with the current `packages/auto-sol-2` multi-token program schema.

## Problems Addressed

- The Rust blockchain monitor, Bun worker, Prisma schemas, and HTTP dashboard route were not using the same event contract.
- The worker consumed from a Redis list with `BRPOP` and retried with in-process `setTimeout`, which meant retry behavior was tied to one process staying alive.
- The database schema still modeled the system like a SOL-only scheduler and dropped `mint`, `fee_amount`, and `is_sol` fields emitted by the on-chain program.
- `event_logs.signature` was the only dedupe key, which is too weak for a durable event pipeline.
- HTTP and worker each had their own copy of the Prisma schema, with drift already present.

## Changes Applied

### Shared event contract package

Added `packages/autosol-event-contract` with:

- canonical Redis stream/list names
- shared Zod schemas for all program events
- event wrapper parsing
- deterministic event key generation

This package is now the contract boundary for event payload parsing on the Bun side.

### Monitor publishing

`apps/blockchain_monitor` now:

- targets the live `G4zWuZQ7SaP9VgE7bhucKgQ7MVWjLVBhL4wHK6ymVAQL` program id
- deserializes the current event payloads including `mint`, `fee_amount`, and `is_sol`
- publishes only to the Redis stream: `solana_auto_sol_events_stream`
- trims the stream approximately with `XADD ... MAXLEN ~ 10000`
- clears the obsolete legacy Redis list `solana_auto_sol_events` on startup so stale items do not keep consuming memory

### Worker consumption model

`apps/worker` now uses Redis Streams consumer groups instead of list popping:

- stream: `solana_auto_sol_events_stream`
- consumer group: `autosol-workers`
- dead-letter stream: `solana_auto_sol_events_dlq`

Worker behavior:

- reads new messages via `XREADGROUP`
- reclaims abandoned pending messages via `XAUTOCLAIM`
- acknowledges only after durable processing
- sends permanently failed messages to the DLQ stream
- trims the dead-letter stream approximately with `MAXLEN ~ 2000`
- stores retry state in `event_logs` instead of relying on in-memory timers

This removes the previous retry dependency on a single worker process.

### Schema alignment

The canonical Prisma schema in `packages/db/prisma/schema.prisma` was updated to store:

- `payment_schedules.mint`
- `payment_schedules.fee_amount`
- `payment_schedules.is_sol`
- `payments.mint`
- `payments.is_sol`
- `fee_withdrawals.mint`
- `fee_withdrawals.is_sol`
- `event_logs.event_key`
- `event_logs.stream_id`
- `event_logs.last_attempt_at`
- `event_logs.processed_at`

`EventStatus` now includes:

- `PROCESSING`
- `RETRYING`
- `DEAD_LETTER`

`event_logs.signature` is no longer unique. `event_logs.event_key` is the durable uniqueness boundary.

### HTTP service shape

`apps/http` now:

- returns dashboard transactions with `executorAddress` instead of pretending every execution has a transaction signature
- returns token labels derived from `mint` and `is_sol`
- exposes `/ready` with a database probe
- shuts down Prisma cleanly on `SIGINT` / `SIGTERM`

## Verification Performed

- Regenerated Prisma client after schema changes:
  - `apps/http`
  - `apps/worker`
- Focused TypeScript checks passed for:
  - `packages/autosol-event-contract`
  - `apps/worker`
  - `apps/http`

## Required Rollout Steps

Before running the pipeline in an environment with a database, apply the new migrations for both Prisma schemas.

Recommended order:

1. Stop worker instances.
2. Apply the new migration in the active DB environment.
3. Restart the Rust monitor.
4. Start Bun worker instances.
5. Verify new events appear in:
   - `solana_auto_sol_events_stream`
   - `event_logs`
   - `payments`
   - `payment_schedules`

## Remaining Risks

- Redis itself is still an infrastructure dependency. This change removes single-process retry failure modes, but not Redis as an external dependency. High-availability Redis still needs to be handled at deployment level.
- The Rust monitor is still a single poller process. The stream-based worker path is more resilient now, but monitor leader election / horizontalization is still future work.
- The HTTP dashboard still uses simplified token labeling instead of a canonical metadata table. That is sufficient for correctness, not final UX.
