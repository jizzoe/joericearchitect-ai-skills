# SDD Workspace Bootstrap Planning

Date: 2026-08-11
Status: Planning only

## Goal

Define a reusable future capability for initializing and validating a
single-repository or multi-repository OpenSpec workspace without importing a
product's domain data, credentials, or configuration.

## Proposed Scope

- A canonical `bootstrap-sdd-workspace` skill with thin Claude and Codex
  exposure.
- Explicit workspace manifests for repository membership, roles, paths or
  remotes, default branches, and spec ownership.
- Preview-first initialization, idempotent reruns, conflict reporting, and
  targeted recovery.
- Deterministic validation and generic multi-repository fixtures.
- Documentation covering configuration, ownership, safety, and recovery.

## Boundaries

- Do not infer product membership from directory proximity.
- Do not write outside the selected workspace or change global assistant
  configuration without preview and explicit approval.
- Do not copy credentials, tokens, user paths, project IDs, or product domain
  constants into reusable assets.
- Preserve existing user-authored and generated files; conflicts fail closed.
- Reuse the independently delivered global skill installation workflow where
  available, but retain documented manual prerequisites.

## Required Research and Design Decisions

1. Select the authoritative location for product-level specifications and the
   workspace manifest schema.
2. Define explicit inputs, generated-file ownership, and conflict semantics.
3. Identify the minimum safe single-repository workflow before multi-repository
   behavior.
4. Define a generic fixture covering missing repositories, invalid manifests,
   partial platform failures, safe reruns, and recovery.
5. Establish the future OpenSpec requirement, test, documentation, and
   attribution boundaries before implementation begins.

## Next Authorization

This plan does not authorize implementation. Create a separate implementation
issue and OpenSpec change after research and design review approve the selected
workspace model.
