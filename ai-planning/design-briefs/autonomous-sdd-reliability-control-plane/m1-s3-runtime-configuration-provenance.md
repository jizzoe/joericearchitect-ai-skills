# M1-S3 — Runtime Configuration Provenance

Date: 2026-08-20
Status: Draft for owner review; no OpenSpec artifacts or implementation exist.
Proposed change: `establish-autonomous-sdd-runtime-config-provenance`

## 1. Problem and desired outcome
Problem: Runtime and review configuration can be discovered from conflicting files, environment, and conversational context.
Desired outcome: Admission consumes one validated, immutable, redacted configuration snapshot with explicit provenance and precedence.

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
- The [configuration-provenance brief](../independent-review-configuration-provenance.md)
  documents a concrete failure caused by inferring the wrong review configuration source.

## 3. Options considered and tradeoffs
- Read configuration lazily.
- Use only the sealed request.
- Resolve approved defaults before admission and seal the consumed shape.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; configuration authority and precedence require owner acceptance.
- Confirmed decisions: Admission freezes intent, normalized non-secret
  configuration, provenance, and digests; live permissions and capabilities
  are revalidated before every external action.
- Approval evidence: The owner accepted immutable-intent/live-revalidation
  separation and requested this brief; exact source authority remains open.
- Assumptions: Repository and user configuration may coexist only through one
  deterministic precedence resolver with typed validation.

## 5. Scope, non-goals, constraints, dependencies, and risks
- Scope: M1-S3 configuration schema, sources, precedence, provenance, validation, snapshot, and redaction.
- Non-goals: Persisting credentials, granting standing authority, or implementing backend and reviewer behavior.
- Constraints: Never persist credentials, raw environment dumps, or standing
  authority; status and logs expose redacted provenance only.
- Dependencies: M1-S1 schema ownership; may be designed alongside M1-S2 but
  merges only after the shared record boundary is settled.
- Risks: Hidden precedence, snapshotting secrets, or treating stale admission
  capabilities as live authority could produce unsafe unattended mutations.

### Proposed contract

- A resolver reads only declared product-owned sources in fixed precedence,
  validates one schema, records safe provenance, and emits an immutable snapshot.
- The snapshot covers canonical paths, backend and claim-provider selection,
  reviewer/adapter identity, evidence destinations, attestations, policies, and
  redacted capability availability.
- Credentials, raw environment values, user-specific absolute paths, mutable
  standing authority, and unvalidated fallback sources are excluded.
- Admission consumes the resolver output unchanged; later transitions recheck
  live permissions and capabilities without mutating frozen intent.

### Acceptance evidence

- Precedence fixtures prove equivalent resolution from every worktree and reject
  conflicts, unknown fields, unsafe paths, secret-shaped values, and stale proof.
- Serialization/digest tests bind the consumed snapshot to the admitted run.
- Runtime tests prove no helper rereads environment or guesses a later config
  source after admission.
- Existing independent-review configuration provenance is mapped or explicitly
  superseded rather than duplicated.

## 6. Open questions and blocking decisions
- Is the sealed request the sole authority, or may validated product defaults
  supply values before admission?
- Which capability facts must remain live checks rather than snapshot fields?

## 7. Recommended next step
Recommendation pending owner confirmation: Resolve configuration authority, then Propose establish-autonomous-sdd-runtime-config-provenance.
Recommended workflow action: OpenSpec Explore. No OpenSpec artifacts were created.
