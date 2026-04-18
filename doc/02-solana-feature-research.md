# Solana Feature Research For AutoSOl

Reviewed on April 15, 2026.

## Bottom Line

Plain recurring payments are not a unique product angle on Solana anymore. Public material from Solana, Zebec, Streamflow, and Squads already covers overlapping areas like payouts, streaming payroll, token vesting, treasury workflows, spending controls, fee relaying, and recurring recipient management.

The opportunity is to build a narrower but more defensible category: programmable treasury-grade recurring payments with compliance, attestations, proofs, and failure handling built in.

## What Already Exists

### Solana Base Capabilities

What the platform itself now emphasizes:

- Payments docs cover invoices, payouts, batch payments, and fee abstraction.
- Solana explicitly documents fee sponsorship so end users do not need to hold SOL.

Implication:
If AutoSOl only offers scheduled transfers, batching, or sponsored fees, it will look like an implementation of standard Solana payment primitives rather than a differentiated product.

Source:
- https://solana.com/docs/payments
- https://solana.com/docs/payments/send-payments/payment-processing
- https://solana.com/tr/docs/payments/send-payments/payment-processing/fee-abstraction

### Zebec

Public positioning:

- Real-time payroll and streaming pay.
- Enterprise payroll and global payouts.
- Expanding compliance stack after the Gatenox acquisition.

Implication:
You should not compete head-on on "real-time payroll" or "continuous salary streaming" unless you have a materially different buyer or workflow.

Source:
- https://zebec.io/
- https://zebec.io/payroll
- https://docs.zebec.io/
- https://zebec.io/blog/zebec-acquires-gatenox-to-deepen-compliance-stack

### Streamflow

Public positioning:

- Token vesting.
- Payroll.
- Automated token unlocks and distribution workflows.
- Airdrop tracking.

Implication:
Token distribution and team payroll automation are already occupied categories.

Source:
- https://streamflow.finance/blog/welcome-to-streamflow/
- https://streamflow.finance/vesting
- https://docs.streamflow.finance/en/articles/12955803-airdrop-checker/

### Squads

Public positioning:

- Treasury management and smart-account controls.
- Spending limits.
- Fee relayer.
- Recurring payments via recipients/payments workflows.

Implication:
DAO and treasury users already have a trusted control plane for approvals and treasury ops. AutoSOl should integrate with that layer rather than ignore it.

Source:
- https://docs.squads.so/main/getting-started/treasury-management-overview
- https://docs.squads.so/main/navigating-your-squad/settings/spending-limits
- https://docs.squads.so/main/navigating-your-squad/treasury

### Solana Attestation Service

Public positioning:

- Credential issuance for KYC, badges, compliance, and wallet-linked attestations.

Implication:
This opens a product lane that recurring-payment products do not appear to emphasize publicly: attestation-aware payment automation.

Source:
- https://attest.solana.com/

## Recommended Differentiation Bets

These are not guaranteed to be globally unique. They are the strongest gaps I could infer from the public material reviewed above, and I did not find strong evidence that they already exist as end-to-end Solana products.

### Bet 1

Attestation-Gated Recurring Payments

Idea:
Only execute a payment if the recipient wallet still carries required attestations such as KYC, KYB, contractor approval, region eligibility, sanctions screening, or DAO role membership.

Why this is interesting:

- Strong fit with enterprise payroll, grants, vendor payouts, and DAO contributor ops.
- Turns AutoSOl from a scheduler into a policy engine.
- Uses a specifically Solana-native primitive that most payment apps are not visibly centering.

MVP shape:

- Attach one or more attestation policies to each schedule.
- Block or pause execution when an attestation expires.
- Emit a machine-readable "why payment was blocked" event.

### Bet 2

Proof-of-Execution Recurring Payments

Idea:
Every scheduled payment should produce a verifiable execution proof bundle: scheduled timestamp, actual execution timestamp, tx, signer, price context, fee context, and policy checks passed.

