/**
 * TokenBalanceService — fetches SOL + SPL token balances for a given wallet.
 *
 * Uses the Solana JSON RPC standard endpoints (getBalance + getParsedTokenAccountsByOwner).
 * Results are cached per-wallet for 15 seconds to reduce RPC load during
 * rapid frontend re-mounts.
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  SUPPORTED_TOKENS,
  TOKEN_BY_MAINNET_MINT,
} from "../config/supported-tokens";
import type { SupportedToken } from "../config/supported-tokens";

// Per-wallet cache: walletAddress → { balances, timestamp }
interface BalanceCacheEntry {
  balances: WalletTokenBalance[];
  timestamp: number;
}

const BALANCE_CACHE_TTL_MS = 15_000; // 15 seconds

// In-memory cache keyed by wallet address
const balanceCache = new Map<string, BalanceCacheEntry>();

export interface WalletTokenBalance {
  symbol: string;
  name: string;
  decimals: number;
  mintAddress: string;
  logoURI: string;
  /** Human-readable balance (already divided by 10^decimals) */
  balance: number;
  /** Raw lamports / base units (as reported by RPC) */
  rawBalance: string;
}

/** Resolve the RPC endpoint from the environment */
function getRpcEndpoint(): string {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "http://127.0.0.1:8899"
  );
}

/**
 * Determine whether the current network is devnet based on the RPC URL.
 * Used to pick the correct mint address for devnet tokens (e.g., devnet USDC).
 *
 * The SOLANA_TOKEN_ENV env var takes priority when set:
 *   - "devnet"  → use devnet mints
 *   - anything else (e.g. "mainnet", "local") → use mainnet mints
 *
 * Without the env var, only an RPC URL containing "devnet" is treated as devnet.
 * localhost / 127.0.0.1 (Surfpool) defaults to mainnet mints since Surfpool
 * typically forks mainnet state.
 */
function isDevnet(): boolean {
  const envOverride = process.env.SOLANA_TOKEN_ENV;
  if (envOverride) return envOverride === "devnet";
  const rpc = getRpcEndpoint().toLowerCase();
  return rpc.includes("devnet");
}

/**
 * Return the correct mint address for a SupportedToken based on current network.
 */
function resolveMint(token: SupportedToken): string {
  return isDevnet() ? token.mintAddressDevnet : token.mintAddressMainnet;
}

/**
 * Fetch SOL and all supported SPL token balances for a given wallet address.
 * Results are cached for 15 seconds per wallet.
 */
export async function fetchWalletBalances(
  walletAddress: string
): Promise<WalletTokenBalance[]> {
  const now = Date.now();

  // Return cached data if still fresh
  const cached = balanceCache.get(walletAddress);
  if (cached && now - cached.timestamp < BALANCE_CACHE_TTL_MS) {
    return cached.balances;
  }

  let publicKey: PublicKey;
  try {
    publicKey = new PublicKey(walletAddress);
  } catch {
    throw new Error(`Invalid wallet address: ${walletAddress}`);
  }

  const connection = new Connection(getRpcEndpoint(), "confirmed");

  const balances: WalletTokenBalance[] = [];

  // --- 1. Fetch SOL balance ---
  try {
    const solLamports = await connection.getBalance(publicKey);
    const solToken = SUPPORTED_TOKENS.find((t) => t.symbol === "SOL")!;
    balances.push({
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      mintAddress: solToken.mintAddressMainnet,
      logoURI: solToken.logoURI,
      balance: solLamports / LAMPORTS_PER_SOL,
      rawBalance: solLamports.toString(),
    });
  } catch (err) {
    console.error("[TokenBalanceService] Failed to fetch SOL balance:", err);
  }

  // --- 2. Fetch all SPL token accounts owned by the wallet ---
  try {
    const splAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );

    const now2 = Date.now(); // avoid closure issues

    for (const { account } of splAccounts.value) {
      const info = account.data.parsed?.info;
      if (!info) continue;

      const mintAddr: string = info.mint;
      const rawBalance: string =
        info.tokenAmount?.amount ?? "0";
      const uiAmount: number = info.tokenAmount?.uiAmount ?? 0;
      const decimals: number =
        info.tokenAmount?.decimals ?? 0;

      // Only include tokens from our supported list (by any of their mint addresses)
      const knownToken =
        TOKEN_BY_MAINNET_MINT.get(mintAddr) ||
        // Also check devnet mint addresses
        SUPPORTED_TOKENS.find(
          (t) => t.mintAddressDevnet === mintAddr && t.mintAddressDevnet !== t.mintAddressMainnet
        );

      if (!knownToken) continue;

      // Avoid duplicates (e.g., SOL already added above)
      if (knownToken.symbol === "SOL") continue;

      balances.push({
        symbol: knownToken.symbol,
        name: knownToken.name,
        decimals: decimals || knownToken.decimals,
        mintAddress: resolveMint(knownToken),
        logoURI: knownToken.logoURI,
        balance: uiAmount,
        rawBalance,
      });
    }
  } catch (err) {
    console.error("[TokenBalanceService] Failed to fetch SPL token balances:", err);
  }

  // Sort: SOL first, then by balance descending
  balances.sort((a, b) => {
    if (a.symbol === "SOL") return -1;
    if (b.symbol === "SOL") return 1;
    return b.balance - a.balance;
  });

  // Persist to cache
  balanceCache.set(walletAddress, { balances, timestamp: now });

  return balances;
}

/** Evict a wallet's cached balances (e.g., after a confirmed transaction) */
export function invalidateBalanceCache(walletAddress: string): void {
  balanceCache.delete(walletAddress);
}

/** Return cache statistics for monitoring */
export function getBalanceCacheStats(): { size: number } {
  return { size: balanceCache.size };
}
