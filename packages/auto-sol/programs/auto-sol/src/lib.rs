use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use std::str::FromStr;

declare_id!("DfnY1thcxGzhPZaUy4V9S4QwyBP1VoshuY87iQxtyrm8");


const HTTP_BACKEND_WALLET: &str = "ABCDEF123456789abcdef123456789abcdef123456789abcdef123456789abcd"; // Replace with your actual HTTP backend public key
const FEE_WITHDRAWAL_ALLOWED_KEYS: [&str; 3] = [
    "ABCDEF123456789abcdef123456789abcdef123456789abcdef123456789abcd", // Replace with actual public keys
    "BCDEF123456789abcdef123456789abcdef123456789abcdef123456789abcde",
    "CDEF123456789abcdef123456789abcdef123456789abcdef123456789abcdef",
];

// Token addresses for USDC and USDT
const USDC_MINT: &str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Devnet USDC
const USDT_MINT: &str = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // Mainnet USDT

#[program]
pub mod auto_sol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // Initialize global fee vault settings
        let fee_settings = &mut ctx.accounts.fee_settings;
        fee_settings.authority = ctx.accounts.authority.key();
        fee_settings.fee_percentage = 100; // 1% in basis points (100 = 1.00%)
        fee_settings.http_backend_wallet = Pubkey::from_str(HTTP_BACKEND_WALLET).unwrap();
        
        for key_str in FEE_WITHDRAWAL_ALLOWED_KEYS.iter() {
            let pubkey = Pubkey::from_str(key_str).unwrap();
            fee_settings.fee_withdrawal_allowed_keys.push(pubkey);
        }

        // Initialize SOL vault
        let sol_fee_vault = &mut ctx.accounts.sol_fee_vault;
        sol_fee_vault.token_type = TokenType::SOL;
        sol_fee_vault.authority = fee_settings.authority;
        sol_fee_vault.initialized = true;

        // Initialize USDC vault
        let usdc_fee_vault = &mut ctx.accounts.usdc_fee_vault;
        usdc_fee_vault.token_type = TokenType::USDC;
        usdc_fee_vault.authority = fee_settings.authority;
        usdc_fee_vault.initialized = true;

        // Initialize USDT vault
        let usdt_fee_vault = &mut ctx.accounts.usdt_fee_vault;
        usdt_fee_vault.token_type = TokenType::USDT;
        usdt_fee_vault.authority = fee_settings.authority;
        usdt_fee_vault.initialized = true;

        Ok(())
    }

    pub fn create_payment_schedule(
        ctx: Context<CreatePaymentSchedule>,
        payment_amount: u64,
        recipient: Pubkey,
        schedule_times: Vec<i64>,
        memo: String,
        token_type: TokenType,
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
        let fee_settings = &ctx.accounts.fee_settings;
        let fee_amount = (total_amount * fee_settings.fee_percentage as u64) / 10000;
        let deposit_amount = total_amount + fee_amount;

        // Initialize payment schedule
        payment_schedule.owner = ctx.accounts.user.key();
        payment_schedule.total_amount = total_amount;
        payment_schedule.remaining_amount = total_amount;
        payment_schedule.payment_amount = payment_amount;
        payment_schedule.recipient = recipient;
        payment_schedule.created_at = current_time;
        payment_schedule.memo = memo;
        payment_schedule.status = ScheduleStatus::Active;
        payment_schedule.token_type = token_type;

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

        // Handle transfer based on token type
        match token_type {
            TokenType::SOL => {
                // Check if user has enough SOL
                require!(
                    ctx.accounts.user.lamports() >= deposit_amount + 100000, // Adding some for rent exempt
                    ErrorCode::InsufficientFunds
                );

                // Transfer SOL to payment vault
                let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.user.key(),
                    &ctx.accounts.sol_payment_vault.key(),
                    total_amount,
                );

                anchor_lang::solana_program::program::invoke(
                    &transfer_instruction,
                    &[
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.sol_payment_vault.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ],
                )?;
                
                // Transfer fee to fee vault
                let fee_transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
                    &ctx.accounts.user.key(),
                    &ctx.accounts.sol_fee_vault.to_account_info().key(),
                    fee_amount,
                );
                
                anchor_lang::solana_program::program::invoke(
                    &fee_transfer_instruction,
                    &[
                        ctx.accounts.user.to_account_info(),
                        ctx.accounts.sol_fee_vault.to_account_info(),
                        ctx.accounts.system_program.to_account_info(),
                    ],
                )?;
            },
            TokenType::USDC | TokenType::USDT => {
                // Check if user has enough tokens
                let user_token_account = if token_type == TokenType::USDC {
                    &ctx.accounts.user_usdc_account
                } else {
                    &ctx.accounts.user_usdt_account
                };

                require!(
                    user_token_account.amount >= deposit_amount,
                    ErrorCode::InsufficientFunds
                );

                // Determine target vaults
                let (payment_vault, fee_vault) = if token_type == TokenType::USDC {
                    (&ctx.accounts.usdc_payment_vault, &ctx.accounts.usdc_fee_vault_token_account)
                } else {
                    (&ctx.accounts.usdt_payment_vault, &ctx.accounts.usdt_fee_vault_token_account)
                };

                // Transfer tokens from user to payment vault
                token::transfer(
                    CpiContext::new(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: user_token_account.to_account_info(),
                            to: payment_vault.to_account_info(),
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
                            from: user_token_account.to_account_info(),
                            to: fee_vault.to_account_info(),
                            authority: ctx.accounts.user.to_account_info(),
                        },
                    ),
                    fee_amount,
                )?;
            }
        }

        emit!(PaymentScheduleCreatedEvent {
            schedule_id: payment_schedule.key(),
            owner: payment_schedule.owner,
            recipient: payment_schedule.recipient,
            total_amount: payment_schedule.total_amount,
            payment_amount: payment_schedule.payment_amount,
            payment_count: payment_schedule.payments.len() as u64,
            created_at: payment_schedule.created_at,
            token_type: payment_schedule.token_type,
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

        // Store the payment amount for later use
        let payment_amount = payment_schedule.payment_amount;
        let schedule_key = payment_schedule.key();

        // Transfer tokens based on token type
        match payment_schedule.token_type {
            TokenType::SOL => {
                // Prepare PDA signing for SOL payment vault
                let vault_seed = [b"sol_vault".as_ref(), schedule_key.as_ref()];
                let (_vault_authority, bump) = Pubkey::find_program_address(&vault_seed, &crate::ID);
                let seeds = &[b"sol_vault".as_ref(), schedule_key.as_ref(), &[bump]];
                let _signer = &[&seeds[..]];

                // Transfer SOL from payment vault to recipient
                **ctx.accounts.sol_payment_vault.to_account_info().try_borrow_mut_lamports()? -= payment_amount;
                **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += payment_amount;
            },
            TokenType::USDC | TokenType::USDT => {
                // Determine which vault and accounts to use
                let (payment_vault, recipient_token_account, vault_seed, _vault_address) =
                    if payment_schedule.token_type == TokenType::USDC {
                        (
                            &ctx.accounts.usdc_payment_vault,
                            &ctx.accounts.recipient_usdc_account,
                            [b"usdc_vault".as_ref(), schedule_key.as_ref()],
                            ctx.accounts.usdc_vault_authority.key(),
                        )
                    } else {
                        (
                            &ctx.accounts.usdt_payment_vault,
                            &ctx.accounts.recipient_usdt_account,
                            [b"usdt_vault".as_ref(), schedule_key.as_ref()],
                            ctx.accounts.usdt_vault_authority.key(),
                        )
                    };

                // Get the PDA bump for signing
                let (_, bump) = Pubkey::find_program_address(&vault_seed, &crate::ID);
                let seeds = &[vault_seed[0], vault_seed[1], &[bump]];
                let signer = &[&seeds[..]];

                // Transfer tokens from payment vault to recipient
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: payment_vault.to_account_info(),
                            to: recipient_token_account.to_account_info(),
                            authority: if payment_schedule.token_type == TokenType::USDC {
                                ctx.accounts.usdc_vault_authority.to_account_info()
                            } else {
                                ctx.accounts.usdt_vault_authority.to_account_info()
                            },
                        },
                        signer,
                    ),
                    payment_amount,
                )?;
            }
        }

        // Now we can safely update the payment
        payment_schedule.payments[payment_index as usize].executed = true;
        payment_schedule.payments[payment_index as usize].execution_time = current_time;
        payment_schedule.payments[payment_index as usize].tx_signature = Some(ctx.accounts.executor.key());

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
            token_type: payment_schedule.token_type.clone(),
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

        // Calculate the amount to refund (remaining unexecuted payments)
        let refund_amount = payment_schedule.remaining_amount;
        require!(refund_amount > 0, ErrorCode::NoRemainingFunds);

        // Execute refund based on token type
        match payment_schedule.token_type {
            TokenType::SOL => {
                // Prepare PDA signing for SOL vault
                let schedule_key = payment_schedule.key();
                let vault_seed = [b"sol_vault".as_ref(), schedule_key.as_ref()];
                let (_vault_authority, bump) = Pubkey::find_program_address(&vault_seed, &crate::ID);
                let seeds = &[b"sol_vault".as_ref(), schedule_key.as_ref(), &[bump]];
                let _signer = &[&seeds[..]];

                // Transfer SOL from payment vault back to owner
                **ctx.accounts.sol_payment_vault.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
                **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += refund_amount;
            },
            TokenType::USDC | TokenType::USDT => {
                // Determine which vault and accounts to use
                let schedule_key = payment_schedule.key();
                let (payment_vault, owner_token_account, vault_seed, vault_authority) = 
                    if payment_schedule.token_type == TokenType::USDC {
                        (
                            &ctx.accounts.usdc_payment_vault,
                            &ctx.accounts.owner_usdc_account, 
                            [b"usdc_vault".as_ref(), schedule_key.as_ref()],
                            &ctx.accounts.usdc_vault_authority,
                        )
                    } else {
                        (
                            &ctx.accounts.usdt_payment_vault,
                            &ctx.accounts.owner_usdt_account,
                            [b"usdt_vault".as_ref(), schedule_key.as_ref()],
                            &ctx.accounts.usdt_vault_authority,
                        )
                    };

                // Get the PDA bump for signing
                let (_, bump) = Pubkey::find_program_address(&vault_seed, &crate::ID);
                let seeds = &[vault_seed[0], vault_seed[1], &[bump]];
                let signer = &[&seeds[..]];

                // Transfer tokens from payment vault back to owner
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: payment_vault.to_account_info(),
                            to: owner_token_account.to_account_info(),
                            authority: vault_authority.to_account_info(),
                        },
                        signer,
                    ),
                    refund_amount,
                )?;
            }
        }

        // Update schedule status
        payment_schedule.status = ScheduleStatus::Cancelled;
        payment_schedule.remaining_amount = 0;

        emit!(PaymentScheduleCancelledEvent {
            schedule_id: payment_schedule.key(),
            owner: payment_schedule.owner,
            refund_amount,
            cancelled_at: Clock::get()?.unix_timestamp,
            token_type: payment_schedule.token_type.clone(),
        });

        Ok(())
    }

    pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64, token_type: TokenType) -> Result<()> {
        // Verify the withdrawer is authorized
        let fee_settings = &ctx.accounts.fee_settings;
        let authorized = fee_settings.fee_withdrawal_allowed_keys.iter()
            .any(|key| *key == ctx.accounts.authority.key());

        require!(authorized, ErrorCode::UnauthorizedFeeWithdrawal);

        match token_type {
            TokenType::SOL => {
                // Check if there are enough SOL in the fee vault
                require!(
                    ctx.accounts.sol_fee_vault.to_account_info().lamports() >= amount,
                    ErrorCode::InsufficientVaultFunds
                );

                // Transfer SOL from fee vault to withdrawer
                **ctx.accounts.sol_fee_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
                **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;
            },
            TokenType::USDC => {
                // Check if there are enough USDC tokens in the fee vault
                require!(
                    ctx.accounts.usdc_fee_vault_token_account.amount >= amount,
                    ErrorCode::InsufficientVaultFunds
                );

                // Prepare PDA signing for USDC fee vault
                let seeds = &[b"usdc_fee_vault".as_ref(), &[ctx.bumps.usdc_fee_vault_authority]];
                let signer = &[&seeds[..]];

                // Transfer tokens from USDC fee vault to withdrawer
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.usdc_fee_vault_token_account.to_account_info(),
                            to: ctx.accounts.user_usdc_account.to_account_info(),
                            authority: ctx.accounts.usdc_fee_vault_authority.to_account_info(),
                        },
                        signer,
                    ),
                    amount,
                )?;
            },
            TokenType::USDT => {
                // Check if there are enough USDT tokens in the fee vault
                require!(
                    ctx.accounts.usdt_fee_vault_token_account.amount >= amount,
                    ErrorCode::InsufficientVaultFunds
                );

                // Prepare PDA signing for USDT fee vault
                let seeds = &[b"usdt_fee_vault".as_ref(), &[ctx.bumps.usdt_fee_vault_authority]];
                let signer = &[&seeds[..]];

                // Transfer tokens from USDT fee vault to withdrawer
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.usdt_fee_vault_token_account.to_account_info(),
                            to: ctx.accounts.user_usdt_account.to_account_info(),
                            authority: ctx.accounts.usdt_fee_vault_authority.to_account_info(),
                        },
                        signer,
                    ),
                    amount,
                )?;
            }
        }

        emit!(FeesWithdrawnEvent {
            amount,
            token_type,
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

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + FeeSettings::SPACE
    )]
    pub fee_settings: Account<'info, FeeSettings>,

    #[account(
        init,
        payer = authority,
        space = 8 + FeeVault::SPACE
    )]
    pub sol_fee_vault: Account<'info, FeeVault>,

    #[account(
        init,
        payer = authority,
        space = 8 + FeeVault::SPACE
    )]
    pub usdc_fee_vault: Account<'info, FeeVault>,

    #[account(
        init,
        payer = authority,
        space = 8 + FeeVault::SPACE
    )]
    pub usdt_fee_vault: Account<'info, FeeVault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_amount: u64, recipient: Pubkey, schedule_times: Vec<i64>, memo: String, token_type: TokenType)]
