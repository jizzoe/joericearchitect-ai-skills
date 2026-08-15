## 1. Lifecycle contract and safe diagnostics

- [x] 1.1 Define the versioned, digest-bound outer worktree-lifecycle request,
  response, ownership record, and finite safe diagnostic schema for creation,
  verification, and cleanup outcomes. Include canonical repository/sealed-head,
  expiration, and generated-destination constraints. Evidence: focused schema
  and validation fixtures.
- [x] 1.2 Extend independent-review launcher recovery validation so a selected
  worktree strategy requests the bounded lifecycle capability before view
  construction and rejects expired, mismatched, or unbound requests. Preserve
  strict/degraded and final-result contracts. Depends on: 1.1.

## 2. Host-owned view lifecycle

- [x] 2.1 Refactor detached review-view construction behind the validated outer
  capability with fixed Git argument vectors, a runtime-generated temporary
  root, canonical exact-head/detached verification, and no caller-controlled
  shell text, branch, or destination. Depends on: 1.1.
- [x] 2.2 Implement ownership-checked removal that validates the marker,
  request binding, root containment, and expected view before removing any
  worktree; classify partial-create and cleanup failures without unchecked
  deletion. Depends on: 2.1.
- [x] 2.3 Integrate the host launcher so it consumes the outer lifecycle
  response, propagates only safe request-bound diagnostics, and fails closed
  before inner review on construction or verification unavailability. Depends
  on: 1.2, 2.2.

## 3. Platform boundary and canonical documentation

- [x] 3.1 Wire Codex and Claude platform adapters to request the dedicated
  outer operation proactively only when the chosen strategy needs a Git-aware
  worktree. Keep canonical policy assistant-neutral and generated assistant
  wrappers thin. Depends on: 2.3.
- [x] 3.2 Update the independent-review protocol and related user-facing
  diagnostic guidance to describe the host/inner boundary, explicit archive
  strategy selection, safe unavailable results, and prohibition on manual
  owner-run recovery commands. Depends on: 3.1.
- [x] 3.3 Perform the portability and security review: verify a fixture second
  repository works through configuration and that no product paths, credentials,
  raw stderr, raw review/package content, generic escalation, or reviewer
  privilege expansion enters reusable assets. Depends on: 3.1, 3.2.

## 4. Deterministic evidence

- [x] 4.1 Add focused lifecycle fixtures for successful authorized creation and
  exact-head verification, ordinary sandbox denial, invalid request/commit,
  request expiration/binding rejection, and post-authorization failure. Depends
  on: 2.3.
- [x] 4.2 Add focused cleanup, verification-mismatch, safe-diagnostic, and
  inner-restriction fixtures that prove no unavailable setup becomes reviewer
  `passed`/findings output and no unsafe diagnostic fields persist. Depends on:
  2.3.
- [x] 4.3 Add adapter/protocol regression coverage that a changed head requires
  a fresh package, view, and review, and that production paths never emit a
  manual host/review command. Depends on: 3.2, 4.1, 4.2.
- [x] 4.4 Add safe strict reviewer-process diagnostics for Codex and Claude,
  including allowlisted authentication, sandbox/permission, network, output
  contract, repository-trust, and generic execution categories. Prefer a
  terminal specific cause over incidental warning text. Preserve only stable
  fields and optional numeric exit status; do not retain output, arguments,
  paths, or environment data. Depends on: 4.2.
- [x] 4.5 Define and validate one versioned, assistant-neutral diagnostic
  envelope and unavailable-outcome helper for the full independent-review
  control plane. Keep immutable reviewer-result contracts unchanged and bind
  durable diagnostic records to their sealed package/result. Depends on: 4.4.
- [x] 4.6 Convert package, archive/worktree, adapter preflight/process/result,
  launcher host, parent transport, and recovery-acceptance failures to emit or
  preserve the shared envelope. Add deterministic propagation, redaction, and
  boundary coverage. Depends on: 4.5.

## 5. Verification and delivery evidence

- [x] 5.1 Run focused lifecycle and adapter tests, the full Node suite,
  adapter-drift/thin-wrapper checks, whitespace and secret-pattern review,
  `openspec validate harden-independent-review-worktree-lifecycle --strict`,
  and `openspec validate --all --strict`; record only non-sensitive evidence.
  Depends on: 3.3, 4.3.
- [ ] 5.2 Obtain a fresh exact-head independent review under the repaired
  lifecycle; resolve or record all findings under the canonical review policy.
  Do not reuse a result after the head changes. Depends on: 5.1.
- [ ] 5.3 Complete authorized delivery artifacts and PR linkage, including
  `OpenSpec change: harden-independent-review-worktree-lifecycle`; do not
  create or mutate GitHub tracking, Sync, Archive, or merge without the
  applicable separate authorization. Depends on: 5.2.
