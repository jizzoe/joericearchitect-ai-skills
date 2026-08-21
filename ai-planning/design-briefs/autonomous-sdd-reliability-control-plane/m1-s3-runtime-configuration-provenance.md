# M1-S3 — Runtime Configuration Provenance

Date: 2026-08-21
Status: Delivered and archived; owner confirmation recorded.
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
- Read configuration lazily. Rejected because different gates could consume
  different sources after admission, making recovery and audit non-reproducible.
- Use only the sealed request. Rejected because every caller would need to
  repeat safe repository defaults and adapter declarations, while the runtime
  would lose one reusable product configuration source.
- Resolve approved defaults before admission and seal the consumed shape.
  Selected because it preserves one authoritative run snapshot while allowing
  validated, non-secret product defaults.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; configuration authority and precedence require owner acceptance.
- Confirmed decisions: Admission freezes intent, normalized non-secret
  configuration, provenance, and digests; live permissions and capabilities
  are revalidated before every external action.
- Owner-confirmed decisions recorded on 2026-08-21:
  - Use a bounded layered resolver. The sealed request owns target, profile,
    review policy, expiry, mutation scope, and other authority. Validated
    product configuration may supply only allowlisted non-secret defaults and
    adapter declarations. Runtime probes supply live capability facts only.
  - Extend the validated `config/ai-skills.json` through a versioned runtime
    namespace and one canonical loader. Do not add a second runtime config
    authority or store credentials, standing grants, or sealed reviewer
    identity/attestation there.
  - Fail closed on conflicts involving authority, identity, policy, paths,
    providers, or reviewers. Precedence may fill only absent safe defaults.
- Implementation guardrails confirmed with the architecture: freeze intent and
  configuration at admission, recheck live capabilities before external
  actions, and persist only redacted source metadata and digests.
- Approval evidence: Owner confirmation was supplied on 2026-08-21. A formal
  runtime confirmation receipt/digest has not been captured.
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
- The source-authority matrix is fixed: sealed request for authority, validated
  product config for safe defaults, and runtime probes for live facts. User
  conversation and ambient environment are not reread as configuration after
  admission.
- A snapshot records resolver/schema version, safe source identifiers, selected
  field names, redacted workspace-relative paths, and SHA-256 digests. It never
  records raw environment values, credentials, absolute user paths, arbitrary
  config text, or attestation material.

### Acceptance evidence

- Precedence fixtures prove equivalent resolution from every worktree and reject
  conflicts, unknown fields, unsafe paths, secret-shaped values, and stale proof.
- Serialization/digest tests bind the consumed snapshot to the admitted run.
- Runtime tests prove no helper rereads environment or guesses a later config
  source after admission.
- Existing independent-review configuration provenance is mapped or explicitly
  superseded rather than duplicated.

## 6. Open questions and blocking decisions

No owner-blocking decisions remain for M1-S3. The following implementation
guardrails must be made executable in the proposal:

- Snapshot intent, normalized configuration, source provenance, and digests at
  admission; never reread a later configuration source to change them.
- Recheck authorization, runtime permission, credential presence and identity,
  repository/worktree/head, external record state, claim ownership, adapter
  capability, reviewer availability, deadline, and evidence freshness before
  each external action.
- Reject unknown fields, unsafe paths, secret-shaped values, conflicting
  authority, stale proof, and any source that is not explicitly declared.
- Persist safe provenance sufficient to diagnose wrong-source selection without
  exposing secrets or sensitive runtime contents.

## 7. Recommended next step

The accepted design was delivered and archived as
`establish-autonomous-sdd-runtime-config-provenance`. Any follow-up should
begin from the archived OpenSpec evidence and the implemented runtime contract,
not recreate this proposal.
