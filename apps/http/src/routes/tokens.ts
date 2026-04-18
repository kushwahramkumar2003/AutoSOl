/**
 * Token REST routes.
 *
 * GET /api/v1/tokens/supported          — canonical list of supported tokens
 * GET /api/v1/tokens/prices             — batch USD prices (query: mints=addr1,addr2)
 * GET /api/v1/tokens/balances/:wallet   — SOL + SPL balances for a wallet
 * GET /api/v1/tokens/cache              — cache statistics (internal/monitoring)
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { SUPPORTED_TOKENS, ALL_MAINNET_MINTS } from "../config/supported-tokens";
import {
  fetchTokenPrices,
  getPriceCacheStats,
} from "../services/token-price.service";
import {
  fetchWalletBalances,
  invalidateBalanceCache,
  getBalanceCacheStats,
} from "../services/token-balance.service";

const router = Router();

// ─── GET /supported ───────────────────────────────────────────────────────────
/**
 * Returns the static list of tokens supported by AutoSOl for recurring payments.
 * Clients can use this to populate the token selector without any RPC calls.
 */
router.get("/supported", (_req: Request, res: Response) => {
  res.json({
    tokens: SUPPORTED_TOKENS.map((t) => ({
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
      mintAddress: t.mintAddressMainnet,
      mintAddressDevnet: t.mintAddressDevnet,
      logoURI: t.logoURI,
      jupiterMint: t.jupiterMint,
    })),
    count: SUPPORTED_TOKENS.length,
  });
});

// ─── GET /prices ──────────────────────────────────────────────────────────────
/**
 * Fetch USD prices for a set of token mint addresses.
 *
 * Query params:
 *   mints  — comma-separated mainnet mint addresses (optional, defaults to all supported)
 *   symbols — comma-separated symbols (optional, alternative to mints)
 *
 * Prices are sourced from Jupiter Price API v2 with a 60s server-side cache.
 */
router.get("/prices", async (req: Request, res: Response) => {
  try {
    let mintAddresses: string[] = ALL_MAINNET_MINTS;

    // Support filtering by mint addresses
    if (req.query.mints && typeof req.query.mints === "string" && req.query.mints.length > 0) {
      mintAddresses = req.query.mints.split(",").map((m: string) => m.trim()).filter(Boolean);
    }

    // Support filtering by symbols (convert to mints)
    if (req.query.symbols && typeof req.query.symbols === "string" && req.query.symbols.length > 0) {
      const symbols = (req.query.symbols as string).split(",").map((s: string) => s.trim().toUpperCase());
      mintAddresses = SUPPORTED_TOKENS.filter((t) =>
        symbols.includes(t.symbol.toUpperCase())
      ).map((t) => t.mintAddressMainnet);
    }

    if (mintAddresses.length === 0) {
      return res.status(400).json({ error: "No valid mint addresses or symbols provided" });
    }

    const priceMap = await fetchTokenPrices(mintAddresses);

    // Build a response object keyed by mint address
    const prices: Record<string, { priceUSD: number; fetchedAt: string }> = {};
    priceMap.forEach((val, key) => {
      prices[key] = { priceUSD: val.priceUSD, fetchedAt: val.fetchedAt };
    });

    // Also include symbol-keyed entries for easy frontend lookup
    const bySymbol: Record<string, { priceUSD: number; mintAddress: string }> = {};
    for (const token of SUPPORTED_TOKENS) {
      const entry = priceMap.get(token.mintAddressMainnet);
      if (entry) {
        bySymbol[token.symbol] = {
          priceUSD: entry.priceUSD,
          mintAddress: token.mintAddressMainnet,
        };
      }
    }

    res.json({ prices, bySymbol });
  } catch (err) {
    console.error("[tokens/prices] Error:", err);
    res.status(500).json({ error: "Failed to fetch token prices" });
  }
});

// ─── GET /balances/:wallet ─────────────────────────────────────────────────────
/**
 * Fetch SOL + SPL token balances for a specific wallet address.
 *
 * Path params:
 *   wallet — base58-encoded Solana public key
 *
 * Query params:
 *   refresh — if "true", bypass the 15s cache and force a fresh RPC fetch
 *
 * Balances include price data from the price service for a complete token object.
 */
router.get(
  "/balances/:wallet",
  async (req: Request, res: Response) => {
    const wallet = req.params.wallet as string;
    const forceRefresh = req.query.refresh === "true";

    if (!wallet || wallet.length < 32) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (forceRefresh) {
      invalidateBalanceCache(wallet);
    }

    try {
      const balances = await fetchWalletBalances(wallet);

      // Enrich with prices — batch-fetch all token prices in one go
      const mints = balances.map((b) => b.mintAddress);
      const priceMap = await fetchTokenPrices(
        // For devnet mints, always look up the mainnet mint's Jupiter price
        SUPPORTED_TOKENS.filter((t) =>
          mints.includes(t.mintAddressMainnet) ||
          mints.includes(t.mintAddressDevnet)
        ).map((t) => t.mintAddressMainnet)
      );

      // Merge symbol lookup for devnet tokens
      const symbolToPrice = new Map<string, number>();
      SUPPORTED_TOKENS.forEach((t) => {
        const pe = priceMap.get(t.mintAddressMainnet);
        if (pe) symbolToPrice.set(t.symbol, pe.priceUSD);
      });

      const enriched = balances.map((b) => ({
        ...b,
        priceUSD: symbolToPrice.get(b.symbol) ?? 0,
        balanceUSD: (symbolToPrice.get(b.symbol) ?? 0) * b.balance,
      }));

      res.json({
        wallet,
        tokens: enriched,
        totalBalanceUSD: enriched.reduce((sum, t) => sum + t.balanceUSD, 0),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[tokens/balances] Error for wallet", wallet, ":", msg);

      if (msg.includes("Invalid wallet address")) {
        return res.status(400).json({ error: msg });
      }
      res.status(500).json({ error: "Failed to fetch wallet balances" });
    }
  }
);

// ─── GET /cache ──────────────────────────────────────────────────────────────
/**
 * Internal endpoint to inspect cache health (useful for ops/monitoring).
 */
router.get("/cache", (_req: Request, res: Response) => {
  res.json({
    price: getPriceCacheStats(),
    balance: getBalanceCacheStats(),
  });
});

export default router;
