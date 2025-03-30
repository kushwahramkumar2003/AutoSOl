use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("sg8bwyw6qvK923nNjieJFcJVrwCGWo3XBJGkC1fkt9Z");

#[program]
pub mod auto_sol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let fee_vault = &mut ctx.accounts.fee_vault;
        fee_vault.authority = ctx.accounts.authority.key();
        fee_vault.fee_percentage = 100; // 1% in basis points (100 = 1.00%)
        Ok(())
    }

    pub fn create_payment_schedule(
        ctx: Context<CreatePaymentSchedule>,
        payment_amount: u64,
        recipient: Pubkey,
        schedule_times: Vec<i64>,
        memo: String,
    ) -> Result<()> {
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
        let fee_vault = &ctx.accounts.fee_vault;
        let fee_amount = (total_amount * fee_vault.fee_percentage as u64) / 10000;
        let deposit_amount = total_amount + fee_amount;

        // Check if user has enough funds
        let user_token_account = &ctx.accounts.user_token_account;
        require!(
            user_token_account.amount >= deposit_amount,
            ErrorCode::InsufficientFunds
        );

        // Transfer tokens from user to payment vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.payment_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            total_amount,
        )?;

        // Transfer fee to fee vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.fee_vault_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            fee_amount,
        )?;

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
            })
            .collect();

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

        // Store the payment amount for later use
        let payment_amount = payment_schedule.payment_amount;
        let schedule_key = payment_schedule.key();

        // Transfer tokens from payment vault to recipient
        let seeds = &[schedule_key.as_ref(), &[ctx.bumps.payment_vault_authority]];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payment_vault.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.payment_vault_authority.to_account_info(),
                },
                signer,
            ),
            payment_amount,
        )?;

        // Now we can safely update the payment
        payment_schedule.payments[payment_index as usize].executed = true;
        payment_schedule.payments[payment_index as usize].execution_time = current_time;
        payment_schedule.payments[payment_index as usize].tx_signature =
            Some(ctx.accounts.keeper.key());

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
            executed_by: ctx.accounts.keeper.key(),
        });

        Ok(())
    }
    pub fn cancel_payment_schedule(ctx: Context<CancelPaymentSchedule>) -> Result<()> {
        let payment_schedule = &mut ctx.accounts.payment_schedule;

        // Validate payment schedule is active
        require!(
            payment_schedule.status == ScheduleStatus::Active,
            ErrorCode::InvalidScheduleStatus
        );

        // Calculate the amount to refund (remaining unexecuted payments)
        let refund_amount = payment_schedule.remaining_amount;
        require!(refund_amount > 0, ErrorCode::NoRemainingFunds);

        // Transfer tokens from payment vault back to owner
        let seeds = &[
            payment_schedule.to_account_info().key.as_ref(),
            &[ctx.bumps.payment_vault_authority],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.payment_vault.to_account_info(),
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.payment_vault_authority.to_account_info(),
                },
                signer,
            ),
            refund_amount,
        )?;

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

    pub fn update_fee_percentage(
        ctx: Context<UpdateFeePercentage>,
        new_fee_percentage: u16,
    ) -> Result<()> {
        // Cap fee at 5%
        require!(new_fee_percentage <= 500, ErrorCode::FeeTooHigh);

        let fee_vault = &mut ctx.accounts.fee_vault;
        fee_vault.fee_percentage = new_fee_percentage;

        emit!(FeePercentageUpdatedEvent {
            old_percentage: fee_vault.fee_percentage,
            new_percentage: new_fee_percentage,
            updated_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + FeeVault::SPACE
    )]
    pub fee_vault: Account<'info, FeeVault>,

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

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    // Add the mint account explicitly
    pub mint: Account<'info, anchor_spl::token::Mint>,

    #[account(
        init,
        payer = user,
        token::mint = mint, // Reference the mint account directly
        token::authority = payment_vault_authority,
        seeds = [payment_schedule.key().as_ref(), b"vault"],
        bump
    )]
    pub payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA derived from payment_schedule
    #[account(
        seeds = [payment_schedule.key().as_ref()],
        bump
    )]
    pub payment_vault_authority: UncheckedAccount<'info>,

    pub fee_vault: Account<'info, FeeVault>,

    #[account(
        mut,
        constraint = fee_vault_token_account.owner == fee_vault.authority,
        constraint = fee_vault_token_account.mint == mint.key() // Use the mint key directly
    )]
    pub fee_vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(mut)]
    pub payment_schedule: Account<'info, PaymentSchedule>,

    #[account(
        mut,
        seeds = [payment_schedule.key().as_ref(), b"vault"],
        bump
    )]
    pub payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA derived from payment_schedule
    #[account(
        seeds = [payment_schedule.key().as_ref()],
        bump
    )]
    pub payment_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = recipient_token_account.owner == payment_schedule.recipient,
        constraint = recipient_token_account.mint == payment_vault.mint
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub keeper: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelPaymentSchedule<'info> {
    #[account(
        mut,
        constraint = payment_schedule.owner == owner.key()
    )]
    pub payment_schedule: Account<'info, PaymentSchedule>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [payment_schedule.key().as_ref(), b"vault"],
        bump
    )]
    pub payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA derived from payment_schedule
    #[account(
        seeds = [payment_schedule.key().as_ref()],
        bump
    )]
    pub payment_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.mint == payment_vault.mint
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateFeePercentage<'info> {
    #[account(
        mut,
        constraint = fee_vault.authority == authority.key()
    )]
    pub fee_vault: Account<'info, FeeVault>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
#[derive(Default)]
pub struct FeeVault {
    pub authority: Pubkey,   // 32 bytes
    pub fee_percentage: u16, // 2 bytes
}

impl FeeVault {
    pub const SPACE: usize = 32 + 2;
}

#[account]
#[derive(Default)]
pub struct PaymentSchedule {
    pub owner: Pubkey,          // 32 bytes
    pub total_amount: u64,      // 8 bytes
    pub remaining_amount: u64,  // 8 bytes
    pub payment_amount: u64,    // 8 bytes
    pub recipient: Pubkey,      // 32 bytes
    pub payments: Vec<Payment>, // variable
    pub created_at: i64,        // 8 bytes
    pub status: ScheduleStatus, // 1 byte
    pub memo: String,           // variable
}

impl PaymentSchedule {
    // Assuming max 52 payments (weekly for a year)
    // and a memo of max 100 chars
    pub const SPACE: usize = 32 + 8 + 8 + 8 + 32 + (4 + 52 * Payment::SPACE) + 8 + 1 + (4 + 100);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Payment {
    pub scheduled_time: i64,          // 8 bytes
    pub executed: bool,               // 1 byte
    pub execution_time: i64,          // 8 bytes
    pub tx_signature: Option<Pubkey>, // 1 + 32 bytes
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

// Events
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
}