pub struct CreatePaymentSchedule<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + PaymentSchedule::SPACE
    )]
    pub payment_schedule: Account<'info, PaymentSchedule>,

    pub fee_settings: Account<'info, FeeSettings>,

    #[account(mut)]
    pub user: Signer<'info>,

    // SOL vaults and accounts
    /// CHECK: This is the SOL payment vault
    #[account(
        init,
        payer = user,
        seeds = [b"sol_vault", payment_schedule.key().as_ref()],
        bump,
        space = 8 + 32
    )]
    pub sol_payment_vault: AccountInfo<'info>,

    /// CHECK: This is the SOL fee vault
    #[account(mut)]
    pub sol_fee_vault: Account<'info, FeeVault>,

    // USDC vaults and accounts
    #[account(
        mut,
        constraint = user_usdc_account.owner == user.key(),
        constraint = user_usdc_account.mint == Pubkey::from_str(USDC_MINT).unwrap()
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        token::mint = usdc_mint,
        token::authority = usdc_vault_authority,
        seeds = [b"usdc_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdc_payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDC vault authority
    #[account(
        seeds = [b"usdc_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdc_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = usdc_fee_vault_token_account.owner == usdc_fee_vault_authority.key(),
        constraint = usdc_fee_vault_token_account.mint == usdc_mint.key()
    )]
    pub usdc_fee_vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDC fee vault authority
    #[account(
        seeds = [b"usdc_fee_vault"],
        bump
    )]
    pub usdc_fee_vault_authority: UncheckedAccount<'info>,

    pub usdc_mint: Account<'info, anchor_spl::token::Mint>,

    // USDT vaults and accounts
    #[account(
        mut,
        constraint = user_usdt_account.owner == user.key(),
        constraint = user_usdt_account.mint == Pubkey::from_str(USDT_MINT).unwrap()
    )]
    pub user_usdt_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        token::mint = usdt_mint,
        token::authority = usdt_vault_authority,
        seeds = [b"usdt_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdt_payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDT vault authority
    #[account(
        seeds = [b"usdt_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdt_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = usdt_fee_vault_token_account.owner == usdt_fee_vault_authority.key(),
        constraint = usdt_fee_vault_token_account.mint == usdt_mint.key()
    )]
    pub usdt_fee_vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDT fee vault authority
    #[account(
        seeds = [b"usdt_fee_vault"],
        bump
    )]
    pub usdt_fee_vault_authority: UncheckedAccount<'info>,

    pub usdt_mint: Account<'info, anchor_spl::token::Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(payment_index: u64)]
