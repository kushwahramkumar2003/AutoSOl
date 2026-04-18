/**
 * Canonical registry of supported tokens for AutoSOl recurring payments.
 * Each entry includes addresses for both devnet and mainnet
 * so the same config works in both environments.
 */

export interface SupportedToken {
  symbol: string;
  name: string;
  decimals: number;
  /** Solana mainnet mint address */
  mintAddressMainnet: string;
  /** Solana devnet mint address (may be same as mainnet for synthetic tokens) */
  mintAddressDevnet: string;
  /** Jupiter / CoinGecko token id for price lookup */
  coingeckoId: string;
  /** Jupiter price API token identifier (usually same as mainnet mint) */
  jupiterMint: string;
  logoURI: string;
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    mintAddressMainnet: "So11111111111111111111111111111111111111112",
    mintAddressDevnet: "So11111111111111111111111111111111111111112",
    coingeckoId: "solana",
    jupiterMint: "So11111111111111111111111111111111111111112",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    mintAddressMainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    mintAddressDevnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    coingeckoId: "usd-coin",
    jupiterMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    mintAddressMainnet: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    mintAddressDevnet: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    coingeckoId: "tether",
    jupiterMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    mintAddressMainnet: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    mintAddressDevnet: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    coingeckoId: "bonk",
    jupiterMint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    logoURI:
      "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    decimals: 6,
    mintAddressMainnet: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    mintAddressDevnet: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    coingeckoId: "jupiter-exchange-solana",
    jupiterMint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    logoURI: "https://static.jup.ag/jup/icon.png",
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    decimals: 6,
    mintAddressMainnet: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    mintAddressDevnet: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    coingeckoId: "dogwifcoin",
    jupiterMint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    logoURI:
      "https://bafkreibk3covs5ltyqxa272uodhculbgn2zm52cx7i6laqnhxhutifssfy.ipfs.nftstorage.link",
  },
  {
    symbol: "PYTH",
    name: "Pyth Network",
    decimals: 6,
    mintAddressMainnet: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    mintAddressDevnet: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    coingeckoId: "pyth-network",
    jupiterMint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    logoURI:
      "https://pyth.network/token.svg",
  },
  {
    symbol: "RAY",
    name: "Raydium",
    decimals: 6,
    mintAddressMainnet: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    mintAddressDevnet: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    coingeckoId: "raydium",
    jupiterMint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  },
];

/** Quick lookup by mainnet mint address */
export const TOKEN_BY_MAINNET_MINT = new Map<string, SupportedToken>(
  SUPPORTED_TOKENS.map((t) => [t.mintAddressMainnet, t])
);

/** Quick lookup by symbol (uppercase) */
export const TOKEN_BY_SYMBOL = new Map<string, SupportedToken>(
  SUPPORTED_TOKENS.map((t) => [t.symbol.toUpperCase(), t])
);

/** All mainnet mint addresses (used for batch price lookup) */
export const ALL_MAINNET_MINTS = SUPPORTED_TOKENS.map(
  (t) => t.mintAddressMainnet
);

/**
 * Resolve the correct mint address based on the current network environment.
 * Falls back to mainnet address when no devnet address is available.
 */
export function getMintForEnv(
  token: SupportedToken,
  isDevnet: boolean
): string {
  return isDevnet ? token.mintAddressDevnet : token.mintAddressMainnet;
}
