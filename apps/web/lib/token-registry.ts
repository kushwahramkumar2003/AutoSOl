export interface KnownToken {
  symbol: string;
  name: string;
  decimals: number;
  mintAddresses: string[];
  logoURI: string | null;
}

export interface TokenRegistryOption {
  symbol: string;
  name: string;
  decimals: number;
  mintAddress: string;
  logoURI: string | null;
}

export const SOL_NATIVE_MINT = "11111111111111111111111111111111";
export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

const KNOWN_TOKENS: KnownToken[] = [
  {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    mintAddresses: [SOL_NATIVE_MINT, WRAPPED_SOL_MINT],
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    mintAddresses: [
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    ],
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    mintAddresses: ["Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"],
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
  },
  {
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    mintAddresses: ["DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"],
    logoURI: "https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png",
  },
  {
    symbol: "JUP",
    name: "Jupiter",
    decimals: 6,
    mintAddresses: ["JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"],
    logoURI: "https://static.jup.ag/jup/icon.png",
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    decimals: 6,
    mintAddresses: ["EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"],
    logoURI:
      "https://bafkreibk3covs5ltyqxa272uodhculbgn2zm52cx7i6laqnhxhutifssfy.ipfs.nftstorage.link",
  },
  {
    symbol: "PYTH",
    name: "Pyth Network",
    decimals: 6,
    mintAddresses: ["HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3"],
    logoURI: "https://pyth.network/token.svg",
  },
  {
    symbol: "RAY",
    name: "Raydium",
    decimals: 6,
    mintAddresses: ["4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"],
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  },
];

const KNOWN_TOKENS_BY_MINT = new Map<string, KnownToken>();
const KNOWN_TOKENS_BY_SYMBOL = new Map<string, KnownToken>();

KNOWN_TOKENS.forEach((token) => {
  KNOWN_TOKENS_BY_SYMBOL.set(token.symbol.toUpperCase(), token);
  token.mintAddresses.forEach((mint) => {
    KNOWN_TOKENS_BY_MINT.set(mint, token);
  });
});

export function isSolMint(mint: string): boolean {
  return mint === SOL_NATIVE_MINT || mint === WRAPPED_SOL_MINT;
}

export function getKnownTokenByMint(mint: string): KnownToken | undefined {
  return KNOWN_TOKENS_BY_MINT.get(mint);
}

export function getKnownTokenBySymbol(symbol: string): KnownToken | undefined {
  return KNOWN_TOKENS_BY_SYMBOL.get(symbol.toUpperCase());
}

export function getAllKnownTokens(): KnownToken[] {
  return [...KNOWN_TOKENS];
}

function prefersDevnetMint(rpcEndpoint?: string): boolean {
  if (!rpcEndpoint) {
    return false;
  }

  const normalized = rpcEndpoint.toLowerCase();
  return normalized.includes("devnet");
}

export function getPopularTokenOptions(
  rpcEndpoint?: string
): TokenRegistryOption[] {
  const useDevnetPreference = prefersDevnetMint(rpcEndpoint);

  return KNOWN_TOKENS.map((token) => {
    const preferredMint =
      useDevnetPreference && token.symbol === "USDC" && token.mintAddresses[1]
        ? token.mintAddresses[1]
        : token.mintAddresses[0];

    return {
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      mintAddress: preferredMint,
      logoURI: token.logoURI,
    };
  });
}

export function getTokenLabel(mint: string, isSol: boolean = false): string {
  if (isSol || isSolMint(mint)) {
    return "SOL";
  }

  const known = getKnownTokenByMint(mint);
  if (known) {
    return known.symbol;
  }

  return mint.length > 8 ? `SPL:${mint.slice(0, 6)}` : "TOKEN";
}

export function getTokenName(mint: string, isSol: boolean = false): string {
  if (isSol || isSolMint(mint)) {
    return "Solana";
  }

  return getKnownTokenByMint(mint)?.name || `Token ${mint.slice(0, 6)}`;
}

export function getTokenDecimals(mint: string, isSol: boolean = false): number {
  if (isSol || isSolMint(mint)) {
    return 9;
  }

  return getKnownTokenByMint(mint)?.decimals ?? 9;
}

export function getTokenLogo(mint: string, isSol: boolean = false): string | null {
  if (isSol || isSolMint(mint)) {
    return getKnownTokenByMint(WRAPPED_SOL_MINT)?.logoURI ?? null;
  }

  return getKnownTokenByMint(mint)?.logoURI ?? null;
}

export function getTokenLogoBySymbol(symbol: string): string | null {
  return getKnownTokenBySymbol(symbol)?.logoURI ?? null;
}

export function formatRawTokenAmount(
  rawAmount: number,
  mint: string,
  isSol: boolean = false,
  maximumFractionDigits: number = 4
): string {
  const decimals = getTokenDecimals(mint, isSol);
  const normalized = rawAmount / Math.pow(10, decimals);
  return normalized.toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

export function rawTokenAmountToUi(
  rawAmount: number,
  mint: string,
  isSol: boolean = false
): number {
  const decimals = getTokenDecimals(mint, isSol);
  return rawAmount / Math.pow(10, decimals);
}
