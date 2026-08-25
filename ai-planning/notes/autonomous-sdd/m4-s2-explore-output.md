# M4-S2 Explore Output — Sync and Archive Delivery

Date: 2026-08-25
Change: `integrate-autonomous-sdd-sync-and-archive`
Workflow action: OpenSpec Explore (planning-only; no OpenSpec artifacts created).

## Context

M4-S2 makes Sync (delta-to-living-spec) and Archive (content-preserving move)
two separately delivered, evidenced, recoverable lifecycle transitions. The two
open questions from the M4-S2 brief §6 are:

1. Define the canonical conflict scope for shared capability and archive paths.
2. Confirm required delivery checkpoints between Sync and Archive.

Both are owner decisions. This note records the evidence-derived recommendations
for owner review before Propose. No implementation is authorized by this note.

Live state (re-inspected 2026-08-25): M4-S1 delivered and archived (issue #231,
PR #232); M4-S2's dependency is satisfied. No active changes; `openspec validate
--all --strict` 44/44; runtime `ok`. Working tree has only three unrelated
untracked dirs (`.continue/`,
`docs/research/aidlc/cloud-deployed-sdd-framework/`, `docs/research/security/`).

## Source-mapping (existing machinery vs. the M4-S2 gap)

- `scripts/sdd/autonomous-sdd-controller.mjs` — lifecycle phases include `sync`
  and `archive`, plus run-level terminalization/archive-conflict detection
  (`terminalizationArchiveMatch`: identity/request conflicts). It does NOT detect
  spec-delta-level capability/requirement overlap.
- `scripts/sdd/check-operation-authorization.mjs` — `canonicalLifecycleSteps`
  already orders `sync-change` before `archive-change`, and `archive-change`
  requires `issue`, `branch`, `pr`, `sync`, `change`. Archive is high-impact.
- `openspec archive` CLI — applies the delta to the living spec and moves the
  change; supports `--skip-specs`/`--yes`. M4-S2 wraps this deterministically
  rather than reimplementing it.
- `openspec/specs/openspec-github-lifecycle-sync/spec.md` — covers issue/Project
  status sync, not spec-content sync. M4-S2 adds the spec-content sync layer.
- Lifecycle references (`openspec-actions.md`) define the canonical Sync Gate and
  Archive Gate.

Gap: no module yet builds the active-delta overlap graph (capability →
requirement → operation) or proves exact description+scenario comparison and
repeat-Sync no-op.

## Open question resolutions

### Q1 — Canonical conflict scope for shared capability and archive paths

**Answer (recommendation — pending owner confirmation).** Define conflict at
three nested levels plus the archive path:

1. **Capability scope** — `openspec/specs/<capability>/spec.md`. Two active
   changes declaring deltas for the same capability must be graphed together.
2. **Requirement scope** — `ADDED` is additive (compatible unless a requirement
   id collides); `MODIFIED` is a complete replacement, so two `MODIFIED` of the
   same requirement (or `MODIFIED` + `ADDED` on the same id) is a hard conflict
   and must be serialized under authority covering both changes.
3. **Text scope** — comparison includes each requirement's full description and
   all scenario text, not only structure or titles; any diff means invented,
   dropped, duplicated, or corrupted content.

**Archive path scope** — `YYYY-MM-DD-<change>` is unique per change name, so a
collision means "same change archived twice" (idempotent no-op) or a path held
by a different change (hard conflict → pause). The run-level
`terminalizationArchiveMatch` already detects identity/request conflicts; M4-S2
extends this to the spec-delta level.

### Q2 — Required delivery checkpoints between Sync and Archive

**Answer (recommendation — pending owner confirmation).** Three evidenced
checkpoints, already consistent with `canonicalLifecycleSteps`:

1. **Implementation delivery** (M4-S1 output) — merged and verified.
2. **Sync delivery** — a distinct exact-head PR/merge that applies only the
   authorized delta to the living spec and proves repeat-Sync no-op.
3. **Archive delivery** — content-preserving move, only after Sync is confirmed
   on `main`, the issue is closed, and the Project is `Done`.

`check-operation-authorization.mjs` already requires `sync-change` to precede
`archive-change` and marks Archive high-impact; M4-S2 codifies the no-op proof
and the pre-Archive comparison as gates rather than prose.

## Authorization

Explore is planning-only. Implementation (Propose/Apply) is NOT authorized and
requires explicit owner approval in the pre-v2/interactive lane. The v2
controller remains NOT activated; M4-S2 is delivered by the pre-v2 lifecycle.

## Owner sign-off and authorization (2026-08-25)

- Q1 (conflict scope) — **signed off**.
- Q2 (checkpoints between Sync and Archive) — **signed off**.
- Owner explicitly authorized **Propose + deliver `integrate-autonomous-sdd-sync-and-archive`**
  in the **pre-v2 / prototype-rapid** flow, autonomously through close and cleanup.
