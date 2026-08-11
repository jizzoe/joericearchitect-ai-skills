# Global Skill Installation Implementation Plan

Date: 2026-08-10
Status: Proposed

## Purpose

Turn the reviewed global skill installation research into one supported,
cross-agent workflow for this repository's canonical skills. This plan is
limited to Claude Code and Codex skill installation; SDD workspace bootstrap
planning is tracked separately by GitHub issue #57.

## Outcomes

- Canonical skills carry stable, machine-readable metadata.
- A deterministic offline validator detects metadata regressions for every
  dynamically discovered canonical skill.
- Maintainers can install reviewed skills with GitHub CLI `gh skill`, including
  preview, pinning, conflict handling, listing, updates, and recovery.
- Disposable fixtures verify installation behavior without changing a user's
  global assistant configuration or credentials.
- Claude Code and Codex remain thin consumers of the same canonical sources.

## Delivery Sequence

1. Record the selected `gh skill` workflow, prerequisites, tested versions,
   supported scope, conflict behavior, and non-goals in a design brief.
2. Create a GitHub issue and OpenSpec change for the runtime-facing installer
   behavior only after the planning checkpoint is reviewed.
3. Add `name` and `description` metadata to every distributable
   `skills/base/*/SKILL.md` source without duplicating policy into adapters.
4. Implement an offline validator and focused regression tests for dynamic
   discovery, invalid frontmatter, required fields, duplicate names, and
   directory-name mismatches.
5. Add `gh skill` installation and recovery documentation with explicit source
   review, release-tag-or-SHA pinning, and user-owned conflict boundaries.
6. Run isolated fixtures for install, listing, rerun, conflict, update, paths
   with spaces, and alternate source layouts. Treat missing authenticated
   disposable-profile invocation evidence as blocked, not passing.
7. Verify, deliver, Sync, and Archive the implementation change through the
   normal OpenSpec lifecycle.

## Boundaries

- Do not create a repository-owned copy installer unless repeatable fixture
  evidence establishes a requirement `gh skill` cannot satisfy.
- Do not install or alter Claude Code, Codex, OpenSpec, MCP, credentials,
  approval policies, or product configuration.
- Do not hard-code user homes, credentials, mutable project IDs, or a product
  repository into reusable assets.
- Do not claim agent/version support without authenticated disposable-profile
  evidence.

## Verification

The implementation change must include deterministic metadata tests, disposable
installer fixtures, documentation walkthroughs, wrapper-drift review, strict
OpenSpec validation, and `git diff --check`. Every mutation must have an
explicit conflict and recovery path.

## Definition of Done

The work is complete when canonical skills validate, the documented `gh skill`
workflow has objective evidence for each claimed agent/version pair, CI runs
the offline check, the implementation change has passed Verify and delivery,
and its living specification and history have been synchronized and archived.
