# Design Brief: Shared SDD Runtime Distribution

Date: 2026-08-19
Status: Ready for OpenSpec Propose
Proposed change: `distribute-shared-sdd-runtime`

## 1. Problem and desired outcome

Global installation currently copies each `skills/base/<name>` directory through
`gh skill install`, but the canonical skills invoke a shared executable runtime
under this repository's top-level `scripts/` tree. The installed skill packages
therefore discover correctly but cannot execute their required helpers in a
separate target repository. The missing `sdd-workspace-cleanup.mjs` report is
one instance of a broader distribution defect.

Provide one reproducible distribution that installs or updates both the
canonical Claude/Codex skills and their complete shared SDD runtime. A skill
must resolve a compatible installed runtime deterministically, execute it
against an explicit target repository, and fail with a classified runtime
preflight result when it is absent or incompatible. This change must preserve
all current authorization, evidence, independent-review, and GitHub approval
gates.

## 2. Evidence and key findings

- `gh skill install` discovers and copies skill directories; it is not a
  general dependency installer. See [Global Skill Installation](../../docs/global-skill-installation.md)
  and the [GitHub CLI manual](https://cli.github.com/manual/gh_skill_install).
- Seventeen canonical skill packages reference helpers under top-level
  `scripts/sdd`, `scripts/validation`, or `scripts/github`; the required
  runtime has a transitive module dependency graph rather than four standalone
  files.
- The current global-install fixture verifies skill discovery and the
  `autonomous-sdd-delivery` sibling link, but not executable availability or
  invocation from a disposable installed profile.
- The Agent Skills specification permits scripts inside a skill package, but
  requires them to be self-contained or to clearly document dependencies.
  See [Agent Skills specification](https://agentskills.io/specification).
- The WordPress project builds host-specific distributable skill trees before
  installation rather than treating its source layout as the installed
  artifact. See [WordPress packaging](https://github.com/WordPress/agent-skills/blob/trunk/docs/packaging.md).
- Claude plugins also distribute shared utilities at the plugin root and
  resolve them from that installed root. This is useful precedent but is not a
  portable Codex runtime mechanism. See [Claude plugin reference](https://code.claude.com/docs/en/plugins-reference).

## 3. Options considered and tradeoffs

### Continue with `gh skill install` alone

Reject. It intentionally omits the shared runtime, producing install-success
messages for skills that cannot execute.

### Copy selected helpers into individual skill packages

Reject. The helpers import one another and validation/GitHub modules. Copying
only reported files fails; copying the full graph to every consumer creates
drift, inconsistent fixes, and a large duplicated supply chain.

### Claude-only plugin runtime

Reject as the primary solution. A Claude plugin can bundle shared scripts and
use `${CLAUDE_PLUGIN_ROOT}`, but Codex has no corresponding portable plugin
root. A Claude plugin may become a thin host adapter later, not the runtime's
source of truth.

### Staged, versioned shared runtime with cross-platform installers

Select. Keep `scripts/` as the source of truth, produce a validated staged
runtime artifact containing its complete dependency closure, and install that
artifact once beside the global skills. The installers use the same reviewed
source revision for both assets. This has one executable copy per user/profile
and works for Claude and Codex without relying on repository-relative paths.

## 4. Decisions, assumptions, and decision owner

### Owner direction captured

The owner has directed a shared distribution modeled on WordPress's staged
distribution approach, plus Bash and Windows PowerShell install/update
entrypoints under `scripts/` that refresh both `gh` skills and bundled
executables.

### Recommended implementation decisions

1. Add a runtime packaging manifest and deterministic builder that stages the
   full dependency closure from the existing top-level runtime sources. The
   builder must reject an untracked file, a missing import, an unsafe path, or
   an output that does not match the manifest.
2. Give the staged runtime a version and content digest derived from the
   reviewed source revision and manifest. The installer must install atomically
   into a versioned user-level runtime directory and switch the active runtime
   only after validation succeeds.
3. Add `scripts/install-ai-skills.sh` and
   `scripts/install-ai-skills.ps1`. Each exposes explicit `install` and
   `update` modes, stages or obtains one reviewed source revision, invokes
   `gh skill install --all` for the selected Claude/Codex targets, and installs
   the matching runtime artifact. `--force` remains opt-in and visible.
4. Expose one neutral runtime launcher/resolver on the user's executable path.
   Skills invoke that launcher with an explicit target repository rather than
   assuming that the current workspace contains `scripts/sdd`. The launcher
   validates the active manifest/version before dispatching a named entrypoint.
5. Preserve `scripts/` as the canonical source tree. The installed runtime is
   a generated distribution artifact; contributors do not edit it directly.
6. Update canonical skill instructions and platform adapters to use the
   resolver. Do not maintain divergent Codex and Claude policy.

These are recommendations, not a claim of completed owner approval for a
specific release channel, package name, or user-level directory.

## 5. Scope, non-goals, constraints, dependencies, and risks

### In scope

- A manifest-driven, staged SDD runtime distribution and deterministic
  completeness validation.
- Bash and PowerShell install/update scripts under `scripts/`.
- Installation of the complete canonical skill set through `gh skill`, paired
  with the exact matching runtime revision.
- Runtime resolver/preflight behavior and canonical skill-path migration.
- Disposable installed-profile integration fixtures that invoke every helper
  referenced by a distributed skill.
- Updates to [Global Skill Installation](../../docs/global-skill-installation.md),
  including prerequisites, install/update commands, activation, verification,
  recovery, and the distinction between global runtime and target repository.

### Non-goals

- Relaxing host approvals, GitHub permissions, autonomous authorization,
  review gates, or sandbox restrictions.
- Installing or configuring Claude Code, Codex, OpenSpec, credentials, MCP
  servers, product-specific settings, or target-repository policy.
- Publishing a marketplace/plugin-only implementation or duplicating the
  runtime into every skill.
- Rewriting unrelated dirty files or completing the existing
  `fix-claude-degraded-mcp-config` change.

### Constraints and risks

- The installer must only consume a reviewed local checkout or a pinned release
  revision; it must report an unclean source checkout and never call a broad
  reset/clean operation.
- Bash and PowerShell must have behaviorally equivalent argument validation,
  dry-run, overwrite, path quoting, failure reporting, and receipt semantics.
- The runtime must operate on an explicit target repository and cannot infer
  the intended workspace from its own installation directory.
- User-level paths and PATH registration differ by platform. The chosen
  launcher contract must work without hard-coded personal paths and document
  its required shell/session reload.
- Existing user-owned skills and runtime versions must not be deleted or
  overwritten without an explicit selected-target/force policy.

## 6. Open questions and blocking decisions

1. **Release channel:** Should normal users install from a signed/tagged GitHub
   release artifact, while contributors use a local checkout, or should the
   first release support local-checkout distribution only? The recommendation
   is both modes, with tagged artifacts as the documented normal path.
2. **Runtime launcher:** Should the portable launcher be a small published Node
   package/binary, or a managed executable shim installed by these scripts? The
   recommendation is one versioned Node launcher that is installed with the
   runtime and performs no network access at execution time.
3. **Runtime location and retention:** Define the non-secret cross-platform
   configuration location and the policy for retaining prior known-good runtime
   versions for rollback. This must be explicit before Apply because it affects
   user-level mutation and cleanup.
4. **Release integrity:** Confirm whether GitHub release provenance/attestation
   is required for the runtime artifact in addition to tag/commit pinning.

## 7. Recommended next step

Run OpenSpec Propose for `distribute-shared-sdd-runtime`, attaching this brief
as immutable proposal provenance. The proposal should resolve the four open
decisions, define the runtime manifest and launcher contracts, specify the
Bash/PowerShell parity matrix, and add delta requirements for distribution,
runtime resolution, installed-profile invocation, and installation
documentation.

After proposal review and explicit Apply authorization, implement only the
approved staged runtime, installers, migration, fixtures, and documentation.
