## Why

Global skill installation currently succeeds while leaving the shared SDD
helpers unavailable: `gh skill install` distributes individual skill packages,
but sixteen canonical skills reference seventeen helper modules under the
repository-level `scripts/` runtime. The result is a misleading successful
installation that later pauses on missing executables, preventing portable
Claude and Codex autonomous SDD work.

Seven of those seventeen modules are not dispatchable as programs,
and two read repository data outside `scripts/`, so a complete distribution
must package assets and add dispatchable entrypoints rather than only copying
executable roots.

This change makes the complete executable dependency closure a versioned,
validated companion distribution and installs it in lockstep with the skills.
The design brief is captured at
`context/design-brief.md`; no primary GitHub issue is linked yet, so Apply
must create or reuse the configured issue record before delivery work begins.

## What Changes

- Add a manifest-driven builder that stages the shared SDD runtime from the
  canonical repository `scripts/` sources and the declared asset roots the
  helpers read, verifies its full local dependency closure by static analysis
  and staged smoke invocation, and emits a version/digest receipt.
- Add executable entrypoints for the seven non-dispatchable helper modules: a
  uniform JSON payload wrapper for five of them and declared subcommands for
  `platform-review-adapters` and `autonomous-sdd-controller`.
- Add a portable runtime resolver/launcher that verifies the active runtime and
  its declared contract version before dispatching a named helper against an
  explicit target repository, plus a `doctor` command that detects
  skill/runtime drift after installation.
- Add paired Bash and Windows PowerShell install/update entrypoints under
  `scripts/` that install the exact matching runtime and canonical `gh skill`
  packages for selected Claude Code and Codex user profiles, delegating skill
  installation to the existing `scripts/skills/install-global-skill.mjs`
  utility rather than duplicating GitHub CLI invocation.
- Add a labeled development mode so work inside this repository exercises the
  working tree without silently producing evidence from an unbuilt runtime.
- Migrate canonical skill instructions and thin platform exposure to resolve
  the installed runtime rather than assuming `scripts/sdd/...` exists in the
  active workspace.
- Extend isolated install fixtures to prove the complete distributed runtime
  can invoke every helper referenced by an installed canonical skill for both
  supported agents, with a CI matrix covering the network-free cross-platform
  surface.
- Update global-installation guidance with the new review, bootstrap, install,
  update, runtime-preflight, drift-detection, recovery, and session-reload
  procedures.

## Capabilities

### New Capabilities

- `shared-sdd-runtime-distribution`: Builds, installs, resolves, verifies, and
  recovers the reusable shared SDD executable runtime independently of a
  source checkout.

### Modified Capabilities

- `global-skill-installation`: Global installation becomes complete only when
  the selected canonical skills and their matching executable runtime are
  installed and evidenced together.
- `cross-assistant-assets`: Claude and Codex exposure must resolve one
  assistant-neutral installed runtime without duplicating runtime policy or
  silently changing host approval, sandbox, or credential behavior.
- `skill-install-utility`: The existing installation utility gains a
  machine-readable result so paired shell entrypoints can consume it instead of
  reimplementing GitHub CLI invocation.

## Reuse Plan

- Keep the runtime sources, manifest, builder, resolver, and install contracts
  product-neutral. Repositories, credentials, target paths, branches, and
  approval state remain explicit runtime inputs or product-owned configuration.
- Keep canonical policy under `skills/base/`; generated Claude/Codex exposure
  remains thin and refers to the same runtime contract.
- Reuse GitHub CLI for skill source selection, provenance, and skill-directory
  installation, and reuse the existing repository install utility for `gh`
  invocation. The new entrypoints add only the missing shared runtime
  distribution, compatibility preflight, and paired-revision receipt.

## Impact

- Affected assets: canonical skills and references, Claude/Codex thin adapters,
  top-level runtime scripts, installer utilities, fixtures/evals, CI workflows,
  and `docs/global-skill-installation.md`.
- New user-level local state: a versioned runtime installation and its
  non-secret active-version metadata. Before Apply, the decision gate in
  `tasks.md` must resolve the runtime location and PATH activation behavior and
  confirm the packaging channel. Node 20 or newer is a declared prerequisite
  for the distributed runtime and must be preflighted rather than assumed.
- No approval, independent-review, GitHub, network, credential, or sandbox
  gate is broadened. The launcher makes no authorization decision; helper-level
  checks remain the only authority. Missing, invalid, incompatible, or drifted
  runtime state remains a classified pause.
