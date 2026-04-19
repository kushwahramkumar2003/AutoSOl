# Payment Commitments Implementation Plan

Reviewed on April 19, 2026.

This document turns the research in [10-irrevocable-payment-commitments-research.md](./10-irrevocable-payment-commitments-research.md) into an implementation plan for AutoSOl.

## Goal

Add a new `Payment Commitment` product flow that is stronger than the current recurring payment schedule:

- the sender proposes a commitment
- the recipient reviews the terms and explicitly accepts on-chain
- the sender activates the commitment and locks funds into escrow
- once activated, the recurring schedule is not cancellable by the sender

This must be implemented without breaking existing standard schedules.

## Status

- Current implementation status: core feature implemented across the program, event pipeline, DB, HTTP, and web layers.
- Verification status: `yarn check-types`, targeted package typechecks, and Prisma client generation passed.
- Remaining verification: re-run the full Surfpool stable Anchor suite after the last SPL commitment test fix, then complete manual end-to-end checks.

## Product Rules

- `Standard Schedule` remains the existing flexible recurring transfer flow.
- `Payment Commitment` is a separate mode, not a hidden flag on the current UI.
- A commitment is only active after both parties have signed and the sender has funded escrow.
- No admin override, governance, arbitration, or moderator intervention is in scope.
- No silent backend-only state is allowed for commitment authority or lifecycle.
- Chain events, Redis payloads, Prisma models, HTTP responses, and frontend types must remain aligned.

## Canonical User Flow

1. Sender creates a commitment proposal with:
   - recipient
   - token / mint
   - payment amount
   - schedule dates
   - memo
   - markdown note stored on IPFS
2. Recipient sees the proposal in the app and/or via share link.
3. Recipient accepts the proposal on-chain.
4. Sender activates the proposal on-chain.
5. Activation creates the funded schedule and links it back to the proposal.
6. Executor continues processing scheduled transfers normally.
7. Activated commitment schedules cannot be cancelled through the existing cancel instruction path.

## Delivery Constraints

- The active program target is `packages/auto-sol-2`.
- Generated IDL/types must be copied from the program outputs, not hand-edited.
- Every on-chain change requires Anchor tests.
- Off-chain services must keep working when the backend is unavailable by falling back to RPC where feasible.
- UI must follow the existing dashboard visual system and must not regress current payment flows.

## Stage 0: Planning And Safety Baseline

### Outcomes

- Write this plan to disk.
- Confirm scope boundaries before implementation spreads across the stack.

### Checklist

- [x] Save the implementation plan in `/doc`.
- [x] Keep feature naming consistent: `Payment Commitment`.
- [x] Preserve existing standard schedule behavior unless explicitly changed.
- [x] Record any deviations or follow-up items back into `/doc`.

## Stage 1: On-Chain Commitment Model

### Outcomes

- Introduce a proposal account and schedule policy model in the Anchor program.
- Keep current standard schedules working.

### Program Changes

- [x] Add `PaymentCommitmentProposal` account state.
- [x] Add `PaymentCommitmentStatus` enum.
- [x] Add `SchedulePolicy` enum on `PaymentSchedule`.
- [x] Add optional proposal linkage from schedule to proposal.
- [x] Keep existing `PaymentSchedule` fields compatible with current execution logic.
- [x] Add validation for memo length, note URI length, schedule count, and timestamp ordering.
- [x] Add checked arithmetic to all payment and fee calculations used in activation.

### New Instructions

- [x] `create_payment_commitment_proposal` for SOL commitments.
- [x] `create_spl_payment_commitment_proposal` for SPL commitments.
- [x] `accept_payment_commitment_proposal`.
- [x] `activate_payment_commitment` for SOL commitments.
- [x] `activate_spl_payment_commitment` for SPL commitments.

### Behavior Requirements

- [x] Proposal creation does not lock funds yet.
- [x] Recipient acceptance must require the intended recipient signer.
- [x] Activation must require the original sender signer.
- [x] Activation must only succeed after recipient acceptance.
- [x] Activation creates the actual funded schedule and links the proposal.
- [x] Activated schedules created from commitments must be marked `COMMITMENT`.
- [x] Cancellation of commitment schedules must fail with an explicit program error.
- [x] Standard schedules must still support the current create / execute / cancel flow.

### Events

- [x] Add `PaymentCommitmentProposedEvent`.
- [x] Add `PaymentCommitmentAcceptedEvent`.
- [x] Add `PaymentCommitmentActivatedEvent`.
- [x] Extend `PaymentScheduleCreatedEvent` with policy/proposal linkage if needed by indexing.
- [x] Keep event payloads deterministic and aligned with Rust and TypeScript.

### Anchor Tests

- [x] Proposal creation test for SOL.
- [x] Proposal creation test for SPL.
- [x] Recipient acceptance authorization test.
- [x] Activation-before-acceptance rejection test.
- [x] Activation success test for SOL.
- [x] Activation success test for SPL.
- [x] Commitment schedule cancellation rejection test.
- [x] Regression test proving standard schedules still cancel normally.
- [x] Regression test proving executors still execute commitment-backed schedules.

## Stage 2: Generated Artifacts And Shared Types

### Outcomes

- All consumers read the same program interface.

### Checklist

- [x] Rebuild Anchor program artifacts.
- [x] Copy generated IDL into frontend and service consumers.
- [x] Copy generated TS types into frontend and service consumers.
- [x] Avoid hand-editing generated IDL/type files.
- [x] Verify instruction names and account layouts match the new program.

## Stage 3: Event Contract And Monitor Pipeline

### Outcomes

- Proposal lifecycle events are captured and pushed into Redis in order.

### Event Contract