Why this is interesting:

- Valuable for finance teams, payroll, grants, and compliance.
- Converts AutoSOl into a settlement and audit layer, not only a transfer layer.
- None of the reviewed competitors foreground this as the primary product.

MVP shape:

- Execution receipts page.
- Downloadable CSV and JSON audit packages.
- Signed webhook callbacks for ERP/accounting ingestion.

### Bet 3

Invoice-to-Schedule-to-Escrow

Idea:
Start from an invoice or vendor agreement, convert it into a schedule, and optionally keep funds in escrow with cancellation/dispute windows before release.

Why this is interesting:

- More useful than raw recurring transfers for agencies, freelancers, and B2B services.
- Sits between invoicing software and treasury tools.

MVP shape:

- Create schedule from invoice terms.
- Optional milestone and approval gates.
- Recipient can acknowledge schedule terms on-chain.

### Bet 4

Treasury Policy Automation For Squads Users

Idea:
Offer AutoSOl as a smart payment policy layer on top of Squads-style treasury controls instead of competing with Squads treasury UX.

Why this is interesting:

- Existing teams already trust Squads for approvals and custody.
- AutoSOl can become the "when and under what conditions should money move" layer.

MVP shape:

- Squads-connected schedule creation.
- Spending-limit aware schedule proposals.
- Multi-approver payment policy templates.

### Bet 5

Missed-Payment Recovery And SLA Layer

Idea:
If a scheduled payment is missed because of RPC failure, fee spikes, keeper downtime, or destination-account problems, AutoSOl should auto-retry, document the miss, and optionally compensate from a reserve.

Why this is interesting:

- This is a real enterprise pain point.
- Most public product copy focuses on automation, not reliability guarantees.

MVP shape:

- Retry policy matrix.
- Alerting and failure reasons.
- SLA dashboard.
- Optional insurance / reserve balance.

### Bet 6

Recipient Onboarding Without SOL

Idea:
Combine sponsored fees, embedded wallets, and destination-account preparation so recipients can receive, acknowledge, and manage schedules without ever needing native SOL.

Why this is interesting:

- Very strong UX improvement for mainstream recipients.
- Aligns with Solana's fee abstraction direction.

MVP shape:

- Sponsor wallet creation or ATA creation.
- One-click recipient confirmation links.
- Stablecoin-only UX for both payer and recipient.

### Bet 7

Intent-Based Scheduled Treasury Actions

Idea:
Extend beyond payments into recurring treasury intents: pay vendor, top up payroll wallet, rebalance stablecoin float, move idle balance to yield, or pause a schedule on risk signals.

Why this is interesting:

- Higher-value than consumer subscriptions.
- More defensible against single-purpose payroll competitors.

MVP shape:

- Policy templates.
- Safe action set.
- Human approval for high-risk intents.

## Recommended Product Direction

If you want the strongest wedge, build this:

`AutoSOl = attestation-aware, proof-rich, treasury-grade recurring payment orchestration for Solana teams.`

That keeps the current recurring payment base, but upgrades the product into something much harder to replace with generic streaming payroll or standard treasury tooling.

## Suggested Roadmap

### Phase 1

Stabilize core payments:

- Fix auth and executor trust boundaries.
- Unify on one production program.
- Make worker/executor/monitor data formats deterministic.
- Add end-to-end test coverage for SOL and USDC.

### Phase 2

Ship differentiated primitives:

- payment execution receipts
- retry and missed-payment handling
- sponsor-fee recipient onboarding
- Squads integration

### Phase 3

Ship defensible product moat:

- attestation-gated schedules
- compliance-aware policies
- invoice-to-schedule workflow
- accounting and audit exports

## Notes On Uniqueness

I cannot prove that no one anywhere has built each idea privately or in stealth. The recommendations above are based on publicly visible product docs and marketing pages reviewed on April 15, 2026. The safer claim is:

`I did not find strong public evidence that these combinations are already offered as a polished Solana-native product.`
