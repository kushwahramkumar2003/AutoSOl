"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { AlertCircle, Coins, FileText, Loader2, Search } from "lucide-react";
import { TokenAvatar } from "@/components/shared/token-avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getKnownTokenByMint,
  getPopularTokenOptions,
  getTokenLabel,
  isSolMint,
} from "@/lib/token-registry";

interface PaymentData {
  amount: number;
  token: string;
  memo: string;
  symbol: string;
  decimals: number;
}

interface RequestTokenOption {
  symbol: string;
  name: string;
  decimals: number;
  mintAddress: string;
  logoURI: string | null;
  source: "popular" | "manual";
}

interface Props {
  data: PaymentData;
  updateData: (d: PaymentData) => void;
}

const CUSTOM_TOKEN_VALUE = "__custom_token__";

function formatUiAmount(amount: number, decimals: number): string {
  if (!Number.isFinite(amount)) {
    return "0";
  }

  if (decimals <= 2) {
    return amount.toFixed(0);
  }

  if (amount < 0.01) {
    return amount.toFixed(Math.min(decimals, 6));
  }

  if (amount < 1) {
    return amount.toFixed(4);
  }

  return amount.toFixed(2);
}

function getStepSize(decimals: number): number {
  return Math.pow(10, -Math.min(6, decimals));
}