- [x] Extend `@autosol/event-contract` with the three new commitment event schemas.
- [x] Extend `buildEventKey` for deterministic deduplication.
- [x] Export new event types for worker and HTTP usage.

### Blockchain Monitor

- [x] Add new discriminators for commitment proposal, acceptance, and activation.
- [x] Decode and serialize the new event payloads.
- [x] Push all new events into the Redis stream using the existing envelope shape.
- [x] Keep legacy queue cleanup intact.

## Stage 4: Database Schema And Worker Indexing

### Outcomes

- Proposals and commitment-backed schedules become queryable and auditable off-chain.

### Prisma Schema

- [x] Add `PaymentCommitmentProposal` model.
- [x] Add `PaymentCommitmentStatus` enum.
- [x] Add `PaymentSchedulePolicy` enum.
- [x] Add schedule fields needed for policy and proposal linkage.
- [x] Keep existing payment, fee withdrawal, and event log tables intact.

### Migration

- [x] Create a new Prisma migration for commitment proposal tables and schedule fields.
- [x] Keep existing package scripts unchanged.
- [ ] Ensure migration can run from `packages/db`.

### Worker

- [x] Add new event priorities so commitment proposal creation is indexed before acceptance/activation.
- [x] Handle proposal create events idempotently.
- [x] Handle proposal accept events idempotently.
- [x] Handle proposal activate events idempotently.
- [x] Update schedule indexing to persist policy and proposal linkage.
- [x] Preserve retry behavior when activation arrives before proposal indexing.
- [x] Keep processed event cleanup and dead-letter behavior deterministic.

## Stage 5: HTTP API Surface

### Outcomes

- The backend can serve commitment proposal state to the web app, while remaining optional.

### Checklist

- [x] Add read endpoints for sent proposals.
- [x] Add read endpoints for received proposals.
- [x] Add read endpoint for a single proposal detail if needed by share links.
- [x] Return proposal status, note URI, token metadata hooks, and linked schedule ID when available.
- [x] Keep dashboard and schedule responses backward compatible.

## Stage 6: Frontend Commitment UX

### Outcomes

- Users can create, accept, activate, and track commitments from the web app.

### New UX Areas

- [x] Add a commitment mode in the new payment flow.
- [x] Add markdown note authoring UI.
- [x] Add IPFS upload helper for markdown notes using client-side Pinata JWT flow.
- [x] Add sender proposal outbox UI.
- [x] Add recipient inbox UI.
- [x] Add activation action for accepted proposals.
- [x] Add commitment policy badges in schedule lists and detail views.
- [x] Disable cancel actions in the UI for commitment-backed schedules.

### Frontend Data / RPC Fallback

- [x] Add program client helpers to fetch proposals by owner and recipient over RPC.
- [x] Add resilient data helpers so commitment reads still work if HTTP backend is down.
- [x] Surface a clear notice when the app is using RPC fallback.
- [x] Keep existing schedules, dashboard, and transactions resilient behavior intact.

### Share Link Flow

- [x] Add a proposal detail route that can be shared.
- [x] If the recipient wallet matches the proposal recipient, show the accept action.
- [x] If the sender wallet matches the owner and the proposal is accepted, show the activate action.

## Stage 7: Security And Product Hardening

### Outcomes

- The feature is robust enough for local validation and staged rollout.

### Checklist

- [x] Validate signer/authority checks for every new instruction.
- [x] Confirm no hidden backend authority is introduced.
- [x] Confirm commitment schedules cannot be cancelled by current UI or program paths.
- [x] Confirm SPL commitments respect mint allowlists.
- [x] Confirm note URI handling does not require secret leakage to logs.
- [x] Confirm worker/event indexing remains idempotent under retries.
- [x] Confirm backend failure does not block frontend reads of proposals or schedules.
- [x] Document any remaining trust assumptions around activation timing and off-chain notification.

## Stage 8: Verification

### Required Commands

- [ ] `anchor test --skip-local-validator` from `packages/auto-sol-2`
- [x] `yarn check-types`
- [x] targeted service type checks for changed packages
- [x] Prisma generate / migration verification for `packages/db`

### Manual Flow Verification

- [ ] Create standard SOL schedule and verify cancellation still works.
- [ ] Create standard SPL schedule and verify cancellation still works.
- [ ] Create SOL commitment proposal, accept it, activate it, and verify cancellation is blocked.
- [ ] Create SPL commitment proposal, accept it, activate it, and verify cancellation is blocked.
- [ ] Verify indexed proposal data appears in HTTP and frontend.
- [ ] Verify frontend proposal and schedule reads still work with backend stopped.

## Remaining Trust Assumptions

- Recipient acceptance records agreement, but escrow is still only funded when the sender activates the proposal.
- If the sender never activates an accepted proposal, it remains accepted but unfunded by design in the current model.
- Notification delivery remains an application concern. The chain state and UI expose proposal lifecycle state, but this implementation does not add guaranteed out-of-band notification channels.

## Implementation Order

1. Stage 1: Program + tests
2. Stage 2: Generated IDL/types
3. Stage 3: Event contract + blockchain monitor
4. Stage 4: Prisma + worker
5. Stage 5: HTTP routes
6. Stage 6: Frontend flows and RPC fallback
7. Stage 7: Security pass
8. Stage 8: Verification

## Out Of Scope For This Implementation

- arbitration
- governance or admin override
- off-chain legal enforcement
- dynamic treasury approval workflows
- partial activation or sender pause controls for commitments
- mobile-specific UX beyond responsive web support

## Notes For Future Follow-Up

- Consider proposal revocation rules before acceptance if product wants sender-side draft withdrawal.
- Consider richer markdown rendering and attachment handling once the base commitment flow is stable.
- Consider notification delivery outside the dashboard after the chain and indexing paths are proven reliable.
