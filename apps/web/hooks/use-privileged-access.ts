"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/use-program";
import type { FeeSettingsData } from "@/lib/program";
import {
  getConfiguredAdminWallet,
  getConfiguredBackendWallet,
  getConfiguredFeeCollectorWallets,
} from "@/lib/privileged-access";

interface PrivilegedAccessState {
  feeSettings: FeeSettingsData | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  backendAuthorityWallet: string;
  configuredAdminWallet: string | null;
  configuredFeeCollectorWallets: string[];
  onChainAdmin: boolean;
  envAdmin: boolean;
  isAdmin: boolean;
  onChainFeeCollector: boolean;
  envFeeCollector: boolean;
  isFeeCollector: boolean;
  canInitialize: boolean;
}

export function usePrivilegedAccess(): PrivilegedAccessState {
  const wallet = useWallet();
  const { program } = useProgram();
  const [feeSettings, setFeeSettings] = useState<FeeSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backendAuthorityWallet = useMemo(() => getConfiguredBackendWallet(), []);
  const configuredAdminWallet = useMemo(() => getConfiguredAdminWallet(), []);
  const configuredFeeCollectorWallets = useMemo(
    () => getConfiguredFeeCollectorWallets(),
    []
  );
  const walletAddress = wallet.publicKey?.toBase58() ?? null;

  useEffect(() => {
    const load = async () => {
      if (!program) {
        setLoading(false);
        setFeeSettings(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const nextSettings = await program.getFeeSettings();
        setFeeSettings(nextSettings);
      } catch (fetchError) {
        setFeeSettings(null);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load fee settings");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [program]);

  const initialized = Boolean(feeSettings?.initialized);
  const onChainAdmin = Boolean(
    walletAddress && feeSettings && feeSettings.authority.toBase58() === walletAddress
  );
  const envAdmin = Boolean(walletAddress && configuredAdminWallet === walletAddress);
  const isAdmin = Boolean(onChainAdmin || envAdmin);
  const onChainFeeCollector = Boolean(
    walletAddress &&
      feeSettings?.feeCollectorAllowedKeys.some((key) => key.toBase58() === walletAddress)
  );
  const envFeeCollector = Boolean(
    walletAddress && configuredFeeCollectorWallets.includes(walletAddress)
  );
  const isFeeCollector = Boolean(onChainFeeCollector || envFeeCollector);
  const canInitialize = Boolean(
    walletAddress &&
      !initialized &&
      (walletAddress === backendAuthorityWallet || walletAddress === configuredAdminWallet)
  );

  return {
    feeSettings,
    loading,
    error,
    initialized,
    backendAuthorityWallet,
    configuredAdminWallet,
    configuredFeeCollectorWallets,
    onChainAdmin,
    envAdmin,
    isAdmin,
    onChainFeeCollector,
    envFeeCollector,
    isFeeCollector,
    canInitialize,
  };
}
