# Independent-review assurance and profiles

Date: 2026-08-17

Status: Canonical review-architecture brief. It consolidates implemented
contracts, delivered history, known reliability gaps, and unselected profile
alternatives without changing current behavior.

## 1. Problem and desired outcome

Independent review is specified and substantially implemented, but its design
history is spread across isolation, degraded recovery, result transport,
worktree lifecycle, configuration discovery, inspection environment, and
delivery-profile briefs. Some are delivered, some record live gaps, and one
proposes profile behavior that conflicts with the current durable shorthand.

The desired outcome is one map of assurance levels, exact-head lineage,
admission, dispatch, result transport, correction/rereview, and recovery. A
planner should be able to distinguish current requirements from proposed
repairs and should never infer that a local review, a fresh context, or a
degraded reviewer has strict-independent assurance.

## 2. Evidence and key findings

Current observable behavior is owned by
[isolated independent review](../../openspec/specs/isolated-independent-review/spec.md),
[authorized degraded review](../../openspec/specs/authorized-degraded-independent-review/spec.md),
[bounded autonomous execution](../../openspec/specs/bounded-autonomous-execution/spec.md),
and [SDD lifecycle](../../openspec/specs/sdd-lifecycle/spec.md).

Delivered historical decisions establish:

- sealed immutable packages, distinct reviewers, pinned read-only views,
  schema-valid durable results, finding dispositions, correction, and
  exact-head rereview ([isolation](archived/isolated-autonomous-independent-review.md));
- explicit, expiring, exact-package authorization and reduced-assurance labels
  for strict-first degraded recovery
  ([degraded review](archived/authorized-degraded-independent-review.md));
- final-artifact-only acceptance and safe stage diagnostics
  ([result transport](archived/independent-review-result-transport-reliability.md));
- bounded host-owned detached-worktree construction/cleanup with reviewer
  authority unchanged
  ([view lifecycle](archived/independent-review-worktree-lifecycle-and-diagnostics.md)); and
- narrow eligibility for the durable strict
  `review-launcher-codex-result-artifact-missing` outcome under an already
  authorized degraded policy
  ([artifact-missing recovery](archived/autonomy/allow-artifact-missing-degraded-review-recovery.md)).

Known or proposed work remains:

- a real multi-step Codex review can inspect successfully and exit without the
  required owned terminal artifact; transcript/stdout remains unacceptable
  ([multi-step transport evidence](archived/autonomy/strict-review-multistep-artifact-delivery.md));
- source guessing can falsely declare a configured strict reviewer absent;
  discovery should use explicit provenance and the sealed parent request
  ([configuration provenance](archived/autonomy/independent-review-configuration-provenance.md));
- sanitized launch-context toolchain parity may be needed for typed missing-tool
  failures, but only after host-owned semantic inspection is insufficient
  ([inspection fallback](archived/autonomy/independent-review-inspection-environment-fallback.md)); and
- the proposed same-session prototype policy conflicts with current shorthand,
  which resolves prototype delivery to strict-first-degraded
  ([prototype alternative](archived/autonomy/prototype-rapid-same-session-review.md)).

## 3. Assurance and profile model

| Mechanism | Separation | May mutate source | Assurance label | Current role |
| --- | --- | --- | --- | --- |
| Same-session local review | Implementer session; no independent actor claim | Within the already authorized implementation loop | `local-review` only | Required proportional verification evidence; never production independent-review evidence. |
| Fresh scoped verifier | New bounded context/attempt; producer-separated when configured | Source-read-only for verification | verification evidence, not independent review | Proposed work-unit specialization. |
| Strict independent review | Fresh distinct reviewer, immutable exact-head package/view, strict read-only capabilities | No | `strict-isolated` | Required production assurance when selected and available. |
| Authorized degraded review | Fresh separate reviewer with exact bounded capabilities after an eligible strict-unavailable precursor | No | `authorized-degraded` | Reduced-assurance recovery only under precise, current authorization. |

