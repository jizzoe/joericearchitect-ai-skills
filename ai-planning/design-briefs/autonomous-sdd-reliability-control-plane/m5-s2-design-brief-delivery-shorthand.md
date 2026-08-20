# M5-S2 — Design-Brief Delivery Shorthand

Date: 2026-08-20
Status: Draft for owner review; blocked on M5-S1 and profile resolution.
Proposed change: `add-autonomous-design-brief-delivery-shorthand`

## 1. Problem and desired outcome
Problem: A concise design-brief delivery request could create fuzzy selection, hidden defaults, or a second runner.
Desired outcome: implement design brief name deterministically resolves or resumes one canonical run and returns its ID.

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

## 3. Options considered and tradeoffs
- Use a free-form prompt.
- Build a shorthand-specific executor.
- Use a thin resolver that displays and seals exact inputs.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; defaults and ambiguity policy require owner acceptance.
- Confirmed decisions: Shorthand is a thin resolver into the canonical runner,
  never a second executor; it displays, normalizes, and seals exact inputs.
- Approval evidence: The owner requested eventual “implement design brief”
  shorthand but deferred it until after reliable single-change delivery.
- Assumptions: Brief identity, current run state, and accepted profile can be
  resolved deterministically without conversational inference.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M5-S2 brief discovery, exact selection, defaults and overrides, resume-or-create behavior, normalization, and run ID response.
- Non-goals: Standing authority, fuzzy matching, hidden profile changes, second lifecycle policy, or gate bypass.
- Constraints: No fuzzy selection, hidden defaults, standing authority, profile
  downgrade, or bypass of admission and review gates.
- Dependencies: M5-S1, M1-S2, and resolution of the prototype-profile policy.
- Risks: Convenience syntax could conceal material choices or fork lifecycle
  behavior unless it remains a narrow input adapter.

### Proposed resolver

- Parse only the explicit shorthand shape, discover exact candidate briefs under
  configured roots, and reject zero, multiple, fuzzy, or path-escaping matches.
- Display resolved repository, brief, profile, review policy, expiry, defaults,
  and overrides before sealing the request.
- If an exact current run already owns the brief, return/resume that run;
  otherwise enter Propose once through the canonical engine and return its ID.
- Claude and Codex wrappers remain thin and produce byte-equivalent normalized
  controller input for equivalent requests.

### Acceptance evidence

- Exact, missing, duplicate-name, unsafe-path, expired-default, conflicting-run,
  and resume fixtures return deterministic results.
- No standing authority, hidden profile, automatic Apply, second runner, or
  direct lifecycle mutation is introduced.
- Equivalent assistant invocations normalize identically and cache-refresh
  checks expose newly generated wrappers.
- Status always names the resolved brief, run ID, selected profile, and next
  allowed action or pause reason.

## 6. Open questions and blocking decisions
- Confirm the canonical prototype profile before exposing defaults.
- Decide whether brief identity is path-only or path plus immutable digest.

## 7. Recommended next step
Recommendation pending owner confirmation: After M5-S1 and profile resolution, Propose add-autonomous-design-brief-delivery-shorthand.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
