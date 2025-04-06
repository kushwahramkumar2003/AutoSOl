import { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getMint } from "@solana/spl-token";
import axios from "axios";

// Constants
const JUPITER_TOKEN_LIST_URL = "https://token.jup.ag/all";
const JUPITER_PRICE_API_URL = "https://price.jup.ag/v4/price";
const USDC_MINT_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// Types
export interface Token {
  symbol: string;
  name: string;
  balance: number;
  iconUrl: string | null;
  dollarValue: number;
  mintAddress: string;
  decimals: number;
}

interface UseFetchTokensReturn {
  availableTokens: Token[];
  isLoadingTokens: boolean;
  tokenError: string | null;
  viewMode: "token" | "usd";
  setViewMode: (mode: "token" | "usd") => void;
  sliderValue: number;
  setSliderValue: (value: number) => void;
  tokenInfoVisible: boolean;
  setTokenInfoVisible: (visible: boolean) => void;
  tokenMetadata: Record<string, any>;
  tokenPrices: Record<string, number>;
  inputError: string | null;
  setInputError: (error: string | null) => void;
  selectedToken: Token | null;
  handleAmountChange: (value: string) => void;
  handleSliderChange: (value: number[]) => void;
  getUSDValue: (amount: number, tokenMint: string) => string;
  formatTokenAmount: (amount: number, decimals: number) => string;
  calculateFee: (amount: number) => number;
  calculateTotal: (amount: number) => number;
  getStepSize: (tokenMint: string) => number;
  refreshTokens: () => Promise<void>;
}

