"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { RefreshCw, ServerCog, ShieldCheck, Settings2, UserPlus2, WalletCards } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import { AccessGuard } from "@/components/dashboard/admin/access-guard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProgram } from "@/hooks/use-program";
import { usePrivilegedAccess } from "@/hooks/use-privileged-access";
import { formatRawTokenAmount, getTokenLabel, isSolMint } from "@/lib/token-registry";
import { toast } from "sonner";

function parseAddress(value: string, label: string): PublicKey {
  try {
    return new PublicKey(value.trim());
  } catch {
    throw new Error(`Enter a valid ${label} address.`);
  }
}

export default function AdminPage() {
  const wallet = useWallet();
  const { program } = useProgram();
  const {
    feeSettings,
    error,
    initialized,
    backendAuthorityWallet,
    configuredAdminWallet,
    onChainAdmin,
    envAdmin,
    isAdmin,
    canInitialize,
  } = usePrivilegedAccess();

  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const [solFeeVaultBalance, setSolFeeVaultBalance] = useState<number | null>(null);
  const [nextFeePercentage, setNextFeePercentage] = useState<string>("1");
  const [executorAddress, setExecutorAddress] = useState("");
  const [feeCollectorAddress, setFeeCollectorAddress] = useState("");
  const [whitelistMint, setWhitelistMint] = useState("");

  const loadVaultBalances = useCallback(async () => {
    if (!program || !initialized) {
      setSolFeeVaultBalance(null);
      return;
    }

    try {
      const balance = await program.getSolFeeVaultBalance();
      setSolFeeVaultBalance(balance);
    } catch (vaultError) {
      console.error("Failed to load SOL fee vault balance", vaultError);
    }
  }, [initialized, program]);

  useEffect(() => {
    void loadVaultBalances();
  }, [loadVaultBalances]);

  useEffect(() => {
    if (feeSettings) {
      setNextFeePercentage((feeSettings.feePercentage / 100).toString());
    }
  }, [feeSettings]);

  const whitelist = useMemo(
    () => feeSettings?.whitelistedMints.map((mint) => mint.toBase58()) ?? [],
    [feeSettings]
  );
  const feeCollectors = useMemo(
    () => feeSettings?.feeCollectorAllowedKeys.map((key) => key.toBase58()) ?? [],
    [feeSettings]
  );
  const executors = useMemo(
    () => feeSettings?.executorAllowedKeys.map((key) => key.toBase58()) ?? [],
    [feeSettings]
  );

  const runAction = async (label: string, action: () => Promise<void>) => {
    setWorkingAction(label);
    try {
      await action();
      await loadVaultBalances();
    } finally {
      setWorkingAction(null);
    }
  };

  const handleInitialize = async () => {
    if (!program) return;
    await runAction("initialize", async () => {
      await program.initializeFeeSettings();
      toast.success("Fee settings initialized");
      window.location.reload();
    });
  };

  const handleUpdateFee = async () => {
    if (!program || !feeSettings) return;
    const numericPercent = Number.parseFloat(nextFeePercentage);
    if (!Number.isFinite(numericPercent) || numericPercent < 0 || numericPercent > 5) {
      toast.error("Fee percentage must be between 0 and 5");
      return;
    }

    await runAction("fee", async () => {
      await program.updateFeePercentage(Math.round(numericPercent * 100));
      toast.success("Fee percentage updated");
      window.location.reload();
    });
  };

  const handleAddCollector = async () => {
    if (!program) return;
    const address = parseAddress(feeCollectorAddress, "fee collector wallet");
    await runAction("collector-add", async () => {
      await program.addFeeCollector(address);
      setFeeCollectorAddress("");
      toast.success("Fee collector added");
      window.location.reload();
    });
  };

  const handleRemoveCollector = async (address: string) => {
    if (!program) return;
    await runAction(`collector-remove-${address}`, async () => {
      await program.removeFeeCollector(new PublicKey(address));
      toast.success("Fee collector removed");
      window.location.reload();
    });
  };

  const handleAddExecutor = async () => {
    if (!program) return;
    const address = parseAddress(executorAddress, "executor wallet");
    await runAction("executor-add", async () => {
      await program.addExecutor(address);
      setExecutorAddress("");
      toast.success("Executor added");
      window.location.reload();
    });
  };

  const handleRemoveExecutor = async (address: string) => {
    if (!program) return;
    await runAction(`executor-remove-${address}`, async () => {
      await program.removeExecutor(new PublicKey(address));
      toast.success("Executor removed");
      window.location.reload();
    });
  };

  const handleAddWhitelist = async () => {
    if (!program) return;
    const mint = parseAddress(whitelistMint, "mint");
    await runAction("whitelist-add", async () => {
      await program.addWhitelistedMint(mint);
      setWhitelistMint("");
      toast.success("Mint added to whitelist");
      window.location.reload();
    });
  };

  const handleRemoveWhitelist = async (mint: string) => {
    if (!program) return;
    await runAction(`whitelist-remove-${mint}`, async () => {
      await program.removeWhitelistedMint(new PublicKey(mint));
      toast.success("Mint removed from whitelist");
      window.location.reload();
    });
  };

  const currentFeePercent = feeSettings ? feeSettings.feePercentage / 100 : 0;
  const nextFeeBps = Math.round((Number.parseFloat(nextFeePercentage) || 0) * 100);

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="app-page page-stack flex-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Admin Console</h1>
            <p className="mt-1 text-sm text-slate-400">
              Authority-only controls for initialization, fee policy, executor allowlist, fee-collector allowlist, and mint whitelist.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-white/[0.08] bg-white/[0.03]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {error && !initialized ? (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-50 [&>svg]:text-amber-200">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Initialization path active</AlertTitle>
            <AlertDescription>
              Fee settings could not be fetched. If the program is not initialized yet, only the configured backend wallet can initialize it: {backendAuthorityWallet}
            </AlertDescription>
          </Alert>
        ) : null}

        {envAdmin && !onChainAdmin ? (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-50 [&>svg]:text-amber-200">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Env fallback admin access</AlertTitle>
            <AlertDescription>
              This wallet is allowed by `NEXT_PUBLIC_AUTOSOL_ADMIN_WALLET`, but it is not the current on-chain authority wallet.
              You can open this page for visibility, but write actions may fail unless chain authority also matches.
            </AlertDescription>
          </Alert>
        ) : null}

        <AccessGuard
          connected={Boolean(wallet.publicKey)}
          allowed={isAdmin || canInitialize}
          title="Admin access denied"
          description={`This route currently requires either the on-chain authority wallet or the env-configured admin wallet. Current on-chain authority: ${feeSettings?.authority.toBase58() ?? "unknown"}. Env admin: ${configuredAdminWallet ?? "not set"}. Executor role is separate and does not grant admin access.`}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">Program State</div>
              <div className="mt-3 text-lg font-semibold text-white">{initialized ? "Initialized" : "Not initialized"}</div>
              <div className="mt-1 text-xs text-slate-400">Init wallet: {backendAuthorityWallet}. Env admin: {configuredAdminWallet ?? "not set"}.</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">Current Fee</div>
              <div className="mt-3 text-lg font-semibold text-white">{currentFeePercent.toFixed(2)}%</div>
              <div className="mt-1 text-xs text-slate-400">Hard cap is 5.00% on-chain.</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">Fee Collectors</div>
              <div className="mt-3 text-lg font-semibold text-white">{feeCollectors.length}</div>
              <div className="mt-1 text-xs text-slate-400">Allowlisted withdrawal wallets.</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">Executors</div>
              <div className="mt-3 text-lg font-semibold text-white">{executors.length}</div>
              <div className="mt-1 text-xs text-slate-400">Wallets allowed to execute due payments.</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500">SOL Fee Vault</div>
              <div className="mt-3 text-lg font-semibold text-white">
                {solFeeVaultBalance === null ? "-" : `${formatRawTokenAmount(solFeeVaultBalance, "11111111111111111111111111111111", true)} SOL`}
              </div>
              <div className="mt-1 text-xs text-slate-400">Readable without backend dependency.</div>
            </div>
          </div>

          {!initialized ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-white">Initialize Fee Settings</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Simulation preview: create the fee-settings PDA, create the SOL fee vault PDA, set authority to your wallet, set fee to 1.00%, and seed configured fee-collector defaults.
                  </div>
                </div>
                <Button
                  className="rounded-xl"
                  onClick={() => void handleInitialize()}
                  disabled={!canInitialize || workingAction === "initialize"}
                >
                  Initialize
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Settings2 className="h-4 w-4" /> Fee Policy
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Simulation preview: update platform fee from {currentFeePercent.toFixed(2)}% to {(nextFeeBps / 100).toFixed(2)}%.
                  </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={nextFeePercentage}
                    onChange={(event) => setNextFeePercentage(event.target.value)}
                    placeholder="1.00"
                      className="field-surface h-11"
                    />
                    <Button
                      className="rounded-xl"
                      disabled={(!isAdmin || !onChainAdmin) || workingAction === "fee"}
                      onClick={() => void handleUpdateFee()}
                    >
                      Update Fee
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Input is percentage, not basis points.</div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <ServerCog className="h-4 w-4" /> Executor Allowlist
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Simulation preview: add or remove wallets allowed to submit execution transactions. The EC2 executor must run with the private key for one of these public keys.
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={executorAddress}
                      onChange={(event) => setExecutorAddress(event.target.value)}
                      placeholder="Executor wallet public key"
                      className="field-surface h-11"
                    />
                    <Button
                      className="rounded-xl"
                      disabled={(!isAdmin || !onChainAdmin) || workingAction === "executor-add"}
                      onClick={() => void handleAddExecutor()}
                    >
                      Add Executor
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Only the on-chain authority wallet can change this. Allowlisting a public key here does not deploy the executor; it only authorizes that wallet on-chain.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {executors.length === 0 ? (
                      <div className="text-sm text-slate-500">No executors allowlisted.</div>
                    ) : (
                      executors.map((address) => (
                        <div key={address} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-slate-300">
                          <span>{address}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg border-red-500/30 px-2 text-red-300"
                            disabled={(!isAdmin || !onChainAdmin) || workingAction === `executor-remove-${address}`}
                            onClick={() => void handleRemoveExecutor(address)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <UserPlus2 className="h-4 w-4" /> Fee Collector Allowlist
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    Simulation preview: add or remove wallets that can withdraw accumulated protocol fees.
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={feeCollectorAddress}
                      onChange={(event) => setFeeCollectorAddress(event.target.value)}
                      placeholder="Fee collector wallet"
                      className="field-surface h-11"
                    />
                    <Button
                      className="rounded-xl"
                      disabled={(!isAdmin || !onChainAdmin) || workingAction === "collector-add"}
                      onClick={() => void handleAddCollector()}
                    >
                      Add Collector
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {feeCollectors.length === 0 ? (
                      <div className="text-sm text-slate-500">No fee collectors allowlisted.</div>
                    ) : (
                      feeCollectors.map((address) => (
                        <div key={address} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-slate-300">
                          <span>{address}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg border-red-500/30 px-2 text-red-300"
                            disabled={(!isAdmin || !onChainAdmin) || workingAction === `collector-remove-${address}`}
                            onClick={() => void handleRemoveCollector(address)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <WalletCards className="h-4 w-4" /> Mint Whitelist
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Simulation preview: when the whitelist is non-empty, only listed SPL mints can be used for schedule creation.
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={whitelistMint}
                    onChange={(event) => setWhitelistMint(event.target.value)}
                    placeholder="Mint address to whitelist"
                    className="field-surface h-11"
                  />
                  <Button
                    className="rounded-xl"
                    disabled={(!isAdmin || !onChainAdmin) || workingAction === "whitelist-add"}
                    onClick={() => void handleAddWhitelist()}
                  >
                    Add Mint
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {whitelist.length === 0 ? (
                    <div className="text-sm text-slate-500">Whitelist is empty. All mints are currently allowed.</div>
                  ) : (
                    whitelist.map((mint) => (
                      <div key={mint} className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-white/10 text-slate-300">
                            {getTokenLabel(mint, isSolMint(mint))}
                          </Badge>
                          <span>{mint}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg border-red-500/30 px-2 text-red-300"
                            disabled={(!isAdmin || !onChainAdmin) || workingAction === `whitelist-remove-${mint}`}
                            onClick={() => void handleRemoveWhitelist(mint)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </AccessGuard>
      </div>
    </div>
  );
}
