"use client";

import { useEffect, useState, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clipboard, Clock, Coins, Search, User, Wallet, XCircle } from "lucide-react";
import type { AutoSolProgram } from "@/lib/program";

interface Props {
  data: { address: string; name: string };
  updateData: (d: { address: string; name: string }) => void;
  program: AutoSolProgram | null;
}

export default function RecipientSection({ data, updateData, program }: Props) {
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<
    { address: string; name: string }[]
  >([]);

  const addressValid = useMemo(() => {
    if (!data.address) return null;
    try { new PublicKey(data.address); return true; } catch { return false; }
  }, [data.address]);

  const sectionComplete = Boolean(addressValid && data.name);

  useEffect(() => {
    if (!program || !publicKey) return;
    program.getSchedulesForOwner(publicKey).then((schedules) => {
      const map = new Map<string, string>();
      schedules.forEach((s) => {
        const addr = s.data.recipient.toString();
        if (!map.has(addr)) map.set(addr, s.data.memo || `${addr.slice(0, 4)}…${addr.slice(-4)}`);
      });
      setRecentRecipients(
        Array.from(map.entries()).slice(0, 4).map(([address, name]) => ({ address, name }))
      );
    }).catch(() => {});
  }, [program, publicKey]);

  const copy = async () => {
    if (!data.address) return;
    await navigator.clipboard.writeText(data.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Recipient</span>
        {sectionComplete && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Ready
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Address + Label in a responsive row */}
        <div className="grid gap-3 sm:grid-cols-[1fr,200px]">
          <div className="group relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-300" />
            <Input
              placeholder="Solana wallet address"
              value={data.address}
              onChange={(e) => updateData({ ...data, address: e.target.value })}
              className="field-surface h-11 pl-10 pr-10 transition-colors focus:border-white/20"
            />
            <button type="button" onClick={copy} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Clipboard className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="group relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-300" />
            <Input
              placeholder="Label"
              value={data.name}
              onChange={(e) => updateData({ ...data, name: e.target.value })}
              className="field-surface h-11 pl-10 transition-colors focus:border-white/20"
            />
          </div>
        </div>

        {/* Validation feedback */}
        {data.address && (
          <div className="flex items-center gap-1.5 px-1">
            {addressValid ? (
              <><CheckCircle className="h-3 w-3 text-emerald-400" /><span className="text-[11px] text-emerald-400">Valid Solana address</span></>
            ) : (
              <><XCircle className="h-3 w-3 text-red-400" /><span className="text-[11px] text-red-400">Invalid address format</span></>
            )}
          </div>
        )}

        {/* Recent recipients */}
        {recentRecipients.length > 0 && !data.address && (
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-500">Recent</span>
            <div className="flex flex-wrap gap-1.5">
              {recentRecipients.map((r) => (
                <button
                  key={r.address}
                  type="button"
                  onClick={() => updateData({ address: r.address, name: r.name })}
                  className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview of upcoming sections when empty — gives the form structure */}
        {!sectionComplete && (
          <div className="mt-2 space-y-2 opacity-40 pointer-events-none select-none">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5 text-xs text-slate-500">
              <Coins className="h-3.5 w-3.5" />
              <span>Token & Amount</span>
              <span className="ml-auto text-[10px] text-slate-600">Step 2</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Schedule</span>
              <span className="ml-auto text-[10px] text-slate-600">Step 3</span>
            </div>
            <Button disabled className="mt-1 w-full rounded-xl bg-primary/30 text-sm font-medium text-primary-foreground/50 h-11 cursor-not-allowed">
              <Wallet className="mr-2 h-4 w-4" /> Create Schedule
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
