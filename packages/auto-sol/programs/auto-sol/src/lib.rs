use anchor_lang::prelude::*;
use std::str::FromStr;

declare_id!("98g9uR7WZqinAnSeUgB5nUw3pbR6sNwFuYWW78yPHtva");

const HTTP_BACKEND_WALLET: &str = "8dRCBu5V2v6JHR3HxN9zjN91WoX4FfGzgdM8nXawUbqt";
const FEE_WITHDRAWAL_ALLOWED_KEYS: [&str; 6] = [
    "FxfMxvBecat982M1DpeCwqWRRc4gk35UZH5bhaFqVoDX",
    "9KP44gv69EoXN2aB71u1HoYy5ZSZjXTpyYXygJ9phwCN",
    "BS5QbyrCvPreGPPQ7XzEkdpFk7J7LPd9RfYDF8rXmVm7",
    "68AzXw2QAhh6NkrH5bqvDn3hPGk1mix4ewFGQ7AoTpe1",
    "G8UmesEhavARgE6xTWbDq6iHvdp8W2yo4pbrW4jLsHxh",
    "8dRCBu5V2v6JHR3HxN9zjN91WoX4FfGzgdM8nXawUbqt",
];


const GLOBAL_FEE_SETTINGS_SEED: &[u8] = b"global_fee_settings";
const GLOBAL_FEE_VAULT_SEED: &[u8] = b"global_fee_vault";

