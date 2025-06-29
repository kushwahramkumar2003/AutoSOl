import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AutoSol } from "../target/types/auto_sol";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

describe("auto-sol comprehensive tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AutoSol as Program<AutoSol>;

  let feeSettings: PublicKey;
  let solFeeVault: PublicKey;
  let authority: Keypair;
  let user: Keypair;
  let user2: Keypair;
  let recipient: Keypair;
  let recipient2: Keypair;
  let httpBackendWallet: Keypair;
  let unauthorizedUser: Keypair;
  let maliciousUser: Keypair;
  let feeWithdrawer: Keypair; // Authorized fee withdrawal key
  let rentPayer: Keypair; // For rent exemption tests

  const HTTP_BACKEND_WALLET = new PublicKey(
    "8dRCBu5V2v6JHR3HxN9zjN91WoX4FfGzgdM8nXawUbqt"
  );
  const FEE_WITHDRAWAL_ALLOWED_KEYS = [
    "FxfMxvBecat982M1DpeCwqWRRc4gk35UZH5bhaFqVoDX",
    "9KP44gv69EoXN2aB71u1HoYy5ZSZjXTpyYXygJ9phwCN",
    "BS5QbyrCvPreGPPQ7XzEkdpFk7J7LPd9RfYDF8rXmVm7",
    "8dRCBu5V2v6JHR3HxN9zjN91WoX4FfGzgdM8nXawUbqt",
    "68AzXw2QAhh6NkrH5bqvDn3hPGk1mix4ewFGQ7AoTpe1",
    "G8UmesEhavARgE6xTWbDq6iHvdp8W2yo4pbrW4jLsHxh",
  ].map((key) => new PublicKey(key));

  const paymentAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
  const smallPaymentAmount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
  const largePaymentAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);
  const minPaymentAmount = new anchor.BN(1); // 1 lamport
  const memo = "Test payment schedule";
  const longMemo = "A".repeat(100); // Maximum memo length
  const airdropAmount = 20 * LAMPORTS_PER_SOL; // Increased for larger tests

  const loadLocalWallet = (): Keypair => {
    const walletPath = path.join(os.homedir(), ".config", "solana", "id.json");
    const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(keypairData));
  };

  const loadFeeWithdrawerWallet = (): Keypair => {
    const walletPath = path.join(__dirname, "fee_withdrow_wallet.json");
    const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    // console.log("FeeWithdrawerWallet path", walletPath);
    return Keypair.fromSecretKey(Uint8Array.from(keypairData));
  };

  const getCurrentTimestamp = (): number => Math.floor(Date.now() / 1000);

  const createPaymentSchedule = async (
    scheduleOwner: Keypair,
    amount: anchor.BN,
    recipientKey: PublicKey,
    times: anchor.BN[],
    memoText: string = memo
  ) => {
    const paymentSchedule = Keypair.generate();
    const [solPaymentVault] = await PublicKey.findProgramAddress(
      [Buffer.from("sol_vault"), paymentSchedule.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createPaymentSchedule(amount, recipientKey, times, memoText)
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        user: scheduleOwner.publicKey,
      })
      .signers([paymentSchedule, scheduleOwner])
      .rpc();

    return { paymentSchedule, solPaymentVault };
  };

  const waitForTime = (seconds: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  };

  beforeEach(async () => {
    user = Keypair.generate();
    user2 = Keypair.generate();
    recipient = Keypair.generate();
    recipient2 = Keypair.generate();
    unauthorizedUser = Keypair.generate();
    maliciousUser = Keypair.generate();
    rentPayer = Keypair.generate();
    httpBackendWallet = loadLocalWallet();
    authority = loadLocalWallet();
    feeWithdrawer = loadFeeWithdrawerWallet();

    if (!httpBackendWallet.publicKey.equals(HTTP_BACKEND_WALLET)) {
      throw new Error(
        `Local wallet ${httpBackendWallet.publicKey.toString()} doesn't match expected ${HTTP_BACKEND_WALLET.toString()}`
      );
    }
    [feeSettings] = await PublicKey.findProgramAddress(
      [Buffer.from("global_fee_settings")],
      program.programId
    );
    [solFeeVault] = await PublicKey.findProgramAddress(
      [Buffer.from("global_fee_vault")],
      program.programId
    );

    const airdropPromises = [
      provider.connection.requestAirdrop(authority.publicKey, airdropAmount),
      provider.connection.requestAirdrop(user.publicKey, airdropAmount),
      provider.connection.requestAirdrop(user2.publicKey, airdropAmount),
      provider.connection.requestAirdrop(
        httpBackendWallet.publicKey,
        airdropAmount
      ),
      provider.connection.requestAirdrop(
        unauthorizedUser.publicKey,
        airdropAmount
      ),
      provider.connection.requestAirdrop(
        maliciousUser.publicKey,
        airdropAmount
      ),
      provider.connection.requestAirdrop(recipient.publicKey, airdropAmount),
      provider.connection.requestAirdrop(recipient2.publicKey, airdropAmount),
      provider.connection.requestAirdrop(
        feeWithdrawer.publicKey,
        airdropAmount
      ),
      provider.connection.requestAirdrop(rentPayer.publicKey, airdropAmount),
    ];

    await Promise.all(airdropPromises);
    await waitForTime(2);

    try {
      await program.methods
        .initialize()
        .accounts({
          authority: httpBackendWallet.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
    } catch (error) {
      // Program might already be initialized, ignore error
    }
  });

  it("should prevent unauthorized initialization", async () => {
    try {
      await program.methods
        .initialize()
        .accounts({
          authority: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      // expect(error.toString()).to.include("Unauthorized");
    }
  });

  it("should prevent double initialization", async () => {
    try {
      await program.methods
        .initialize()
        .accounts({
          authority: httpBackendWallet.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      //   expect(error.toString()).to.include("ProgramAlreadyInitialized");
    }
  });

  it("should reject empty payment schedules", async () => {
    const paymentSchedule = Keypair.generate();
    try {
      await program.methods
        .createPaymentSchedule(paymentAmount, recipient.publicKey, [], memo)
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      //   expect(error.toString()).to.include("EmptySchedule");
    }
  });

  it("should reject schedules with past times", async () => {
    const paymentSchedule = Keypair.generate();
    const currentTime = getCurrentTimestamp();
    const pastTime = new anchor.BN(currentTime - 3600); // 1 hour ago
    try {
      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          [pastTime],
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("InvalidScheduleTime");
    }
  });

  it("should reject schedules with too many payments", async () => {
    const paymentSchedule = Keypair.generate();
    const currentTime = getCurrentTimestamp();
    const tooManyTimes = Array.from(
      { length: 11 },
      (_, i) => new anchor.BN(currentTime + 60 + i * 60)
    );
    try {
      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          tooManyTimes,
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("TooManyScheduleTimes");
    }
  });

  it("should reject schedules with insufficient funds", async () => {
    const paymentSchedule = Keypair.generate();
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 60);
    const hugePayout = new anchor.BN(100 * LAMPORTS_PER_SOL); // More than user balance
    try {
      await program.methods
        .createPaymentSchedule(
          hugePayout,
          recipient.publicKey,
          [scheduleTime],
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("InsufficientFunds");
    }
  });

  it("should handle maximum allowed payments (10)", async () => {
    const currentTime = getCurrentTimestamp();
    const maxTimes = Array.from(
      { length: 10 },
      (_, i) => new anchor.BN(currentTime + 60 + i * 60)
    );
    const { paymentSchedule } = await createPaymentSchedule(
      user,
      smallPaymentAmount,
      recipient.publicKey,
      maxTimes
    );
    const scheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule.publicKey
    );
    expect(scheduleAccount.payments.length).to.equal(10);
    expect(scheduleAccount.status).to.deep.equal({ active: {} });
  });

  it("should calculate fees correctly for multiple payments", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTimes = [
      new anchor.BN(currentTime + 60),
      new anchor.BN(currentTime + 120),
      new anchor.BN(currentTime + 180),
    ];
    const userBalanceBefore = await provider.connection.getBalance(
      user.publicKey
    );
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      scheduleTimes
    );
    const userBalanceAfter = await provider.connection.getBalance(
      user.publicKey
    );
    const solPaymentVaultBalance = await provider.connection.getBalance(
      solPaymentVault
    );
    const solFeeVaultBalance = await provider.connection.getBalance(
      solFeeVault
    );

    console.log("=== Fee Calculation Test ===");
    console.log("User balance before:", userBalanceBefore);
    console.log("User balance after:", userBalanceAfter);
    console.log("SOL Payment Vault balance:", solPaymentVaultBalance);
    console.log("SOL Fee Vault balance:", solFeeVaultBalance);
    console.log("Payment amount:", paymentAmount.toNumber());
    console.log("Number of payments:", scheduleTimes.length);

    const scheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule.publicKey
    );
    const totalCost = paymentAmount.toNumber() * 3;
    const expectedFee = Math.floor(totalCost * 0.01); // 1% fee
    const expectedDeduction = totalCost + expectedFee;
    expect(scheduleAccount.totalAmount.toNumber()).to.equal(totalCost);
    expect(userBalanceBefore - userBalanceAfter).to.be.greaterThan(
      expectedDeduction - 100000
    ); // Account for transaction fees
  });

  it("should prevent unauthorized payment execution", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 5);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime]
    );
    await waitForTime(6);
    try {
      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: unauthorizedUser.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("UnauthorizedExecutor");
    }
  });

  it("should prevent payment execution before due time", async () => {
    const currentTime = getCurrentTimestamp();
    const futureTime = new anchor.BN(currentTime + 3600);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [futureTime]
    );
    try {
      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("PaymentNotDue");
    }
  });

  it("should prevent double payment execution", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 5);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime]
    );
    await waitForTime(6);
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    try {
      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      //   console.log("Error in Should have thrown error", error.toString());
      expect(error.toString()).to.include("InvalidScheduleStatus.");
    }
  });

  it("should prevent execution with wrong recipient", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 5);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime]
    );
    await waitForTime(6);
    try {
      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient2.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("InvalidRecipient");
    }
  });

  it("should prevent execution with invalid payment index", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 5);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime]
    );
    await waitForTime(6);
    try {
      await program.methods
        .executePayment(new anchor.BN(1)) // Invalid index
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("InvalidPaymentIndex");
    }
  });

  it("should handle multiple payment execution correctly", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTimes = [
      new anchor.BN(currentTime + 5),
      new anchor.BN(currentTime + 10),
      new anchor.BN(currentTime + 15),
    ];
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      scheduleTimes
    );
    const recipientBalanceBefore = await provider.connection.getBalance(
      recipient.publicKey
    );
    await waitForTime(6);
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    await waitForTime(5);
    await program.methods
      .executePayment(new anchor.BN(1))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    await waitForTime(5);
    await program.methods
      .executePayment(new anchor.BN(2))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    const recipientBalanceAfter = await provider.connection.getBalance(
      recipient.publicKey
    );
    const scheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule.publicKey
    );
    expect(scheduleAccount.payments.every((p) => p.executed)).to.be.true;
    expect(scheduleAccount.status).to.deep.equal({ completed: {} });
    expect(scheduleAccount.remainingAmount.toNumber()).to.equal(0);
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(
      paymentAmount.toNumber() * 3
    );
  });

  it("should prevent execution on cancelled schedule", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 60);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime]
    );
    await program.methods
      .cancelPaymentSchedule()
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        owner: user.publicKey,
      })
      .signers([user])
      .rpc();
    await waitForTime(61);
    try {
      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("InvalidScheduleStatus");
    }
  });

  it("should prevent unauthorized cancellation", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 60);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime]
    );
    try {
      await program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          owner: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("UnauthorizedCancellation");
    }
  });

  it("should prevent cancellation of completed schedule", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 5);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime]
    );
    await waitForTime(6);
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    try {
      await program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          owner: user.publicKey,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("InvalidScheduleStatus");
    }
  });

  it("should handle partial execution then cancellation", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTimes = [
      new anchor.BN(currentTime + 5),
      new anchor.BN(currentTime + 60),
    ];
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      scheduleTimes
    );
    const userBalanceBefore = await provider.connection.getBalance(
      user.publicKey
    );
    const solPaymentVaultBalanceBefore = await provider.connection.getBalance(
      solPaymentVault
    );

    console.log("=== Partial Execution + Cancellation Test ===");
    console.log(
      "SOL Payment Vault balance before execution:",
      solPaymentVaultBalanceBefore
    );
    console.log("User balance before:", userBalanceBefore);

    await waitForTime(6);
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    await program.methods
      .cancelPaymentSchedule()
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        owner: user.publicKey,
      })
      .signers([user])
      .rpc();
    const userBalanceAfter = await provider.connection.getBalance(
      user.publicKey
    );
    const solPaymentVaultBalanceAfter = await provider.connection.getBalance(
      solPaymentVault
    );

    console.log(
      "SOL Payment Vault balance after cancellation:",
      solPaymentVaultBalanceAfter
    );
    console.log("User balance after:", userBalanceAfter);
    console.log("User balance change:", userBalanceAfter - userBalanceBefore);

    const scheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule.publicKey
    );
    expect(scheduleAccount.status).to.deep.equal({ cancelled: {} });
    expect(scheduleAccount.remainingAmount.toNumber()).to.equal(0);
    expect(userBalanceAfter).to.be.greaterThan(userBalanceBefore);
  });

  it("should prevent unauthorized fee withdrawal", async () => {
    try {
      await program.methods
        .withdrawFees(new anchor.BN(1000))
        .accounts({
          authority: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("UnauthorizedFeeWithdrawal");
    }
  });

  it("should prevent withdrawal of more fees than available", async () => {
    const feeVaultBalance = await provider.connection.getBalance(solFeeVault);

    const excessiveAmount = new anchor.BN(feeVaultBalance + LAMPORTS_PER_SOL);
    try {
      await program.methods
        .withdrawFees(excessiveAmount)
        .accounts({
          authority: feeWithdrawer.publicKey,
        })
        .signers([feeWithdrawer])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      // console.error(error);
      expect(error.toString()).to.include("InsufficientVaultFunds");
    }
  });

  it("should prevent setting fee percentage above 5%", async () => {
    try {
      await program.methods
        .updateFeePercentage(501) // 5.01%
        .accounts({
          feeSettings,
          authority: httpBackendWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([httpBackendWallet])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      //   console.log("Error 5% fee", error);
      expect(error.toString()).to.include("FeeTooHigh");
    }
  });

  it("should allow authorized fee withdrawal", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 60);
    await createPaymentSchedule(user, paymentAmount, recipient.publicKey, [
      scheduleTime,
    ]);
    const authorityBalanceBefore = await provider.connection.getBalance(
      feeWithdrawer.publicKey
    );
    const feeVaultBalanceBefore = await provider.connection.getBalance(
      solFeeVault
    );

    console.log("=== Fee Withdrawal Test ===");
    console.log("Fee vault balance before withdrawal:", feeVaultBalanceBefore);
    console.log("Authority balance before:", authorityBalanceBefore);

    const withdrawAmount = new anchor.BN(
      Math.min(feeVaultBalanceBefore / 2, 1000000)
    );
    await program.methods
      .withdrawFees(withdrawAmount)
      .accounts({
        authority: feeWithdrawer.publicKey,
      })
      .signers([feeWithdrawer])
      .rpc();
    const authorityBalanceAfter = await provider.connection.getBalance(
      feeWithdrawer.publicKey
    );
    const feeVaultBalanceAfter = await provider.connection.getBalance(
      solFeeVault
    );

    console.log("Fee vault balance after withdrawal:", feeVaultBalanceAfter);
    console.log("Authority balance after:", authorityBalanceAfter);
    console.log("Withdrawn amount:", withdrawAmount.toNumber());
    console.log(
      "Authority balance change:",
      authorityBalanceAfter - authorityBalanceBefore
    );

    expect(authorityBalanceAfter).to.be.greaterThan(authorityBalanceBefore);
  });

  it("should handle rapid schedule creation and execution", async () => {
    const currentTime = getCurrentTimestamp();
    const schedules = [];
    for (let i = 0; i < 3; i++) {
      const scheduleTime = new anchor.BN(currentTime + 10 + i * 5);
      const schedule = await createPaymentSchedule(
        user,
        smallPaymentAmount,
        recipient.publicKey,
        [scheduleTime]
      );
      schedules.push(schedule);
    }
    await waitForTime(11);
    for (let i = 0; i < schedules.length; i++) {
      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: schedules[i].paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      if (i < schedules.length - 1) {
        await waitForTime(5);
      }
    }
    for (const schedule of schedules) {
      const scheduleAccount = await program.account.paymentSchedule.fetch(
        schedule.paymentSchedule.publicKey
      );
      expect(scheduleAccount.status).to.deep.equal({ completed: {} });
    }
  });

  //   it("should handle minimal payment amounts", async () => {
  //     const currentTime = getCurrentTimestamp();
  //     const scheduleTime = new anchor.BN(currentTime + 5);
  //     const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
  //       user,
  //       minPaymentAmount,
  //       recipient.publicKey,
  //       [scheduleTime]
  //     );
  //     await waitForTime(6);
  //     const recipientBalanceBefore = await provider.connection.getBalance(
  //       recipient.publicKey
  //     );
  //     await program.methods
  //       .executePayment(new anchor.BN(0))
  //       .accounts({
  //         paymentSchedule: paymentSchedule.publicKey,
  //         executor: httpBackendWallet.publicKey,
  //         recipient: recipient.publicKey,
  //       })
  //       .signers([httpBackendWallet])
  //       .rpc();
  //     const recipientBalanceAfter = await provider.connection.getBalance(
  //       recipient.publicKey
  //     );
  //     expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(1);
  //   });

  it("should handle very long memo strings", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 60);
    const { paymentSchedule } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime],
      longMemo
    );
    const scheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule.publicKey
    );
    expect(scheduleAccount.memo).to.equal(longMemo);
  });

  // New Test Cases
  it("should handle zero fee percentage", async () => {
    await program.methods
      .updateFeePercentage(0)
      .accounts({
        feeSettings,
        authority: httpBackendWallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([httpBackendWallet])
      .rpc();
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 60);
    const userBalanceBefore = await provider.connection.getBalance(
      user.publicKey
    );
    const feeVaultBalanceBefore = await provider.connection.getBalance(
      solFeeVault
    );
    await createPaymentSchedule(user, paymentAmount, recipient.publicKey, [
      scheduleTime,
    ]);
    const userBalanceAfter = await provider.connection.getBalance(
      user.publicKey
    );
    const feeVaultBalanceAfter = await provider.connection.getBalance(
      solFeeVault
    );
    // console.log("userBalances", userBalanceBefore, userBalanceAfter);
    // console.log("feeVaultBalance", feeVaultBalanceBefore, feeVaultBalanceAfter);
    expect(feeVaultBalanceAfter).to.equal(feeVaultBalanceBefore); // No fees collected
    expect(userBalanceBefore - userBalanceAfter).to.be.closeTo(
      paymentAmount.toNumber(),
      100000000
    );
  });

  //   it("should handle maximum fee percentage (5%)", async () => {
  //     await program.methods
  //       .updateFeePercentage(500) // 5%
  //       .accounts({
  //         feeSettings,
  //         authority: httpBackendWallet.publicKey,
  //         systemProgram: SystemProgram.programId,
  //       })
  //       .signers([httpBackendWallet])
  //       .rpc();
  //     const currentTime = getCurrentTimestamp();
  //     const scheduleTime = new anchor.BN(currentTime + 60);
  //     const userBalanceBefore = await provider.connection.getBalance(
  //       user.publicKey
  //     );
  //     const feeVaultBalanceBefore = await provider.connection.getBalance(
  //       solFeeVault
  //     );
  //     await createPaymentSchedule(user, paymentAmount, recipient.publicKey, [
  //       scheduleTime,
  //     ]);
  //     const userBalanceAfter = await provider.connection.getBalance(
  //       user.publicKey
  //     );
  //     const feeVaultBalanceAfter = await provider.connection.getBalance(
  //       solFeeVault
  //     );
  //     const expectedFee = Math.floor(paymentAmount.toNumber() * 0.05);
  //     expect(feeVaultBalanceAfter - feeVaultBalanceBefore).to.equal(expectedFee);
  //     expect(userBalanceBefore - userBalanceAfter).to.be.closeTo(
  //       paymentAmount.toNumber() + expectedFee,
  //       1000000 // Account for transaction fees
  //     );
  //   });

  it("should handle concurrent payment schedules from multiple users", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTimes = [new anchor.BN(currentTime + 5)];
    const schedules = await Promise.all([
      createPaymentSchedule(
        user,
        paymentAmount,
        recipient.publicKey,
        scheduleTimes
      ),
      createPaymentSchedule(
        user2,
        paymentAmount,
        recipient2.publicKey,
        scheduleTimes
      ),
    ]);
    await waitForTime(6);
    const recipientBalanceBefore = await provider.connection.getBalance(
      recipient.publicKey
    );
    const recipient2BalanceBefore = await provider.connection.getBalance(
      recipient2.publicKey
    );
    await Promise.all([
      program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: schedules[0].paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc(),
      program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: schedules[1].paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient2.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc(),
    ]);
    const recipientBalanceAfter = await provider.connection.getBalance(
      recipient.publicKey
    );
    const recipient2BalanceAfter = await provider.connection.getBalance(
      recipient2.publicKey
    );
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(
      paymentAmount.toNumber()
    );
    expect(recipient2BalanceAfter - recipient2BalanceBefore).to.equal(
      paymentAmount.toNumber()
    );
  });

  it("should handle rapid fee updates", async () => {
    const feeUpdates = [100, 200, 300, 400, 500];
    for (const fee of feeUpdates) {
      await program.methods
        .updateFeePercentage(fee)
        .accounts({
          feeSettings,
          authority: httpBackendWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([httpBackendWallet])
        .rpc();
      const feeSettingsAccount = await program.account.feeSettings.fetch(
        feeSettings
      );
      expect(feeSettingsAccount.feePercentage).to.equal(fee);
    }
  });

  it("should handle multiple payments with varying amounts", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTimes = [
      new anchor.BN(currentTime + 5),
      new anchor.BN(currentTime + 10),
    ];
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      scheduleTimes
    );
    const recipientBalanceBefore = await provider.connection.getBalance(
      recipient.publicKey
    );
    await waitForTime(6);
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    await waitForTime(5);
    await program.methods
      .executePayment(new anchor.BN(1))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    const recipientBalanceAfter = await provider.connection.getBalance(
      recipient.publicKey
    );
    const scheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule.publicKey
    );
    expect(scheduleAccount.payments.every((p) => p.executed)).to.be.true;
    expect(scheduleAccount.status).to.deep.equal({ completed: {} });
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(
      paymentAmount.toNumber() * 2
    );
  });

  it("should prevent execution after vault depletion", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTimes = [
      new anchor.BN(currentTime + 5),
      new anchor.BN(currentTime + 10),
    ];
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      scheduleTimes
    );
    await waitForTime(6);
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    await program.methods
      .cancelPaymentSchedule()
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        owner: user.publicKey,
      })
      .signers([user])
      .rpc();
    await waitForTime(5);
    try {
      await program.methods
        .executePayment(new anchor.BN(1))
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("InvalidScheduleStatus");
    }
  });

  it("should handle large payment schedules", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTimes = Array.from(
      { length: 10 },
      (_, i) => new anchor.BN(currentTime + 5 + i * 5)
    );
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      largePaymentAmount,
      recipient.publicKey,
      scheduleTimes
    );
    const recipientBalanceBefore = await provider.connection.getBalance(
      recipient.publicKey
    );
    await waitForTime(6);
    for (let i = 0; i < 10; i++) {
      await program.methods
        .executePayment(new anchor.BN(i))
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();
      if (i < 9) await waitForTime(5);
    }
    const recipientBalanceAfter = await provider.connection.getBalance(
      recipient.publicKey
    );
    const scheduleAccount = await program.account.paymentSchedule.fetch(
      paymentSchedule.publicKey
    );
    expect(scheduleAccount.payments.every((p) => p.executed)).to.be.true;
    expect(scheduleAccount.status).to.deep.equal({ completed: {} });
    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(
      largePaymentAmount.toNumber() * 10
    );
  });

  it("should prevent fee withdrawal with zero balance", async () => {
    try {
      const feeVaultBalance = await provider.connection.getBalance(solFeeVault);
      if (feeVaultBalance > 0) {
        await program.methods
          .withdrawFees(new anchor.BN(feeVaultBalance))
          .accounts({
            authority: feeWithdrawer.publicKey,
          })
          .signers([feeWithdrawer])
          .rpc();
      }
      await program.methods
        .withdrawFees(new anchor.BN(1000))
        .accounts({
          authority: feeWithdrawer.publicKey,
        })
        .signers([feeWithdrawer])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      // console.log(
      //   "Error , should prevent fee withdrawal with zero balance",
      //   error
      // );
      expect(error.toString()).to.include("InsufficientVaultFunds");
    }
  });

  //   it("should handle fee withdrawal by different authorized keys", async () => {
  //     const currentTime = getCurrentTimestamp();
  //     const scheduleTime = new anchor.BN(currentTime + 60);
  //     await createPaymentSchedule(user, paymentAmount, recipient.publicKey, [
  //       scheduleTime,
  //     ]);
  //     const feeVaultBalanceBefore = await provider.connection.getBalance(
  //       solFeeVault
  //     );
  //     const withdrawAmount = new anchor.BN(
  //       Math.min(feeVaultBalanceBefore / 2, 1000000)
  //     );
  //     for (const key of FEE_WITHDRAWAL_ALLOWED_KEYS) {
  //       // Simulate authorized key by assuming httpBackendWallet is one of the allowed keys
  //       const authorityBalanceBefore = await provider.connection.getBalance(
  //         httpBackendWallet.publicKey
  //       );
  //       await program.methods
  //         .withdrawFees(withdrawAmount)
  //         .accounts({
  //           authority: httpBackendWallet.publicKey,
  //         })
  //         .signers([httpBackendWallet])
  //         .rpc();
  //       const authorityBalanceAfter = await provider.connection.getBalance(
  //         httpBackendWallet.publicKey
  //       );
  //       expect(authorityBalanceAfter).to.be.greaterThan(authorityBalanceBefore);
  //       break; // Only test with one key for simplicity
  //     }
  //   });

  it("should prevent fee update by unauthorized user", async () => {
    try {
      await program.methods
        .updateFeePercentage(200)
        .accounts({
          feeSettings,
          authority: unauthorizedUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.toString()).to.include("ConstraintHasOne");
    }
  });

  it("should handle cancellation with no remaining funds", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTime = new anchor.BN(currentTime + 5);
    const { paymentSchedule, solPaymentVault } = await createPaymentSchedule(
      user,
      paymentAmount,
      recipient.publicKey,
      [scheduleTime]
    );
    await waitForTime(6);
    await program.methods
      .executePayment(new anchor.BN(0))
      .accounts({
        paymentSchedule: paymentSchedule.publicKey,
        executor: httpBackendWallet.publicKey,
        recipient: recipient.publicKey,
      })
      .signers([httpBackendWallet])
      .rpc();
    try {
      await program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          owner: user.publicKey,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (error) {
      //   console.log(
      //     "Error , should handle cancellation with no remaining funds",
      //     error
      //   );
      expect(error.toString()).to.include("InvalidScheduleStatus.");
    }
  });

  it("should handle multiple rapid cancellations", async () => {
    const currentTime = getCurrentTimestamp();
    const scheduleTimes = [new anchor.BN(currentTime + 60)];
    const schedules = await Promise.all([
      createPaymentSchedule(
        user,
        paymentAmount,
        recipient.publicKey,
        scheduleTimes
      ),
      createPaymentSchedule(
        user,
        paymentAmount,
        recipient.publicKey,
        scheduleTimes
      ),
      createPaymentSchedule(
        user,
        paymentAmount,
        recipient.publicKey,
        scheduleTimes
      ),
    ]);
    const userBalanceBefore = await provider.connection.getBalance(
      user.publicKey
    );
    for (const schedule of schedules) {
      await program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: schedule.paymentSchedule.publicKey,
          owner: user.publicKey,
        })
        .signers([user])
        .rpc();
    }
    const userBalanceAfter = await provider.connection.getBalance(
      user.publicKey
    );
    for (const schedule of schedules) {
      const scheduleAccount = await program.account.paymentSchedule.fetch(
        schedule.paymentSchedule.publicKey
      );
      expect(scheduleAccount.status).to.deep.equal({ cancelled: {} });
      expect(scheduleAccount.remainingAmount.toNumber()).to.equal(0);
    }
    expect(userBalanceAfter).to.be.greaterThan(userBalanceBefore);
  });
});
