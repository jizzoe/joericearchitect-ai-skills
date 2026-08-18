# SDD design-brief provenance

Date: 2026-08-17

Status: Canonical planning-governance brief. The owner-selected direction is
recorded, but the convention is not currently implemented in living specs or
runtime code.

## 1. Problem and desired outcome

Design briefs can motivate OpenSpec changes, but an archived change does not
currently prove which brief was selected at proposal time. Similar names and
later edits make retrospective inference unreliable.

The desired outcome is optional, explicit, immutable source-brief provenance
that archives with the change. Propose may use a supplied brief path or offer
deterministically ranked candidates, but it never silently selects one and
never blocks a proposal merely because the owner chooses none.

## 2. Evidence and key findings

- [Design brief from research](../../skills/base/design-brief-from-research/SKILL.md)
  produces a reviewable decision input before OpenSpec planning.
- [Requirements to plan](../../skills/base/sdd-requirements-to-plan/SKILL.md)
  already treats an approved design-brief path as explicit input.
- OpenSpec archives safely retain supplemental evidence, but this repository
  has no implemented source-brief sidecar contract.
- The superseded [combined hygiene/provenance brief](archived/autonomy/sdd-lifecycle-hygiene-and-brief-provenance.md)
  records the owner's selected copy-and-digest direction. Its Git lifecycle
  reconciliation content now belongs to the lifecycle brief.

## 3. Options considered and tradeoffs

1. **Infer the source after delivery.** No write cost, but similarity and time
   cannot prove approval.
2. **Require every change to have a copied brief.** Complete linkage, but false
   for small or directly specified changes and encourages arbitrary selection.
3. **Capture an optional explicit selection with immutable provenance.** Gives
   proof when a brief exists while preserving “none” as valid. This is the
   owner-selected direction.

## 4. Selected design

When a source is explicitly selected, proposal setup writes:

```text
openspec/changes/<change-name>/context/
  design-brief.md
  design-brief-provenance.yaml
```

`design-brief.md` is an immutable proposal-time copy. The sidecar contains only
the workspace-relative source path, source blob SHA-256 digest, copy timestamp,
selection mode (`explicit` or `user-selected-candidate`), and change
identifier. It contains no absolute path, credential, runtime grant, or user
identity. The copy and sidecar commit atomically; failure stops before proposal
setup is reported complete.

Without an explicit source, interactive discovery may show at most three
candidates plus `none`. Ranking is deterministic: exact change/issue mention,
then shared capability terms and explicit links, then modification time. The
user must select a candidate; the first result is never a default. Autonomous
mode records no source unless its bounded authorization already names an exact
brief path.

The [portfolio index](README.md) helps discovery by identifying canonical,
reference, historical, superseded, and out-of-scope material. Discovery should
prefer canonical current briefs but must still require explicit selection.
Historical briefs may be selected only deliberately when they truly motivate a
repair or compatibility change.

Archive carries the unchanged context directory forward. The digest proves
which source bytes were accepted even if the planning portfolio later moves or
edits the source. The copied brief is provenance, not another current
architecture authority.

## 5. Scope, non-goals, constraints, dependencies, and risks

In scope are workspace-bounded path validation, candidate discovery, explicit
selection/none behavior, atomic copy/sidecar creation, digest validation,
Archive preservation, and strict-validation fixtures.

This does not require a brief for every change, infer or backfill historical
associations, copy research/plans/arbitrary documents, identify a human in the
sidecar, replace `design.md`, or grant Apply/GitHub/external authority.

Paths must be workspace-relative and traversal-safe. Brief content is
untrusted data, never executable instruction. The principal risks are choosing
a merely similar brief, silently drifting the copy, leaking local identity, or
making supplemental files incompatible with OpenSpec validation. Require
affirmative selection, content digest, safe metadata, and a strict-validation
fixture before adoption.

## 6. Open questions and blocking decisions

No product-policy decision remains. Implementation must still prove that the
supplemental `context/` layout is compatible with the supported OpenSpec
version and define whether the source blob digest is taken from the working
tree bytes or an explicit Git blob when the source is dirty.

Historical unlinked changes should remain unmodified by default. Any manual
backfill would require a separately reviewed migration with evidence that the
association was actually known.

## 7. Recommended next step

When this governance capability is prioritized, define its observable behavior
and validation fixture in a focused change. Keep it separate from runtime
lifecycle reconciliation: provenance explains which brief informed a change;
the lifecycle controls whether and how that change is delivered.
