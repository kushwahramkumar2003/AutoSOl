import { idl } from "@/program/idl";
import { AutoSol } from "@/program/types";

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "6W2YxRyMJoDEWWRsTmh8KdkAuz4AahY2WLMXh3ZEigBf"
);

export class AutoSolError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "ApologyError";
  }
}

export class AutoSolProgram {
  private program: Program<AutoSol>;
  private connection: Connection;

  // eslint-disable-next-line
  private logger: (message: string, ...args: any[]) => void;

  constructor(
    provider: anchor.AnchorProvider,
    debug: boolean = false,
    // eslint-disable-next-line
    customLogger?: (message: string, ...args: any[]) => void
  ) {
    if (!provider.publicKey) {
      throw new AutoSolError(
        "Provider wallet not connected",
        "WALLET_NOT_CONNECTED"
      );
    }

    this.program = new Program(idl as unknown as AutoSol, provider);
    this.connection = provider.connection;
    this.logger = customLogger || (debug ? console.log : () => {});
  }
}
