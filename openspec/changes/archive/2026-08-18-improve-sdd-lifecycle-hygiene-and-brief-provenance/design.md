## Context

See `proposal.md` for motivation. Existing exact-owned cleanup protects
controller-recorded resources after Archive, but does not provide a general
read-only explanation of historical local Git state. Design briefs are
repository planning inputs with no change-local provenance convention.

## Goals / Non-Goals

**Goals:**

- Add a sidecar provenance pair that is safe to retain in an OpenSpec change
  and archive unchanged.
- Make candidate selection deterministic but never implicit.
- Provide a small, deterministic, non-mutating reconciliation API and report
  suitable for local tools and assistant skills.
- Reuse the existing exact-owned cleanup model rather than creating a second
  deletion mechanism.

**Non-Goals:**

- Backfill historic changes, rewrite Git history, or automate removal.
- Modify OpenSpec-generated workflows or require a design brief for every
  change.
- Treat unavailable GitHub credentials as delivered PR evidence.

## Decisions

### One pure Node module owns provenance and classification

Add `scripts/sdd/sdd-lifecycle-hygiene.mjs` as a Node-standard-library module
with exported helpers for path validation, atomic sidecar capture, candidate
ranking, and report construction. A small CLI wrapper can inspect repository
state but delegates normalization and classification to the module. This keeps
the capability testable without live GitHub credentials.

Alternative: shell-only commands. Rejected because atomic writes, path
containment, and deterministic fixture testing need structured handling.

### Sidecar metadata is deliberately minimal and immutable

`context/design-brief.md` is copied atomically alongside
`context/design-brief-provenance.yaml`. The metadata uses a simple deterministic
YAML shape with relative path, SHA-256 digest, timestamp, selection mode, and
change name. The capture operation refuses to overwrite an existing differing
pair, so reruns converge and an archived copy remains evidence of proposal
input rather than a mutable mirror.

Alternative: reference only the source file. Rejected because later edits or
removal would break historical provenance.

### Report confidence is explicit

The report takes normalized local evidence plus an optional GitHub lookup
result. It uses merged PR/archive/spec signals before ancestry and exposes
`local-only` whenever PR evidence was requested but unavailable. The first
release only accepts already-collected GitHub data; it never authenticates,
changes credentials, or makes a write.

Alternative: infer delivery from branch naming or ahead/behind counts.
Rejected because squash merges and duplicate preservation refs make both
unreliable.

### Cleanup is recommendation-only

The hygiene report may name an exact clean delivered target, but invokes no
cleanup operation. Existing `sdd-workspace-cleanup` retains exclusive authority
for exact-owned, post-Archive deletion and receipt persistence.

## Risks / Trade-offs

- [Candidate terminology can create false associations] → ranking is advisory;
  only an explicit selection causes a copy.
- [Filesystem race during capture] → validate before writing, use temporary
  siblings and rename only after both output contents are ready; remove only
  owned temporary files on failure.
- [GitHub unavailable in sandboxes] → emit a local-only evidence gap instead
  of an invented PR conclusion.
- [Report appears to authorize cleanup] → output states recommendation status
  and the independent exact-owned cleanup requirement.

## Migration Plan

1. Add the module, tests, canonical skill, and thin adapters.
2. Update lifecycle documents/spec behavior and validate strict compatibility
   with a fixture containing the supplemental context directory.
3. Use the convention only for newly proposed changes. Existing archives remain
   unchanged; rollback consists of removing the new optional capability without
   touching historical records.

## Reuse Plan

The canonical base skill and portable module use caller/repository-supplied
paths, default-branch data, and optional GitHub results. Claude and Codex
adapters only point at that canonical skill. Repository-specific labels,
Project numbers, issue numbers, credentials, and absolute paths remain in
runtime configuration or controller records, never in reusable assets. A
fixture with a second temporary workspace proves source paths and candidate
discovery do not depend on this repository name.
