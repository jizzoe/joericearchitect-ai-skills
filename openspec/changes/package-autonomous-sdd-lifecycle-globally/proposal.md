## Why

The globally installable `autonomous-sdd-delivery` skill depends on an
autonomous lifecycle stored outside `skills/base`, so its relative canonical
link breaks after `gh skill` copies the skill into a user profile. This makes a
supported global installation incomplete and can produce assistant-dependent
or workspace-dependent behavior.

Tracking issue: [#123](https://github.com/jizzoe/joericearchitect-ai-skills/issues/123).
It records the bounded repair required by this repository's delivery linkage
policy; `tracking.yaml` is the authoritative repository-to-issue binding.

## What Changes

- Promote the autonomous SDD lifecycle into one canonical distributable skill
  under `skills/base/autonomous-sdd-lifecycle/`, including its progressive
  references and shared guardrail link.
- Make `autonomous-sdd-delivery` reference the lifecycle through a sibling
  skill path that resolves identically in the repository and in Claude or
  Codex user-scope installations.
- Retain `workflows/autonomous-sdd-lifecycle/` only as a thin compatibility
  entrypoint, and point both platform adapters directly at the canonical skill.
- Extend installation and drift fixtures to prove that the lifecycle and
  delivery packages are both discovered and that every canonical dependency
  resolves inside an isolated installed skill root.
- Document the new canonical ownership and refresh both user-scope
  installations after validation.

## Non-Goals

- Do not change lifecycle semantics, delivery profiles, authorization,
  independent-review gates, runtime permissions, or external mutations.
- Do not edit generated OpenSpec actions or absorb the unrelated active
  terminal-cleanup change.
- Do not introduce a custom copy installer, hard-coded user-profile path, or
  credential handling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `global-skill-installation`: globally installed autonomous delivery must
  retain its resolvable lifecycle dependency after installation.
- `cross-assistant-assets`: lifecycle policy must have one canonical
  assistant-neutral source with equivalent, thin Claude and Codex exposure.

## Impact

- Affected assets: canonical lifecycle and delivery skills, the legacy
  workflow compatibility path, Claude/Codex wrappers, adapter drift checks,
  global installation fixtures, and lifecycle documentation.
- Users: global Claude and Codex users gain a complete, discoverable lifecycle
  dependency rather than a broken link to repository-only content.
- Compatibility: the legacy workflow path remains present as a thin pointer;
  lifecycle behavior and authorization gates do not change.
- Security: packaging preserves the existing treatment of untrusted content,
  secrets, authorization, runtime permission, evidence, and human decisions.
- Migration: rerun the existing local or pinned `--all` installer and start a
  new agent session.

## Reuse Plan

- Keep all policy and references product-neutral in
  `skills/base/autonomous-sdd-lifecycle/`; keep platform adapters and the
  legacy workflow entrypoint as discovery-only pointers, with product values
  supplied by target repository configuration.
- Use the same canonical package and relative dependency path for Claude and
  Codex, and verify it in a disposable second checkout with different paths.
