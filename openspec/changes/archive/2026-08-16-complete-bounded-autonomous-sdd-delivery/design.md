## Context

See [proposal.md](proposal.md) for motivation. The current resolver normalizes
a complete delivery request, but no durable controller context survives phase
entry. Generated OpenSpec phase skills correctly stop at ordinary boundaries,
and the existing checkpoint only models delivery-derived targets. The cleanup
brief establishes a compatible ownership-first safety model but has no
executor. GitHub issue, PR, merge, Sync, Archive, and Project operations remain
runtime- and exact-target-gated.

## Goals / Non-Goals

**Goals:**

- Persist a portable, versioned controller record before selection and use it
  to resume the first incomplete evidenced phase.
- Preserve phase-local behavior without a record, while allowing a validated
  controller to orchestrate the full authorized chain.
- Implement target-explicit aliases, exact owned cleanup, narrow brief
  preparation, equivalent thin platform exposure, and deterministic evidence.

**Non-Goals:**

- Altering generated OpenSpec lifecycle content, inferring targets, creating
  standing approval, broadening credentials, deleting remote branches, or
  cleaning legacy resources.

## Decisions

### Canonical controller and record

Create one canonical `skills/base/autonomous-sdd-delivery/` skill and a
deterministic controller script. The controller obtains resolver output, hashes
canonical authorization fields, creates or resumes a selected-entry record, and
recomputes the first incomplete phase from durable state on each entry. Store
the mutable checkpoint in a change-scoped evidence location and keep only
portable relative references in it. This avoids state in generated adapters or
chat logs. An alternative of changing generated phase skills was rejected
because regeneration would overwrite policy and standalone semantics would
become unsafe.

### Context contract and lifecycle routing

Use a versioned context reference containing record path, selected entry,
authorization digest, repository identity, and expiry. Each canonical phase
adapter validates this reference then returns control to the controller; without
it, its existing boundary is unchanged. Validation is fail-closed on missing,
expired, malformed, or conflicting context. A goal-text-only approach was
rejected because it cannot bind exact targets or recovery evidence.

### Explicit shorthand and bounded preparation

Extend the resolver with `ship-sdd` parsing: `prod` means four hours,
autonomous, production-rapid, strict-only, and sdd-delivery; `prototype` uses
prototype-rapid and strict-first-degraded. An explicit target is mandatory and
an explicit duration replaces only the duration. The controller receives one
authorized design-brief path, validates it as contained in the selected
workspace, and passes it to the existing brief workflow. An alias never creates
a target or broader write grant.

### Exact delivery and cleanup evidence

Extend checkpoint validation with controller phase status, exact derived
records, resource ownership records, evidence freshness, and cleanup outcomes.
The cleanup planner performs audit first, then applies only independently
eligible resources. It checks refreshed default-branch archive visibility,
issue/Project evidence where configured, recorded PR/final-head delivery,
worktree registration/ownership/cleanliness, and reference safety. It removes
worktrees before local branches, uses normal branch deletion when possible, and
permits forced local deletion solely for proven squash/rebase delivery. Name or
ancestry heuristics cannot authorize cleanup.

### Reuse and platform exposure

Canonical policy stays in `skills/base`, `workflows`, and `scripts`; Claude and
Codex wrappers contain only discovery metadata and canonical references. Tests
use synthetic repositories and configured fixtures with no owner, Project,
branch, local absolute path, or credential constant in reusable code. Generated
OpenSpec assets are not edited.

## Risks / Trade-offs

- [Record is forged or stale] → validate schema, digest, selected entry,
  repository, expiry, and checkpoint on every transition.
- [A phase silently terminates] → test every phase-entry resume path against
  either next-checkpoint progression or classified pause.
- [Cleanup risks local work] → require recorded ownership, audit classification,
  clean-state and primary/locked guards; never infer legacy ownership.
- [Strict review is unavailable] → production strict-only pauses with durable
  unavailable evidence; it never self-downgrades.
- [GitHub runtime is unavailable] → retain local evidence and pause only the
  affected external transition with exact safe recovery guidance.

## Migration Plan

1. Add schema-aware reader support so legacy checkpoints remain usable for
   inventory but are ineligible for controller continuation or cleanup.
2. Add controller, resolver, validator, cleanup, and adapter behavior with
   deterministic fixtures before exposing it through documentation.
3. Refresh only repository-owned thin adapters, then validate asset drift and
   second-repository portability.
4. Delivery uses normal implementation, Sync, and Archive checkpoints; rollback
   reverts only the change-owned commits. Durable records cause a later run to
   pause rather than guess after partial external state.
