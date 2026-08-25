# Repair Runtime GitHub CLI Agent Mapping

## Why

The M4-S4 qualification campaign surfaced a latent defect in the runtime's
`gh skill` probes (findings #2 and #3): `scripts/runtime/launcher.mjs` `doctor()`
and `scripts/runtime/install-runtime.mjs` `currentSkillPin()`/`installSkills()`
pass the runtime's internal agent identifier `claude` directly to `gh`, but the
GitHub CLI names Claude Code `claude-code`. The probes also pass bare `--json`
(which requires a field list) and read `skill.revision`/`skill.pin`, neither of
which the real `gh skill list --json` output provides (the field is `version`).

As a result `ai-skills-runtime doctor` reported both `claude` and `codex` as
`available: false` (`gh-skill-list-unavailable`) even though both agents are
installed and `gh` is authenticated, and the installer's prior-skill-pin
detection silently returned nothing. The suite missed it because the test stubs
hard-coded the same wrong `claude` id and never validated the `gh` arg vector.

## What Changes

- Map the internal agent id (`claude`) to the `gh` CLI id (`claude-code`) at
  every `gh skill list` and `gh skill install` boundary (`codex` unchanged).
- Request the explicit `--json skillName,version,pinned` field list.
- Read installed skill revision and prior pin from `version`.
- Update the three affected test stubs to validate the real arg vector.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared-sdd-runtime-distribution`: explicit GitHub CLI agent-identity and
  field mapping at the skill boundary.

## Impact

- `scripts/runtime/launcher.mjs`, `scripts/runtime/install-runtime.mjs`, and
  three runtime test files.
