"use client";

import { createContext, useContext } from "react";

export type NetworkType = "mainnet-beta" | "devnet" | "testnet" | "localnet";

type NetworkConfigContextValue = {
  network: NetworkType;
  endpoint: string;
  setNetwork: (network: NetworkType) => void;
};

export const NETWORK_ENDPOINTS: Record<NetworkType, string> = {
  "mainnet-beta":
    process.env.NEXT_PUBLIC_RPC_URL_MAINNET ?? "https://api.mainnet-beta.solana.com",
  devnet: process.env.NEXT_PUBLIC_RPC_URL_DEVNET ?? "https://api.devnet.solana.com",
  testnet: process.env.NEXT_PUBLIC_RPC_URL_TESTNET ?? "https://api.testnet.solana.com",
  localnet: process.env.NEXT_PUBLIC_RPC_URL_LOCALNET ?? "http://127.0.0.1:8899",
};

export function inferNetworkFromEndpoint(endpoint: string): NetworkType {
  const normalized = endpoint.toLowerCase();
  if (normalized.includes("127.0.0.1") || normalized.includes("localhost")) {
    return "localnet";
  }
  if (normalized.includes("mainnet")) {
    return "mainnet-beta";
  }
  if (normalized.includes("testnet")) {
    return "testnet";
  }
  return "devnet";
}

export const NetworkConfigContext = createContext<NetworkConfigContextValue | null>(null);

export function useNetworkConfig(): NetworkConfigContextValue {
  const ctx = useContext(NetworkConfigContext);
  if (!ctx) {
    throw new Error("useNetworkConfig must be used within Providers");
  }
  return ctx;
}

