import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AutoSol } from "../target/types/auto_sol";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

describe("auto-sol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AutoSol as Program<AutoSol>;

  let feeSettings: PublicKey;
  let solFeeVault: PublicKey;
  let authority: Keypair;
  let user: Keypair;
  let recipient: Keypair;
  let httpBackendWallet: Keypair;
  let unauthorizedUser: Keypair;

  const HTTP_BACKEND_WALLET = new PublicKey(
    "8dRCBu5V2v6JHR3HxN9zjN91WoX4FfGzgdM8nXawUbqt"
  );
  const FEE_WITHDRAWAL_ALLOWED_KEYS = [
    "FxfMxvBecat982M1DpeCwqWRRc4gk35UZH5bhaFqVoDX",
    "9KP44gv69EoXN2aB71u1HoYy5ZSZjXTpyYXygJ9phwCN",
    "BS5QbyrCvPreGPPQ7XzEkdpFk7J7LPd9RfYDF8rXmVm7",
    "68AzXw2QAhh6NkrH5bqvDn3hPGk1mix4ewFGQ7AoTpe1",
    "8dRCBu5V2v6JHR3HxN9zjN91WoX4FfGzgdM8nXawUbqt",
    "G8UmesEhavARgE6xTWbDq6iHvdp8W2yo4pbrW4jLsHxh",
  ].map((key) => new PublicKey(key));

  const paymentAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
  const memo = "Test payment schedule";

  const loadLocalWallet = (): Keypair => {
    const walletPath = path.join(os.homedir(), ".config", "solana", "id.json");
    const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(keypairData));
  };

  const getPDAs = () => {
    const [feeSettingsPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_fee_settings")],
      program.programId
    );
    const [solFeeVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_fee_vault")],
      program.programId
    );
    return { feeSettingsPDA, solFeeVaultPDA };
  };

  const getPaymentVaultPDA = (paymentScheduleKey: PublicKey) => {
    const [solPaymentVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("sol_vault"), paymentScheduleKey.toBuffer()],
      program.programId
    );
    return solPaymentVaultPDA;
  };

  beforeEach(async () => {
    user = Keypair.generate();
    recipient = Keypair.generate();
    unauthorizedUser = Keypair.generate();
    httpBackendWallet = loadLocalWallet();
    authority = loadLocalWallet();

    if (!httpBackendWallet.publicKey.equals(HTTP_BACKEND_WALLET)) {
      throw new Error(
        `Local wallet ${httpBackendWallet.publicKey.toString()} doesn't match expected ${HTTP_BACKEND_WALLET.toString()}`
      );
    }

    const pdas = getPDAs();
    feeSettings = pdas.feeSettingsPDA;
    solFeeVault = pdas.solFeeVaultPDA;

    const airdropAmount = 10 * LAMPORTS_PER_SOL;
    const airdropPromises = [
      provider.connection.requestAirdrop(authority.publicKey, airdropAmount),
      provider.connection.requestAirdrop(user.publicKey, airdropAmount),
      provider.connection.requestAirdrop(
        httpBackendWallet.publicKey,
        airdropAmount
      ),
      provider.connection.requestAirdrop(
        unauthorizedUser.publicKey,
        airdropAmount
      ),
    ];

    await Promise.all(airdropPromises);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  describe("Initialize Program", () => {
    it("should initialize successfully", async () => {
      await program.methods
        .initialize()
        .accounts({
          authority: httpBackendWallet.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();

      const feeSettingsAccount = await program.account.feeSettings.fetch(
        feeSettings
      );
      expect(feeSettingsAccount.authority.toString()).to.equal(
        httpBackendWallet.publicKey.toString()
      );
      expect(feeSettingsAccount.feePercentage).to.equal(100); // 1%
      expect(feeSettingsAccount.httpBackendWallet.toString()).to.equal(
        HTTP_BACKEND_WALLET.toString()
      );
      expect(feeSettingsAccount.initialized).to.be.true;
      expect(feeSettingsAccount.feeWithdrawalAllowedKeys.length).to.equal(6);

      // Check that the fee vault exists (it's a SystemAccount, so we just check balance)
      // const solFeeVaultAccount = await provider.connection.getAccountInfo(
      //   solFeeVault
      // );
      // console.log("Account info", solFeeVaultAccount);
      // expect(solFeeVaultAccount).to.not.be.null;
    });

    it("should fail if already initialized", async () => {
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
        expect(error.toString()).to.include("already in use");
      }
    });
  });

  describe("Payment Schedule", () => {
    let paymentSchedule: Keypair;
    let solPaymentVault: PublicKey;

    beforeEach(async () => {
      paymentSchedule = Keypair.generate();
      solPaymentVault = getPaymentVaultPDA(paymentSchedule.publicKey);
    });

    it("should create schedule successfully", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const scheduleTimes = [
        new anchor.BN(currentTime + 60), // 1 min
        new anchor.BN(currentTime + 120), // 2
      ];

      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          scheduleTimes,
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();

      const scheduleAccount = await program.account.paymentSchedule.fetch(
        paymentSchedule.publicKey
      );
      expect(scheduleAccount.owner.toString()).to.equal(
        user.publicKey.toString()
      );
      expect(scheduleAccount.recipient.toString()).to.equal(
        recipient.publicKey.toString()
      );
      expect(scheduleAccount.payments.length).to.equal(2);
      expect(scheduleAccount.status).to.deep.equal({ active: {} });
      expect(scheduleAccount.memo).to.equal(memo);
      expect(scheduleAccount.totalAmount.toNumber()).to.equal(
        paymentAmount.toNumber() * 2
      );
      expect(scheduleAccount.remainingAmount.toNumber()).to.equal(
        paymentAmount.toNumber() * 2
      );

      const paymentVaultBalance = await provider.connection.getBalance(
        solPaymentVault
      );
      expect(paymentVaultBalance).to.equal(paymentAmount.toNumber() * 2);

      const feeVaultBalance = await provider.connection.getBalance(solFeeVault);
      const expectedFee = (paymentAmount.toNumber() * 2 * 100) / 10000; // 1% fee
      expect(feeVaultBalance).to.be.greaterThan(expectedFee - 1000); // Allow for small rounding
    });

    it("should execute payment when due", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const scheduleTimes = [new anchor.BN(currentTime + 5)]; // 5 seconds

      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          scheduleTimes,
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();

      await new Promise((resolve) => setTimeout(resolve, 6000));

      const recipientBalanceBefore = await provider.connection.getBalance(
        recipient.publicKey
      );

      await program.methods
        .executePayment(new anchor.BN(0))
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          executor: httpBackendWallet.publicKey,
          recipient: recipient.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();

      const scheduleAccount = await program.account.paymentSchedule.fetch(
        paymentSchedule.publicKey
      );
      const recipientBalanceAfter = await provider.connection.getBalance(
        recipient.publicKey
      );

      expect(scheduleAccount.payments[0].executed).to.be.true;
      expect(scheduleAccount.status).to.deep.equal({ completed: {} });
      expect(recipientBalanceAfter).to.equal(
        recipientBalanceBefore + paymentAmount.toNumber()
      );
    });

    it("should cancel schedule and refund", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const scheduleTimes = [new anchor.BN(currentTime + 60)];

      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          scheduleTimes,
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();

      const userBalanceBefore = await provider.connection.getBalance(
        user.publicKey
      );

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
      const scheduleAccount = await program.account.paymentSchedule.fetch(
        paymentSchedule.publicKey
      );

      expect(scheduleAccount.status).to.deep.equal({ cancelled: {} });
      expect(scheduleAccount.remainingAmount.toNumber()).to.equal(0);
      expect(userBalanceAfter).to.be.greaterThan(userBalanceBefore);
    });

    it("should fail to execute payment too early", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const scheduleTimes = [new anchor.BN(currentTime + 3600)]; // 1 hour

      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          scheduleTimes,
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
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
        expect(error.toString()).to.include("PaymentNotDue");
      }
    });

    it("should fail execution with unauthorized executor", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const scheduleTimes = [new anchor.BN(currentTime + 5)];

      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          scheduleTimes,
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();

      await new Promise((resolve) => setTimeout(resolve, 6000));

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
  });

  describe("Fee Management", () => {
    it("should update fee percentage", async () => {
      const newFeePercentage = 200; // 2%

      await program.methods
        .updateFeePercentage(newFeePercentage)
        .accounts({
          feeSettings,
          authority: httpBackendWallet.publicKey,
        })
        .signers([httpBackendWallet])
        .rpc();

      const feeSettingsAccount = await program.account.feeSettings.fetch(
        feeSettings
      );
      expect(feeSettingsAccount.feePercentage).to.equal(newFeePercentage);
    });

    it("should prevent unauthorized fee updates", async () => {
      try {
        await program.methods
          .updateFeePercentage(200)
          .accounts({
            feeSettings,
            authority: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.toString()).to.include("ConstraintHasOne");
      }
    });

    it("should prevent setting fee too high", async () => {
      try {
        await program.methods
          .updateFeePercentage(600) // 6% - above 5% limit
          .accounts({
            feeSettings,
            authority: httpBackendWallet.publicKey,
          })
          .signers([httpBackendWallet])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error.toString()).to.include("FeeTooHigh");
      }
    });

    // it("should withdraw fees by authorized wallet", async () => {
    //   // First create a payment schedule to generate fees
    //   const paymentSchedule = Keypair.generate();
    //   const solPaymentVault = getPaymentVaultPDA(paymentSchedule.publicKey);
    //   const currentTime = Math.floor(Date.now() / 1000);
    //   const scheduleTimes = [new anchor.BN(currentTime + 60)];

    //   await program.methods
    //     .createPaymentSchedule(
    //       paymentAmount,
    //       recipient.publicKey,
    //       scheduleTimes,
    //       memo
    //     )
    //     .accounts({
    //       paymentSchedule: paymentSchedule.publicKey,
    //       user: user.publicKey,
    //     })
    //     .signers([paymentSchedule, user])
    //     .rpc();

    //   // Get authorized withdrawal key
    //   const authorizedKey = Keypair.fromSecretKey(httpBackendWallet.secretKey);
    //   const balanceBefore = await provider.connection.getBalance(
    //     authorizedKey.publicKey
    //   );
    //   const feeVaultBalance = await provider.connection.getBalance(solFeeVault);

    //   // Withdraw a small amount
    //   const withdrawAmount = Math.floor(feeVaultBalance * 0.5);

    //   await program.methods
    //     .withdrawFees(new anchor.BN(withdrawAmount))
    //     .accounts({
    //       authority: authorizedKey.publicKey,
    //     })
    //     .signers([authorizedKey])
    //     .rpc();

    //   const balanceAfter = await provider.connection.getBalance(
    //     authorizedKey.publicKey
    //   );
    //   expect(balanceAfter).to.be.greaterThan(balanceBefore);
    // });

    it("should fail fee withdrawal by unauthorized wallet", async () => {
      try {
        await program.methods
          .withdrawFees(new anchor.BN(1000000))
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
  });

  describe("Error Cases", () => {
    it("should reject empty schedules", async () => {
      const paymentSchedule = Keypair.generate();
      const solPaymentVault = getPaymentVaultPDA(paymentSchedule.publicKey);

      try {
        await program.methods
          .createPaymentSchedule(
            paymentAmount,
            recipient.publicKey,
            [], // Empty schedule
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
        expect(error.toString()).to.include("EmptySchedule");
      }
    });

    it("should reject past-due schedules", async () => {
      const paymentSchedule = Keypair.generate();
      const solPaymentVault = getPaymentVaultPDA(paymentSchedule.publicKey);
      const currentTime = Math.floor(Date.now() / 1000);

      try {
        await program.methods
          .createPaymentSchedule(
            paymentAmount,
            recipient.publicKey,
            [new anchor.BN(currentTime - 60)], // Past time
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

    it("should reject too many schedule times", async () => {
      const paymentSchedule = Keypair.generate();
      const solPaymentVault = getPaymentVaultPDA(paymentSchedule.publicKey);
      const currentTime = Math.floor(Date.now() / 1000);

      // Create 11 schedule times (more than the 10 limit)
      const scheduleTimes = Array.from(
        { length: 11 },
        (_, i) => new anchor.BN(currentTime + 60 + i * 60)
      );

      try {
        await program.methods
          .createPaymentSchedule(
            paymentAmount,
            recipient.publicKey,
            scheduleTimes,
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

    it("should fail to cancel already cancelled schedule", async () => {
      const paymentSchedule = Keypair.generate();
      const solPaymentVault = getPaymentVaultPDA(paymentSchedule.publicKey);
      const currentTime = Math.floor(Date.now() / 1000);
      const scheduleTimes = [new anchor.BN(currentTime + 60)];

      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          scheduleTimes,
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();

      await program.methods
        .cancelPaymentSchedule()
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          owner: user.publicKey,
        })
        .signers([user])
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

    it("should fail cancellation by non-owner", async () => {
      const paymentSchedule = Keypair.generate();
      const solPaymentVault = getPaymentVaultPDA(paymentSchedule.publicKey);
      const currentTime = Math.floor(Date.now() / 1000);
      const scheduleTimes = [new anchor.BN(currentTime + 60)];

      await program.methods
        .createPaymentSchedule(
          paymentAmount,
          recipient.publicKey,
          scheduleTimes,
          memo
        )
        .accounts({
          paymentSchedule: paymentSchedule.publicKey,
          user: user.publicKey,
        })
        .signers([paymentSchedule, user])
        .rpc();

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
  });
});
