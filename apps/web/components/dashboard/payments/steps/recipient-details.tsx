"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProgram } from "@/hooks/use-program";
import {
  CheckCircle,
  Clipboard,
  Loader2,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

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
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [addressValid, setAddressValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRecentRecipients = async () => {
      if (!program || !publicKey) {
        setRecentRecipients([]);
        return;
      }

      try {
        setLoading(true);
        const outgoingSchedules = await program.getSchedulesForOwner(publicKey);
        const recipientMap = new Map<
          string,
          { count: number; lastUsed: Date; name: string }
        >();

        outgoingSchedules.forEach((schedule) => {
          const recipientAddress = schedule.data.recipient.toString();
          const existing = recipientMap.get(recipientAddress);
          const scheduleDate = new Date(schedule.data.createdAt.toNumber() * 1000);

          if (existing) {
            existing.count += 1;
            if (scheduleDate > existing.lastUsed) {
              existing.lastUsed = scheduleDate;
            }
          } else {
            recipientMap.set(recipientAddress, {
              count: 1,
              lastUsed: scheduleDate,
              name:
                schedule.data.memo ||
                `Recipient ${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}`,
            });
          }
        });

        const recipients = Array.from(recipientMap.entries())
          .map(([address, value]) => ({
            address,
            name: value.name,
            lastUsed: value.lastUsed,
            paymentCount: value.count,
          }))
          .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
          .slice(0, 6);

        setRecentRecipients(recipients);
      } catch {
        setRecentRecipients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRecipients();
  }, [program, publicKey]);

  useEffect(() => {
    if (!data.address) {
      setAddressValid(null);
      return;
    }

    try {
      new PublicKey(data.address);
      setAddressValid(true);
    } catch {
      setAddressValid(false);
    }
  }, [data.address]);

  const copyAddress = async () => {
    if (!data.address) return;
    await navigator.clipboard.writeText(data.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr),260px]"
    >
      <section className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="recipient-address" className="text-sm text-slate-300">
              Wallet Address
            </Label>
            <div className="group relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-300" />
              <Input
                id="recipient-address"
                placeholder="Enter Solana wallet address"
                value={data.address}
                onChange={(e) => updateData({ ...data, address: e.target.value })}
                className="field-surface pl-10 pr-11 transition-colors focus:border-white/20"
              />
              <button
                type="button"
                onClick={copyAddress}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                aria-label="Copy address"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
              </button>
            </div>
            {data.address && (
              <div className="flex items-center gap-1.5">
                {addressValid ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Valid Solana address</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-red-400">Invalid address format</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recipient-name" className="text-sm text-slate-300">
              Label
            </Label>
            <div className="group relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-300" />
              <Input
                id="recipient-name"
                placeholder="Payroll, vendor, contributor, treasury"
                value={data.name}
                onChange={(e) => updateData({ ...data, name: e.target.value })}
                className="field-surface pl-10 transition-colors focus:border-white/20"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Helps you identify this recipient in your dashboard.
            </p>
          </div>
        </div>
      </section>

      <aside className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-primary/[0.06] px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-xs text-slate-400">
            Double-check the wallet address before submitting.
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-slate-400">Recent Recipients</span>
            {recentRecipients.length > 0 && (
              <span className="text-[11px] text-slate-500">
                {recentRecipients.length} saved
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-sm text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading…
            </div>
          ) : recentRecipients.length > 0 ? (
            <div className="space-y-1.5">
              {recentRecipients.map((recipient) => (
                <button
                  key={recipient.address}
                  type="button"
                  onClick={() =>
                    updateData({
                      address: recipient.address,
                      name: recipient.name,
                    })
                  }
                  className="group w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <div className="truncate text-sm font-medium text-white">
                    {recipient.name}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">
                    {recipient.address.slice(0, 8)}…{recipient.address.slice(-6)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015] px-3 py-4 text-center text-xs text-slate-500">
              No recent recipients yet.
            </div>
          )}
        </div>
      </aside>
    </motion.div>
  );
}
