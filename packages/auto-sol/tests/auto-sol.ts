import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AutoSol } from "../target/types/auto_sol";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import { assert } from "chai";

describe("auto-sol", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AutoSol as Program<AutoSol>;

  // Use your local wallet (assuming it's the provider wallet)
  const authority = provider.wallet;
  const user = Keypair.generate();
  // Specified recipient wallet address
  const recipient = new PublicKey(
    "FxfMxvBecat982M1DpeCwqWRRc4gk35UZH5bhaFqVoDX"
  );
  const executor = Keypair.generate(); // This should match HTTP_BACKEND_WALLET in production

  // Initialize variables
  let usdcMint: PublicKey;
  let usdtMint: PublicKey;
  let userUsdcAccount: PublicKey;
  let userUsdtAccount: PublicKey;
  let recipientUsdcAccount: PublicKey;
  let recipientUsdtAccount: PublicKey;
  let feeSettings: PublicKey;
  let solFeeVault: PublicKey;
  let usdcFeeVault: PublicKey;
  let usdtFeeVault: PublicKey;
  let paymentSchedule: PublicKey;
  let solPaymentVault: PublicKey;
  let usdcPaymentVault: PublicKey;
  let usdtPaymentVault: PublicKey;
  let usdcVaultAuthority: PublicKey;
  let usdtVaultAuthority: PublicKey;
  let usdcFeeVaultTokenAccount: PublicKey;
  let usdtFeeVaultTokenAccount: PublicKey;
  let usdcFeeVaultAuthority: PublicKey;
  let usdtFeeVaultAuthority: PublicKey;

  // Define constants
  const INITIAL_MINT_AMOUNT = 1_000_000_000; // 1000 tokens with 6 decimals
  const PAYMENT_AMOUNT = 100_000_00; // 10 tokens
  const TEST_MEMO = "Test payment schedule";
  const USDC_MINT = new PublicKey(
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
  ); // Devnet USDC
  const USDT_MINT = new PublicKey(
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
  ); // Mainnet USDT

  before(async () => {
    // Airdrop SOL to test accounts
    await Promise.all([
      provider.connection.requestAirdrop(user.publicKey, 10 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(
        executor.publicKey,
        10 * LAMPORTS_PER_SOL
      ),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Set up USDC and USDT mints and accounts
    usdcMint = USDC_MINT;
    usdtMint = USDT_MINT;

    // Create associated token accounts
    userUsdcAccount = await getAssociatedTokenAddress(usdcMint, user.publicKey);
    userUsdtAccount = await getAssociatedTokenAddress(usdtMint, user.publicKey);
    recipientUsdcAccount = await getAssociatedTokenAddress(usdcMint, recipient);
    recipientUsdtAccount = await getAssociatedTokenAddress(usdtMint, recipient);
  });

  it("Initialize program", async () => {
    const feeSettingsKeypair = Keypair.generate();
    feeSettings = feeSettingsKeypair.publicKey;
    const solFeeVaultKeypair = Keypair.generate();
    solFeeVault = solFeeVaultKeypair.publicKey;
    const usdcFeeVaultKeypair = Keypair.generate();
    usdcFeeVault = usdcFeeVaultKeypair.publicKey;
    const usdtFeeVaultKeypair = Keypair.generate();
    usdtFeeVault = usdtFeeVaultKeypair.publicKey;

    await program.methods
      .initialize()
      .accounts({
        feeSettings: feeSettings,
        solFeeVault: solFeeVault,
        usdcFeeVault: usdcFeeVault,
        usdtFeeVault: usdtFeeVault,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([
        feeSettingsKeypair,
        solFeeVaultKeypair,
        usdcFeeVaultKeypair,
        usdtFeeVaultKeypair,
      ])
      .rpc();

    const feeSettingsAccount = await program.account.feeSettings.fetch(
      feeSettings
    );
    assert.equal(
      feeSettingsAccount.authority.toString(),
      authority.publicKey.toString()
    );
    assert.equal(feeSettingsAccount.feePercentage, 100);
  });

  it("Create payment schedule with SOL", async () => {
    const paymentScheduleKeypair = Keypair.generate();
    paymentSchedule = paymentScheduleKeypair.publicKey;

    [solPaymentVault] = await PublicKey.findProgramAddress(
      [Buffer.from("sol_vault"), paymentSchedule.toBuffer()],
      program.programId
    );

    const slot = await provider.connection.getSlot();
    const timestamp =
      (await provider.connection.getBlockTime(slot)) ||
      Math.floor(Date.now() / 1000);
    const scheduleTimes = [timestamp + 10];

    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient,
        scheduleTimes.map((time) => new anchor.BN(time)),
        TEST_MEMO,
        { sol: {} }
      )
      .accounts({
        paymentSchedule: paymentSchedule,
        feeSettings: feeSettings,
        user: user.publicKey,
        solPaymentVault: solPaymentVault,
        solFeeVault: solFeeVault,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        usdcMint: usdcMint,
        usdtMint: usdtMint,
        userUsdcAccount: userUsdcAccount,
        usdcPaymentVault: usdcPaymentVault,
        usdcVaultAuthority: usdcVaultAuthority,
        usdcFeeVaultTokenAccount: usdcFeeVaultTokenAccount,
        usdcFeeVaultAuthority: usdcFeeVaultAuthority,
        userUsdtAccount: userUsdtAccount,
        usdtPaymentVault: usdtPaymentVault,
        usdtVaultAuthority: usdtVaultAuthority,
        usdtFeeVaultTokenAccount: usdtFeeVaultTokenAccount,
        usdtFeeVaultAuthority: usdtFeeVaultAuthority,
      })
      .signers([user, paymentScheduleKeypair])
      .rpc();

    const paymentScheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule
    );
    assert.equal(
      paymentScheduleAccount.owner.toString(),
      user.publicKey.toString()
    );
    assert.equal(
      paymentScheduleAccount.recipient.toString(),
      recipient.toString()
    );
    assert.equal(
      paymentScheduleAccount.paymentAmount.toString(),
      PAYMENT_AMOUNT.toString()
    );
  });

  it("Execute SOL payment", async () => {
    await new Promise((resolve) => setTimeout(resolve, 11000));

    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule,
        feeSettings: feeSettings,
        executor: executor.publicKey,
        recipient: recipient,
        solPaymentVault: solPaymentVault,
        usdcPaymentVault: usdcPaymentVault,
        usdcVaultAuthority: usdcVaultAuthority,
        recipientUsdcAccount: recipientUsdcAccount,
        usdtPaymentVault: usdtPaymentVault,
        usdtVaultAuthority: usdtVaultAuthority,
        recipientUsdtAccount: recipientUsdtAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([executor])
      .rpc();

    const paymentScheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule
    );
    assert.equal(paymentScheduleAccount.payments[0].executed, true);
    assert.equal(paymentScheduleAccount.status.completed !== undefined, true);
  });

  it("Create payment schedule with USDC", async () => {
    const paymentScheduleKeypair = Keypair.generate();
    paymentSchedule = paymentScheduleKeypair.publicKey;

    [usdcVaultAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from("usdc_vault"), paymentSchedule.toBuffer()],
      program.programId
    );
    [usdcPaymentVault] = await PublicKey.findProgramAddress(
      [Buffer.from("usdc_vault"), paymentSchedule.toBuffer()],
      program.programId
    );
    [usdcFeeVaultAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from("usdc_fee_vault")],
      program.programId
    );
    usdcFeeVaultTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      usdcFeeVaultAuthority
    );

    const slot = await provider.connection.getSlot();
    const timestamp =
      (await provider.connection.getBlockTime(slot)) ||
      Math.floor(Date.now() / 1000);
    const scheduleTimes = [timestamp + 10];

    // Note: For this to work, you'll need to fund userUsdcAccount with USDC from devnet faucet
    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient,
        scheduleTimes.map((time) => new anchor.BN(time)),
        TEST_MEMO,
        { usdc: {} }
      )
      .accounts({
        paymentSchedule: paymentSchedule,
        feeSettings: feeSettings,
        user: user.publicKey,
        solPaymentVault: solPaymentVault,
        solFeeVault: solFeeVault,
        userUsdcAccount: userUsdcAccount,
        usdcPaymentVault: usdcPaymentVault,
        usdcVaultAuthority: usdcVaultAuthority,
        usdcFeeVaultTokenAccount: usdcFeeVaultTokenAccount,
        usdcFeeVaultAuthority: usdcFeeVaultAuthority,
        usdcMint: usdcMint,
        userUsdtAccount: userUsdtAccount,
        usdtPaymentVault: usdtPaymentVault,
        usdtVaultAuthority: usdtVaultAuthority,
        usdtFeeVaultTokenAccount: usdtFeeVaultTokenAccount,
        usdtFeeVaultAuthority: usdtFeeVaultAuthority,
        usdtMint: usdtMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, paymentScheduleKeypair])
      .rpc();

    const paymentScheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule
    );
    assert.equal(paymentScheduleAccount.tokenType.usdc !== undefined, true);
    assert.equal(
      paymentScheduleAccount.paymentAmount.toString(),
      PAYMENT_AMOUNT.toString()
    );
  });

  it("Cancel payment schedule", async () => {
    await program.methods
      .cancelPaymentSchedule()
      .accounts({
        paymentSchedule: paymentSchedule,
        owner: user.publicKey,
        solPaymentVault: solPaymentVault,
        usdcPaymentVault: usdcPaymentVault,
        usdcVaultAuthority: usdcVaultAuthority,
        ownerUsdcAccount: userUsdcAccount,
        usdtPaymentVault: usdtPaymentVault,
        usdtVaultAuthority: usdtVaultAuthority,
        ownerUsdtAccount: userUsdtAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const paymentScheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule
    );
    assert.equal(paymentScheduleAccount.status.cancelled !== undefined, true);
    assert.equal(paymentScheduleAccount.remainingAmount.toString(), "0");
  });

  it("Withdraw fees", async () => {
    await program.methods
      .withdrawFees(new anchor.BN(PAYMENT_AMOUNT / 100), { sol: {} }) // 1% fee
      .accounts({
        feeSettings: feeSettings,
        authority: authority.publicKey,
        solFeeVault: solFeeVault,
        usdcFeeVaultTokenAccount: usdcFeeVaultTokenAccount,
        usdcFeeVaultAuthority: usdcFeeVaultAuthority,
        userUsdcAccount: userUsdcAccount,
        usdtFeeVaultTokenAccount: usdtFeeVaultTokenAccount,
        usdtFeeVaultAuthority: usdtFeeVaultAuthority,
        userUsdtAccount: userUsdtAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(); // Using provider wallet (authority)

    // Verify fee vault balance decreased
    const solFeeVaultBalance = await provider.connection.getBalance(
      solFeeVault
    );
    assert(solFeeVaultBalance < PAYMENT_AMOUNT / 100);
  });

  it("Update fee percentage", async () => {
    await program.methods
      .updateFeePercentage(new anchor.BN(200))
      .accounts({
        feeSettings: feeSettings,
        authority: authority.publicKey,
      })
      .rpc();

    const feeSettingsAccount = await program.account.feeSettings.fetch(
      feeSettings
    );
    assert.equal(feeSettingsAccount.feePercentage, 200);
  });
});
