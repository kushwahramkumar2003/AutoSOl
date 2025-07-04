"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Coins,
  FileText,
  DollarSign,
  PiggyBank,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFetchTokens } from "@/hooks/use-fetchToken";
import Image from "next/image";
import { useEffect } from "react";

interface PaymentDetailsProps {
  data: {
    amount: number;
    token: string;
    memo: string;
    symbol: string;
  };
  updateData: (data: {
    amount: number;
    token: string;
    memo: string;
    symbol: string;
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
    setViewMode,
    sliderValue,
    tokenInfoVisible,
    setTokenInfoVisible,
    inputError,
    selectedToken,
    handleAmountChange,
    handleSliderChange,
    getUSDValue,
    formatTokenAmount,
    calculateFee,
    calculateTotal,
    getStepSize,
    refreshTokens,
  } = useFetchTokens(data, updateData);

  useEffect(() => {
    refreshTokens();
  }, [isLoadingTokens]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 w-full max-w-full px-4"
    >
      <div className="text-center md:text-left">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-bold mb-3"
        >
          Payment Details
        </motion.h2>
        <p className="text-white/70 max-w-lg">
          Enter the payment amount and additional details for your transaction
        </p>
      </div>

      {tokenError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{tokenError}</AlertDescription>
        </Alert>
      )}

      {isLoadingTokens ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#6E56CF]" />
          <span className="ml-2 text-lg">Loading your tokens...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="token"
                  className="text-sm font-medium flex items-center"
                >
                  Select Token
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Select
                    value={data.token}
                    onValueChange={(value) =>
                      updateData({
                        ...data,
                        token: value,
                        amount: 0,
                        symbol:
                          availableTokens.find((t) => t.mintAddress === value)
                            ?.symbol || "Unknown",
                      })
                    }
                    disabled={availableTokens.length === 0}
                  >
                    <SelectTrigger className="border-white/10 focus:ring-[#6E56CF] py-6 pl-10">
                      <SelectValue
                        placeholder={
                          availableTokens.length === 0
                            ? "No tokens available"
                            : "Select token"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 text-white">
                      {availableTokens.map((token) => (
                        <SelectItem
                          key={token.mintAddress}
                          value={token.mintAddress}
                          className="hover:bg-[#6E56CF]/20 transition-colors duration-150 cursor-pointer"
                        >
                          <motion.div
                            className="flex items-center gap-3 py-1"
                            whileHover={{ x: 2 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {token.iconUrl ? (
                              <Image
                                src={token.iconUrl || "/placeholder.svg"}
                                alt={token.symbol}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  (e.target as HTMLImageElement).src =
                                    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%236E56CF"><circle cx="12" cy="12" r="10" /></svg>`;
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 bg-[#6E56CF]/30 rounded-full flex items-center justify-center">
                                {token.symbol.slice(0, 1)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-xs text-white/50 flex items-center">
                                <span>{token.name}</span>
                                <span className="mx-1">•</span>
                                <span>
                                  {formatTokenAmount(
                                    token.balance,
                                    token.decimals
                                  )}{" "}
                                  available
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <PiggyBank className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                </div>
              </div>

              {selectedToken && (
                <>
                  <Tabs
                    defaultValue="token"
                    onValueChange={(v) => setViewMode(v as "token" | "usd")}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 w-full border border-white/10 mb-4">
                      <TabsTrigger
                        value="token"
                        className="data-[state=active]:text-white data-[state=active]:bg-[#6E56CF]"
                      >
                        Token Amount
                      </TabsTrigger>
                      <TabsTrigger
                        value="usd"
                        className="data-[state=active]:text-white data-[state=active]:bg-[#6E56CF]"
                        disabled={selectedToken.dollarValue <= 0}
                      >
                        USD Value
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="token" className="mt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label
                            htmlFor="amount"
                            className="text-sm font-medium"
                          >
                            Amount
                          </Label>
                          <button
                            className="text-xs text-[#6E56CF] hover:text-[#8A78DA] transition-colors duration-150"
                            onClick={() =>
                              setTokenInfoVisible(!tokenInfoVisible)
                            }
                          >
                            <Info className="h-4 w-4 inline-block mr-1" />
                            Token Info
                          </button>
                        </div>
                        <div className="relative group">
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={data.amount || ""}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className="border-white/10 focus-visible:ring-[#6E56CF] pl-10 py-6 transition-all duration-200 pr-20"
                            min={0}
                            step={getStepSize(data.token)}
                            disabled={!selectedToken}
                          />
                          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-hover:text-[#6E56CF] transition-colors duration-200" />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 font-medium">
                            {selectedToken.symbol}
                          </div>
                        </div>
                        {inputError && (
                          <p className="text-xs text-red-500 mt-1">
                            {inputError}
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="usd" className="mt-0">
                      <div className="space-y-2">
                        <Label
                          htmlFor="amount-usd"
                          className="text-sm font-medium"
                        >
                          USD Value
                        </Label>
                        <div className="relative group">
                          <Input
                            id="amount-usd"
                            type="number"
                            placeholder="0.00"
                            value={getUSDValue(data.amount, data.token)}
                            onChange={(e) => {
                              if (
                                selectedToken &&
                                selectedToken.dollarValue > 0
                              ) {
                                const usdValue =
                                  Number.parseFloat(e.target.value) || 0;
                                const tokenAmount =
                                  usdValue / selectedToken.dollarValue;
                                handleAmountChange(tokenAmount.toString());
                              }
                            }}
                            className="border-white/10 focus-visible:ring-[#6E56CF] pl-10 py-6 transition-all duration-200 pr-20"
                            min={0}
                            step={0.01}
                            disabled={
                              !selectedToken || selectedToken.dollarValue <= 0
                            }
                          />
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-hover:text-[#6E56CF] transition-colors duration-200" />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 font-medium">
                            USD
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-4">
                    <AnimatePresence>
                      {tokenInfoVisible && selectedToken && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border border-white/10 p-4 rounded-lg"
                        >
                          <h4 className="text-sm font-medium mb-2">
                            Token Information
                          </h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/70">Price</span>
                              <span>
                                $
                                {selectedToken.dollarValue.toFixed(
                                  selectedToken.dollarValue < 0.01 ? 6 : 2
                                )}{" "}
                                USD
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">
                                Your Balance
                              </span>
                              <span>
                                {formatTokenAmount(
                                  selectedToken.balance,
                                  selectedToken.decimals
                                )}{" "}
                                {selectedToken.symbol}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">USD Value</span>
                              <span>
                                $
                                {(
                                  selectedToken.balance *
                                  selectedToken.dollarValue
                                ).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">
                                Mint Address
                              </span>
                              <span className="truncate max-w-40">
                                {selectedToken.mintAddress.slice(0, 4)}...
                                {selectedToken.mintAddress.slice(-4)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/70">Decimals</span>
                              <span>{selectedToken.decimals}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">
                          0 {selectedToken.symbol}
                        </span>
                        <span className="text-white/70">
                          {formatTokenAmount(
                            selectedToken.balance,
                            selectedToken.decimals
                          )}{" "}
                          {selectedToken.symbol}
                        </span>
                      </div>
                      <Slider
                        value={[sliderValue]}
                        onValueChange={handleSliderChange}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                        disabled={!selectedToken}
                      />
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/50">
                          Available:{" "}
                          {formatTokenAmount(
                            selectedToken.balance,
                            selectedToken.decimals
                          )}{" "}
                          {selectedToken.symbol}
                        </span>
                        <button
                          className="text-[#10B981] hover:text-[#3DD6A3] transition-colors duration-150 bg-[#10B981]/10 px-2 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() =>
                            handleAmountChange(selectedToken.balance.toString())
                          }
                          disabled={
                            !selectedToken || selectedToken.balance <= 0
                          }
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="memo" className="text-sm font-medium">
                  Memo (Optional)
                </Label>
                <div className="relative group">
                  <Textarea
                    id="memo"
                    placeholder="Add a note about this payment"
                    value={data.memo}
                    onChange={(e) =>
                      updateData({
                        ...data,
                        memo: e.target.value,
                        symbol: selectedToken?.symbol || "",
                      })
                    }
                    className="border-white/10 focus-visible:ring-[#6E56CF] min-h-[100px] pl-10 pt-2 transition-all duration-200 ease-in-out"
                    maxLength={500}
                  />
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-white/50 group-hover:text-[#6E56CF] transition-colors duration-200" />
                </div>
                <div className="flex justify-between">
                  <p className="text-xs text-white/50">
                    This memo will be stored on-chain with your payment
                  </p>
                  <p className="text-xs text-white/50">
                    {data.memo.length}/500
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {selectedToken && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-lg border border-white/10"
              >
                <h3 className="text-lg font-medium mb-4">Payment Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Token</span>
                    <span className="flex items-center font-medium">
                      {selectedToken.iconUrl ? (
                        <Image
                          src={selectedToken.iconUrl || "/placeholder.svg"}
                          alt={selectedToken.symbol}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full mr-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%236E56CF"><circle cx="12" cy="12" r="10" /></svg>`;
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 bg-[#6E56CF]/30 rounded-full flex items-center justify-center mr-2">
                          {selectedToken.symbol.slice(0, 1)}
                        </div>
                      )}
                      {selectedToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Amount</span>
                    <span className="font-medium">
                      {formatTokenAmount(data.amount, selectedToken.decimals)}{" "}
                      {selectedToken.symbol}
                    </span>
                  </div>
                  {selectedToken.dollarValue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">USD Value</span>
                      <span className="font-medium">
                        ${getUSDValue(data.amount, data.token)}
                      </span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70">Fee (1%)</span>
                      <span>
                        {formatTokenAmount(
                          calculateFee(data.amount),
                          selectedToken.decimals
                        )}{" "}
                        {selectedToken.symbol}
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatTokenAmount(
                            calculateTotal(data.amount),
                            selectedToken.decimals
                          )}{" "}
                          {selectedToken.symbol}
                        </div>
                        {selectedToken.dollarValue > 0 && (
                          <div className="text-xs text-white/50">
                            $
                            {(
                              Number(getUSDValue(data.amount, data.token)) *
                              1.01
                            ).toFixed(2)}{" "}
                            USD
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoadingTokens && availableTokens.length === 0 && (
              <Alert className="mb-4 bg-amber-500/10 border-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-500">
                  No tokens found in your wallet. Please add funds to continue.
                </AlertDescription>
              </Alert>
            )}

            {selectedToken && data.amount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-lg border border-green-500/20 bg-green-500/5"
              >
                <h3 className="text-lg font-medium mb-3 flex items-center text-green-400">
                  <Info className="h-5 w-5 mr-2" />
                  Payment Ready
                </h3>
                <p className="text-sm text-white/70">
                  You&apos;re all set! Review your payment details and proceed
                  to the next step to complete your transaction.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
