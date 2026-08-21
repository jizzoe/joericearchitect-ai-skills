# M1-S3 — Runtime Configuration Provenance

Date: 2026-08-20
Status: Proposal-ready pending owner confirmation; no OpenSpec artifacts exist.
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

- Read configuration lazily at each transition. This preserves late changes,
  but allows different gates and adapters to consume different sources after
  admission. It is incompatible with immutable intent and exact recovery.
- Use only the sealed request. This gives the strongest single authority and
  simplest provenance, but forces every non-secret path, adapter, and backend
  default into every caller and prevents repository-owned reusable defaults.
- Resolve approved product defaults before admission and seal the consumed
  shape. This preserves one authoritative run snapshot while allowing a
  validated repository configuration to provide safe defaults. It is the
  recommended option, provided risk-bearing authority cannot be supplied by
  defaults and conflicts fail closed.

## 4. Decisions, assumptions, and owner
- Owner: Initiative owner; configuration authority and precedence require owner acceptance.
- Confirmed architectural direction: Admission freezes intent, normalized
  non-secret configuration, provenance, and digests; live permissions and
  capabilities are revalidated before every external action.
- Evidence-backed recommendation, pending owner confirmation: use a bounded
  layered resolver in which the sealed request owns run intent and authority,
  the validated product-owned config supplies only non-secret defaults and
  adapter declarations, and environment/runtime probes supply live capability
  facts only. Conflicts never resolve by silent precedence.
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

The following are the remaining owner decisions. The recommended actions make
the slice proposal-ready; they do not claim that the owner has accepted them.

### M1-S3-Q1 — Which source is authoritative before admission?

| Action | Impact | Tradeoffs |
|---|---|---|
| Make the sealed request the sole source | Every admitted value comes from the exact caller request. | Strongest provenance and least ambiguity, but callers must repeat safe defaults and the runtime cannot reuse repository-owned adapter/path declarations. |
| Make product configuration authoritative | Repository policy supplies the run shape. | Convenient and centrally maintainable, but a file can silently widen authority or override an explicit owner request. |
| Use a bounded layered resolver | The request owns target, profile, policy, expiry, mutation scope, and other authority; validated product config fills only allowlisted non-secret defaults; runtime probes report live facts. | Slightly more schema and precedence work, but preserves explicit authority and reusable defaults without lazy rereads. |
| Merge arbitrary environment, user config, and conversation context | Maximum flexibility. | Source confusion, secret leakage, and non-reproducible runs; reject. |

Recommendation: use the bounded layered resolver. Explicit authority fields
must be present in the sealed request and cannot be supplied by config. Safe
defaults may be filled from one validated product-owned config before sealing.
The resolver records the source and digest for every consumed field.

### M1-S3-Q2 — Where should product-owned runtime defaults live?

| Action | Impact | Tradeoffs |
|---|---|---|
| Extend the validated product config (`config/ai-skills.json`) | Reuses the existing schema validator and one repository-owned configuration entry point. | Requires a versioned schema extension and careful separation between planning defaults and runtime authority. |
| Add a second runtime-specific config file | Makes runtime concerns visually separate. | Creates another discovery surface and risks reproducing the two-schema failure already documented by the main design. |
| Use only user/global runtime configuration | Works across repositories without checked-in changes. | Weakens repository reproducibility, complicates worktree discovery, and can change behavior without a repository review. |

Recommendation: extend the existing validated product configuration through a
versioned runtime namespace and one canonical loader. Keep it workspace-relative
and non-secret. Do not make it the source of credentials, standing grants, or
the sealed parent strict-review identity/attestation. If a future deployment
requires a separate host secret store, it must be an explicit live capability
provider rather than an additional config authority.

### M1-S3-Q3 — How should source conflicts resolve?

| Action | Impact | Tradeoffs |
|---|---|---|
| Let higher-precedence sources silently win | Keeps runs moving. | A changed config can alter a requested operation without an explicit stop; unsafe for unattended mutation. |
| Merge fields from all sources | Preserves more values. | Field-level merges are difficult to audit and can combine incompatible identities, paths, or policies. |
| Fail closed on authority conflicts and use precedence only for absent safe defaults | A conflicting run pauses with the exact fields and source digests. | More pauses and more migration work, but the resulting snapshot is explainable and deterministic. |

Recommendation: use precedence only to fill an absent, non-authoritative,
allowlisted default. Any conflict involving target, profile, review policy,
expiration, mutation scope, adapter identity, backend/history, claim provider,
or reviewer identity pauses before admission completes.

### M1-S3-Q4 — Which facts are frozen and which must remain live?

| Action | Impact | Tradeoffs |
|---|---|---|
| Snapshot every fact at admission | Stable replay and simple status. | Credentials, permissions, branch protection, external records, and claims can become stale and incorrectly authorize later mutations. |
| Re-resolve every fact before every transition | Freshest state. | Allows config drift to change intent mid-run and makes recovery non-reproducible. |
| Freeze intent/configuration and recheck live capabilities | Stable authority plus current safety checks. | Requires a clear field classification and more preflight evidence, but matches the architecture and threat model. |

Recommendation: use the hybrid model. Freeze normalized intent, operation
graph/profile, paths, adapter/provider bindings, evidence destinations, safe
provenance, and digests. Recheck before each external action: current
authorization/runtime permission, credential presence and identity (never the
secret), repository/worktree/head, branch protection and external record
state, claim ownership, adapter executable/capability, reviewer availability,
clock/deadline, and evidence freshness.

### M1-S3-Q5 — What provenance is safe to persist?

| Action | Impact | Tradeoffs |
|---|---|---|
| Persist raw paths, environment, and loader output | Best debugging detail. | Leaks user paths, command environment, credentials, and sensitive reviewer data; reject. |
| Persist only the final snapshot digest | Minimal exposure. | Cannot explain which source supplied a value or diagnose precedence errors. |
| Persist redacted source metadata plus field/snapshot digests | Supports audit and wrong-source diagnosis without retaining secrets. | Requires a redaction allowlist and digest coverage tests; recommended. |

Recommendation: persist source kind, stable safe identifier, schema/resolver
version, selected field names, redacted workspace-relative paths, and SHA-256
digests. Exclude raw environment values, credentials, absolute user paths,
attestation material, and arbitrary config text.

## 7. Recommended next step

Recommendation: after owner confirmation of M1-S3-Q1 through Q3 (Q4 and Q5 are
implementation guardrails), run OpenSpec Propose for
`establish-autonomous-sdd-runtime-config-provenance`. The proposal should
define the source-authority matrix, versioned config shape, conflict behavior,
snapshot/live classification, and redacted provenance record, then add
fixtures proving every gate consumes the sealed snapshot unchanged. No
OpenSpec artifacts have been created.