Current durable profile behavior remains authoritative until changed through
its owning requirements: production requires independent-review evidence; the
target-explicit prototype shorthand currently selects strict-first-degraded.
The same-session prototype brief is an alternative, not an implemented policy.

## 4. Review pipeline and decisions

One dispatcher should own the complete flow:

1. **Admission and configuration provenance.** Resolve the allowed reviewer
   source, executable identity, platform adapter, strict/degraded policy,
   capabilities, and transport readiness before Apply when strict-only review
   is mandatory. Record safe provenance and digests, not credentials or raw
   environment.
2. **Sealed package.** Bind selected change, immutable base/head, changed paths,
   relevant OpenSpec artifacts, Apply/verification evidence, correction chain,
   package digest, reviewer identity requirements, and result destination.
3. **Host-owned view and launch.** Construct the exact detached view through a
   bounded outer lifecycle operation. Launch a fixed, sealed, no-network,
   credential-scrubbed reviewer that cannot inherit repository customization or
   implementation authority.
4. **Owned result transport.** Accept only the parent-owned final artifact or a
   formally versioned terminal event captured into it. Reject transcript,
   stdout, intermediate JSON, missing/duplicate/late terminal events, invalid
   schema, binding mismatch, and cleanup failure with distinct safe codes.
5. **Validation and lineage.** Bind the normalized result to package digest,
   reviewer, attempt, base/head, transition, authorization, and expiry. A code
   or review-relevant artifact change invalidates the result.
6. **Findings and correction.** Every finding receives an evidence-backed
   resolution. Objective fixes use bounded correction and require verification
   plus a fresh package/rereview of the new head. Material judgment pauses.
7. **Strict-first recovery.** Only an allowlisted, exact-package durable strict
   unavailable result may enter a separately authorized degraded path. The
   accepted result retains the strict precursor and never claims strict
   assurance.

Review evidence should normally bind to a code head and assurance contract,
then be reused by later non-code lifecycle transitions while all relevant
inputs remain current. Re-reviewing identical code at merge, Sync, Archive,
and cleanup adds transport risk without added code assurance. The exact reuse
boundary remains an owner decision and must be enforced by the lifecycle graph,
not inferred by callers.

## 5. Scope, non-goals, constraints, dependencies, and risks

This brief owns review admission, profile compatibility, dispatch, isolation,
view lifecycle, result transport, evidence lineage, finding resolution,
rereview, and degraded recovery. It links to living specs rather than copying
their normative requirements.

It does not accept self-review or a transcript as independent evidence, widen
reviewer network/credential/write authority, make degraded review equivalent to
strict isolation, decide the prototype alternative editorially, or use
repository content to select an executable or runtime configuration.

Primary risks are false availability/unavailability, final-event ambiguity,
stale-head reuse, capability broadening during fallback, and misleading
assurance labels. Fail closed with explicit source provenance, live transport
probes, fixed host adapters, exact bindings, exhaustive outcome classification,
and labels carried through status and delivery evidence.

## 6. Open questions and blocking decisions

- Decide whether `prototype-rapid` remains strict-first-degraded or becomes
  same-session-local. If changed, use one versioned profile/policy matrix across
  resolver, authorization, workflow, docs, and tests; do not allow both meanings.
- Prove a stable host-owned terminal artifact/event contract for real
  multi-step Codex and Claude review before claiming strict transport ready.
- Decide whether reviewer authority may come only from the sealed delivery
  request or also from a separately schema-validated product-owned runtime
  configuration.
- Define the exact review-relevant inputs and non-code transitions covered by
  one current exact-head review.
- Select semantic host inspection versus sanitized launch-context toolchain
  parity for typed missing-tool failures; never inherit the full host
  environment.

## 7. Recommended next step

Keep current living requirements authoritative. Resolve the prototype profile
decision separately, then sequence remaining work as: configuration/admission
provenance, proven multi-step terminal transport, one dispatcher with exhaustive
codes, exact-head reuse rules, and conditional inspection fallback. Release
evidence must include real multi-step review acceptance, not only fixtures that
write the expected result artifact themselves.