pub struct ExecutePayment<'info> {
    #[account(mut)]
    pub payment_schedule: Account<'info, PaymentSchedule>,

    pub fee_settings: Account<'info, FeeSettings>,

    #[account(
        mut,
        constraint = executor.key() == fee_settings.http_backend_wallet
    )]
    pub executor: Signer<'info>,

    /// CHECK: This is the payment recipient
    #[account(
        mut,
        constraint = recipient.key() == payment_schedule.recipient
    )]
    pub recipient: AccountInfo<'info>,

    // SOL vaults and accounts
    /// CHECK: This is the SOL payment vault
    #[account(
        mut,
        seeds = [b"sol_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub sol_payment_vault: AccountInfo<'info>,

    // USDC vaults and accounts
    #[account(
        mut,
        seeds = [b"usdc_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdc_payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDC vault authority
    #[account(
        seeds = [b"usdc_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdc_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = recipient_usdc_account.owner == payment_schedule.recipient,
        constraint = recipient_usdc_account.mint == Pubkey::from_str(USDC_MINT).unwrap()
    )]
    pub recipient_usdc_account: Account<'info, TokenAccount>,

    // USDT vaults and accounts
    #[account(
        mut,
        seeds = [b"usdt_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdt_payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDT vault authority
    #[account(
        seeds = [b"usdt_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdt_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = recipient_usdt_account.owner == payment_schedule.recipient,
        constraint = recipient_usdt_account.mint == Pubkey::from_str(USDT_MINT).unwrap()
    )]
    pub recipient_usdt_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
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

    // SOL vaults and accounts
    /// CHECK: This is the SOL payment vault
    #[account(
        mut,
        seeds = [b"sol_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub sol_payment_vault: AccountInfo<'info>,

    // USDC vaults and accounts
    #[account(
        mut,
        seeds = [b"usdc_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdc_payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDC vault authority
    #[account(
        seeds = [b"usdc_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdc_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = owner_usdc_account.owner == owner.key(),
        constraint = owner_usdc_account.mint == Pubkey::from_str(USDC_MINT).unwrap()
    )]
    pub owner_usdc_account: Account<'info, TokenAccount>,

    // USDT vaults and accounts
    #[account(
        mut,
        seeds = [b"usdt_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdt_payment_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDT vault authority
    #[account(
        seeds = [b"usdt_vault", payment_schedule.key().as_ref()],
        bump
    )]
    pub usdt_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = owner_usdt_account.owner == owner.key(),
        constraint = owner_usdt_account.mint == Pubkey::from_str(USDT_MINT).unwrap()
    )]
    pub owner_usdt_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    pub fee_settings: Account<'info, FeeSettings>,

    #[account(mut)]
    pub authority: Signer<'info>,

    // SOL fee vault
    #[account(mut)]
    pub sol_fee_vault: Account<'info, FeeVault>,

    // USDC fee vault and accounts
    #[account(
        mut,
        constraint = usdc_fee_vault_token_account.mint == Pubkey::from_str(USDC_MINT).unwrap()
    )]
    pub usdc_fee_vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDC fee vault authority
    #[account(
        seeds = [b"usdc_fee_vault"],
        bump
    )]
    pub usdc_fee_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = user_usdc_account.owner == authority.key(),
        constraint = user_usdc_account.mint == Pubkey::from_str(USDC_MINT).unwrap()
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,

    // USDT fee vault and accounts
    #[account(
        mut,
        constraint = usdt_fee_vault_token_account.mint == Pubkey::from_str(USDT_MINT).unwrap()
    )]
    pub usdt_fee_vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA for USDT fee vault authority
    #[account(
        seeds = [b"usdt_fee_vault"],
        bump
    )]
    pub usdt_fee_vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = user_usdt_account.owner == authority.key(),
        constraint = user_usdt_account.mint == Pubkey::from_str(USDT_MINT).unwrap()
    )]
    pub user_usdt_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateFeePercentage<'info> {
    #[account(
        mut,
        constraint = fee_settings.authority == authority.key()
    )]
    pub fee_settings: Account<'info, FeeSettings>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

