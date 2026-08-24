# M3-S1 — Strict-Review Artifact Delivery

Date: 2026-08-20
Status: Delivered and archived. Issue #219; implementation PR #220, Sync PR
#221, Archive PR #222.
Proposed change: `harden-strict-review-multistep-artifact-delivery`

## 1. Problem and desired outcome
Problem: The thin M2-S1 review loop is not yet strict; a genuine multi-step strict reviewer can finish without delivering the required terminal artifact.
Desired outcome: Every strict review returns one parent-owned schema-valid terminal artifact or exact unavailable evidence.

## 2. Evidence and key findings
- [Harness research](../../research/autonomous-agent-harness-landscape-2026/findings.md)
  supports deterministic control boundaries, least-authority workers,
  observable evidence, fault injection, and bounded recovery.
- The [main design](../autonomous-sdd-reliability-control-plane.md) supplies
  the shared architecture, invariants, role boundaries, and accepted sequencing
  that this slice must preserve.
- The [roadmap](../../plans/autonomous-sdd-reliability-control-plane-roadmap.md)
  is the authority for this slice's dependencies, readiness, execution order,
  and containing milestone exit evidence.
- The [earlier artifact-delivery brief](../strict-review-multistep-artifact-delivery.md)
  documents the concrete multistep capture failure and the terminal-artifact repair.

## 3. Options considered and tradeoffs
- Accept transcripts.
- Retry free-form instructions.
- Use host-owned capture and deterministic terminalization.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; strict review remains the production assurance boundary.
- Confirmed decisions: Reviewer output must arrive as a host-captured terminal
  artifact; transcripts and claimed success are not acceptance evidence.
- Approval evidence: The owner accepted an isolated independent reviewer role
  and exact evidence transport in the master design.
- Assumptions: A configured reviewer adapter can be exercised in a disposable
  live probe without enabling production Apply.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M3-S1 strict review capture, transport, terminalization, transcript rejection, cleanup, and live probes.
- Non-goals: Admission policy, exact-head correction policy, degraded fallback redesign, or production Apply.
- Constraints: Reviewer execution is read-only and isolated; capture must
  terminalize deterministically across success, failure, timeout, and crash.
- Dependencies: the M2-S1 thin review loop and M1 contracts; upgrade the thin
  loop to strict host-captured multi-step artifact delivery; reconcile any
  existing authoritative review change or worktree before Propose.
- Risks: Accepting a transcript, losing the terminal artifact, or leaving an
  ambiguous capture process would create false assurance.

### Proposed delivery contract

- The parent creates a sealed immutable review package and owns the only
  writable terminal-result destination.
- A fixed host adapter launches a fresh read-only reviewer, captures its
  lifecycle independently of the transcript, and terminalizes exactly once.
- Accepted results must validate schema, package digest, base/head commits,
  assurance, reviewer identity, and terminal status; prose and stdout never
  substitute for the artifact.
- Transport timeout, process loss, malformed result, missing file, and cleanup
  failure return typed unavailable or failure evidence without guessing success.

### Acceptance evidence

- Minimal, large-read, and genuine multi-step reviews all use this interface.
- Process exit before/after result creation yields one deterministic terminal
  record, never duplicate or conflicting results.
- Transcript-only and wrong-package results are rejected.
- Temporary resources clean exactly or retain an actionable recovery record.
- Existing strict-review delivery work is reconciled by source mapping before
  an older brief is considered superseded.

## 6. Open questions and blocking decisions
- Confirm the authoritative existing review change/worktree, if any.
- Finalize host capture and terminalization boundaries for each adapter.

## 7. Recommended next step
Recommendation pending owner confirmation: Reconcile existing review work, then Propose harden-strict-review-multistep-artifact-delivery.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
