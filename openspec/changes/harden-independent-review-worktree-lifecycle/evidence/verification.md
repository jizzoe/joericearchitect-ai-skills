# Verification Report: harden-independent-review-worktree-lifecycle

## Summary

| Dimension | Status |
|---|---|
| Completeness | 19/19 tasks complete |
| Correctness | 3/3 requirements and 20/20 scenarios mapped to implementation, tests, or runtime evidence |
| Coherence | Design followed; canonical policy remains assistant-neutral and wrappers remain thin |

## Completeness

All implementation tasks, Apply verification, exact-head independent review,
and authorized delivery linkage are complete. Issue #95 and PR #96 provide
the delivery record; Sync, Archive, merge, and GitHub Project mutation remain
outside this authorization.

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

The final Apply checks passed: 262 Node tests, 23 focused detached-view/adapter
tests, adapter-drift validation, shared-guardrail validation, whitespace and
changed-content secret-pattern review, strict validation of this change, and
all 26 strict OpenSpec items.

The repaired implementation and then the linked-tracking head each received an
accepted strict Codex independent review with zero findings. The latest record
binds the immutable base, head, and manifest and confirms fresh, read-only,
network-disabled execution from a neutral parent with owned cleanup. See
`evidence/strict-independent-review.md`.

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

- WARNING: Claude cannot currently act as the reviewer on this machine because
  its CLI is not logged in; Codex is authenticated and does not share this
  prerequisite.
- SUGGESTION: none.

## Assessment

Apply verification, exact-head strict Codex review, and authorized PR linkage
pass. The change is ready for a separately authorized Sync, Archive, or merge;
none of those actions were performed here.