#[program]
pub mod auto_sol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == Pubkey::from_str(HTTP_BACKEND_WALLET).unwrap(),
            ErrorCode::Unauthorized
        );
     
       
        let fee_settings = &mut ctx.accounts.fee_settings;
        fee_settings.authority = ctx.accounts.authority.key();
        fee_settings.fee_percentage = 100; // 1% in basis points (100 = 1.00%)
        fee_settings.http_backend_wallet = Pubkey::from_str(HTTP_BACKEND_WALLET).unwrap();
        fee_settings.initialized = true;

        for key_str in FEE_WITHDRAWAL_ALLOWED_KEYS.iter() {
            let pubkey = Pubkey::from_str(key_str).unwrap();
            fee_settings.fee_withdrawal_allowed_keys.push(pubkey);
            msg!("- Added Withdrawal Key: {}", pubkey);
        }

        Ok(())
    }

    pub fn create_payment_schedule(
        ctx: Context<CreatePaymentSchedule>,
        payment_amount: u64,
        recipient: Pubkey,
        schedule_times: Vec<i64>,
        memo: String,
    ) -> Result<()> {
        if schedule_times.len() > 10 {
            return Err(error!(ErrorCode::TooManyScheduleTimes));
        }
        require!(!schedule_times.is_empty(), ErrorCode::EmptySchedule);

        let payment_schedule = &mut ctx.accounts.payment_schedule;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        // Validate that all scheduled times are in the future
        for &time in schedule_times.iter() {
            require!(time > current_time, ErrorCode::InvalidScheduleTime);
        }

        // Calculate total amount needed for all payments
        let total_amount = payment_amount * (schedule_times.len() as u64);

        // Calculate fee amount
        let fee_settings = &ctx.accounts.fee_settings;
        let fee_amount = (total_amount * fee_settings.fee_percentage as u64) / 10000;
        let deposit_amount = total_amount + fee_amount;

        // Check if user has enough SOL
        require!(
            ctx.accounts.user.lamports() >= deposit_amount + 100000, // Adding some for rent exempt
            ErrorCode::InsufficientFunds
        );

        // Initialize payment schedule
        payment_schedule.owner = ctx.accounts.user.key();
        payment_schedule.total_amount = total_amount;
        payment_schedule.remaining_amount = total_amount;
        payment_schedule.payment_amount = payment_amount;
        payment_schedule.recipient = recipient;
        payment_schedule.created_at = current_time;
        payment_schedule.memo = memo;
        payment_schedule.status = ScheduleStatus::Active;

        // Initialize payments
        payment_schedule.payments = schedule_times
            .iter()
            .map(|&time| Payment {
                scheduled_time: time,
                executed: false,
                execution_time: 0,
                tx_signature: None,
            }).collect();

        // Transfer SOL to payment vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.sol_payment_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, total_amount)?;

        // Transfer fee to global fee vault (simple PDA)
        let fee_cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.sol_fee_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(fee_cpi_context, fee_amount)?;

        emit!(PaymentScheduleCreatedEvent {
            schedule_id: payment_schedule.key(),
            owner: payment_schedule.owner,
            recipient: payment_schedule.recipient,
            total_amount: payment_schedule.total_amount,
            payment_amount: payment_schedule.payment_amount,
            payment_count: payment_schedule.payments.len() as u64,
            created_at: payment_schedule.created_at,
        });

        Ok(())
    }

    pub fn execute_payment(ctx: Context<ExecutePayment>, payment_index: u64) -> Result<()> {
        // Only HTTP backend wallet can execute payments
        require!(
            ctx.accounts.executor.key() == ctx.accounts.fee_settings.http_backend_wallet,
            ErrorCode::UnauthorizedExecutor
        );

        let payment_schedule = &mut ctx.accounts.payment_schedule;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        // Validate payment schedule is active
        require!(
            payment_schedule.status == ScheduleStatus::Active,
            ErrorCode::InvalidScheduleStatus
        );

        // Validate payment index
        require!(
            payment_index < payment_schedule.payments.len() as u64,
            ErrorCode::InvalidPaymentIndex
        );

        // Get the payment to execute
        let payment = &payment_schedule.payments[payment_index as usize];

        // Check if payment is already executed
        require!(!payment.executed, ErrorCode::PaymentAlreadyExecuted);

        // Check if it's time to execute the payment
        require!(
            current_time >= payment.scheduled_time,
            ErrorCode::PaymentNotDue
        );

        // Check if there are sufficient funds in the vault
        require!(
            payment_schedule.remaining_amount >= payment_schedule.payment_amount,
            ErrorCode::InsufficientVaultFunds
        );

        // Validate recipient matches schedule
        require!(
            ctx.accounts.recipient.key() == payment_schedule.recipient,
            ErrorCode::InvalidRecipient
        );

        // Store the payment amount for later use
        let payment_amount = payment_schedule.payment_amount;
        let schedule_key = payment_schedule.key();

        // Prepare PDA signing for SOL payment vault
        let vault_seed = [b"sol_vault".as_ref(), schedule_key.as_ref()];
        let (_vault_authority, bump) = Pubkey::find_program_address(&vault_seed, &crate::ID);
        let seeds = &[b"sol_vault".as_ref(), schedule_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        // Transfer SOL from payment vault to recipient using CPI
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.sol_payment_vault.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
            signer,
        );
        anchor_lang::system_program::transfer(cpi_context, payment_amount)?;

        // Now we can safely update the payment
        payment_schedule.payments[payment_index as usize].executed = true;
        payment_schedule.payments[payment_index as usize].execution_time = current_time;
        payment_schedule.payments[payment_index as usize].tx_signature =
            Some(ctx.accounts.executor.key());

        // Update schedule status
        payment_schedule.remaining_amount = payment_schedule
            .remaining_amount
            .checked_sub(payment_amount)
            .unwrap();

        // Check if all payments are executed
        let all_executed = payment_schedule.payments.iter().all(|p| p.executed);
        if all_executed {
            payment_schedule.status = ScheduleStatus::Completed;
        }

        emit!(PaymentExecutedEvent {
            schedule_id: schedule_key,
            payment_index,
            amount: payment_amount,
            recipient: payment_schedule.recipient,
            executed_at: current_time,
            executed_by: ctx.accounts.executor.key(),
        });

        Ok(())
    }

    pub fn cancel_payment_schedule(ctx: Context<CancelPaymentSchedule>) -> Result<()> {
        let payment_schedule = &mut ctx.accounts.payment_schedule;

        // Validate payment schedule is active and owned by caller
        require!(
            payment_schedule.status == ScheduleStatus::Active,
            ErrorCode::InvalidScheduleStatus
        );

        // Validate owner
        require!(
            payment_schedule.owner == ctx.accounts.owner.key(),
            ErrorCode::UnauthorizedCancellation
        );

        // Calculate the amount to refund (remaining unexecuted payments)
        let refund_amount = payment_schedule.remaining_amount;
        require!(refund_amount > 0, ErrorCode::NoRemainingFunds);

        // Prepare PDA signing for SOL vault
        let schedule_key = payment_schedule.key();
        let vault_seed = [b"sol_vault".as_ref(), schedule_key.as_ref()];
        let (_vault_authority, bump) = Pubkey::find_program_address(&vault_seed, &crate::ID);
        let seeds = &[b"sol_vault".as_ref(), schedule_key.as_ref(), &[bump]];
        let signer = &[&seeds[..]];

        // Transfer SOL from payment vault back to owner using CPI
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.sol_payment_vault.to_account_info(),
                to: ctx.accounts.owner.to_account_info(),
            },
            signer,
        );
        anchor_lang::system_program::transfer(cpi_context, refund_amount)?;

        // Update schedule status
        payment_schedule.status = ScheduleStatus::Cancelled;
        payment_schedule.remaining_amount = 0;

        emit!(PaymentScheduleCancelledEvent {
            schedule_id: payment_schedule.key(),
            owner: payment_schedule.owner,
            refund_amount,
            cancelled_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
        // Verify the withdrawer is authorized
        let fee_settings = &ctx.accounts.fee_settings;
        let authorized = fee_settings
            .fee_withdrawal_allowed_keys
            .iter()
            .any(|key| *key == ctx.accounts.authority.key());

        require!(authorized, ErrorCode::UnauthorizedFeeWithdrawal);

        // Check if there are enough SOL in the fee vault
        require!(
            ctx.accounts.sol_fee_vault.to_account_info().lamports() >= amount,
            ErrorCode::InsufficientVaultFunds
        );

        // Prepare PDA signing for SOL fee vault - simple PDA without bump from account
        let seeds = &[GLOBAL_FEE_VAULT_SEED, &[ctx.bumps.sol_fee_vault]];
        let signer = &[&seeds[..]];

        // Transfer SOL from fee vault to withdrawer using CPI with PDA signing
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.sol_fee_vault.to_account_info(),
                to: ctx.accounts.authority.to_account_info(),
            },
            signer,
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        emit!(FeesWithdrawnEvent {
            amount,
            withdrawn_by: ctx.accounts.authority.key(),
            withdrawn_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_fee_percentage(
        ctx: Context<UpdateFeePercentage>,
        new_fee_percentage: u16,
    ) -> Result<()> {
        // Cap fee at 5%
        require!(new_fee_percentage <= 500, ErrorCode::FeeTooHigh);

        let fee_settings = &mut ctx.accounts.fee_settings;
        let old_percentage = fee_settings.fee_percentage;
        fee_settings.fee_percentage = new_fee_percentage;

        emit!(FeePercentageUpdatedEvent {
            old_percentage,
            new_percentage: new_fee_percentage,
            updated_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// Data Structures
#[account]
pub struct FeeSettings {
    pub authority: Pubkey,
    pub fee_percentage: u16,
    pub http_backend_wallet: Pubkey,
    pub fee_withdrawal_allowed_keys: Vec<Pubkey>,
    pub initialized: bool,
}

impl FeeSettings {
    pub const SPACE: usize = 32 + 2 + 32 + (4 + 32 * 6) + 1; // Authority + fee% + http_wallet + 6 withdrawal keys + initialized
}

#[account]
pub struct PaymentSchedule {
    pub owner: Pubkey,
    pub total_amount: u64,
    pub remaining_amount: u64,
    pub payment_amount: u64,
    pub recipient: Pubkey,
    pub payments: Vec<Payment>,
    pub created_at: i64,
    pub status: ScheduleStatus,
    pub memo: String,
}

impl PaymentSchedule {
    pub const SPACE: usize = 32 + 8 + 8 + 8 + 32 + (4 + 10 * Payment::SPACE) + 8 + 1 + (4 + 100);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Payment {
    pub scheduled_time: i64,
    pub executed: bool,
    pub execution_time: i64,
    pub tx_signature: Option<Pubkey>,
}

impl Payment {
    pub const SPACE: usize = 8 + 1 + 8 + (1 + 32);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum ScheduleStatus {
    Active,
    Completed,
    Cancelled,
}

impl Default for ScheduleStatus {
    fn default() -> Self {
        ScheduleStatus::Active
    }
}

// Context Structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + FeeSettings::SPACE,
        seeds = [GLOBAL_FEE_SETTINGS_SEED],
        bump
    )]
    pub fee_settings: Account<'info, FeeSettings>,

    /// CHECK: This is the global SOL fee vault PDA - validated by seeds constraint
    /// Simple PDA without data structure for easy SOL transfers
    #[account(
        mut,
        seeds = [GLOBAL_FEE_VAULT_SEED],
        bump
    )]
    pub sol_fee_vault: SystemAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePaymentSchedule<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + PaymentSchedule::SPACE
    )]
    pub payment_schedule: Account<'info, PaymentSchedule>,

    #[account(
        seeds = [GLOBAL_FEE_SETTINGS_SEED],
        bump
    )]
    pub fee_settings: Account<'info, FeeSettings>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: This is the SOL payment vault PDA - validated by seeds constraint
    #[account(
        mut,
        seeds = [b"sol_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub sol_payment_vault: SystemAccount<'info>,

    /// CHECK: This is the global SOL fee vault PDA - validated by seeds constraint
    #[account(
        mut,
        seeds = [GLOBAL_FEE_VAULT_SEED],
        bump
    )]
    pub sol_fee_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(mut)]
    pub payment_schedule: Account<'info, PaymentSchedule>,

    #[account(
        seeds = [GLOBAL_FEE_SETTINGS_SEED],
        bump
    )]
    pub fee_settings: Account<'info, FeeSettings>,

    #[account(mut)]
    pub executor: Signer<'info>,

    /// CHECK: This is the payment recipient - validated in function logic
    #[account(mut)]
    pub recipient: SystemAccount<'info>,

    /// CHECK: This is the SOL payment vault PDA - validated by seeds constraint
    #[account(
        mut,
        seeds = [b"sol_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub sol_payment_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelPaymentSchedule<'info> {
    #[account(mut)]
    pub payment_schedule: Account<'info, PaymentSchedule>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: This is the SOL payment vault PDA - validated by seeds constraint
    #[account(
        mut,
        seeds = [b"sol_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub sol_payment_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(
        seeds = [GLOBAL_FEE_SETTINGS_SEED],
        bump
    )]
    pub fee_settings: Account<'info, FeeSettings>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: This is the global SOL fee vault PDA - validated by seeds constraint
    /// Simple PDA without data structure for easy SOL transfers
    #[account(
        mut,
        seeds = [GLOBAL_FEE_VAULT_SEED],
        bump
    )]
    pub sol_fee_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateFeePercentage<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_FEE_SETTINGS_SEED],
        bump,
        has_one = authority
    )]
    pub fee_settings: Account<'info, FeeSettings>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[event]
