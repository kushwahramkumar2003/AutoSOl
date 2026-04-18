# Auth Nonce Store Note

Reviewed on April 16, 2026.

## Change

The in-memory auth challenge nonce store for `apps/web` was moved out of
`app/api/auth/challenge/route.ts` into `apps/web/lib/nonce-store.ts`.

## Reason

Next.js route modules must not export arbitrary runtime values like
`nonceStore`. Keeping the shared store inside the route caused type generation
to fail during `tsc` and `next build`.

## Behavior

- nonce issuance remains in `app/api/auth/challenge/route.ts`
- nonce consumption remains in `apps/web/lib/auth.ts`
- nonce TTL and periodic cleanup behavior are unchanged

## Security note

This is still a single-process in-memory store. It is acceptable for local
development and single-instance deployments, but it is not sufficient for a
multi-instance production deployment without shared storage such as Redis.
