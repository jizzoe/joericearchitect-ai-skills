# Strict Review Multi-Step Artifact Delivery

Date: 2026-08-16

Status: Propose-ready design brief. This brief does not authorize an Apply,
review waiver, delivery, or acceptance of a transcript as review evidence.

## 1. Problem and desired outcome

A production-rapid, `strict-only` SDD delivery correctly paused when two fresh
sealed Codex strict-review attempts completed tool-driven inspection but did
not create the exclusively owned file passed through `--output-last-message`.
The parent consumer therefore returned
`review-launcher-codex-result-artifact-missing` and removed each owned review
view. It must continue to fail closed: no transcript, stdout, JSONL fragment,
self-review, or degraded-review substitution can satisfy this authorization.

The desired outcome is a strict Codex transport that reliably produces a
schema-valid, parent-owned terminal result artifact after a real multi-step
read-only review, or emits a precise, safe, actionable unavailable record that
distinguishes terminal-event absence from other runtime failures. It must make
the strict-only gate dependable without relaxing its sealed view, no-network,
credential denial, distinct-reviewer, exact-package, or artifact-only evidence
boundaries.

## 2. Evidence and key findings

The following diagnostics were performed against the exact paused delivery
head, using the configured pinned strict transport and fresh owned views:

| Diagnostic | Result | Conclusion |
| --- | --- | --- |
| Two fresh strict reviews | Each exited `0`, performed read-only inspection, and left no owned final-result file. | The delivery pause is real and the parent consumer correctly rejected it. |
| Installed CLI capability check | `codex-cli 0.147.0` advertises `--output-schema` and `--output-last-message`. | The failure is not a missing CLI flag or unsupported invocation argument. |
| Minimal sealed output probe | The identical executable, sealed environment, read-only policy, schema, and output-file mechanism emitted a valid 51-byte findings JSON file. | The result-file channel works for a simple non-tool invocation. |
| Large-package read probe | A sealed invocation read the 146,798-byte package and emitted the same valid final file. | Package size and one large read are not sufficient causes. |
| Real review transcripts | The reviewer performed multiple autonomous inspection calls and then exited without the final artifact. | The failure is specific to the multi-step, tool-driven review flow. |

The package is a secondary protocol defect: it is JSON-minified into two lines
while embedding a 141,323-byte, 2,154-logical-line Git diff. The current
review prompt permits line-oriented `awk`; a supposedly bounded read can
therefore print the complete package. The large-read probe disproves this as
the direct cause of missing output, but it remains a source of excessive tool
output, non-deterministic review behavior, and weak bounded-read guarantees.

The available safe diagnostics cannot prove the internal Codex termination
condition after the final tool call. The root cause established by evidence is
therefore a transport-contract gap, not a claim about a specific Codex service
or model defect: the parent treats `--output-last-message` as reliable after a
free-form, multi-step tool session, but that behavior has not been proven and
has now failed twice with exit status `0`.

Relevant durable sources:

- [result-transport reliability brief](archived/independent-review-result-transport-reliability.md)
  already recommends a fixed host-owned event-capture adapter if the CLI cannot
  guarantee final-file handoff.
- [archived strict transport design](../../openspec/changes/archive/2026-08-15-harden-strict-review-artifact-transport/design.md)
  added artifact-only acceptance and safe unavailable diagnostics, but its
  live acceptance evidence did not prove a multi-step tool-driven review.
- [platform adapter](../../scripts/sdd/platform-review-adapters.mjs) writes the
  review package as one `JSON.stringify` line and invokes the free-form review
  prompt with `--output-last-message`.
- [transport adapter tests](../../scripts/sdd/test/platform-review-adapters.test.mjs)
  manually write the success artifact in the parent-consumer fixture, so they
  do not exercise the actual CLI path after multiple tool calls.
- [inspection-environment fallback brief](independent-review-inspection-environment-fallback.md)
  is related only at the unavailable-result boundary: it addresses missing
  toolchain capability in degraded review, which the present strict review did
  not exhibit.
- OpenAI's model documentation confirms structured-output support but does not
  specify `codex exec --output-last-message` semantics after a tool-driven run:
  <https://developers.openai.com/api/docs/models/gpt-5-codex>.

## 3. Options considered and tradeoffs

### A. Accept the terminal transcript or stdout when the file is absent

