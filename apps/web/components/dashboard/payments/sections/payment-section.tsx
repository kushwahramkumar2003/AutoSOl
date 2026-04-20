"use client";

import Image from "next/image";
import { useFetchTokens } from "@/hooks/use-fetchToken";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Coins, DollarSign, FileText, Loader2, RefreshCw } from "lucide-react";

interface Props {
  data: { amount: number; token: string; memo: string; symbol: string; decimals: number };
  updateData: (d: { amount: number; token: string; memo: string; symbol: string; decimals: number }) => void;
}

export default function PaymentSection({ data, updateData }: Props) {
  const {
    availableTokens, isLoadingTokens, tokenError, inputError,
    selectedToken, handleAmountChange, getUSDValue, formatTokenAmount,
    calculateFee, getStepSize, refreshTokens,
  } = useFetchTokens(data, updateData);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Payment</span>
        <button type="button" onClick={() => refreshTokens()} className="flex items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-white">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {/* Token selector */}
        <Select
          value={data.token}
          onValueChange={(v) => {
            const t = availableTokens.find((tk) => tk.mintAddress === v);
            updateData({ ...data, token: v, amount: 0, symbol: t?.symbol || "Unknown", decimals: t?.decimals ?? 9 });
          }}
          disabled={availableTokens.length === 0}
        >
          <SelectTrigger className="field-surface h-12">
            {selectedToken ? (
              <div className="flex items-center gap-2.5">
                {selectedToken.iconUrl ? (
                  <Image src={selectedToken.iconUrl} alt={selectedToken.symbol} width={20} height={20} className="h-5 w-5 rounded-full" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">{selectedToken.symbol[0]}</div>
                )}
                <span className="font-medium text-white">{selectedToken.symbol}</span>
                <span className="text-xs text-slate-500">{formatTokenAmount(selectedToken.balance, selectedToken.decimals)} available</span>
              </div>
            ) : (
              <SelectValue placeholder={isLoadingTokens ? "Loading…" : "Select token"} />
            )}
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
            {availableTokens.map((t) => (
              <SelectItem key={t.mintAddress} value={t.mintAddress} className="rounded-lg focus:bg-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {t.iconUrl ? <Image src={t.iconUrl} alt={t.symbol} width={18} height={18} className="h-[18px] w-[18px] rounded-full" /> : null}
                  <span className="font-medium">{t.symbol}</span>
                  <span className="text-xs text-slate-500">{formatTokenAmount(t.balance, t.decimals)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoadingTokens && (
          <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading balances…</div>
        )}
        {tokenError && <p className="text-xs text-slate-500">{tokenError}</p>}

        {/* Amount */}
        {selectedToken && (
          <>
            <div className="group relative">
              <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-300" />
              <Input
                type="number" min={0} step={getStepSize(data.token)} placeholder="0.00"
                value={data.amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="field-surface h-11 pl-10 pr-20 transition-colors focus:border-white/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">{selectedToken.symbol}</div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-500">
                  Balance: {formatTokenAmount(selectedToken.balance, selectedToken.decimals)} {selectedToken.symbol}
                </span>
                <button type="button" onClick={() => handleAmountChange(selectedToken.balance.toString())}
                  className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-white/[0.1] hover:text-white transition-colors">
                  MAX
                </button>
              </div>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <DollarSign className="h-3 w-3" /> ≈ ${getUSDValue(data.amount, data.token)}
              </span>
            </div>

            {inputError && <p className="text-xs text-red-400 px-1">{inputError}</p>}

            {/* Fee preview */}
            {data.amount > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-[11px]">
                <span className="text-slate-500">Fee (1%)</span>
                <span className="text-slate-400">{formatTokenAmount(calculateFee(data.amount), selectedToken.decimals)} {selectedToken.symbol}</span>
              </div>
            )}
          </>
        )}

        {/* Memo */}
        <div className="group relative">
          <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-slate-300" />
          <Textarea
            placeholder="Memo (optional)"
            value={data.memo}
            onChange={(e) => updateData({ ...data, memo: e.target.value, symbol: selectedToken?.symbol || data.symbol, decimals: selectedToken?.decimals ?? data.decimals })}
            maxLength={500}
            className="field-surface min-h-[70px] pl-10 transition-colors focus:border-white/20"
          />
        </div>
      </div>
    </div>
  );
}
