import { TOKEN_BY_MAINNET_MINT } from "../config/supported-tokens";

const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";

// Cache entry: price in USD + timestamp of fetch
interface PriceCacheEntry {
  price: number;
  timestamp: number;
}

// TTL for price cache (60 seconds — prices don't need to be millisecond-fresh)
const PRICE_CACHE_TTL_MS = 60_000;

// In-memory map: mintAddress → { price, timestamp }
const priceCache = new Map<string, PriceCacheEntry>();

export interface TokenPrice {
  mintAddress: string;
  priceUSD: number;
  /** ISO timestamp of when the price was fetched */
  fetchedAt: string;
}

/**
 * Fetch USD prices for a list of token mint addresses using CoinGecko API.
 * Results are cached for 60 seconds to reduce external API load.
 */
export async function fetchTokenPrices(
  mintAddresses: string[]
): Promise<Map<string, TokenPrice>> {
  const now = Date.now();
  const result = new Map<string, TokenPrice>();
  const toFetch: string[] = [];
  const coingeckoIdsToFetch: string[] = [];
  
  // Mapping of coingeckoId -> array of mints (in case multiple mints share an ID)
  const idToMints = new Map<string, string[]>();

  // Separate cached hits from misses
  for (const mint of mintAddresses) {
    const cached = priceCache.get(mint);
    if (cached && now - cached.timestamp < PRICE_CACHE_TTL_MS) {
      result.set(mint, {
        mintAddress: mint,
        priceUSD: cached.price,
        fetchedAt: new Date(cached.timestamp).toISOString(),
      });
    } else {
      toFetch.push(mint);
      
      const tokenConfig = TOKEN_BY_MAINNET_MINT.get(mint);
      if (tokenConfig && tokenConfig.coingeckoId) {
        coingeckoIdsToFetch.push(tokenConfig.coingeckoId);
        const existing = idToMints.get(tokenConfig.coingeckoId) || [];
        existing.push(mint);
        idToMints.set(tokenConfig.coingeckoId, existing);
      }
    }
  }

  if (toFetch.length === 0) {
    return result;
  }

  if (coingeckoIdsToFetch.length > 0) {
    try {
      const ids = Array.from(new Set(coingeckoIdsToFetch)).join(",");
      const url = `${COINGECKO_API}?ids=${ids}&vs_currencies=usd`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        // Set a generous timeout — server-side so we don't need to be as strict
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        throw new Error(
          `CoinGecko API returned ${response.status}: ${response.statusText}`
        );
      }

      // Record<coingeckoId, { usd: number }>
      const body = (await response.json()) as Record<string, { usd?: number } | null>;

      const fetchedAt = new Date().toISOString();

      for (const [cgId, mints] of idToMints.entries()) {
        const entry = body[cgId];
        const price = entry?.usd ? entry.usd : 0;

        for (const mint of mints) {
          // Update cache regardless of whether price was found (cache zero too, briefly)
          priceCache.set(mint, { price, timestamp: now });

          result.set(mint, {
            mintAddress: mint,
            priceUSD: price,
            fetchedAt,
          });
        }
      }
    } catch (err) {
      console.error("[TokenPriceService] Failed to fetch prices from CoinGecko:", err);
    }
  }

  // Handle errors or missing IDs by falling back to cache or zero
  for (const mint of toFetch) {
    if (!result.has(mint)) {
      const stale = priceCache.get(mint);
      result.set(mint, {
        mintAddress: mint,
        priceUSD: stale?.price ?? 0,
        fetchedAt: stale ? new Date(stale.timestamp).toISOString() : new Date().toISOString(),
      });
    }
  }

  return result;
}

/** Clear a single entry from the price cache (e.g., force refresh) */
export function invalidatePriceCache(mintAddress: string): void {
  priceCache.delete(mintAddress);
}

/** Return cache statistics for monitoring */
export function getPriceCacheStats(): {
  size: number;
  entries: Array<{ mint: string; ageMs: number }>;
} {
  const now = Date.now();
  return {
    size: priceCache.size,
    entries: Array.from(priceCache.entries()).map(([mint, entry]) => ({
      mint,
      ageMs: now - entry.timestamp,
    })),
  };
}