Rejected. Tool output, intermediate JSON, and repository-controlled content
can resemble a findings payload. Treating any of them as durable review
evidence would weaken the current provenance and injection boundaries.

### B. Retry the same free-form review until a file appears

Rejected as the primary repair. A bounded retry can be useful for a typed,
transient transport error, but repeated retries alone do not make the final
artifact deterministic and can consume the autonomous delivery window without
new evidence.

### C. Use a fixed host-owned terminal-event capture adapter

Recommended. Run the pinned reviewer through a fixed, versioned adapter that
receives its documented structured event stream, accepts only one expected
terminal structured event after validation, and atomically writes the existing
owned result artifact. The parent then applies the unchanged schema, package,
reviewer, and cleanup validation. The adapter accepts no repository-controlled
executable, command, path, event type, or arbitrary arguments.

This preserves artifact-only acceptance while removing reliance on an implicit
CLI side effect after arbitrary tool loops. It must not treat free-form stdout
as a fallback; it must parse only a versioned terminal event emitted by the
pinned Codex CLI and prove that no later event can supersede it.

### D. Eliminate free-form shell inspection from the strict reviewer

Recommended as a complementary hardening measure. Provide a bounded package
index and host-owned, capped read/list/search/diff operations, or provide a
pre-chunked review capsule. This reduces non-deterministic tool behavior and
prevents one-line JSON from defeating output limits. It is not by itself an
artifact-delivery guarantee, so it cannot replace Option C.

### E. Use the existing degraded inspection-environment fallback

Rejected for this failure. The strict reviewer had working read tools and
strict-only authorization forbids degraded review. That separate proposal may
remain useful for its own typed degraded-toolchain failure.

## 4. Decisions, assumptions, and owner record

**Evidence-derived recommendation (not yet owner-approved):** create a
separate OpenSpec change for strict multi-step artifact delivery. Preserve the
existing strict-only gate and replace only the unproven final-result handoff.

**Decisions already established by the active delivery authorization:**

1. `strict-only` remains fail closed; no degraded or transcript fallback is
   permitted.
2. Review evidence remains bound to the exact immutable package, a fresh
   distinct reviewer, the current head, and an exclusively owned final result
   artifact.
3. The parent retains only safe diagnostics and removes owned sealed views on
   every path.

**Assumptions to validate during Propose:**

- The installed pinned CLI's JSON event stream has a stable terminal event that
  can be allowlisted and safely captured by a fixed host-owned adapter.
- The adapter can atomically create the already-required parent-owned final
  artifact outside the sealed read-only view.
- If no stable terminal event exists, the proposal must pause rather than
  invent a transcript parser; the compatible alternative is a no-tool,
  pre-chunked review capsule with an independently proven final-file contract.

**Owner and approval:** No new owner decision is required to propose this
bounded repair. Apply must obtain normal explicit authorization for the named
change. The active delivery remains paused at its strict-review gate.

## 5. Scope, non-goals, constraints, dependencies, and risks

### Scope

- Add a versioned, fixed host-owned terminal-event capture transport for the
  pinned Codex strict-review invocation, or a proven equivalent artifact
  protocol.
- Preserve the existing parent-owned result-file contract and downstream
  sealing, validation, authorization, and cleanup behavior.
- Emit safe, durable diagnostics that distinguish at least: no terminal event
  after exit `0`, nonzero execution, unsupported event contract, malformed
  terminal event, atomic-write failure, and final-artifact validation failure.
- Replace one-line package injection with a bounded index plus chunked review
  content, and make tool-read bounds byte-aware rather than line-only.
- Add deterministic replay fixtures and live acceptance probes covering a
  multi-step review of a large package, including an exact terminal artifact.
- Update the canonical independent-review protocol and thin platform exposure
  only where their contract changes.

### Non-goals

- No transcript, stdout, JSONL-fragment, or self-review acceptance fallback.
- No degraded-review fallback for strict-only authorization.
- No network access, credentials, workspace/Git/GitHub writes, deployment,
  release, external messaging, or arbitrary command execution by the reviewer.
- No modification to the paused delivery merely to waive or bypass its review.
- No product-specific executable paths, repositories, tokens, or raw review
  content in reusable assets or durable diagnostics.

### Constraints and dependencies

- The fix composes with the existing `isolated-independent-review` schemas,
  parent strict transport, executable identity sealing, and owned-view cleanup.
