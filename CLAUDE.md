# Claude Code Instructions

Read `AGENTS.md` first, then `/doc/03-agent-rules.md`.

## Repo Priorities

1. Fix security and execution correctness before adding features.
2. Treat on-chain/off-chain schema drift as a production bug.
3. Do not ship replayable wallet authentication.
4. Do not assume `/api/dashboard/:address` is production-ready.
5. Prefer one validated end-to-end payment flow over multiple unfinished surfaces.
