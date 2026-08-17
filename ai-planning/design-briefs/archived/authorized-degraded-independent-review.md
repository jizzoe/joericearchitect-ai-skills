# Authorized Degraded Independent Review

Date: 2026-08-13
Status: Design brief. Propose only after the owner explicitly accepts this
scope; do not alter the current fail-closed protocol beforehand.

## Decision

Add an explicitly authorized, per-run degraded-review mode for
`production-rapid` autonomous delivery. The default remains a proven fresh,
OS-isolated, read-only independent reviewer. A goal may opt in to degraded mode
only through a named, durable authorization record. If the preferred isolated
adapter cannot complete its review, the runner may invoke a fresh, separate,
non-sandboxed reviewer and record the reduced assurance precisely.

This is an owner-selected risk acceptance, not an assertion that the fallback
is isolated or equivalent to the default gate.

## Problem

The current protocol correctly fails closed when an adapter cannot prove its
required boundary. That is appropriate by default, but an owner may decide that
a fresh reviewer with a sealed package and no implementation-session history is
an acceptable additional signal for one bounded `production-rapid` run, even
when the host cannot prove the full OS read-only boundary. For example, a
Codex read-only sandbox may prevent a system Git helper from creating required
temporary cache state.

The system needs a way to make that choice explicit and auditable without
silently weakening normal autonomous delivery.

## Goals

- Keep fail-closed isolated review as the default for every profile and run.
- Permit a narrowly scoped, owner-authorized fallback only after the strict
  adapter was attempted and produced a durable unavailable record.
- Preserve reviewer independence where it can still be established: fresh
  session, no inherited implementer history, sealed immutable package, detached
  committed view, and no delivery authority.
- Record exactly which capabilities were proven, unavailable, or only
  instruction-constrained, and bind the risk acceptance to one delivery
  transition and exact base/head/package digest.
- Ensure a fallback reviewer cannot itself mutate GitHub, deploy, release,
  send external messages, or broaden authorization.

## Non-Goals

- Do not make degraded review the default or allow an adapter to choose it.
- Do not represent degraded review as OS-isolated, read-only, or equivalent to
  a successful strict adapter result.
- Do not grant standing exceptions, product-wide flags, credentials, network
  mutation, GitHub mutation, deployments, releases, or extra OAuth scopes.
- Do not use a same-session subagent, an ordinary pull-request review, or the
  implementer as the fallback reviewer.
- Do not introduce model-selection or model-routing policy.

## Proposed Authorization Contract

The bounded Goal authorization gains an optional, disabled-by-default field
such as `degradedIndependentReview`. It must contain:

- `enabled: true` as a positive owner choice;
- the selected queue entry/change, permitted lifecycle transitions, and the
  bounded corrective envelope described below;
- an expiration no later than the goal expiration;
- a human-readable risk-acceptance reason; and
- the permitted fallback boundary, initially `fresh-separated-reviewer-only`.

The authorization is invalid for any different change or transition, a resumed
run after expiration, or a head that is outside its bounded corrective envelope.
It must appear in the durable checkpoint and delivery evidence. The runner must
not infer it from a generic autonomous mode, PR label, environment variable,
configuration file, or reviewer output.

### Bounded corrective envelope

The authorization covers the initially sealed package and derived packages for
new heads only when each new head results from an in-scope,
behavior-preserving objective correction within the existing per-signature
correction budget and before the stated expiration. Every derived head/package
must be recorded, rerun affected checks, and undergo strict-first review again.
This permits the autonomous feedback loop to finish overnight without turning
the exception into standing permission. A material change, an out-of-scope
correction, an exhausted budget, or an expired run still pauses.

## Review Flow

```text
current Apply evidence + sealed package
                 |
                 v
 strict OS-isolated adapter attempt
       | pass -> normal independent-review gate
       | unavailable -> durable strict failure record
                 |
                 v
 exact active degraded-review authorization?
       | no -> pause (current behavior)
       | yes -> fresh separate fallback reviewer
                 |
                 v
 normalized degraded result + capability ledger
                 |
                 v
 existing validation, findings, correction, and transition gates
```

