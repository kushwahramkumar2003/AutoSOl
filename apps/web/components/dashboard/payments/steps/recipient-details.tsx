"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, User, Clipboard, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface RecipientDetailsProps {
  data: {
    address: string;
    name: string;
  };
  updateData: (data: { address: string; name: string }) => void;
}

export default function RecipientDetailsStep({
  data,
  updateData,
}: RecipientDetailsProps) {
  const [recentRecipients] = useState([
    { name: "CryptoDevs DAO", address: "8xDR54a...9j2K" },
    { name: "Solana Hosting", address: "3tYV87b...5rL1" },
    { name: "SolanaFM", address: "7pQR32c...8mN4" },
  ]);
  const [copied, setCopied] = useState(false);
  const [addressValidation, setAddressValidation] = useState<{
    valid: boolean;
    message: string;
  }>({ valid: true, message: "" });

  const handleSelectRecent = (recipient: { name: string; address: string }) => {
    // Visual feedback for selection
    updateData({
      name: recipient.name,
      address: recipient.address,
    });
  };

  const validateAddress = (address: string) => {
    // Simple validation - can be expanded with more complex Solana address validation
    if (!address) {
      return { valid: true, message: "" };
    }
    if (address.length < 10) {
      return { valid: false, message: "Address is too short" };
    }
    return { valid: true, message: "" };
  };

  useEffect(() => {
    setAddressValidation(validateAddress(data.address));
  }, [data.address]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(data.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          Recipient Details
        </motion.h2>
        <p className="text-white/70 max-w-lg">
          Enter the wallet address of the person or organization you want to pay
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
                htmlFor="recipient-address"
                className="text-sm font-medium flex items-center"
              >
                Recipient Address
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative group">
                <Input
                  id="recipient-address"
                  placeholder="Enter Solana wallet address"
                  value={data.address}
                  onChange={(e) =>
                    updateData({ ...data, address: e.target.value })
                  }
                  className=" border-white/10 focus-visible:ring-[#6E56CF] pl-10 pr-10 py-6 transition-all duration-200 ease-in-out rounded-md"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-hover:text-[#6E56CF] transition-colors duration-200" />
                <button
                  onClick={handleCopyToClipboard}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-[#6E56CF]/20 transition-all duration-200 flex items-center justify-center"
                  aria-label="Copy address"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-[#10B981] transition-all duration-200" />
                  ) : (
                    <Clipboard className="h-4 w-4 text-white/50 hover:text-[#6E56CF] transition-all duration-200" />
                  )}
                </button>
              </div>
              {!addressValidation.valid && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-xs text-red-400 mt-1"
                >
                  {addressValidation.message}
                </motion.p>
              )}
              <p className="text-xs text-white/50">
                Enter a valid Solana wallet address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-name" className="text-sm font-medium">
                Recipient Name
              </Label>
              <div className="relative group">
                <Input
                  id="recipient-name"
                  placeholder="Enter a name for this recipient"
                  value={data.name}
                  onChange={(e) =>
                    updateData({ ...data, name: e.target.value })
                  }
                  className=" border-white/10 focus-visible:ring-[#6E56CF] pl-10 py-6 transition-all duration-200 ease-in-out rounded-md"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-hover:text-[#6E56CF] transition-colors duration-200" />
              </div>
              <p className="text-xs text-white/50">
                This name will help you identify the recipient in your address
                book
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4 text-[#6E56CF]" />
                Recent Recipients
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white hover:bg-white/10"
              >
                View All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentRecipients.map((recipient, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="justify-start border-white/10 bg-dark-300 hover:bg-[#6E56CF]/20 hover:border-[#6E56CF]/50 h-auto py-3 w-full transition-all duration-200 ease-in-out"
                    onClick={() => handleSelectRecent(recipient)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full bg-[#6E56CF]/20 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-[#6E56CF]" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <div className="font-medium truncate">
                          {recipient.name}
                        </div>
                        <div className="text-xs text-white/70 truncate">
                          {recipient.address}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 p-4 bg-dark-300 border border-white/10 rounded-lg"
          >
            <h4 className="text-sm font-medium mb-2">Need Help?</h4>
            <p className="text-xs text-white/70">
              Make sure to double-check the wallet address before confirming.
              Transactions on Solana are irreversible.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
