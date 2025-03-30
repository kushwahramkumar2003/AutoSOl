import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AutoSol } from "../target/types/auto_sol";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("auto-sol", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AutoSol as Program<AutoSol>;

  // Generate keypairs for testing
  const authority = Keypair.generate();
  const user = Keypair.generate();
  const recipient = Keypair.generate();
  const keeper = Keypair.generate();

  // Initialize variables
  let mint: PublicKey;
  let userTokenAccount: PublicKey;
  let recipientTokenAccount: PublicKey;
  let ownerTokenAccount: PublicKey;
  let feeVault: PublicKey;
  let feeVaultTokenAccount: PublicKey;
  let paymentSchedule: PublicKey;
  let paymentVault: PublicKey;
  let paymentVaultAuthority: PublicKey;
  let paymentVaultBump: number;

  // Define constants
  const INITIAL_MINT_AMOUNT = 1_000_000_000; // 1000 tokens with 6 decimals
  const PAYMENT_AMOUNT = 100_000_000; // 100 tokens
  const TEST_MEMO = "Test payment schedule";

  // Initialize with some test SOL
  before(async () => {
    // Airdrop SOL to the authority and user
    await provider.connection.requestAirdrop(
      authority.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      user.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      recipient.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      keeper.publicKey,
      10 * LAMPORTS_PER_SOL
    );

    // Wait for confirmation
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it("Initialize program", async () => {
    // Generate a new keypair for the fee vault
    const feeVaultKeypair = Keypair.generate();
    feeVault = feeVaultKeypair.publicKey;

    // Initialize the fee vault
    await program.methods
      .initialize()
      .accounts({
        feeVault: feeVault,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([authority, feeVaultKeypair])
      .rpc();

    // Fetch the fee vault account
    const feeVaultAccount = await program.account.feeVault.fetch(feeVault);

    // Verify the fee vault was initialized correctly
    assert.equal(
      feeVaultAccount.authority.toString(),
      authority.publicKey.toString()
    );
    assert.equal(feeVaultAccount.feePercentage, 100); // Default 1%
  });

  it("Create SPL token mint and accounts", async () => {
    // Create a new mint
    mint = await createMint(
      provider.connection,
      user,
      user.publicKey,
      null,
      6 // 6 decimals
    );

    // Create token accounts
    userTokenAccount = await createAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );

    recipientTokenAccount = await createAccount(
      provider.connection,
      recipient,
      mint,
      recipient.publicKey
    );

    ownerTokenAccount = userTokenAccount;

    feeVaultTokenAccount = await createAccount(
      provider.connection,
      authority,
      mint,
      authority.publicKey
    );

    // Mint tokens to the user
    await mintTo(
      provider.connection,
      user,
      mint,
      userTokenAccount,
      user.publicKey,
      INITIAL_MINT_AMOUNT
    );

    // Verify token minting
    const userTokenBalance = await getAccount(
      provider.connection,
      userTokenAccount
    );
    assert.equal(
      userTokenBalance.amount.toString(),
      INITIAL_MINT_AMOUNT.toString()
    );
  });

  it("Create payment schedule", async () => {
    // Create payment schedule keypair
    const paymentScheduleKeypair = Keypair.generate();
    paymentSchedule = paymentScheduleKeypair.publicKey;

    // Calculate PDA for payment vault authority
    const [paymentVaultAuthorityPDA, paymentVaultAuthorityBump] =
      await PublicKey.findProgramAddressSync(
        [paymentSchedule.toBuffer()],
        program.programId
      );
    paymentVaultAuthority = paymentVaultAuthorityPDA;
    paymentVaultBump = paymentVaultAuthorityBump;

    // Calculate PDA for payment vault
    const [paymentVaultPDA] = await PublicKey.findProgramAddressSync(
      [paymentSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );
    paymentVault = paymentVaultPDA;

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);

    // Schedule payments for the future
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);
    const scheduleTimes = [
      currentTimestamp + 10, // 10 seconds from now
      currentTimestamp + 20, // 20 seconds from now
      currentTimestamp + 30, // 30 seconds from now
    ];

    // Create payment schedule
    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient.publicKey,
        scheduleTimes.map((time) => new anchor.BN(time)),
        TEST_MEMO
      )
      .accounts({
        paymentSchedule: paymentSchedule,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        mint: mint,
        paymentVault: paymentVault,
        paymentVaultAuthority: paymentVaultAuthority,
        feeVault: feeVault,
        feeVaultTokenAccount: feeVaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, paymentScheduleKeypair])
      .rpc();

    // Fetch payment schedule
    const paymentScheduleAccount =
      await program.account.paymentSchedule.fetch(paymentSchedule);

    // Verify payment schedule
    assert.equal(
      paymentScheduleAccount.owner.toString(),
      user.publicKey.toString()
    );
    assert.equal(
      paymentScheduleAccount.recipient.toString(),
      recipient.publicKey.toString()
    );
    assert.equal(
      paymentScheduleAccount.paymentAmount.toString(),
      PAYMENT_AMOUNT.toString()
    );
    assert.equal(
      paymentScheduleAccount.totalAmount.toString(),
      (PAYMENT_AMOUNT * scheduleTimes.length).toString()
    );
    assert.equal(
      paymentScheduleAccount.remainingAmount.toString(),
      (PAYMENT_AMOUNT * scheduleTimes.length).toString()
    );
    assert.equal(paymentScheduleAccount.memo, TEST_MEMO);
    assert.equal(paymentScheduleAccount.payments.length, scheduleTimes.length);
    assert.equal(paymentScheduleAccount.status.active !== undefined, true);

    // Verify tokens were transferred to the payment vault
    const paymentVaultBalance = await getAccount(
      provider.connection,
      paymentVault
    );
    assert.equal(
      paymentVaultBalance.amount.toString(),
      (PAYMENT_AMOUNT * scheduleTimes.length).toString()
    );

    // Verify fee was transferred to fee vault
    const feeVaultBalance = await getAccount(
      provider.connection,
      feeVaultTokenAccount
    );
    const expectedFee = (PAYMENT_AMOUNT * scheduleTimes.length * 100) / 10000; // 1% fee
    assert.equal(feeVaultBalance.amount.toString(), expectedFee.toString());
  });

  it("Execute payment", async () => {
    // Wait for the first payment to be due (10 seconds)
    await new Promise((resolve) => setTimeout(resolve, 11000));

    // Execute the first payment
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule,
        paymentVault: paymentVault,
        paymentVaultAuthority: paymentVaultAuthority,
        recipientTokenAccount: recipientTokenAccount,
        keeper: keeper.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([keeper])
      .rpc();

    // Fetch payment schedule again
    const paymentScheduleAccount =
      await program.account.paymentSchedule.fetch(paymentSchedule);

    // Verify payment was executed
    assert.equal(paymentScheduleAccount.payments[0].executed, true);
    assert.equal(
      paymentScheduleAccount.payments[0].txSignature.toString(),
      keeper.publicKey.toString()
    );
    assert.equal(
      paymentScheduleAccount.remainingAmount.toString(),
      (PAYMENT_AMOUNT * 2).toString()
    );
    assert.equal(paymentScheduleAccount.status.active !== undefined, true);

    // Verify tokens were transferred to recipient
    const recipientTokenBalance = await getAccount(
      provider.connection,
      recipientTokenAccount
    );
    assert.equal(
      recipientTokenBalance.amount.toString(),
      PAYMENT_AMOUNT.toString()
    );
  });

  it("Fail to execute payment that is not due yet", async () => {
    try {
      // Try to execute the third payment (not due yet)
      await program.methods
        .executePayment(new anchor.BN(2))
        .accounts({
          paymentSchedule: paymentSchedule,
          paymentVault: paymentVault,
          paymentVaultAuthority: paymentVaultAuthority,
          recipientTokenAccount: recipientTokenAccount,
          keeper: keeper.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([keeper])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "PaymentNotDue");
    }
  });

  it("Fail to execute payment that is already executed", async () => {
    try {
      // Try to execute the first payment again
      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: paymentSchedule,
          paymentVault: paymentVault,
          paymentVaultAuthority: paymentVaultAuthority,
          recipientTokenAccount: recipientTokenAccount,
          keeper: keeper.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([keeper])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "PaymentAlreadyExecuted");
    }
  });

  it("Update fee percentage", async () => {
    // Update fee percentage to 2%
    await program.methods
      .updateFeePercentage(new anchor.BN(200))
      .accounts({
        feeVault: feeVault,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    // Verify fee percentage was updated
    const feeVaultAccount = await program.account.feeVault.fetch(feeVault);
    assert.equal(feeVaultAccount.feePercentage, 200);
  });

  it("Fail to update fee percentage beyond maximum", async () => {
    try {
      // Try to update fee percentage to 6% (max is 5%)
      await program.methods
        .updateFeePercentage(new anchor.BN(600))
        .accounts({
          feeVault: feeVault,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "FeeTooHigh");
    }
  });

  it("Fail to update fee percentage without authority", async () => {
    try {
      // Try to update fee percentage with wrong authority
      await program.methods
        .updateFeePercentage(new anchor.BN(300))
        .accounts({
          feeVault: feeVault,
          authority: user.publicKey,
        })
        .signers([user])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "constraint was violated");
    }
  });

  it("Execute second payment", async () => {
    // Wait for the second payment to be due
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Execute the second payment
    await program.methods
      .executePayment(new anchor.BN(1))
      .accounts({
        paymentSchedule: paymentSchedule,
        paymentVault: paymentVault,
        paymentVaultAuthority: paymentVaultAuthority,
        recipientTokenAccount: recipientTokenAccount,
        keeper: keeper.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([keeper])
      .rpc();

    // Fetch payment schedule again
    const paymentScheduleAccount =
      await program.account.paymentSchedule.fetch(paymentSchedule);

    // Verify payment was executed
    assert.equal(paymentScheduleAccount.payments[1].executed, true);
    assert.equal(
      paymentScheduleAccount.payments[1].txSignature.toString(),
      keeper.publicKey.toString()
    );
    assert.equal(
      paymentScheduleAccount.remainingAmount.toString(),
      PAYMENT_AMOUNT.toString()
    );
    assert.equal(paymentScheduleAccount.status.active !== undefined, true);

    // Verify tokens were transferred to recipient
    const recipientTokenBalance = await getAccount(
      provider.connection,
      recipientTokenAccount
    );
    assert.equal(
      recipientTokenBalance.amount.toString(),
      (PAYMENT_AMOUNT * 2).toString()
    );
  });

  it("Cancel payment schedule", async () => {
    // Calculate remaining amount
    const paymentScheduleAccount =
      await program.account.paymentSchedule.fetch(paymentSchedule);
    const remainingAmount = paymentScheduleAccount.remainingAmount;

    // Get user balance before cancellation
    const userBalanceBefore = await getAccount(
      provider.connection,
      userTokenAccount
    );

    // Cancel payment schedule
    await program.methods
      .cancelPaymentSchedule()
      .accounts({
        paymentSchedule: paymentSchedule,
        owner: user.publicKey,
        paymentVault: paymentVault,
        paymentVaultAuthority: paymentVaultAuthority,
        ownerTokenAccount: ownerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Fetch payment schedule again
    const updatedPaymentSchedule =
      await program.account.paymentSchedule.fetch(paymentSchedule);

    // Verify payment schedule was cancelled
    assert.equal(updatedPaymentSchedule.status.cancelled !== undefined, true);
    assert.equal(updatedPaymentSchedule.remainingAmount.toString(), "0");

    // Verify tokens were returned to owner
    const userBalanceAfter = await getAccount(
      provider.connection,
      userTokenAccount
    );
    assert.equal(
      userBalanceAfter.amount.toString(),
      (
        BigInt(userBalanceBefore.amount.toString()) +
        BigInt(remainingAmount.toString())
      ).toString()
    );

    // Verify payment vault is empty
    const paymentVaultBalance = await getAccount(
      provider.connection,
      paymentVault
    );
    assert.equal(paymentVaultBalance.amount.toString(), "0");
  });

  it("Create and complete a payment schedule", async () => {
    // Create a new payment schedule with a single payment
    const newPaymentScheduleKeypair = Keypair.generate();
    const newPaymentSchedule = newPaymentScheduleKeypair.publicKey;

    // Calculate PDAs for the new payment schedule
    const [newPaymentVaultAuthorityPDA] =
      await PublicKey.findProgramAddressSync(
        [newPaymentSchedule.toBuffer()],
        program.programId
      );
    const [newPaymentVaultPDA] = await PublicKey.findProgramAddressSync(
      [newPaymentSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);

    // Schedule a single payment for 5 seconds from now
    const singleScheduleTime = [currentTimestamp + 5];

    // Create the payment schedule
    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient.publicKey,
        singleScheduleTime.map((time) => new anchor.BN(time)),
        "Single payment test"
      )
      .accounts({
        paymentSchedule: newPaymentSchedule,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        mint: mint,
        paymentVault: newPaymentVaultPDA,
        paymentVaultAuthority: newPaymentVaultAuthorityPDA,
        feeVault: feeVault,
        feeVaultTokenAccount: feeVaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, newPaymentScheduleKeypair])
      .rpc();

    // Wait for the payment to be due
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Execute the payment
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: newPaymentSchedule,
        paymentVault: newPaymentVaultPDA,
        paymentVaultAuthority: newPaymentVaultAuthorityPDA,
        recipientTokenAccount: recipientTokenAccount,
        keeper: keeper.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([keeper])
      .rpc();

    // Fetch payment schedule
    const completedSchedule =
      await program.account.paymentSchedule.fetch(newPaymentSchedule);

    // Verify the schedule is completed when all payments are executed
    assert.equal(completedSchedule.status.completed !== undefined, true);
    assert.equal(completedSchedule.remainingAmount.toString(), "0");
    assert.equal(completedSchedule.payments[0].executed, true);
  });

  it("Test create payment schedule with invalid times", async () => {
    // Create payment schedule keypair
    const invalidScheduleKeypair = Keypair.generate();
    const invalidSchedule = invalidScheduleKeypair.publicKey;

    // Calculate PDAs
    const [invalidVaultAuthorityPDA] = await PublicKey.findProgramAddressSync(
      [invalidSchedule.toBuffer()],
      program.programId
    );
    const [invalidVaultPDA] = await PublicKey.findProgramAddressSync(
      [invalidSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);

    try {
      // Try to create a schedule with a past time
      await program.methods
        .createPaymentSchedule(
          new anchor.BN(PAYMENT_AMOUNT),
          recipient.publicKey,
          [new anchor.BN(currentTimestamp - 60)], // 1 minute in the past
          "Invalid time test"
        )
        .accounts({
          paymentSchedule: invalidSchedule,
          user: user.publicKey,
          userTokenAccount: userTokenAccount,
          mint: mint,
          paymentVault: invalidVaultPDA,
          paymentVaultAuthority: invalidVaultAuthorityPDA,
          feeVault: feeVault,
          feeVaultTokenAccount: feeVaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user, invalidScheduleKeypair])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "InvalidScheduleTime");
    }
  });

  it("Test create payment schedule with empty schedule", async () => {
    // Create payment schedule keypair
    const emptyScheduleKeypair = Keypair.generate();
    const emptySchedule = emptyScheduleKeypair.publicKey;

    // Calculate PDAs
    const [emptyVaultAuthorityPDA] = await PublicKey.findProgramAddressSync(
      [emptySchedule.toBuffer()],
      program.programId
    );
    const [emptyVaultPDA] = await PublicKey.findProgramAddressSync(
      [emptySchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    try {
      // Try to create a schedule with an empty array of times
      await program.methods
        .createPaymentSchedule(
          new anchor.BN(PAYMENT_AMOUNT),
          recipient.publicKey,
          [], // Empty array
          "Empty schedule test"
        )
        .accounts({
          paymentSchedule: emptySchedule,
          user: user.publicKey,
          userTokenAccount: userTokenAccount,
          mint: mint,
          paymentVault: emptyVaultPDA,
          paymentVaultAuthority: emptyVaultAuthorityPDA,
          feeVault: feeVault,
          feeVaultTokenAccount: feeVaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user, emptyScheduleKeypair])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "EmptySchedule");
    }
  });

  it("Test create payment schedule with insufficient funds", async () => {
    // Create a new user with no funds
    const poorUser = Keypair.generate();
    await provider.connection.requestAirdrop(
      poorUser.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create token account for poor user
    const poorUserTokenAccount = await createAccount(
      provider.connection,
      poorUser,
      mint,
      poorUser.publicKey
    );

    // Mint a small amount of tokens to the poor user (not enough for payment)
    await mintTo(
      provider.connection,
      user,
      mint,
      poorUserTokenAccount,
      user.publicKey,
      PAYMENT_AMOUNT / 2 // Half of what's needed
    );

    // Create payment schedule keypair
    const insufficientFundsKeypair = Keypair.generate();
    const insufficientFundsSchedule = insufficientFundsKeypair.publicKey;

    // Calculate PDAs
    const [insufficientVaultAuthorityPDA] =
      await PublicKey.findProgramAddressSync(
        [insufficientFundsSchedule.toBuffer()],
        program.programId
      );
    const [insufficientVaultPDA] = await PublicKey.findProgramAddressSync(
      [insufficientFundsSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);

    try {
      // Try to create a schedule with insufficient funds
      await program.methods
        .createPaymentSchedule(
          new anchor.BN(PAYMENT_AMOUNT),
          recipient.publicKey,
          [new anchor.BN(currentTimestamp + 60)], // 1 minute in the future
          "Insufficient funds test"
        )
        .accounts({
          paymentSchedule: insufficientFundsSchedule,
          user: poorUser.publicKey,
          userTokenAccount: poorUserTokenAccount,
          mint: mint,
          paymentVault: insufficientVaultPDA,
          paymentVaultAuthority: insufficientVaultAuthorityPDA,
          feeVault: feeVault,
          feeVaultTokenAccount: feeVaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([poorUser, insufficientFundsKeypair])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "InsufficientFunds");
    }
  });

  it("Test cancel payment schedule by non-owner", async () => {
    // Create a new payment schedule
    const newScheduleKeypair = Keypair.generate();
    const newSchedule = newScheduleKeypair.publicKey;

    // Calculate PDAs
    const [newVaultAuthorityPDA] = await PublicKey.findProgramAddressSync(
      [newSchedule.toBuffer()],
      program.programId
    );
    const [newVaultPDA] = await PublicKey.findProgramAddressSync(
      [newSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);

    // Create the payment schedule
    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient.publicKey,
        [new anchor.BN(currentTimestamp + 3600)], // 1 hour in the future
        "Cancel test"
      )
      .accounts({
        paymentSchedule: newSchedule,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        mint: mint,
        paymentVault: newVaultPDA,
        paymentVaultAuthority: newVaultAuthorityPDA,
        feeVault: feeVault,
        feeVaultTokenAccount: feeVaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, newScheduleKeypair])
      .rpc();

    // Try to cancel as the recipient (not the owner)
    try {
      await program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: newSchedule,
          owner: recipient.publicKey,
          paymentVault: newVaultPDA,
          paymentVaultAuthority: newVaultAuthorityPDA,
          ownerTokenAccount: recipientTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([recipient])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "constraint was violated");
    }

    // Now cancel properly as the owner
    await program.methods
      .cancelPaymentSchedule()
      .accounts({
        paymentSchedule: newSchedule,
        owner: user.publicKey,
        paymentVault: newVaultPDA,
        paymentVaultAuthority: newVaultAuthorityPDA,
        ownerTokenAccount: ownerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Verify it was cancelled
    const cancelledSchedule =
      await program.account.paymentSchedule.fetch(newSchedule);
    assert.equal(cancelledSchedule.status.cancelled !== undefined, true);
  });

  it("Test execute payment with invalid index", async () => {
    // Create a new payment schedule
    const invalidIndexScheduleKeypair = Keypair.generate();
    const invalidIndexSchedule = invalidIndexScheduleKeypair.publicKey;

    // Calculate PDAs
    const [invalidIndexVaultAuthorityPDA] =
      await PublicKey.findProgramAddressSync(
        [invalidIndexSchedule.toBuffer()],
        program.programId
      );
    const [invalidIndexVaultPDA] = await PublicKey.findProgramAddressSync(
      [invalidIndexSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);

    // Create the payment schedule with one payment
    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient.publicKey,
        [new anchor.BN(currentTimestamp + 10)], // 10 seconds in the future
        "Invalid index test"
      )
      .accounts({
        paymentSchedule: invalidIndexSchedule,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        mint: mint,
        paymentVault: invalidIndexVaultPDA,
        paymentVaultAuthority: invalidIndexVaultAuthorityPDA,
        feeVault: feeVault,
        feeVaultTokenAccount: feeVaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, invalidIndexScheduleKeypair])
      .rpc();

    // Wait for the payment to be due
    await new Promise((resolve) => setTimeout(resolve, 11000));

    // Try to execute with an invalid index (out of bounds)
    try {
      await program.methods
        .executePayment(new anchor.BN(1)) // Index 1 doesn't exist
        .accounts({
          paymentSchedule: invalidIndexSchedule,
          paymentVault: invalidIndexVaultPDA,
          paymentVaultAuthority: invalidIndexVaultAuthorityPDA,
          recipientTokenAccount: recipientTokenAccount,
          keeper: keeper.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([keeper])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "InvalidPaymentIndex");
    }

    // Now execute with the correct index
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: invalidIndexSchedule,
        paymentVault: invalidIndexVaultPDA,
        paymentVaultAuthority: invalidIndexVaultAuthorityPDA,
        recipientTokenAccount: recipientTokenAccount,
        keeper: keeper.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([keeper])
      .rpc();

    // Verify the payment was executed
    const executedSchedule =
      await program.account.paymentSchedule.fetch(invalidIndexSchedule);
    assert.equal(executedSchedule.status.completed !== undefined, true);
    assert.equal(executedSchedule.payments[0].executed, true);
  });

  it("Test execute payment on cancelled schedule", async () => {
    // Create a new payment schedule
    const cancelledScheduleKeypair = Keypair.generate();
    const cancelledSchedule = cancelledScheduleKeypair.publicKey;

    // Calculate PDAs
    const [cancelledVaultAuthorityPDA] = await PublicKey.findProgramAddressSync(
      [cancelledSchedule.toBuffer()],
      program.programId
    );
    const [cancelledVaultPDA] = await PublicKey.findProgramAddressSync(
      [cancelledSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);

    // Create the payment schedule
    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient.publicKey,
        [new anchor.BN(currentTimestamp + 3600)], // 1 hour in the future
        "Cancelled schedule test"
      )
      .accounts({
        paymentSchedule: cancelledSchedule,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        mint: mint,
        paymentVault: cancelledVaultPDA,
        paymentVaultAuthority: cancelledVaultAuthorityPDA,
        feeVault: feeVault,
        feeVaultTokenAccount: feeVaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, cancelledScheduleKeypair])
      .rpc();

    // Cancel the schedule
    await program.methods
      .cancelPaymentSchedule()
      .accounts({
        paymentSchedule: cancelledSchedule,
        owner: user.publicKey,
        paymentVault: cancelledVaultPDA,
        paymentVaultAuthority: cancelledVaultAuthorityPDA,
        ownerTokenAccount: ownerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Try to execute payment on the cancelled schedule
    try {
      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: cancelledSchedule,
          paymentVault: cancelledVaultPDA,
          paymentVaultAuthority: cancelledVaultAuthorityPDA,
          recipientTokenAccount: recipientTokenAccount,
          keeper: keeper.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([keeper])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.include(error.message, "InvalidScheduleStatus");
    }
  });

  it("Test cancel completed payment schedule", async () => {
    // Create a new payment schedule with a single payment
    const completedScheduleKeypair = Keypair.generate();
    const completedSchedule = completedScheduleKeypair.publicKey;

    // Calculate PDAs
    const [completedVaultAuthorityPDA] = await PublicKey.findProgramAddressSync(
      [completedSchedule.toBuffer()],
      program.programId
    );
    const [completedVaultPDA] = await PublicKey.findProgramAddressSync(
      [completedSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);

    // Create the payment schedule
    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient.publicKey,
        [new anchor.BN(currentTimestamp + 5)], // 5 seconds in the future
        "Completed schedule test"
      )
      .accounts({
        paymentSchedule: completedSchedule,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        mint: mint,
        paymentVault: completedVaultPDA,
        paymentVaultAuthority: completedVaultAuthorityPDA,
        feeVault: feeVault,
        feeVaultTokenAccount: feeVaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, completedScheduleKeypair])
      .rpc();

    // Wait for the payment to be due
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Execute the payment
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: completedSchedule,
        paymentVault: completedVaultPDA,
        paymentVaultAuthority: completedVaultAuthorityPDA,
        recipientTokenAccount: recipientTokenAccount,
        keeper: keeper.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([keeper])
      .rpc();

    // Try to cancel the completed schedule
    try {
      await program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: completedSchedule,
          owner: user.publicKey,
          paymentVault: completedVaultPDA,
          paymentVaultAuthority: completedVaultAuthorityPDA,
          ownerTokenAccount: ownerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      // This should fail because the schedule is already completed
      assert.include(error.message, "InvalidScheduleStatus");
    }
  });

  it("Test cancel payment schedule with no remaining funds", async () => {
    // Create a new payment schedule with one payment
    const noFundsScheduleKeypair = Keypair.generate();
    const noFundsSchedule = noFundsScheduleKeypair.publicKey;

    // Calculate PDAs
    const [noFundsVaultAuthorityPDA] = await PublicKey.findProgramAddressSync(
      [noFundsSchedule.toBuffer()],
      program.programId
    );
    const [noFundsVaultPDA] = await PublicKey.findProgramAddressSync(
      [noFundsSchedule.toBuffer(), Buffer.from("vault")],
      program.programId
    );

    // Get current timestamp
    const slot = await provider.connection.getSlot();
    const timestamp = await provider.connection.getBlockTime(slot);
    const currentTimestamp = timestamp || Math.floor(Date.now() / 1000);

    // Create the payment schedule
    await program.methods
      .createPaymentSchedule(
        new anchor.BN(PAYMENT_AMOUNT),
        recipient.publicKey,
        [new anchor.BN(currentTimestamp + 5)], // 5 seconds in the future
        "No funds test"
      )
      .accounts({
        paymentSchedule: noFundsSchedule,
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        mint: mint,
        paymentVault: noFundsVaultPDA,
        paymentVaultAuthority: noFundsVaultAuthorityPDA,
        feeVault: feeVault,
        feeVaultTokenAccount: feeVaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user, noFundsScheduleKeypair])
      .rpc();

    // Wait for the payment to be due
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Execute the payment
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: noFundsSchedule,
        paymentVault: noFundsVaultPDA,
        paymentVaultAuthority: noFundsVaultAuthorityPDA,
        recipientTokenAccount: recipientTokenAccount,
        keeper: keeper.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([keeper])
      .rpc();

    // Try to cancel the schedule with no remaining funds
    try {
      await program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: noFundsSchedule,
          owner: user.publicKey,
          paymentVault: noFundsVaultPDA,
          paymentVaultAuthority: noFundsVaultAuthorityPDA,
          ownerTokenAccount: ownerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      assert.fail("Should have thrown an error");
    } catch (error) {
      // This should fail because there are no remaining funds
      assert.include(error.message, "NoRemainingFunds");
    }
  });
});
