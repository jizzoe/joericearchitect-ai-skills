# Verification Report: harden-independent-review-worktree-lifecycle

## Summary

| Dimension | Status |
|---|---|
| Completeness | 17/19 tasks complete before independent review and delivery |
| Correctness | 3/3 requirements and 20/20 scenarios mapped to implementation, tests, or runtime evidence |
| Coherence | Design followed; canonical policy remains assistant-neutral and wrappers remain thin |

## Completeness

All implementation tasks and the Apply verification task are complete. The two
remaining tasks are intentionally gated: task 5.2 requires a fresh review of
the committed exact head, and task 5.3 requires that review before delivery.

The lifecycle request, host-owned view, common diagnostic envelope, direct
strict parent transport, neutral launch directory, isolated Codex state, and
Claude restrictions are implemented in the canonical review scripts and
documented in the assistant-neutral skill. Focused tests cover the new positive
and negative boundaries.

## Correctness

The three modified requirements and all twenty scenarios map to the lifecycle,
adapter, contract, recovery, and test assets under `scripts/sdd/`, plus the
canonical protocol under `skills/base/independent-review/`. Runtime exercises
on macOS established the previously ambiguous boundary:

- nested Codex app-server initialization is denied by the managed parent
  Seatbelt with `EPERM`;
- the same Codex reviewer starts successfully across the parent process boundary
  while its child reports the sealed `read-only` sandbox;
- a neutral parent working directory excludes repository startup customization;
- isolated Codex state needs only a bounded regular `auth.json` copy; and
- installed Claude reaches its clean terminal authentication refusal, so Claude
  login remains an external setup prerequisite rather than a sandbox defect.

The final Apply checks passed: 259 Node tests, 23 focused detached-view/adapter
tests, adapter-drift validation, shared-guardrail validation, whitespace and
changed-content secret-pattern review, strict validation of this change, and
all 26 strict OpenSpec items.

## Coherence

The implementation follows the design boundaries. The parent operation can
start only the pinned Codex executable with a digest-bound fixed argument
vector. The child retains its sealed read-only/no-network profile. Request
acceptance rechecks the exact package, reviewer, executable identity, expiry,
owned view, result path, final artifact, and cleanup. The existing
`authorized-degraded` path remains separate and cannot be relabeled strict.

Codex and Claude wrappers remain thin pointers to the canonical skill. No
product account identifiers, standing grants, third-party code, or new runtime
dependency were added.

## Issues

- CRITICAL: task 5.2 is pending until a fresh independent reviewer evaluates
  the committed exact head.
- CRITICAL: task 5.3 is dependency-blocked by task 5.2 and is not yet eligible.
- WARNING: Claude cannot currently act as the reviewer on this machine because
  its CLI is not logged in; Codex is authenticated and does not share this
  prerequisite.
- SUGGESTION: none.

## Assessment

Apply and pre-review verification pass. The change is ready for an exact-head
strict Codex review, but it is not ready to archive or merge until tasks 5.2 and
5.3 are completed in order.
