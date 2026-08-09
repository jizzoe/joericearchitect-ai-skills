## Why

OpenSpec is initialized in the repository, but its generated workflow omits the
required verification action and its project context is still an empty
scaffold. Completing this bootstrap now gives later SDD changes a reviewed,
cross-assistant planning foundation without relying on undocumented setup or
overwriting user-authored assistant assets.

Primary issue: [#2 - M1-C1 Bootstrap OpenSpec for Claude and Codex](https://github.com/jizzoe/joericearchitect-ai-skills/issues/2)

Roadmap: [#1 - Establish OpenSpec SDD foundation](https://github.com/jizzoe/joericearchitect-ai-skills/issues/1)

## What Changes

- Configure the streamlined OpenSpec workflow as `explore`, `propose`, `apply`,
  `verify`, `sync`, and `archive`, without incremental artifact workflows.
- Add concise repository context and initial artifact rules to
  `openspec/config.yaml` for product boundaries, sources of truth, quality,
  security, attribution, portability, and built-in capability reuse.
- Refresh and verify OpenSpec-managed Claude and Codex workflow exposure while
  preserving user-authored assistant configuration.
- Document tested tool versions, setup, assistant discovery, update, and
  recovery procedures.
- Establish the first reviewed OpenSpec change and its manual GitHub linkage;
  automated tracking and synchronization remain later changes.

## Scope

This change covers the repository-local OpenSpec bootstrap, generated Claude
and Codex workflow exposure, initial project context, initial artifact rules,
and contributor-facing setup and recovery guidance.

## Non-goals

- Implementing GitHub labels, issue forms, Project statuses, or lifecycle
  automation.
- Adding the versioned `tracking.json` contract before M3-C2.
- Creating repo-owned GitHub/OpenSpec integration skills.
- Introducing a custom OpenSpec schema or incremental artifact workflows.
- Building stack-specific or otherwise deferred SDLC skills.

## Capabilities

### New Capabilities

- `sdd-lifecycle`: Defines the repository's streamlined OpenSpec actions,
  repository context and artifact guidance, and safe setup/update/recovery
  behavior.
- `cross-assistant-assets`: Defines equivalent discovery of OpenSpec-managed
  workflows in Claude and Codex while preserving ownership boundaries and
  user-authored content.

### Modified Capabilities

None. No living capability specifications exist yet.

## Reuse Plan

- Product-neutral behavior includes safe OpenSpec initialization, workflow
  selection, assistant discovery checks, and update/recovery guidance.
- OpenSpec owns its generated commands and skills. This change will not create
  a competing repo-owned lifecycle implementation or prematurely extract the
  future `sdd-product-bootstrap` skill.
- Repository purpose, product boundaries, asset locations, and quality rules
  remain product configuration in `openspec/config.yaml` and contributor
  guidance.
- Claude commands and skills and Codex skills remain thin OpenSpec-generated
  platform exposure rather than separately maintained canonical logic.
- Portability review will check that the documented bootstrap procedure accepts
  a configured repository and assistant set and does not embed this repository's
  GitHub owner, Project number, credentials, or future product domain behavior
  in reusable instructions.
- The exact repository context and the manual bootstrap issue links are
  intentionally product-specific because specifications and lifecycle records
  follow product boundaries.

## Impact

- Affected local systems: OpenSpec global workflow selection and repository
  OpenSpec configuration.
- Affected generated assets: `.claude/commands/opsx/`, `.claude/skills/`, and
  `.agents/skills/` OpenSpec-managed entries.
- Affected documentation: repository contributor guidance selected during
  design.
- External state: GitHub issues #1 and #2 are manually linked for bootstrap;
  Project placement and managed labels are deferred until M2 supplies the
  canonical configuration.
- Compatibility: no product code or public API changes. Claude and Codex must
  expose the same selected lifecycle actions even though their generated file
  layouts differ.
