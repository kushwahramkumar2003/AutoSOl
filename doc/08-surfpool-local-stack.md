# Surfpool Local Stack

Reviewed on April 18, 2026.

## Goal

For local development, AutoSOl services should use the same Surfpool RPC so wallet balances, token balances, schedule reads, and backend enrichment reflect the local chain state instead of devnet or third-party RPCs.

## Canonical Local Endpoints

- Solana RPC: `http://127.0.0.1:8899`
- Redis: `redis://127.0.0.1:6379`
- HTTP backend: `http://localhost:3001`
- Web frontend: `http://localhost:3000`

## Defaults Updated

- `apps/web` now defaults `RPC_URL` to Surfpool
- `apps/http` now defaults `SOLANA_RPC_URL` to Surfpool
- `apps/http/src/services/token-balance.service.ts` now falls back to Surfpool instead of devnet
- `apps/http/src/script/index.ts` now defaults to `localnet`
- `apps/initializr/index.ts` now defaults to `localnet`
- `apps/executer/index.ts` now treats `localnet` as the default logical network
- `apps/blockchain_monitor` was already using Surfpool defaults

## Expected Outcome

When Surfpool is running, local wallet balance reads in the web app and token balance enrichment in the HTTP backend should reflect Surfpool state.

## Local Startup Order

1. Start Surfpool:

```bash
cd packages/auto-sol-2
NO_DNA=1 yarn surfpool:fresh
```

### Custom Upstream RPC

If you want Surfpool to fork from a paid upstream RPC instead of the public
`api.mainnet-beta.solana.com`, set `SURFPOOL_DATASOURCE_RPC_URL` before
starting it.

Example:

```bash
export SURFPOOL_DATASOURCE_RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
cd /mnt/Data/Language-Play-Ground/Projects/MERN/my/AutoSOl
yarn surfpool:fresh
```

This affects Surfpool's upstream datasource only. Your local app RPC should
still point to Surfpool itself at `http://127.0.0.1:8899`.

Recommended local app env values:

```bash
# apps/web/.env
RPC_URL=http://127.0.0.1:8899

# apps/http/.env
SOLANA_RPC_URL=http://127.0.0.1:8899

# apps/executer/.env or shell
RPC_URL=http://127.0.0.1:8899

# apps/blockchain_monitor/.env or shell
SOLANA_RPC_URL=http://127.0.0.1:8899
```

Do not commit the Helius URL with the real API key into the repo. Keep it in
your shell profile or local `.env` files that are ignored by git.

2. Start backend services:

```bash
cd apps/http && bun run dev
cd apps/worker && bun run dev
cd apps/blockchain_monitor && cargo run
cd apps/executer && bun run dev
```

3. Start frontend:

```bash
cd apps/web && bun run dev
```
