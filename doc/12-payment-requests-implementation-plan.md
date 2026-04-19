# Payment Requests v1 (Subscription-Style) — Implementation Plan

## Summary
Implement a new Payment Request flow where a requester asks a payer for one-time or recurring autopayments.
Flow: create request -> payer accepts (same tx funds escrow + creates schedule) -> executor runs payments.
This is additive and must not break existing Standard/Commitment flows.

## Implementation Sequence
1. Implement on-chain + generated artifacts.
2. Extend monitor/event-contract/worker/db/http.
3. Ship web routes + UI.
4. Run cross-service tests.

## On-Chain Program
- Add SchedulePolicy::Request and ScheduleStatus::Paused.
- Add PaymentRequestProposal account (requester/payer lifecycle + activated_schedule).
- Add PaymentRequestStatus enum: Proposed, Declined, Revoked, Accepted.
- Add instructions:
  - create_payment_request_proposal (SOL)
  - create_spl_payment_request_proposal (SPL)
  - decline_payment_request_proposal (payer only)
  - revoke_payment_request_proposal (requester only while proposed)
  - accept_payment_request_proposal (payer only, accept=activate)
  - pause_payment_schedule (request policy only, payer/owner only)
  - resume_payment_schedule (request policy only, payer/owner only)
- Keep commitment cancel restriction intact; request schedules cancellable by payer.

## Events
- Add:
  - PaymentRequestProposedEvent
  - PaymentRequestDeclinedEvent
  - PaymentRequestRevokedEvent
  - PaymentRequestAcceptedEvent
  - PaymentSchedulePausedEvent
  - PaymentScheduleResumedEvent

## Data + Services
- Prisma:
  - Add PaymentRequestProposal model and PaymentRequestStatus enum.
  - Extend PaymentSchedulePolicy with REQUEST.
  - Add optional requestId relation on payment_schedules.
- HTTP:
  - GET /api/v1/requests/sent/:address
  - GET /api/v1/requests/received/:address
  - GET /api/v1/requests/:requestId

## Web
- Add routes:
  - /dashboard/requests
  - /dashboard/requests/new
  - /dashboard/requests/[requestId]
- Reuse payment form UX for request creation.
- Detail view must include transparent schedule preview + markdown note.
- Dashboard-only acceptance link.

## Tests
- Anchor SOL/SPL request lifecycle tests.
- Unauthorized action tests.
- Pause/resume/cancel behavior tests.
- Regressions for standard + commitment flows.
