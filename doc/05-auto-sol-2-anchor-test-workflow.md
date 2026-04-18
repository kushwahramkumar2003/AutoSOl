# `auto-sol-2` Anchor Test Workflow Notes

Reviewed on April 17, 2026.

## Scope

This note covers the current `packages/auto-sol-2` Anchor test workflow and the observed deploy failure when running:

```bash
anchor test --skip-local-validator
```

## What Was Confirmed

- `packages/auto-sol-2/Anchor.toml` did not pin the Anchor CLI version even though the package is built against `anchor-lang` `0.31.1` and `@coral-xyz/anchor` `0.31.x`.
- `packages/auto-sol-2/programs/auto-sol-2/Cargo.toml` enabled `anchor-spl` default features, which pulled in a large amount of unused Token-2022 and metadata support.
- `packages/auto-sol-2/Anchor.toml` and `declare_id!` were configured for `CYfki6Aud8Vj1wiRExz1uG95YKGwrRMh2hw2qtVRpZeg`, but `anchor keys list` and the deploy keypair resolved the actual program to `G4zWuZQ7SaP9VgE7bhucKgQ7MVWjLVBhL4wHK6ymVAQL`.
- The tests and program initialization assumed a hardcoded backend wallet (`8dRC...`) while the local provider wallet was `2zgw...`, causing `initialize()` to fail before any schedule tests could run on a fresh local validator.
- The generated program artifact at `packages/auto-sol-2/target/deploy/auto_sol_2.so` was approximately `434K`.
- The reported deploy step wrote `460` upgrade transactions before blockhash expiry.
- After the dependency cleanup, the rebuilt artifact was still approximately `434K`, so the deploy issue does not appear to be caused by a recent binary size regression in this package.

## Repo-Side Fixes Applied

- Pinned `anchor_version = "0.31.1"` in `packages/auto-sol-2/Anchor.toml` to match the Rust and TypeScript Anchor dependencies used by this package.
- Aligned the configured and declared program id with the actual Anchor deploy keypair so the generated IDL, tests, and deployed address all target the same program.
- Added a compile-time local test override for the backend wallet (`AUTOSOL_HTTP_BACKEND_WALLET`) and updated the tests/scripts to derive the expected authority from the active provider wallet instead of a stale hardcoded key.
- Limited `anchor-spl` to the minimal verified feature set for this package: `token` and `token_2022`. Anchor account macros still require `token_2022` support here, but associated token and token metadata interfaces are no longer enabled.
- Added empty feature declarations for `anchor-debug`, `custom-heap`, and `custom-panic` so current Rust cfg checking does not emit repetitive false-positive warnings from Anchor macros.

## Remaining Blocker

The `Blockhash expired` failure during deploy could not be fully verified inside the current coding sandbox because RPC access to `http://127.0.0.1:8899` is blocked here. That means validator health, slot progression, and deploy throughput had to be inferred from the user-provided terminal output rather than directly measured end-to-end.

## Most Likely Causes Of The Remaining Expiry

1. The local validator used with `--skip-local-validator` is intermittently unstable during the upgradeable program deploy path.
2. The deploy path is still sensitive to validator speed because upgradeable program writes require many small transactions even for a moderately sized `.so`.
3. Version skew between the installed Anchor CLI `0.32.1` and the package dependencies `0.31.1` adds avoidable risk, even if it is not the direct cause of deploy failure.

## Recommended Local Verification

Run these checks on the machine that owns the validator process:

```bash
solana slot -u http://127.0.0.1:8899
solana block-height -u http://127.0.0.1:8899
solana ping -u http://127.0.0.1:8899 --count 5
solana program deploy target/deploy/auto_sol_2.so -u http://127.0.0.1:8899
```

If slots are not advancing smoothly, restart the validator before retrying `anchor test --skip-local-validator`.

## Verified Workaround Direction

`anchor test --help` confirms support for `--skip-deploy`. If Anchor deploy remains flaky against an already-running local validator, the safer workflow is:

```bash
AUTOSOL_HTTP_BACKEND_WALLET=$(solana address -k ~/.config/solana/id.json) NO_DNA=1 anchor build
NO_DNA=1 solana program deploy target/deploy/auto_sol_2.so -u http://127.0.0.1:8899 --max-sign-attempts 100
AUTOSOL_HTTP_BACKEND_WALLET=$(solana address -k ~/.config/solana/id.json) NO_DNA=1 anchor test --skip-build --skip-deploy --skip-local-validator
```

That separates the unstable step from the test run and gives the deploy command a larger signing retry budget than the default Anchor path.

For the current local workflow, the package scripts set `AUTOSOL_HTTP_BACKEND_WALLET` from `~/.config/solana/id.json` before `anchor build` or `anchor test`. That keeps the local test authority aligned with the active provider wallet without changing the default production fallback value compiled into the program. The fresh Surfpool script now uses the default clock-driven block mode because the integration tests rely on scheduled payments becoming due over wall-clock time.

In practice, `anchor test --skip-local-validator` completed the test suite successfully against Surfpool but still returned a final `os error 2` from the wrapper process in this environment. To avoid that wrapper failure, the package now includes a stable direct script:

```bash
yarn test:surfpool:fresh:stable
```

That script runs `anchor build`, `solana program deploy`, and `ts-mocha` directly against the fresh Surfpool validator instead of relying on `anchor test` as the outer orchestrator.

## Additional Notes From April 18, 2026

- The app-facing generated copies were stale. `apps/executer/types.ts`, `apps/initializr/types.ts`, `apps/web/program/types.ts`, `apps/executer/idl.json`, and `apps/initializr/idl.json` were refreshed directly from `packages/auto-sol-2/target/{types,idl}` so the off-chain clients match the current `auto-sol-2` program schema and address.
- `apps/web/program/idl.ts` was rebuilt from `packages/auto-sol-2/target/idl/auto_sol.json` so the web wrapper no longer points at the retired `98g...` program id.
- The full suite passed again on a fresh Surfpool instance after the authority-model migration:

```bash
NO_DNA=1 yarn test:surfpool:fresh:stable
```

Observed result:

```text
20 passing (44s)
```

- In this environment, `surfpool start --daemon` can leave a stale zombie parent/child pair that keeps `127.0.0.1:8899` reserved while RPC is no longer reachable. When that happens, the failure looks like:
  - `solana slot -u http://127.0.0.1:8899` -> request failure
  - a new `surfpool start` -> `RPC port 8899 is already in use`
- The reliable local workflow here was to run Surfpool in the foreground, verify startup, run the test suite from another shell, then stop Surfpool cleanly with `Ctrl-C`.

## Follow-Up Option

If expiry continues after validator health is confirmed, the next step should be to benchmark deploy behavior with the now-pruned dependency graph and compare transaction count and elapsed slot consumption before changing any on-chain logic.
