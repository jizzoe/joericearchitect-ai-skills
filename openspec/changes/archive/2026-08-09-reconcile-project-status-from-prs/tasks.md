## 1. Planning and Review

- [x] 1.1 Create and link the M5-C2 issue and Project item.
  - Depends on: M4-C2, M5-C1
  - Evidence: issue #41 exists, Project item exists, and status is `In Progress`.

- [x] 1.2 Complete planning artifacts and planning review.
  - Depends on: 1.1
  - Evidence: proposal, delta spec, design, tracking metadata, and task plan exist.

## 2. PR Project Reconciliation

- [x] 2.1 Implement deterministic PR event status planning.
  - Depends on: 1.2
  - Evidence: planner maps draft/open, ready, converted-to-draft, merged, closed-unmerged, and no-op events.

- [x] 2.2 Add read-safe workflow audit for PR events.
  - Depends on: 2.1
  - Evidence: workflow runs on pull_request with read-only permissions and no Project token.

## 3. Skills and Evals

- [x] 3.1 Add canonical Project PR status sync skill and assistant wrappers.
  - Depends on: 2.2
  - Evidence: base skill and Claude/Codex wrappers reference canonical scripts.

- [x] 3.2 Add deterministic tests and evals.
  - Depends on: 3.1
  - Evidence: tests/evals cover required lifecycle transitions, trust boundaries, no-op merge behavior, and untrusted audit-only behavior.

## 4. Verification and Delivery

- [x] 4.1 Run full local verification and review.
  - Depends on: 3.2
  - Evidence: OpenSpec strict validation, tracking validation, tests/evals, workflow permission review, secret-pattern scan, and scope review pass.

- [x] 4.2 Complete formal OpenSpec Verify for M5-C2.
  - Depends on: 4.1
  - Evidence: verification report maps tasks, requirements, scenarios, design decisions, security controls, recovery paths, portability claims, and known limitations to current evidence.

- [x] 4.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 4.2
  - Evidence: implementation PR closes issue #41 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