export default function RequestPaymentSection({ data, updateData }: Props) {
  const { connection } = useConnection();
  const [customMint, setCustomMint] = useState("");
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolvingMint, setIsResolvingMint] = useState(false);
  const [manualToken, setManualToken] = useState<RequestTokenOption | null>(null);

  const popularTokens = useMemo<RequestTokenOption[]>(
    () =>
      getPopularTokenOptions(connection.rpcEndpoint).map((token) => ({
        ...token,
        source: "popular" as const,
      })),
    [connection.rpcEndpoint]
  );

  const allTokens = useMemo(() => {
    const tokens = [...popularTokens];
    if (manualToken && !tokens.some((token) => token.mintAddress === manualToken.mintAddress)) {
      tokens.push(manualToken);
    }
    return tokens;
  }, [manualToken, popularTokens]);

  const selectedToken = useMemo(() => {
    return allTokens.find((token) => token.mintAddress === data.token) ?? null;
  }, [allTokens, data.token]);

  useEffect(() => {
    if (!selectedToken && data.token && !isSolMint(data.token)) {
      setCustomMint(data.token);
    }
  }, [data.token, selectedToken]);

  const feeAmount = data.amount > 0 ? data.amount * 0.01 : 0;
  const selectedTokenLabel = selectedToken?.symbol || data.symbol || getTokenLabel(data.token);
  const selectedDecimals = selectedToken?.decimals ?? data.decimals ?? 9;

  const applyToken = (token: RequestTokenOption) => {
    updateData({
      ...data,
      token: token.mintAddress,
      symbol: token.symbol,
      decimals: token.decimals,
    });
  };

  const resolveCustomMint = async () => {
    const trimmed = customMint.trim();
    if (!trimmed) {
      setResolveError("Enter a token mint address first.");
      setManualToken(null);
      return;
    }

    let mintAddress: PublicKey;
    try {
      mintAddress = new PublicKey(trimmed);
    } catch {
      setResolveError("Enter a valid Solana mint address.");
      setManualToken(null);
      return;
    }

    setIsResolvingMint(true);
    setResolveError(null);

    try {
      const mintInfo = await getMint(connection, mintAddress);
      const knownToken = getKnownTokenByMint(trimmed);
      const resolvedToken: RequestTokenOption = {
        symbol: knownToken?.symbol ?? getTokenLabel(trimmed, false).replace(/^SPL:/, "TKN-"),
        name: knownToken?.name ?? `Token ${trimmed.slice(0, 6)}`,
        decimals: mintInfo.decimals,
        mintAddress: trimmed,
        logoURI: knownToken?.logoURI ?? null,
        source: "manual",
      };

      setManualToken(resolvedToken);
      applyToken(resolvedToken);
    } catch (error) {
      setManualToken(null);
      setResolveError(
        error instanceof Error
          ? `Unable to resolve that mint on the current network: ${error.message}`
          : "Unable to resolve that mint on the current network."
      );
    } finally {
      setIsResolvingMint(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Requested Token
          </span>
          <p className="mt-1 text-xs text-slate-500">
            Choose what you want the payer to approve. This list is curated and not tied to your own wallet.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Select
          value={selectedToken?.mintAddress ?? (customMint ? CUSTOM_TOKEN_VALUE : data.token)}
          onValueChange={(value) => {
            if (value === CUSTOM_TOKEN_VALUE) {
              return;
            }

            const token = allTokens.find((item) => item.mintAddress === value);
            if (token) {
              applyToken(token);
              if (token.source !== "manual") {
                setResolveError(null);
              }
            }
          }}
        >
          <SelectTrigger className="field-surface h-12">
            {selectedToken ? (
              <div className="flex items-center gap-2.5">
                <TokenAvatar
                  symbol={selectedToken.symbol}
                  mint={selectedToken.mintAddress}
                  isSol={isSolMint(selectedToken.mintAddress)}
                  iconUrl={selectedToken.logoURI}
                  size={20}
                  className="h-5 w-5"
                />
                <div className="min-w-0 text-left">
                  <div className="truncate font-medium text-white">{selectedToken.symbol}</div>
                  <div className="truncate text-xs text-slate-500">{selectedToken.name}</div>
                </div>
              </div>
            ) : (
              <SelectValue placeholder="Select a popular token" />
            )}
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
            {popularTokens.map((token) => (
              <SelectItem
                key={token.mintAddress}
                value={token.mintAddress}
                className="rounded-lg focus:bg-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  <TokenAvatar
                    symbol={token.symbol}
                    mint={token.mintAddress}
                    isSol={isSolMint(token.mintAddress)}
                    iconUrl={token.logoURI}
                    size={18}
                    className="h-[18px] w-[18px]"
                  />
                  <div className="min-w-0 text-left">
                    <div className="truncate font-medium">{token.symbol}</div>
                    <div className="truncate text-xs text-slate-500">{token.name}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_TOKEN_VALUE} className="rounded-lg focus:bg-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-slate-400" />
                <div className="text-left">
                  <div className="font-medium">Use token mint address</div>
                  <div className="text-xs text-slate-500">Resolve any supported SPL mint on the connected network</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Custom Token Mint
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Paste a mint address to resolve symbol and decimals on {connection.rpcEndpoint.includes("devnet") ? "devnet" : connection.rpcEndpoint.includes("mainnet") ? "mainnet" : "the connected network"}.
              </div>
            </div>
            {manualToken ? (
              <div className="text-[11px] text-emerald-300">Resolved {manualToken.symbol}</div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={customMint}
              onChange={(event) => {
                setCustomMint(event.target.value);
                setResolveError(null);
              }}
              placeholder="Enter SPL token mint address"
              className="field-surface h-11 flex-1"
            />
            <button
              type="button"
              onClick={() => void resolveCustomMint()}
              disabled={isResolvingMint}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResolvingMint ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resolving
                </>
              ) : (
                "Resolve token"
              )}
            </button>
          </div>

          {resolveError ? (
            <p className="mt-2 text-xs text-red-400">{resolveError}</p>
          ) : manualToken ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              <TokenAvatar
                symbol={manualToken.symbol}
                mint={manualToken.mintAddress}
                isSol={false}
                iconUrl={manualToken.logoURI}
                size={18}
                className="h-[18px] w-[18px]"
              />
              <span>
                {manualToken.symbol} resolved with {manualToken.decimals} decimals on the current network.
              </span>
            </div>
          ) : null}
        </div>

        <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-100 [&>svg]:text-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Requester perspective</AlertTitle>
          <AlertDescription>
            Your own wallet balance is intentionally hidden here. You are asking for payment, not funding it.
          </AlertDescription>
        </Alert>

        <div className="group relative">
          <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-300" />
          <Input
            type="number"
            min={0}
            step={getStepSize(selectedDecimals)}
            placeholder="0.00"
            value={data.amount || ""}
            onChange={(event) => {
              const nextAmount = Math.max(0, Number.parseFloat(event.target.value) || 0);
              updateData({
                ...data,
                amount: nextAmount,
                symbol: selectedTokenLabel,
                decimals: selectedDecimals,
              });
            }}
            className="field-surface h-11 pl-10 pr-20 transition-colors focus:border-white/20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
            {selectedTokenLabel}
          </div>
        </div>

        {data.amount > 0 ? (
          <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-[11px]">
            <span className="text-slate-500">Platform fee preview (1%)</span>
            <span className="text-slate-300">
              {formatUiAmount(feeAmount, selectedDecimals)} {selectedTokenLabel}
            </span>
          </div>
        ) : null}

        <div className="group relative">
          <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-slate-300" />
          <Textarea
            placeholder="Memo (optional)"
            value={data.memo}
            onChange={(event) =>
              updateData({
                ...data,
                memo: event.target.value,
                symbol: selectedTokenLabel,
                decimals: selectedDecimals,
              })
            }
            maxLength={500}
            className="field-surface min-h-[70px] pl-10 transition-colors focus:border-white/20"
          />
        </div>
      </div>
    </div>
  );
}
