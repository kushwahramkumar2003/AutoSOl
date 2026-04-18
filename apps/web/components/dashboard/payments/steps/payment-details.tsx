"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useFetchTokens } from "@/hooks/use-fetchToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Coins,
  DollarSign,
  FileText,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface PaymentDetailsProps {
  data: {
    amount: number;
    token: string;
    memo: string;
    symbol: string;
    decimals: number;
  };
  updateData: (data: {
    amount: number;
    token: string;
    memo: string;
    symbol: string;
    decimals: number;
  }) => void;
}

export default function PaymentDetailsStep({
  data,
  updateData,
}: PaymentDetailsProps) {
  const {
    availableTokens,
    isLoadingTokens,
    tokenError,
    inputError,
    selectedToken,
    handleAmountChange,
    getUSDValue,
    formatTokenAmount,
    calculateFee,
    calculateTotal,
    getStepSize,
    refreshTokens,
  } = useFetchTokens(data, updateData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr),260px]"
    >
      <section className="space-y-5">
        {/* Token selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-300">Token</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refreshTokens()}
              className="h-7 rounded-lg text-xs text-slate-500 hover:bg-white/[0.05] hover:text-white"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Refresh
            </Button>
          </div>
          <Select
            value={data.token}
            onValueChange={(value) => {
              const token = availableTokens.find((item) => item.mintAddress === value);
              updateData({
                ...data,
                token: value,
                amount: 0,
                symbol: token?.symbol || "Unknown",
                decimals: token?.decimals ?? 9,
              });
            }}
            disabled={availableTokens.length === 0}
          >
            <SelectTrigger className="field-surface h-12">
              {selectedToken ? (
                <div className="flex items-center gap-2.5">
                  {selectedToken.iconUrl ? (
                    <Image
                      src={selectedToken.iconUrl}
                      alt={selectedToken.symbol}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                      {selectedToken.symbol.slice(0, 1)}
                    </div>
                  )}
                  <div className="text-left">
                    <span className="font-medium text-white">{selectedToken.symbol}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {formatTokenAmount(selectedToken.balance, selectedToken.decimals)} available
                    </span>
                  </div>
                </div>
              ) : (
                <SelectValue
                  placeholder={
                    availableTokens.length === 0 ? "No tokens available" : "Select token"
                  }
                />
              )}
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
              {availableTokens.map((token) => (
                <SelectItem
                  key={token.mintAddress}
                  value={token.mintAddress}
                  className="rounded-lg focus:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-2.5">
                    {token.iconUrl ? (
                      <Image
                        src={token.iconUrl}
                        alt={token.symbol}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full"
                      />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                        {token.symbol.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-slate-500">
                        {formatTokenAmount(token.balance, token.decimals)} available
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tokenError ? (
            <p className="text-xs text-slate-500">{tokenError}</p>
          ) : null}
        </div>

        {isLoadingTokens ? (
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading wallet balances…
          </div>
        ) : null}

        {selectedToken ? (
          <>
            {/* Amount input */}
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount" className="text-sm text-slate-300">
                Amount
              </Label>
              <div className="group relative">
                <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-300" />
                <Input
                  id="payment-amount"
                  type="number"
                  min={0}
                  step={getStepSize(data.token)}
                  placeholder="0.00"
                  value={data.amount || ""}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="field-surface pl-10 pr-20 transition-colors focus:border-white/20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  {selectedToken.symbol}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Balance: {formatTokenAmount(selectedToken.balance, selectedToken.decimals)}{" "}
                  {selectedToken.symbol}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={selectedToken.balance <= 0}
                  onClick={() => handleAmountChange(selectedToken.balance.toString())}
                  className="h-6 rounded-md bg-white/[0.04] px-2 text-[11px] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                >
                  Max
                </Button>
              </div>
              {inputError ? (
                <p className="text-xs text-red-400">{inputError}</p>
              ) : null}
            </div>

            {/* USD + Metadata inline */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <DollarSign className="h-3.5 w-3.5" />
                <span>≈ ${getUSDValue(data.amount, data.token)}</span>
              </div>
              <div className="h-3 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-slate-500">
                <Info className="h-3.5 w-3.5" />
                <span>{selectedToken.name} · {selectedToken.decimals} decimals</span>
              </div>
            </div>
          </>
        ) : null}

        {/* Memo */}
        <div className="space-y-1.5">
          <Label htmlFor="memo" className="text-sm text-slate-300">
            Memo
          </Label>
          <div className="group relative">
            <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500 transition-colors group-focus-within:text-slate-300" />
            <Textarea
              id="memo"
              placeholder="Optional note for this payment schedule"
              value={data.memo}
              onChange={(e) =>
                updateData({
                  ...data,
                  memo: e.target.value,
                  symbol: selectedToken?.symbol || data.symbol,
                  decimals: selectedToken?.decimals ?? data.decimals,
                })
              }
              maxLength={500}
              className="field-surface min-h-[90px] pl-10 transition-colors focus:border-white/20"
            />
          </div>
          <div className="text-right text-[11px] text-slate-500">
            {data.memo.length}/500
          </div>
        </div>
      </section>

      {/* Sidebar summary */}
      <aside className="space-y-3">
        <div className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Summary
          </div>

          {selectedToken ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Token</span>
                <div className="flex items-center gap-1.5">
                  {selectedToken.iconUrl ? (
                    <Image
                      src={selectedToken.iconUrl}
                      alt={selectedToken.symbol}
                      width={14}
                      height={14}
                      className="h-3.5 w-3.5 rounded-full"
                    />
                  ) : null}
                  <span className="font-medium text-white">{selectedToken.symbol}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Amount</span>
                <span className="text-white">
                  {formatTokenAmount(data.amount, selectedToken.decimals)} {selectedToken.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Platform fee</span>
                <span className="text-white">
                  {formatTokenAmount(
                    calculateFee(data.amount),
                    selectedToken.decimals
                  )}{" "}
                  {selectedToken.symbol}
                </span>
              </div>
              <div className="border-t border-white/[0.06] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Per payment</span>
                  <span className="text-base font-semibold text-white">
                    {formatTokenAmount(
                      calculateTotal(data.amount),
                      selectedToken.decimals
                    )}{" "}
                    {selectedToken.symbol}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Select a token to see the funding breakdown.
            </p>
          )}
        </div>
      </aside>
    </motion.div>
  );
}
