import { Transaction } from "@solana/web3.js";

const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
const {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const fs = require("fs");
const os = require("os");

// Load your wallet
const walletPath = `${os.homedir()}/.config/solana/id.json`;
const walletKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf8")))
);

// Connection to devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Token mints (devnet)
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC
// Note: You'll need to find a devnet USDT mint or create one for testing

async function setupTokenAccounts() {
  console.log("🏦 Setting up token accounts...");
  console.log("Wallet:", walletKeypair.publicKey.toString());

  try {
    // Create USDC associated token account
    const usdcAta = await getAssociatedTokenAddress(
      USDC_MINT,
      walletKeypair.publicKey
    );

    console.log("USDC ATA:", usdcAta.toString());

    // Check if account exists
    const accountInfo = await connection.getAccountInfo(usdcAta);
    if (!accountInfo) {
      console.log("Creating USDC associated token account...");

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          walletKeypair.publicKey,
          usdcAta,
          walletKeypair.publicKey,
          USDC_MINT,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      const signature = await connection.sendTransaction(transaction, [
        walletKeypair,
      ]);
      await connection.confirmTransaction(signature);

      console.log("✅ USDC account created:", signature);
    } else {
      console.log("✅ USDC account already exists");
    }

    console.log("\n🎯 Next steps:");
    console.log("1. Go to https://spl-token-faucet.com/");
    console.log('2. Select "Devnet" and "USDC"');
    console.log(
      "3. Enter your wallet address:",
      walletKeypair.publicKey.toString()
    );
    console.log("4. Request tokens");
    console.log("\n📝 Or use CLI:");
    console.log(`spl-token create-account ${USDC_MINT.toString()}`);
    console.log(
      `spl-token mint ${USDC_MINT.toString()} 1000 ${usdcAta.toString()}`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

setupTokenAccounts();