The fallback receives the same sealed package and detached committed review
view. It starts a new noninteractive session and must not receive the
implementer conversation, prior reasoning, desired conclusion, credentials, or
the ability to execute arbitrary instructions from package content.

The fallback may run only deterministic allowlisted inspection commands. Where
the platform cannot prove an OS boundary, the adapter must use the strongest
available practical restrictions (dedicated process, detached view, disabled
mutation tools, no persisted review session, no configured GitHub/deployment
tools) and report them as unproven rather than as enforced.

## Evidence and Result Semantics

Extend `independent-review-result-v1` or introduce a versioned successor with:

- `assuranceLevel`: `strict-isolated` or `authorized-degraded`;
- an immutable capability ledger separating `enforced`, `unavailable`, and
  `instruction-constrained` controls;
- the exact strict-adapter unavailable record that justified fallback;
- a reference to the exact degraded-review authorization and risk reason; and
- the existing reviewer identity, fresh-context assertion, package bindings,
  findings, dispositions, timestamps, and final status.

Only a result marked `authorized-degraded` with a matching active authorization
may satisfy the selected transition's review requirement. It must never be
normalized into `strict-isolated` evidence. UI, checkpoint, PR, and archive
reports must display the assurance level prominently.

## Findings and Corrections

All existing finding rules remain unchanged. Blocker, high, and material
findings pause. Objective fixes remain behavior-preserving, bounded by the
per-signature correction budget, and require affected checks plus a fresh
review of the new head.

For a new head, the strict adapter is attempted again first. The authorization
may cover the derived package only under its bounded corrective envelope; it
does not cover a material, out-of-scope, post-expiration, or
correction-budget-exhausted new head.

## Security and Recovery

- Package construction, artifact allowlists, secret filtering, and injection
  defenses remain identical in both paths.
- The fallback may never trigger GitHub, deployment, release, external-send,
  credential, or delegated-mutation operations.
- If the fallback cannot establish fresh context, sealed inputs, a detached
  view, or its declared restrictions, it also returns `unavailable` and the
  lifecycle pauses.
- Expired, malformed, mismatched, duplicate, or ambiguous authorization is a
  human-decision pause, not a retriable adapter error.
- Durable recovery re-reads Git, OpenSpec, authorization, package, result,
  checkpoint, and transition state. It never converts previous strict failure
  into a general permission to downgrade future runs.

## User Experience

The user-facing enablement guide should explain the normal strict path first.
When an owner deliberately chooses degraded mode, the runner should display:

1. the strict adapter failure and its safe recovery path;
2. the exact reduced protections and remaining controls;
3. the named transition and expiration covered by the risk acceptance; and
4. that the resulting delivery record will be labelled `authorized-degraded`.

Ordinary interactive work and autonomous runs without this explicit flag remain
unchanged.

## Acceptance Criteria

An eventual OpenSpec change must prove:

- absence of the authorization preserves the existing fail-closed pause;
- malformed, broad, expired, stale-head, stale-manifest, or wrong-transition
  authorization is rejected;
- strict review is attempted before fallback and its unavailable evidence is
  retained;
- fallback has a new session, sealed package, detached committed view, and no
  mutation-capable adapter/tool path;
- the result and every delivery artifact distinguish strict and degraded
  assurance without ambiguity;
- every new head repeats the strict-first decision and may use the risk
  acceptance only within the recorded bounded corrective envelope; and
- blocker/high/material findings still pause and objective fixes still require
  current evidence and rereview; and
- portability, secret/data, command-injection, recovery, source/license, and
  thin-adapter drift evals pass.

## Deferred Decisions

- Exact authorization field names and whether the result extension is v1 or a
  new v2 schema.
- The minimum platform-specific restrictions that qualify as an acceptable
  degraded fallback on Codex, Claude, macOS, Linux/WSL2, and native Windows.
- Whether branch protection or Project automation should expose the assurance
  level beyond the durable repository record.