pub struct PaymentScheduleCreatedEvent {
    pub schedule_id: Pubkey,
    pub owner: Pubkey,
    pub recipient: Pubkey,
    pub total_amount: u64,
    pub payment_amount: u64,
    pub payment_count: u64,
    pub created_at: i64,
}

#[event]
pub struct PaymentExecutedEvent {
    pub schedule_id: Pubkey,
    pub payment_index: u64,
    pub amount: u64,
    pub recipient: Pubkey,
    pub executed_at: i64,
    pub executed_by: Pubkey,
}

#[event]
pub struct PaymentScheduleCancelledEvent {
    pub schedule_id: Pubkey,
    pub owner: Pubkey,
    pub refund_amount: u64,
    pub cancelled_at: i64,
}

#[event]
pub struct FeesWithdrawnEvent {
    pub amount: u64,
    pub withdrawn_by: Pubkey,
    pub withdrawn_at: i64,
}

#[event]
pub struct FeePercentageUpdatedEvent {
    pub old_percentage: u16,
    pub new_percentage: u16,
    pub updated_at: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Payment schedule cannot be empty")]
    EmptySchedule,
    #[msg("Schedule time must be in the future")]
    InvalidScheduleTime,
    #[msg("Insufficient funds for scheduled payments and fees")]
    InsufficientFunds,
    #[msg("Payment schedule is not active")]
    InvalidScheduleStatus,
    #[msg("Invalid payment index")]
    InvalidPaymentIndex,
    #[msg("Payment has already been executed")]
    PaymentAlreadyExecuted,
    #[msg("Payment is not due yet")]
    PaymentNotDue,
    #[msg("Insufficient funds in payment vault")]
    InsufficientVaultFunds,
    #[msg("No remaining funds to refund")]
    NoRemainingFunds,
    #[msg("Fee percentage cannot exceed 5%")]
    FeeTooHigh,
    #[msg("Only HTTP backend wallet can execute payments")]
    UnauthorizedExecutor,
    #[msg("Only authorized wallets can withdraw fees")]
    UnauthorizedFeeWithdrawal,
    #[msg("Too many schedule times provided")]
    TooManyScheduleTimes,
    #[msg("Program is already initialized")]
    ProgramAlreadyInitialized,
    #[msg("Invalid recipient for payment")]
    InvalidRecipient,
    #[msg("Unauthorized to cancel payment schedule")]
    UnauthorizedCancellation,
    #[msg("Unauthorized access")]
    Unauthorized,
}