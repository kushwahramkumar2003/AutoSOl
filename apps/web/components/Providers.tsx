"use client";

import config from "@/config";
import {
  NetworkConfigContext,
  NETWORK_ENDPOINTS,
  inferNetworkFromEndpoint,
} from "@/lib/network-config";
import type { NetworkType } from "@/lib/network-config";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { useMemo, useState } from "react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import dynamic from "next/dynamic";

const WalletModalProviderDynamic = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletModalProvider
    ),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
  const [network, setNetwork] = useState<NetworkType>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("autosol:selected-network");
      if (
        saved === "mainnet-beta" ||
        saved === "devnet" ||
        saved === "testnet" ||
        saved === "localnet"
      ) {
        return saved;
      }
    }
    return inferNetworkFromEndpoint(config.rpcEndpoint);
  });

  const endpoint = useMemo(() => {
    if (network === "devnet" && config.rpcEndpoint.includes("devnet")) {
      return config.rpcEndpoint;
    }
    return NETWORK_ENDPOINTS[network];
  }, [network]);

  const updateNetwork = (next: NetworkType) => {
    setNetwork(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("autosol:selected-network", next);
    }
  };

  return (
    <NetworkConfigContext.Provider value={{ network, endpoint, setNetwork: updateNetwork }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProviderDynamic>{children}</WalletModalProviderDynamic>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkConfigContext.Provider>
  );
}
