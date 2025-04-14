"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { type Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const USDC_MINT_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

const USDT_MINT_MAINNET_ADDRESS =
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const USDC_MINT_MAINNET_ADDRESS =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface Token {
  symbol: string;
  name: string;
  balance: number;
  iconUrl: string | null;
  dollarValue: number;
  mintAddress: string;
  decimals: number;
}

export function useFetchTokens(
  data: { token?: string; amount: number; symbol?: string },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  updateData: (data: any) => void
) {
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"token" | "usd">("token");
  const [sliderValue, setSliderValue] = useState(0);
  const [tokenInfoVisible, setTokenInfoVisible] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [cachedTokens, setCachedTokens] = useState<{
    tokens: Token[];
    timestamp: number;
  } | null>(null);

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const selectedToken = useMemo(() => {
    return (
      availableTokens.find((token) => token.mintAddress === data.token) ||
      (availableTokens.length > 0 ? availableTokens[0] : null)
    );
  }, [availableTokens, data.token]);

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
      dollarValue: 0,
      mintAddress: "So11111111111111111111111111111111111111112",
      decimals: 9,
    };
  };

  const fetchUSDCBalance = async (
    conn: Connection,
    pubKey: PublicKey
  ): Promise<Token> => {
    try {
      const response = await conn.getParsedTokenAccountsByOwner(pubKey, {
        mint: new PublicKey(USDC_MINT_ADDRESS),
      });

      if (response.value.length > 0) {
        const tokenAccount = response.value[0];
        const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;

        return {
          symbol: "USDC",
          name: "USD Coin",
          balance: tokenAmount.uiAmount || 0,
          iconUrl:
            "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
          dollarValue: 1,
          mintAddress: USDC_MINT_ADDRESS,
          decimals: 6,
        };
      }

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

  const fetchUserTokens = async () => {
    if (!connected || !publicKey || !connection) {
      setTokenError("Wallet not connected");
      setIsLoadingTokens(false);
      return;
    }

    const currentTime = Date.now();

    if (cachedTokens && currentTime - cachedTokens.timestamp < 30000) {
      setAvailableTokens(cachedTokens.tokens);
      setIsLoadingTokens(false);
      return;
    }

    setIsLoadingTokens(true);
    setTokenError(null);

    try {
      const solToken = await fetchSolBalance(connection, publicKey);

      const usdcToken = await fetchUSDCBalance(connection, publicKey);

      let tokens = [solToken, usdcToken].filter(Boolean);

      tokens = tokens.map((token) => ({
        ...token,
      }));

      tokens = tokens.filter((token) => token.balance > 0);

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

      if (
        tokens.length > 0 &&
        (!data.token || !tokens.find((t) => t.mintAddress === data.token))
      ) {
        updateData({
          ...data,
          token: tokens[0].mintAddress,
          amount: 0,
          symbol: tokens[0].symbol,
        });
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

  const refreshTokens = async () => {
    setCachedTokens(null);
    await fetchUserTokens();
  };

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

  const handleAmountChange = (value: string) => {
    setInputError(null);
    let amount = Number.parseFloat(value) || 0;

    if (selectedToken) {
      if (amount < 0) {
        amount = 0;
        setInputError("Amount cannot be negative");
      } else if (amount > selectedToken.balance) {
        amount = selectedToken.balance;
        setInputError("Amount exceeds balance");
      }
    }

    updateData({
      ...data,
      amount,
      symbol: selectedToken?.symbol,
    });

    if (selectedToken) {
      const percentage = Math.min((amount / selectedToken.balance) * 100, 100);
      setSliderValue(percentage);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    if (selectedToken) {
      const amount = (selectedToken.balance * value[0]) / 100;
      updateData({
        ...data,
        amount,
        symbol: selectedToken.symbol,
      });
    }
  };

  const getUSDValue = (amount: number, tokenMint: string): string => {
    const token = availableTokens.find((t) => t.mintAddress === tokenMint);
    if (token && token.dollarValue) {
      return (amount * token.dollarValue).toFixed(2);
    }
    return "0.00";
  };

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

  const calculateTotal = (amount: number): number => {
    return amount + calculateFee(amount);
  };

  const getStepSize = (tokenMint: string): number => {
    const token = availableTokens.find((t) => t.mintAddress === tokenMint);
    if (!token) return 0.01;

    if (token.dollarValue && token.dollarValue < 0.0001) {
      return 100;
    }

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
