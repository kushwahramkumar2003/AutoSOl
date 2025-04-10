import fs from "fs";
import path from "path";
import { web3, AnchorProvider, Program } from "@project-serum/anchor";
// pull NodeWallet from its internal path:
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const PROGRAM_ID = new web3.PublicKey(
  "DfnY1thcxGzhPZaUy4V9S4QwyBP1VoshuY87iQxtyrm8"
);
const DEVNET_URL = "https://api.devnet.solana.com";

// load your local Solana keypair
const AUTHORITY = web3.Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(
      fs.readFileSync(
        path.join(process.env.HOME!, ".config/solana/id.json"),
        "utf8"
      )
    )
  )
);

// load the IDL via require
const idl = require(path.join(
  __dirname,
  "..",
  "target",
  "idl",
  "auto_sol.json"
));
// ─────────────────────────────────────────────────────────────────────────────

(async () => {
  // 1) Connection + Provider
  const connection = new web3.Connection(DEVNET_URL, "confirmed");
  const wallet = new NodeWallet(AUTHORITY);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // 2) Program client
  const program = new Program(idl, PROGRAM_ID, provider);

  // 3) Generate the fee vault account
  const feeVault = web3.Keypair.generate();

  // 4) Call `initialize`
  const sig = await program.methods
    .initialize()
    .accounts({
      feeVault: feeVault.publicKey,
      authority: AUTHORITY.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .signers([feeVault])
    .rpc();

  console.log("✅ Initialize tx signature:", sig);
  console.log("🗝️  Fee vault address:", feeVault.publicKey.toBase58());
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
