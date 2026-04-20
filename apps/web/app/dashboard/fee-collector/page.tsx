"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Coins, RefreshCw, Vault } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import { AccessGuard } from "@/components/dashboard/admin/access-guard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProgram } from "@/hooks/use-program";
import { usePrivilegedAccess } from "@/hooks/use-privileged-access";
import {
  formatRawTokenAmount,
  getKnownTokenByMint,
  getPopularTokenOptions,
  getTokenLabel,
  isSolMint,
} from "@/lib/token-registry";
import { useConnection } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

function parseAmountToRaw(amount: string, decimals: number): number {
  const numeric = Number.parseFloat(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("Enter a valid withdrawal amount.");
  }

  return Math.floor(numeric * Math.pow(10, decimals));
}

export default function FeeCollectorPage() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();
  const {
    initialized,
    configuredFeeCollectorWallets,
    onChainFeeCollector,
    envFeeCollector,
    isFeeCollector,
  } = usePrivilegedAccess();
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const [solVaultBalance, setSolVaultBalance] = useState<number | null>(null);
  const [splMint, setSplMint] = useState("");
  const [splVaultBalance, setSplVaultBalance] = useState<number | null>(null);
  const [solAmount, setSolAmount] = useState("");
  const [splAmount, setSplAmount] = useState("");

  const popularTokens = useMemo(
    () => getPopularTokenOptions(connection.rpcEndpoint).filter((token) => !isSolMint(token.mintAddress)),
    [connection.rpcEndpoint]
  );

  const currentSplToken = useMemo(() => {
    const known = getKnownTokenByMint(splMint);
    if (known) {
      return {
        symbol: known.symbol,
        decimals: known.decimals,
      };
    }

    return {
      symbol: getTokenLabel(splMint || "TOKEN", false),
      decimals: 9,
    };
  }, [splMint]);

  const loadVaultState = useCallback(async () => {
    if (!program || !initialized) {
      setSolVaultBalance(null);
      setSplVaultBalance(null);
      return;
    }

    try {
      const [solBalance, tokenBalance] = await Promise.all([
        program.getSolFeeVaultBalance(),
        splMint ? program.getSplFeeVaultBalance(new PublicKey(splMint)) : Promise.resolve(null),
      ]);
      setSolVaultBalance(solBalance);
      setSplVaultBalance(tokenBalance);
    } catch (vaultError) {
      console.error("Failed to load fee vault state", vaultError);
    }
  }, [initialized, program, splMint]);

  useEffect(() => {
    void loadVaultState();
  }, [loadVaultState]);

  const runAction = async (label: string, action: () => Promise<void>) => {
    setWorkingAction(label);
    try {
      await action();
      await loadVaultState();
    } finally {
      setWorkingAction(null);
    }
  };

  const handleWithdrawSol = async () => {
    if (!program || solVaultBalance === null) return;
    const rawAmount = parseAmountToRaw(solAmount, 9);
    if (rawAmount > solVaultBalance) {
      toast.error("Requested SOL amount exceeds the fee vault balance.");
      return;
    }

    await runAction("withdraw-sol", async () => {
      await program.withdrawFees(rawAmount);
      setSolAmount("");
      toast.success("SOL fees withdrawn");
    });
  };

  const handleWithdrawSpl = async () => {
    if (!program || splVaultBalance === null) return;
    if (!splMint) {
      toast.error("Enter the SPL mint you want to withdraw.");
      return;
    }

    const mint = new PublicKey(splMint);
    const rawAmount = parseAmountToRaw(splAmount, currentSplToken.decimals);
    if (rawAmount > splVaultBalance) {
      toast.error("Requested SPL amount exceeds the fee vault balance.");
      return;
    }

    await runAction("withdraw-spl", async () => {
      await program.withdrawSplFees(mint, rawAmount);
      setSplAmount("");
      toast.success("SPL fees withdrawn");
    });
  };

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="app-page page-stack flex-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Fee Collector</h1>
            <p className="mt-1 text-sm text-slate-400">
              Withdrawal surface for protocol fees. This route intentionally excludes admin authority controls and executor operations.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-white/[0.08] bg-white/[0.03]"
            onClick={() => void loadVaultState()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <AccessGuard
          connected={Boolean(wallet.publicKey)}
          allowed={Boolean(isFeeCollector)}
          title="Fee collector access denied"
          description={`Only wallets in the on-chain fee collector allowlist or env fallback list can open this route. Env fee collectors: ${configuredFeeCollectorWallets.length > 0 ? configuredFeeCollectorWallets.join(", ") : "not set"}. On-chain program checks still control actual withdrawals.`}
        >
          {envFeeCollector && !onChainFeeCollector ? (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-50 [&>svg]:text-amber-200">
              <Vault className="h-4 w-4" />
              <AlertTitle>Env fallback fee collector access</AlertTitle>
              <AlertDescription>
                This wallet is allowed by `NEXT_PUBLIC_AUTOSOL_FEE_COLLECTOR_WALLETS`, but it is not currently in the on-chain fee collector allowlist.
                You can inspect balances here, but withdrawals can still fail until the on-chain allowlist matches.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Vault className="h-4 w-4" /> SOL Fee Vault
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Simulation preview: transfer the requested SOL amount from the global fee vault PDA to your connected wallet.
              </div>
              <div className="mt-4 text-lg font-semibold text-white">
                {solVaultBalance === null ? "-" : `${formatRawTokenAmount(solVaultBalance, "11111111111111111111111111111111", true)} SOL`}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={solAmount}
                  onChange={(event) => setSolAmount(event.target.value)}
                  placeholder="Amount in SOL"
                  className="field-surface h-11"
                />
                <Button
                  className="rounded-xl"
                  disabled={workingAction === "withdraw-sol" || solVaultBalance === null || !isFeeCollector}
                  onClick={() => void handleWithdrawSol()}
                >
                  Withdraw SOL
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Coins className="h-4 w-4" /> SPL Fee Vault
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Simulation preview: withdraw SPL fees from the mint-specific fee vault PDA into your associated token account. If your ATA is missing, the client creates it first.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {popularTokens.map((token) => (
                  <Button
                    key={token.mintAddress}
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-white/[0.08] bg-white/[0.03]"
                    onClick={() => setSplMint(token.mintAddress)}
                  >
                    {token.symbol}
                  </Button>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                <Input
                  value={splMint}
                  onChange={(event) => setSplMint(event.target.value.trim())}
                  placeholder="Mint address"
                  className="field-surface h-11"
                />
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Badge variant="outline" className="border-white/10 text-slate-300">
                    {splMint ? currentSplToken.symbol : "TOKEN"}
                  </Badge>
                  <span>
                    Vault balance: {splVaultBalance === null ? "-" : `${formatRawTokenAmount(splVaultBalance, splMint, false)} ${currentSplToken.symbol}`}
                  </span>
                </div>
                <Input
                  value={splAmount}
                  onChange={(event) => setSplAmount(event.target.value)}
                  placeholder={`Amount in ${currentSplToken.symbol}`}
                  className="field-surface h-11"
                />
                <Button
                  className="rounded-xl"
                  disabled={workingAction === "withdraw-spl" || splVaultBalance === null || !splMint || !isFeeCollector}
                  onClick={() => void handleWithdrawSpl()}
                >
                  Withdraw SPL Fees
                </Button>
              </div>
            </div>
          </div>

          <Alert className="border-white/[0.08] bg-white/[0.02] text-slate-200 [&>svg]:text-slate-300">
            <Vault className="h-4 w-4" />
            <AlertTitle>Security model</AlertTitle>
            <AlertDescription>
              UI access is reduced to fee-collector wallets only, but the actual security boundary remains on-chain. Withdrawals still require the signer to be present in `feeCollectorAllowedKeys`, and vault balances are validated before transfer.
            </AlertDescription>
          </Alert>
        </AccessGuard>
      </div>
    </div>
  );
}
