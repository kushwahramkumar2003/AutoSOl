"use client";

import {
  AnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { AutoSolProgram } from "@/lib/program";

export function useProgram() {
  const { connection } = useConnection();

  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    const provider = new anchor.AnchorProvider(
      connection,
      wallet as AnchorWallet,
      {
        commitment: "confirmed",
      }
    );

    return new AutoSolProgram(provider, true);
  }, [connection, wallet]);

  return { program };
}
