"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Search,
  User,
  Clipboard,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useProgram } from "@/hooks/use-program";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

interface RecipientDetailsProps {
  data: {
    address: string;
    name: string;
  };
  updateData: (data: { address: string; name: string }) => void;
}

interface RecentRecipient {
  name: string;
  address: string;
  lastUsed: Date;
  paymentCount: number;
}

export default function RecipientDetailsStep({
  data,
  updateData,
}: RecipientDetailsProps) {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addressValidation, setAddressValidation] = useState<{
    valid: boolean;
    message: string;
  }>({ valid: true, message: "" });

  // Fetch recent recipients from user's payment history
  useEffect(() => {
    const fetchRecentRecipients = async () => {
      if (!program || !publicKey) {
        setRecentRecipients([]);
        return;
      }

      try {
        setLoading(true);

        // Get all schedules where the current user is the owner (outgoing payments)
        const outgoingSchedules = await program.getSchedulesForOwner(publicKey);

        // Create a map to track unique recipients and their usage
        const recipientMap = new Map<
          string,
          { count: number; lastUsed: Date; name: string }
        >();

        outgoingSchedules.forEach((schedule) => {
          const recipientAddress = schedule.data.recipient.toString();
          const existing = recipientMap.get(recipientAddress);

          if (existing) {
            existing.count += 1;
            // Update last used date if this schedule is more recent
            const scheduleDate = new Date(
              schedule.data.createdAt.toNumber() * 1000
            );
            if (scheduleDate > existing.lastUsed) {
              existing.lastUsed = scheduleDate;
            }
          } else {
            recipientMap.set(recipientAddress, {
              count: 1,
              lastUsed: new Date(schedule.data.createdAt.toNumber() * 1000),
              name:
                schedule.data.memo ||
                `Recipient ${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}`,
            });
          }
        });

        // Convert to array and sort by last used date (most recent first)
        const recipients: RecentRecipient[] = Array.from(recipientMap.entries())
          .map(([address, data]) => ({
            address,
            name: data.name,
            lastUsed: data.lastUsed,
            paymentCount: data.count,
          }))
          .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
          .slice(0, 6); // Show only the 6 most recent recipients

        setRecentRecipients(recipients);
      } catch {
        console.error("Error fetching recent recipients");
        setRecentRecipients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRecipients();
  }, [program, publicKey]);

  const handleSelectRecent = (recipient: RecentRecipient) => {
    updateData({
      name: recipient.name,
      address: recipient.address,
    });
  };

  const validateAddress = (address: string) => {
    if (!address) {
      return { valid: true, message: "" };
    }

    try {
      new PublicKey(address);
      return { valid: true, message: "" };
    } catch (error) {
      console.log(error)
      return { valid: false, message: "Invalid Solana address format" };
    }
  };

  useEffect(() => {
    setAddressValidation(validateAddress(data.address));
  }, [data.address]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(data.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
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
                  className="border-white/10 focus-visible:ring-[#6E56CF] pl-10 pr-10 py-6 transition-all duration-200 ease-in-out rounded-md"
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
                  className="border-white/10 focus-visible:ring-[#6E56CF] pl-10 py-6 transition-all duration-200 ease-in-out rounded-md"
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
              {recentRecipients.length > 0 && (
                <span className="text-xs text-white/50">
                  {recentRecipients.length} recipient
                  {recentRecipients.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#6E56CF]" />
                <span className="ml-2 text-sm text-white/70">
                  Loading recent recipients...
                </span>
              </div>
            ) : recentRecipients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentRecipients.map((recipient, index) => (
                  <motion.div
                    key={recipient.address}
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
                        <div className="text-left overflow-hidden flex-1">
                          <div className="font-medium truncate text-sm">
                            {recipient.name}
                          </div>
                          <div className="text-xs text-white/50 truncate">
                            {recipient.address.slice(0, 4)}...
                            {recipient.address.slice(-4)}
                          </div>
                          <div className="text-xs text-white/40 mt-1">
                            {recipient.paymentCount} payment
                            {recipient.paymentCount !== 1 ? "s" : ""} •{" "}
                            {formatDate(recipient.lastUsed)}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-sm text-white/50 mb-2">
                  No recent recipients
                </p>
                <p className="text-xs text-white/40">
                  Your recent recipients will appear here after you make
                  payments
                </p>
              </div>
            )}
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