export function useFetchTokens(
  data: { token?: string; amount: number },
  updateData: (data: any) => void
): UseFetchTokensReturn {
  // State variables
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"token" | "usd">("token");
  const [sliderValue, setSliderValue] = useState(0);
  const [tokenInfoVisible, setTokenInfoVisible] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, any>>({});
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [inputError, setInputError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [cachedTokens, setCachedTokens] = useState<{
    tokens: Token[];
    timestamp: number;
  } | null>(null);

  // Wallet and connection from Solana wallet adapter
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  // Get selected token information
  const selectedToken = useMemo(() => {
    return (
      availableTokens.find((token) => token.mintAddress === data.token) ||
      (availableTokens.length > 0 ? availableTokens[0] : null)
    );
  }, [availableTokens, data.token]);

  // Fetch token metadata from Jupiter API
  useEffect(() => {
    async function fetchTokenMetadata() {
      try {
        // Check if we have cached metadata in localStorage
        const cachedData = localStorage.getItem("tokenMetadata");
        const cacheTime = localStorage.getItem("tokenMetadataTime");

        // Use cache if it's less than 1 day old
        if (
          cachedData &&
          cacheTime &&
          Date.now() - Number(cacheTime) < 86400000
        ) {
          setTokenMetadata(JSON.parse(cachedData));
          return;
        }

        const response = await axios.get(JUPITER_TOKEN_LIST_URL);
        const tokenList = response.data;

        // Create a map of mint address to token metadata
        const tokenMap: Record<string, any> = {};
        tokenList.forEach((token: any) => {
          tokenMap[token.address] = {
            symbol: token.symbol,
            name: token.name,
            logoURI: token.logoURI,
            decimals: token.decimals,
          };
        });

        setTokenMetadata(tokenMap);

        // Cache the metadata
        localStorage.setItem("tokenMetadata", JSON.stringify(tokenMap));
        localStorage.setItem("tokenMetadataTime", Date.now().toString());
      } catch (error) {
        console.error("Error fetching token metadata:", error);
      }
    }

    fetchTokenMetadata();
  }, []);

  // Fetch token prices from Jupiter API
  const fetchTokenPrices = async (mintAddresses: string[]) => {
    if (mintAddresses.length === 0) return {};

    try {
      const response = await axios.get(
        `${JUPITER_PRICE_API_URL}?ids=${mintAddresses.join(",")}`
      );

      const prices: Record<string, number> = {};
      Object.entries(response.data.data).forEach(
        ([mint, priceData]: [string, any]) => {
          prices[mint] = priceData?.price || 0;
        }
      );

      return prices;
    } catch (error) {
      console.error("Error fetching token prices:", error);
      return {};
    }
  };

  // Fetch user's SOL balance
  const fetchSolBalance = async (
    conn: Connection,
    pubKey: PublicKey
  ): Promise<Token> => {
    const balance = await conn.getBalance(pubKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    return {
      symbol: "SOL",
      name: "Solana",
      balance: solBalance,
      iconUrl:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      dollarValue: 0, // Will be updated when we fetch prices
      mintAddress: "So11111111111111111111111111111111111111112",
      decimals: 9,
    };
  };

  // Fetch user's USDC balance
  const fetchUSDCBalance = async (
    conn: Connection,
    pubKey: PublicKey
  ): Promise<Token> => {
    try {
      const response = await conn.getParsedTokenAccountsByOwner(pubKey, {
        mint: new PublicKey(USDC_MINT_ADDRESS),
      });

      // Check if any USDC token accounts were found
      if (response.value.length > 0) {
        const tokenAccount = response.value[0];
        const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;

        return {
          symbol: "USDC",
          name: "USD Coin",
          balance: tokenAmount.uiAmount || 0,
          iconUrl:
            "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
          dollarValue: 1, // USDC is a stablecoin with 1:1 USD backing
          mintAddress: USDC_MINT_ADDRESS,
          decimals: 6,
        };
      }

      // If no USDC account found, return zero balance
      return {
        symbol: "USDC",
        name: "USD Coin",
        balance: 0,
        iconUrl:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
        dollarValue: 1,
        mintAddress: USDC_MINT_ADDRESS,
        decimals: 6,
      };
    } catch (error) {
      console.error("Error fetching USDC balance:", error);

      // Return zero balance in case of error
      return {
        symbol: "USDC",
        name: "USD Coin",
        balance: 0,
        iconUrl:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
        dollarValue: 1,
        mintAddress: USDC_MINT_ADDRESS,
        decimals: 6,
      };
    }
  };

  // Function to fetch user's tokens (made reusable for refreshing)
  const fetchUserTokens = async () => {
    if (!connected || !publicKey || !connection) {
      setTokenError("Wallet not connected");
      setIsLoadingTokens(false);
      return;
    }

    const currentTime = Date.now();

    // Return cached tokens if they're less than 30 seconds old
    if (cachedTokens && currentTime - cachedTokens.timestamp < 30000) {
      setAvailableTokens(cachedTokens.tokens);
      setIsLoadingTokens(false);
      return;
    }

    setIsLoadingTokens(true);
    setTokenError(null);

    try {
      // First get native SOL balance
      const solToken = await fetchSolBalance(connection, publicKey);

      // Separately fetch USDC balance
      const usdcToken = await fetchUSDCBalance(connection, publicKey);

      // Fetch SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      // Process token accounts to get balances
      const tokenPromises = tokenAccounts.value
        .filter((account) => {
          const parsedInfo = account.account.data.parsed.info;
          const tokenAmount = parsedInfo.tokenAmount;
          const mintAddress = parsedInfo.mint;

          // Filter out empty accounts and USDC (as we're handling it separately)
          return (
            Number(tokenAmount.uiAmount) > 0 &&
            mintAddress !== USDC_MINT_ADDRESS
          );
        })
        .map(async (account) => {
          const parsedInfo = account.account.data.parsed.info;
          const mintAddress = parsedInfo.mint;
          const mintInfo = await getMint(
            connection,
            new PublicKey(mintAddress)
          );

          // Get balance
          const tokenAmount = parsedInfo.tokenAmount;
          const balance = Number(tokenAmount.uiAmount);

          // Get token metadata from our cached metadata
          const metadata = tokenMetadata[mintAddress] || {
            symbol: "Unknown",
            name: `Token (${mintAddress.slice(0, 4)}...)`,
            logoURI: null,
            decimals: mintInfo.decimals,
          };

          return {
            symbol: metadata.symbol,
            name: metadata.name,
            balance,
            iconUrl: metadata.logoURI,
            dollarValue: 0, // Will be updated when we fetch prices
            mintAddress,
            decimals: mintInfo.decimals,
          };
        });

      // Combine SOL, USDC, and other tokens
      let tokens = [
        solToken,
        usdcToken,
        ...(await Promise.all(tokenPromises)),
      ].filter(Boolean); // Filter out any undefined values

      // Fetch prices for all tokens
      const mintAddresses = tokens.map((token) => token.mintAddress);
      const prices = await fetchTokenPrices(mintAddresses);
      setTokenPrices(prices);

      // Update tokens with price data
      tokens = tokens.map((token) => ({
        ...token,
        dollarValue:
          token.symbol === "USDC" ? 1 : prices[token.mintAddress] || 0,
      }));

      // Filter out tokens with zero balance
      tokens = tokens.filter((token) => token.balance > 0);

      // Sort tokens by USD value (descending)
      tokens.sort((a, b) => {
        const aValue = a.balance * a.dollarValue;
        const bValue = b.balance * b.dollarValue;
        return bValue - aValue;
      });

      setAvailableTokens(tokens);
      setCachedTokens({
        tokens,
        timestamp: currentTime,
      });
      setLastFetchTime(currentTime);

      // Set initial token if we have tokens and none is selected
      if (
        tokens.length > 0 &&
        (!data.token || !tokens.find((t) => t.mintAddress === data.token))
      ) {
        updateData({ ...data, token: tokens[0].mintAddress, amount: 0 });
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setTokenError(
        error instanceof Error ? error.message : "Failed to load tokens"
      );
    } finally {
      setIsLoadingTokens(false);
    }
  };

  // Function to manually refresh tokens
  const refreshTokens = async () => {
    // Clear cache to force refresh
    setCachedTokens(null);
    await fetchUserTokens();
  };

  // Fetch user's token balances
  useEffect(() => {
    fetchUserTokens();

    // Set up polling for price updates (every 30 seconds)
    const priceUpdateInterval = setInterval(() => {
      if (availableTokens.length > 0) {
        const mintAddresses = availableTokens.map((token) => token.mintAddress);
        fetchTokenPrices(mintAddresses).then((prices) => {
          setTokenPrices(prices);

          // Update token dollar values
          setAvailableTokens((tokens) => {
            const updatedTokens = tokens.map((token) => ({
              ...token,
              dollarValue: prices[token.mintAddress] || token.dollarValue,
            }));

            // Update cached tokens as well
            setCachedTokens({
              tokens: updatedTokens,
              timestamp: Date.now(),
            });

            return updatedTokens;
          });
        });
      }
    }, 30000);

    return () => clearInterval(priceUpdateInterval);
  }, [connection, publicKey, connected, updateData, data.token, tokenMetadata]);

  // Update slider value when token or amount changes
  useEffect(() => {
    if (selectedToken && data.amount > 0) {
      const percentage = Math.min(
        (data.amount / selectedToken.balance) * 100,
        100
      );
      setSliderValue(percentage);
    } else {
      setSliderValue(0);
    }
  }, [data.token, data.amount, selectedToken]);

  // Handle amount input change
  const handleAmountChange = (value: string) => {
    setInputError(null);
    let amount = Number.parseFloat(value) || 0;

    // Validate amount
    if (selectedToken) {
      if (amount < 0) {
        amount = 0;
        setInputError("Amount cannot be negative");
      } else if (amount > selectedToken.balance) {
        amount = selectedToken.balance;
        setInputError("Amount exceeds balance");
      }
    }

    updateData({ ...data, amount });

    // Update slider value
    if (selectedToken) {
      const percentage = Math.min((amount / selectedToken.balance) * 100, 100);
      setSliderValue(percentage);
    }
  };

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    if (selectedToken) {
      const amount = (selectedToken.balance * value[0]) / 100;
      updateData({ ...data, amount });
    }
  };

  // Convert token amount to USD value
  const getUSDValue = (amount: number, tokenMint: string): string => {
    const token = availableTokens.find((t) => t.mintAddress === tokenMint);
    if (token && token.dollarValue) {
      return (amount * token.dollarValue).toFixed(2);
    }
    return "0.00";
  };

  // Format token amount based on decimals
  const formatTokenAmount = (amount: number, decimals: number): string => {
    if (decimals <= 2) return amount.toFixed(0);
    if (amount < 0.01) return amount.toFixed(decimals);
    if (amount < 1) return amount.toFixed(4);
    return amount.toFixed(2);
  };

  // Calculate transaction fee (1% in this example)
  const calculateFee = (amount: number): number => {
    return amount * 0.01;
  };

  // Calculate total amount including fee
  const calculateTotal = (amount: number): number => {
    return amount + calculateFee(amount);
  };

  // Determine step size for input based on token
  const getStepSize = (tokenMint: string): number => {
    const token = availableTokens.find((t) => t.mintAddress === tokenMint);
    if (!token) return 0.01;

    // For tokens with very small values like meme coins
    if (token.dollarValue && token.dollarValue < 0.0001) {
      return 100;
    }

    // For tokens with normal values
    return Math.pow(10, -Math.min(6, token.decimals));
  };

  return {
    availableTokens,
    isLoadingTokens,
    tokenError,
    viewMode,
    setViewMode,
    sliderValue,
    setSliderValue,
    tokenInfoVisible,
    setTokenInfoVisible,
    tokenMetadata,
    tokenPrices,
    inputError,
    setInputError,
    selectedToken,
    handleAmountChange,
    handleSliderChange,
    getUSDValue,
    formatTokenAmount,
    calculateFee,
    calculateTotal,
    getStepSize,
    refreshTokens,
  };
}
