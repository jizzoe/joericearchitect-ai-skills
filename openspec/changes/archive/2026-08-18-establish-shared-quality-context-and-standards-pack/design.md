## Context

See `proposal.md` and the delta specs. Existing base quality skills own their
workflows but lack a shared, validated input for standards selection and compact
context handoff. The implementation must remain portable and keep adapters thin.

## Goals / Non-Goals

**Goals:** a small deterministic selection contract and validator; one
normative context policy; compatible consumer updates; and portable synthetic
fixtures before the TypeScript overlay depends on this foundation.

**Non-Goals:** stack catalogs or overlays, product commands or versions, a
generic code-writing workflow, generated-asset edits, credentials, accounts,
deployments, or product-data operations.

## Decisions

### Shared references plus deterministic validation

Add `skills/base/_shared/standards-pack.md` and
`skills/base/_shared/context-management.md`, plus a validation library and CLI
under `scripts/validation/`. This is a shared reference/module, not a broad
user-triggered skill. A JSON schema alone was rejected because the existing
validator pattern can produce readable deterministic fixture failures while
reusing workspace-path and secret safety rules.

### Consumers use records without duplicating rules

Update `base-code-review` and `base-verification-loop` instructions and
references so a valid record is required only for claimed stack-standard
coverage. An explicit not-applicable classification preserves ordinary scoped
review compatibility. Both link to the context policy and return selected IDs
and gaps through their established result contract.

### Synthetic fixtures establish the shared seam

Add a focused fixture suite for valid selection, scoped override, unselected
stack, second-workspace portability, unsafe input, and cross-stage handoff.
Extend existing implementation-quality fixtures only where their existing
result contract needs optional selection details. This proves the foundation
before M2 overlays use it.

### Documentation stays narrow

The root README adds one discoverability link. Canonical references own policy;
existing Claude/Codex wrappers remain unchanged unless a parity check requires
a link update. Generated OpenSpec assets are never edited manually.

## Risks / Trade-offs

- [Generic rules override repository truth] → precedence and scoped override
  records force a conflict or gap outcome.
- [Records leak secrets or product constants] → validator rejects unsafe values
  and accepts only workspace-relative/public-source references.
- [Policy drifts] → one canonical reference and link assertions, not copies.
- [Future overlays overstate tooling] → selection distinguishes required
  standards from available evidence and exposes a gap.

## Verification Strategy

Unit-test valid, override, unselected, portable, unsafe, and incomplete
records; assert quality references link to the shared policies; run existing
implementation-quality and adapter-drift tests. Records are untrusted
structured input and never supply executable commands. No third-party code or
dependency is added. A partial change is recovered through its bounded commit;
records are read-only and make no external mutation.

Security validation rejects unsafe paths and secret-like fields before a record
is consumed, and consumers never execute a record-provided command.

## Attribution and Licensing

This change introduces no third-party code, dependency, or copied standard
catalog. It records only the repository-owned design brief as planning input;
later stack overlays must independently record their selected source licenses.

## Recovery

The selection contract makes no external mutation. A partial implementation is
recovered by rerunning its deterministic validation and reverting only the
change-owned commit if necessary; callers retain their original records and
must not infer a replacement selection.

## Reuse Plan

Canonical shared assets remain under `skills/base/_shared/`; callers supply
repository-specific standards and commands through validated input. Existing
Claude/Codex adapters remain thin. A second-workspace fixture proves portability
without product-specific canonical behavior.
