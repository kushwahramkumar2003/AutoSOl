"use client";

/**
 * useFetchTokens — React hook for token balances and prices.
 *
 * Data is fetched from the AutoSOl HTTP backend when available, then falls
 * back to direct RPC reads when the backend is unavailable. This keeps the
 * payment flow usable during local backend outages.
 *
 * Backend endpoints used:
 *   GET /api/v1/tokens/balances/:wallet  — SOL + SPL balances enriched with prices
 *   GET /api/v1/tokens/supported         — canonical token list (for token selector)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { fetchWalletTokensResilient } from "@/lib/resilient-data";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: (data: any) => void
) {
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"token" | "usd">("token");
  const [sliderValue, setSliderValue] = useState(0);
  const [tokenInfoVisible, setTokenInfoVisible] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  // Keep a ref for the last fetch timestamp to implement client-side debounce
  const lastFetchTs = useRef<number>(0);
  const REFETCH_INTERVAL_MS = 30_000; // re-fetch every 30s while mounted

  const selectedToken = useMemo(() => {
    return (
      availableTokens.find((token) => token.mintAddress === data.token) ||
      (availableTokens.length > 0 ? availableTokens[0] : null)
    );
  }, [availableTokens, data.token]);

  /**
   * Fetch token balances with a backend-first, RPC-fallback strategy.
   */
  const fetchTokensFromBackend = useCallback(
    async (force = false) => {
      if (!connected || !publicKey) {
        setTokenError("Wallet not connected");
        setIsLoadingTokens(false);
        return;
      }

      const now = Date.now();
      if (!force && now - lastFetchTs.current < REFETCH_INTERVAL_MS) {
        // Still fresh enough — skip this call
        return;
      }

      setIsLoadingTokens(true);
      setTokenError(null);

      try {
        const result = await fetchWalletTokensResilient(publicKey, connection);
        const tokens = result.data;

        lastFetchTs.current = Date.now();
        setAvailableTokens(tokens);
        setTokenError(result.notice);

        // Auto-select first available token if none selected
        if (
          tokens.length > 0 &&
          (!data.token || !tokens.find((t) => t.mintAddress === data.token))
        ) {
          updateData({
            ...data,
            token: tokens[0].mintAddress,
            amount: 0,
            symbol: tokens[0].symbol,
            decimals: tokens[0].decimals,
          });
        }
      } catch (err) {
        console.error("[useFetchTokens] Failed to fetch from backend:", err);
        setTokenError(
          err instanceof Error
            ? `Failed to load tokens: ${err.message}`
            : "Failed to load tokens"
        );
      } finally {
        setIsLoadingTokens(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connected, connection, publicKey]
  );

  // Initial load and periodic refetch
  useEffect(() => {
    fetchTokensFromBackend(true);

    const interval = setInterval(() => {
      fetchTokensFromBackend(false);
    }, REFETCH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchTokensFromBackend]);

  // Keep slider in sync when amount / token changes
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
    let amount = parseFloat(value) || 0;

    if (selectedToken) {
      if (amount < 0) {
        amount = 0;
        setInputError("Amount cannot be negative");
      } else if (amount > selectedToken.balance) {
        amount = selectedToken.balance;
        setInputError("Amount exceeds your available balance");
      }
    }

    updateData({
      ...data,
      amount,
      symbol: selectedToken?.symbol,
    });

    if (selectedToken && selectedToken.balance > 0) {
      setSliderValue(Math.min((amount / selectedToken.balance) * 100, 100));
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
    if (token && token.dollarValue > 0) {
      return (amount * token.dollarValue).toFixed(2);
    }
    return "0.00";
  };

  const formatTokenAmount = (amount: number, decimals: number): string => {
    if (decimals <= 2) return amount.toFixed(0);
    if (amount < 0.01) return amount.toFixed(Math.min(decimals, 6));
    if (amount < 1) return amount.toFixed(4);
    return amount.toFixed(2);
  };

  /** Platform fee: 1% of payment amount */
  const calculateFee = (amount: number): number => amount * 0.01;

  const calculateTotal = (amount: number): number =>
    amount + calculateFee(amount);

  const getStepSize = (tokenMint: string): number => {
    const token = availableTokens.find((t) => t.mintAddress === tokenMint);
    if (!token) return 0.01;
    if (token.dollarValue > 0 && token.dollarValue < 0.0001) return 100;
    return Math.pow(10, -Math.min(6, token.decimals));
  };

  /** Force a cache-busting refresh from the backend */
  const refreshTokens = useCallback(async () => {
    await fetchTokensFromBackend(true);
  }, [fetchTokensFromBackend]);

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