- The capture adapter must be a parent-owned fixed argv implementation; its
  input parser and event schema need independent review because they become a
  new trust boundary.
- The diagnostic surface must retain metadata only: CLI version, transport
  revision, exit status, terminal-event classification/count, capped byte
  totals, artifact receipt state, and cleanup result. It must not retain event
  bodies, shell output, temporary paths, credentials, or package content.

### Risks and mitigations

- [Event capture accepts an intermediate event] → allowlist exactly one terminal
  event type, require end-of-stream, reject duplicates/later events, and bind
  the payload to the exact schema before atomic artifact creation.
- [Bounded package data omits a material diff section] → include a manifest
  with chunk digests and require the reviewer/capture record to identify all
  reviewed chunks or explicitly classify scope insufficiency as unavailable.
- [A new wrapper weakens isolation] → keep it parent-owned, fixed-argv,
  no-network, credential-scrubbed, and outside the review view; test every
  protected mutation denial.
- [CLI behavior changes] → require a version/capability preflight and a live
  multi-step artifact probe before strict-only delivery; pause on mismatch.

## 6. Open questions and blocking decisions

The proposal must answer these implementation questions before Apply:

1. What exact Codex CLI JSON event marks an authoritative final structured
   response in the pinned version, and can the adapter prove no later event
   supersedes it?
2. Should review data be exposed through a no-tool pre-chunked capsule or a
   fixed host-owned read capability set? The selected approach must preserve
   full changed-path coverage and byte bounds.
3. Is one retry allowed for the typed `exit-0-no-terminal-event` condition?
   If so, it needs an independent attempt budget and must not consume an
   objective-correction budget.
4. Which minimal safe metadata is sufficient for an operator to distinguish
   an upstream CLI/event-stream failure from adapter, schema, or cleanup
   failure without retaining review content?

These are implementation choices, not grounds to weaken the current strict
gate. If the first question cannot be proven from the pinned runtime, the
change must pause and recommend a supported CLI/runtime upgrade or a separately
authorized transport alternative.

### 2026-08-16 delivery-recovery impact

A subsequent `production-rapid`, `strict-first-degraded` delivery encountered
the same exact-head strict result code,
`review-launcher-codex-result-artifact-missing`, after retaining two fresh
parent-strict unavailable records. Its configured degraded launch path remained
correctly unavailable: `validateReviewLauncherRecovery` currently permits the
Codex detached-review launcher only after
`independent-review-view-create-failed` or
`independent-reviewer-nested-app-server-denied`. It therefore returned
`review-launcher-failure-not-recoverable` before any degraded view or reviewer
was created.

This is a distinct recovery-policy consequence of the documented artifact
transport gap, not evidence that a degraded review ran or that the strict gate
may be bypassed. The proposed strict transport repair must decide whether a
durably classified, exact-package `review-launcher-codex-result-artifact-missing`
result is eligible for the already-authorized fresh-separated-reviewer-only
fallback. If it is, the change must preserve the strict precursor, exact
package/head binding, active expiration, runtime receipt, capability ledger,
and explicit `authorized-degraded` label. If it is not, the recovery contract
must state that `strict-first-degraded` pauses for this code until the strict
artifact transport is repaired. No current delivery may infer either choice.

The owner subsequently selected the eligible degraded-recovery option and a
focused implementation produced a canonical, exact-package strict precursor.
A fresh, separately identified Codex degraded reviewer then performed its
sealed review but also exited without its required owned final-result artifact.
The parent correctly returned the same
`review-launcher-codex-result-artifact-missing` code and rejected its
transcript. This confirms the multi-step artifact transport defect affects the
current Codex degraded path as well as strict review; the recovery-policy
change alone cannot satisfy a production delivery gate. The fixed host-owned
artifact transport remains the required repair before either path can provide
accepted evidence.

## 7. Recommended next step

Run OpenSpec Propose for a focused change named
`harden-strict-review-multistep-artifact-delivery`. The proposal should define
delta requirements for `isolated-independent-review`, include the event-capture
and bounded-package contracts, and require deterministic replay plus a real
multi-step live acceptance probe before it can claim repair. Keep the current
`complete-bounded-autonomous-sdd-delivery` change paused at strict review until
that repair is delivered and a fresh exact-head strict review produces a valid
owned artifact.