// Data Structures
#[account]
pub struct FeeSettings {
    pub authority: Pubkey,
    pub fee_percentage: u16,
    pub http_backend_wallet: Pubkey,
    pub fee_withdrawal_allowed_keys: Vec<Pubkey>,
}

impl FeeSettings {
    pub const SPACE: usize = 32 + 2 + 32 + (4 + 32 * 3); // Authority + fee% + http_wallet + 3 withdrawal keys
}

#[account]
pub struct FeeVault {
    pub token_type: TokenType,
    pub authority: Pubkey,
    pub initialized: bool,
}

impl FeeVault {
    pub const SPACE: usize = 1 + 32 + 1; // token_type + authority + initialized
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
    pub token_type: TokenType,
}

impl PaymentSchedule {
    pub const SPACE: usize = 32 + 8 + 8 + 8 + 32 + (4 + 52 * Payment::SPACE) + 8 + 1 + (4 + 100) + 1;
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug, Copy)]
pub enum TokenType {
    SOL,
    USDC,
    USDT,
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
    pub token_type: TokenType,
}

#[event]
pub struct PaymentExecutedEvent {
    pub schedule_id: Pubkey,
    pub payment_index: u64,
    pub amount: u64,
    pub recipient: Pubkey,
    pub executed_at: i64,
    pub executed_by: Pubkey,
    pub token_type: TokenType,
}

#[event]
pub struct PaymentScheduleCancelledEvent {
    pub schedule_id: Pubkey,
    pub owner: Pubkey,
    pub refund_amount: u64,
    pub cancelled_at: i64,
    pub token_type: TokenType,
}

#[event]
pub struct FeesWithdrawnEvent {
    pub amount: u64,
    pub token_type: TokenType,
    pub withdrawn_by: Pubkey,
    pub withdrawn_at: i64,
}

#[event]
pub struct FeePercentageUpdatedEvent {
    pub old_percentage: u16,
    pub new_percentage: u16,
    pub updated_at: i64,
}

// Error Codes
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
}