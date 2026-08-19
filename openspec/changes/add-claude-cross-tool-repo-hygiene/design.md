## Context

See `proposal.md` for motivation. `scripts/sdd/check-adapter-drift.mjs`
currently enumerates a fixed subset of adapters. The canonical catalog already
has eighteen packages, while OpenSpec's generated `openspec-*` adapters share
the same platform directories but a distinct ownership boundary.

## Goals / Non-Goals

**Goals:**

- Give Claude Code a root-level import of the repository's shared guidance.
- Make repository-owned adapter parity complete as the canonical catalog grows.
- Detect missing references and policy-sized discovery wrappers with focused,
  deterministic diagnostics.

**Non-Goals:**

- Change OpenSpec generation or edit generated OpenSpec assets.
- Change canonical skill policy, global Claude settings, or authentication.
- Infer, generate, or repair missing adapters automatically.

## Decisions

- Discover canonical packages by reading direct `skills/base/*/SKILL.md`
  entries in lexical order. Derive the two required adapter paths from each
  package name. This removes the hand-maintained subset and produces stable
  output.
- Validate a canonical path reference, an explicit no-policy-duplication
  statement, and a conservative maximum adapter size. Together these make a
  discovery wrapper independently checkable without comparing platform prose to
  canonical policy. Existing repository-owned adapters will use the same
  explicit statement.
- Limit enumeration to the canonical catalog. Generated `openspec-*` skills and
  `opsx` commands are not derived from that catalog, so they are excluded by
  ownership rather than a special-case generated-file list.
- Put the ownership boundary and contract in `docs/skill-authoring.md`, beside
  the canonical-skill authoring guidance.

## Risks / Trade-offs

- A size bound cannot semantically prove every possible policy copy → require
  the canonical pointer and explicit non-duplication declaration as well, and
  keep the bound low enough for discovery-only adapters.
- A future intentional adapter format may exceed the contract → change the
  documented contract and its focused tests in the same governed change.

## Migration Plan

1. Add the Claude root import and normalize existing repository-owned adapter
   declarations.
2. Replace the fixed inventory and add fixture-based contract coverage.
3. Run focused tests, repository validation, and strict OpenSpec validation.

Rollback consists of reverting this small validator and documentation change;
no generated asset or external state is changed.
