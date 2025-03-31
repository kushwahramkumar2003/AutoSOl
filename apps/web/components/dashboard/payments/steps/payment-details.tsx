"use client";

import { useState, useEffect } from "react";
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
import { Coins, FileText, DollarSign, PiggyBank, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentDetailsProps {
  data: {
    amount: number;
    token: string;
    memo: string;
  };
  updateData: (data: { amount: number; token: string; memo: string }) => void;
}

export default function PaymentDetailsStep({
  data,
  updateData,
}: PaymentDetailsProps) {
  const [availableTokens] = useState([
    {
      symbol: "SOL",
      name: "Solana",
      balance: 12.45,
      icon: "🟣",
      dollarValue: 98.15,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: 345.67,
      icon: "🔵",
      dollarValue: 1.0,
    },
    {
      symbol: "BONK",
      name: "Bonk",
      balance: 1250000,
      icon: "🟠",
      dollarValue: 0.00002,
    },
    {
      symbol: "RAY",
      name: "Raydium",
      balance: 25.5,
      icon: "🟢",
      dollarValue: 0.54,
    },
  ]);

  const [viewMode, setViewMode] = useState<"token" | "usd">("token");
  const [sliderValue, setSliderValue] = useState(0);
  const [tokenInfoVisible, setTokenInfoVisible] = useState(false);

  const selectedToken =
    availableTokens.find((token) => token.symbol === data.token) ||
    availableTokens[0];

  useEffect(() => {
    // Initialize slider value based on current amount
    if (data.amount > 0) {
      const percentage = Math.min(
        (data.amount / selectedToken.balance) * 100,
        100
      );
      setSliderValue(percentage);
    } else {
      setSliderValue(0);
    }
  }, [data.token, data.amount, selectedToken.balance]);

  const handleAmountChange = (value: string) => {
    const amount = Number.parseFloat(value) || 0;
    updateData({ ...data, amount });

    // Update slider value
    const percentage = Math.min((amount / selectedToken.balance) * 100, 100);
    setSliderValue(percentage);
  };

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
    const amount = (selectedToken.balance * value[0]) / 100;
    updateData({ ...data, amount });
  };

  const getUSDValue = (amount: number, token: string) => {
    const tokenInfo = availableTokens.find((t) => t.symbol === token);
    if (tokenInfo) {
      return (amount * tokenInfo.dollarValue).toFixed(2);
    }
    return "0.00";
  };

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
                    updateData({ ...data, token: value, amount: 0 })
                  }
                >
                  <SelectTrigger className=" border-white/10 focus:ring-[#6E56CF] py-6 pl-10">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent className=" border-white/10 text-white">
                    {availableTokens.map((token) => (
                      <SelectItem
                        key={token.symbol}
                        value={token.symbol}
                        className="hover:bg-[#6E56CF]/20 transition-colors duration-150 cursor-pointer"
                      >
                        <motion.div
                          className="flex items-center gap-3 py-1"
                          whileHover={{ x: 2 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <span className="text-xl">{token.icon}</span>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-white/50 flex items-center">
                              <span>{token.name}</span>
                              <span className="mx-1">•</span>
                              <span>
                                {token.balance.toLocaleString()} available
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
                >
                  USD Value
                </TabsTrigger>
              </TabsList>

              <TabsContent value="token" className="mt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount
                    </Label>
                    <button
                      className="text-xs text-[#6E56CF] hover:text-[#8A78DA] transition-colors duration-150"
                      onClick={() => setTokenInfoVisible(!tokenInfoVisible)}
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
                      className=" border-white/10 focus-visible:ring-[#6E56CF] pl-10 py-6 transition-all duration-200 pr-20"
                      min={0}
                      step={selectedToken.symbol === "BONK" ? 1000 : 0.01}
                    />
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-hover:text-[#6E56CF] transition-colors duration-200" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 font-medium">
                      {selectedToken.symbol}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="usd" className="mt-0">
                <div className="space-y-2">
                  <Label htmlFor="amount-usd" className="text-sm font-medium">
                    USD Value
                  </Label>
                  <div className="relative group">
                    <Input
                      id="amount-usd"
                      type="number"
                      placeholder="0.00"
                      value={getUSDValue(data.amount, data.token)}
                      onChange={(e) => {
                        const usdValue = Number.parseFloat(e.target.value) || 0;
                        const tokenAmount =
                          usdValue / selectedToken.dollarValue;
                        handleAmountChange(tokenAmount.toString());
                      }}
                      className=" border-white/10 focus-visible:ring-[#6E56CF] pl-10 py-6 transition-all duration-200 pr-20"
                      min={0}
                      step={0.01}
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
                {tokenInfoVisible && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className=" border border-white/10 p-4 rounded-lg"
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
                        <span className="text-white/70">Your Balance</span>
                        <span>
                          {selectedToken.balance.toLocaleString()}{" "}
                          {selectedToken.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">USD Value</span>
                        <span>
                          $
                          {(
                            selectedToken.balance * selectedToken.dollarValue
                          ).toFixed(2)}
                        </span>
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
                    {selectedToken.balance} {selectedToken.symbol}
                  </span>
                </div>
                <Slider
                  defaultValue={[0]}
                  value={[sliderValue]}
                  onValueChange={handleSliderChange}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50">
                    Available: {selectedToken.balance} {selectedToken.symbol}
                  </span>
                  <button
                    className="text-[#10B981] hover:text-[#3DD6A3] transition-colors duration-150 bg-[#10B981]/10 px-2 py-1 rounded-md"
                    onClick={() =>
                      handleAmountChange(selectedToken.balance.toString())
                    }
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>

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
                    updateData({ ...data, memo: e.target.value })
                  }
                  className=" border-white/10 focus-visible:ring-[#6E56CF] min-h-[100px] pl-10 pt-2 transition-all duration-200 ease-in-out"
                />
                <FileText className="absolute left-3 top-3 h-5 w-5 text-white/50 group-hover:text-[#6E56CF] transition-colors duration-200" />
              </div>
              <p className="text-xs text-white/50">
                This memo will be stored on-chain with your payment
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-lg  border border-white/10"
          >
            <h3 className="text-lg font-medium mb-4">Payment Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Token</span>
                <span className="flex items-center font-medium">
                  <span className="mr-2">{selectedToken.icon}</span>
                  {selectedToken.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Amount</span>
                <span className="font-medium">
                  {data.amount} {data.token}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">USD Value</span>
                <span className="font-medium">
                  ${getUSDValue(data.amount, data.token)}
                </span>
              </div>
              <div className="pt-4 border-t border-white/10 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Fee (1%)</span>
                  <span>
                    {(data.amount * 0.01).toFixed(
                      data.token === "BONK" ? 0 : 4
                    )}{" "}
                    {data.token}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <div className="text-right">
                    <div className="font-bold">
                      {(data.amount * 1.01).toFixed(
                        data.token === "BONK" ? 0 : 4
                      )}{" "}
                      {data.token}
                    </div>
                    <div className="text-xs text-white/50">
                      $
                      {(
                        Number(getUSDValue(data.amount, data.token)) * 1.01
                      ).toFixed(2)}{" "}
                      USD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-lg bg-[#6E56CF]/10 border border-[#6E56CF]/20"
          >
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2 text-[#6E56CF]" />
              Automatic Payments
            </h3>
            <p className="text-xs text-white/70">
              AutoSOL will automatically execute your payment on the scheduled
              date. All payments are secured by Solana&apos;s blockchain and
              protected by our escrow vault.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
