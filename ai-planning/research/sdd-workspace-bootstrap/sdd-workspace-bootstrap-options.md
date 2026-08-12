# SDD Workspace Bootstrap: Research Findings

Date: 2026-08-10
Status: Research complete; decision pending
Related plan: [Global Skill Installation and SDD Workspace Bootstrap
Implementation Plan](../../plans/global-skill-installation-and-sdd-workspace-bootstrap-implementation-plan.md)

## Executive Summary

The reusable bootstrap capability should orchestrate and validate native
OpenSpec features, not recreate multi-repository coordination from scratch.
Current OpenSpec offers a standalone planning-store model for genuinely
multi-repository work, read-only references from code repositories, diagnostics,
and personal worksets. These are a much better fit than generating a permanent
custom workspace tree in every product repository.

There is a version boundary that must be decided before implementation. This
repository currently runs OpenSpec `1.8.0`. Local help confirms `store` and
`workset` commands, but no `workspace` command. The current public OpenSpec
documentation describes additional beta workspace setup and update behavior.
The bootstrap skill must either:

1. Support the repository's pinned OpenSpec version using only verified
   `store` and `workset` behavior; or
2. Make an OpenSpec upgrade a separate, explicit, tested prerequisite and then
   use the newer beta workspace features behind a version check.

Do not write a reusable skill that assumes the latest public OpenSpec CLI while
this repository remains pinned to 1.8.0. The generated assistant locations and
workflow semantics may differ between those versions.

## Scope and Questions

This research covers bootstrapping an SDD workspace for a future single- or
multi-repository product, including a full-stack mobile application with mobile,
API, and infrastructure repositories. It does not design that product's domain
architecture, create its credentials, or initialize production cloud resources.

Questions investigated:

1. Where should shared plans and specifications live when work spans repos?
2. What should be shared versus machine-local?
3. What can OpenSpec initialize, diagnose, and update natively?
4. Which parts justify a reusable skill, scripts, templates, and tests?
5. Which original plan assumptions are invalidated by current OpenSpec behavior?

## Current OpenSpec Model

### Single Repository Is the Default

OpenSpec recommends a normal repository-local `openspec/` directory when one
repository owns the planning, implementation, and archive lifecycle. It is
brownfield-first: specifications grow with changes rather than being written
for an entire system up front.

Source: [Using OpenSpec in an existing project](https://openspec.dev/docs/existing-projects),
[OpenSpec FAQ](https://openspec.dev/docs/faq).

### Planning Store for Genuine Multi-Repository Work

For a feature or product spanning several repositories, OpenSpec's beta stores
feature creates a dedicated planning repository. The store has its own
`openspec/` directory and is committed, reviewed, pushed, and pulled like any
other Git repository. Code repositories can declare a store pointer or a
read-only reference. OpenSpec does not clone, synchronize, commit, or push on
its own.

This maps well to the intended mobile product:

```text
product-planning-store
  └── openspec/              shared product requirements and cross-repo changes

mobile-app                   implementation repository
api-services                 implementation repository
infrastructure               implementation repository
```

The primary product-level specifications should normally live in the planning
store. Implementation-specific designs can remain in their owning repository
where that makes review and delivery clearer. The decision record must define
this boundary before any file generation.

Sources: [OpenSpec stores user guide](https://openspec.dev/docs/stores),
[OpenSpec CLI reference](https://openspec.dev/docs/reference/cli).

### References and Worksets

References expose another store's specifications as read-only context; they do
not copy the source content or move a repository's own changes. `openspec
context` reports the assembled working context, and `openspec doctor` checks
relationship health.

Worksets are deliberately personal, local views of folders a developer opens
together. They must not become shared product configuration: a workset records
local checkout paths and tooling preference, not product ownership or release
state.

Sources: [OpenSpec stores user guide](https://openspec.dev/docs/stores),
[OpenSpec CLI reference](https://openspec.dev/docs/reference/cli).

### Current Local Version Boundary

The local command evidence on 2026-08-10 is:

```text
openspec --version  ->  1.8.0
openspec --help     ->  store and workset are available
openspec workspace --help  ->  no workspace command is available
```

The current public documentation also describes beta `workspace` setup, update,
link, relink, doctor, and open flows. It must be treated as a future-version
option, not a contract provided by OpenSpec 1.8.0.

The repository's existing `docs/sdd-workflow.md` also documents 1.8.0 and
generated Claude and Codex exposure. A bootstrap implementation must preserve
that pinned baseline unless an OpenSpec upgrade change explicitly revises and
tests it.

Sources: [OpenSpec CLI reference](https://openspec.dev/docs/reference/cli),
[OpenSpec stores user guide](https://openspec.dev/docs/stores),
[How OpenSpec commands work](https://openspec.dev/docs/how-commands-work).

## Implications for the Proposed Bootstrap Skill

### Reusable Skill

The canonical `bootstrap-sdd-workspace` skill remains justified. It should
provide the decision procedure and safe orchestration that the CLI does not:

- Determine whether the user needs a repository-local setup or a dedicated
  planning store.
- Collect explicit product, repository, ownership, and assistant inputs.
- Describe what is global, product-owned, repository-owned, and machine-local.
- Select native commands only after checking installed versions and features.
- Require review before external writes, global configuration changes, or
  assistant initialization.
- Produce a clear verification and targeted-recovery report.

The skill should not claim to be an alternative implementation of OpenSpec
stores, references, worksets, or generated assistant integration.

### Scripts and Templates That Generate Workspace Files

Use templates only for product-owned, portable configuration and guidance. A
candidate minimum set is:

```text
<planning-store>/
├── AGENTS.md                       product-specific operating guidance
├── openspec/                        native OpenSpec root
├── config/
│   └── product-repositories.yaml    explicit product repository manifest
└── docs/
    └── workspace-operations.md      product-specific operator guide
```

The skill should call `openspec init` or store setup for OpenSpec-managed files
instead of copying generated OpenSpec files from a template. It must never
manually recreate platform-generated skills or commands.

The bootstrap script should support:

- Inventory-only and dry-run modes.
- Explicit target paths and no silent directory creation outside approved
  targets.
- Template rendering from user-provided values.
- Existing-file detection with create, skip, merge, and conflict reporting.
- Idempotent reruns.
- Explicit ownership markers for files the bootstrap tool manages.

### Multi-Repository Discovery and Configuration

Use an explicit manifest as the shared source of truth. Discovery can scan a
user-selected parent directory and suggest Git repositories, but must never
assign membership or roles automatically.

A suitable product-owned manifest shape is:

```yaml
version: 1
product: mobile-platform
planning:
  kind: openspec-store
  store_id: mobile-platform-planning
repositories:
  - id: mobile-app
    role: mobile-client
    path_hint: ../mobile-app
    default_branch: main
  - id: api-services
    role: backend-services
    path_hint: ../api-services
    default_branch: main
  - id: infrastructure
    role: infrastructure
    path_hint: ../infrastructure
    default_branch: main
```

Use repository IDs, roles, and relative path hints in committed product
configuration. Keep machine-specific absolute paths and personal worksets out
of Git. The manifest must be validated for duplicate IDs, duplicate roles where
disallowed, missing paths, missing Git repositories, and inconsistent default
branches.

### Automated Claude and Codex Initialization

Initialization must be version-gated. For the current local baseline,
OpenSpec's verified `init --tools claude,codex --profile <profile>` path is the
starting point. Before running it, the bootstrap must inspect existing
configuration, selected profile, generated ownership, and destination paths.

Required safeguards:

- Default to reporting the intended command and generated paths before running
  it.
- Require confirmation before changing global OpenSpec workflow configuration
  or files outside the product planning repository.
- Use the installed OpenSpec version's documented generated locations rather
  than hard-coding a `.agents`, `.codex`, or `.claude` path from another
  version.
- Preserve unrelated Claude and Codex configuration.
- Ask the user to restart or reload the assistant after generation when the
  platform requires rediscovery.
- Record generated-file provenance and refresh through the owning tool rather
  than editing generated content manually.

### Verification and Recovery Tooling

The bootstrap capability should assemble native evidence rather than infer
success from command exit status alone:

| Concern | Verification | Recovery boundary |
|---|---|---|
| Planning store | Store registration and Git presence | Register, relink, or report the exact missing store |
| Repository manifest | Schema and filesystem validation | Correct only the invalid configured record |
| OpenSpec relationship | `openspec doctor` and `openspec context` | Report missing references and exact repair command |
| Generated assistant assets | Version-aware inventory and provenance check | Refresh only the affected assistant through OpenSpec |
| Product workspace | Manifest and path checks without mutation | Do not clone, move, or initialize a discovered repository automatically |
| Rerun behavior | No unexpected diff after a completed run | Report stale managed file or changed input |

For partial failure, retain successful output, identify the failed step and
path, and retry only that operation. Do not use destructive cleanup as a
general recovery strategy.

## Design Options for the Decision Record

| Option | Description | Assessment |
|---|---|---|
| A. Stay on OpenSpec 1.8.0 | Bootstrap store/workset behavior present locally; do not use newer workspace APIs | Lowest compatibility risk; requires a focused feature set |
| B. Upgrade OpenSpec first | Make version upgrade, generated-file migration, and compatibility validation a separate OpenSpec change | Enables current beta workspace APIs; higher migration and churn risk |
| C. Build a custom multi-repo manager | Generate and maintain repository linkage, view state, and assistant files independently | Not recommended; duplicates native OpenSpec concepts and raises drift risk |

Provisional recommendation: select Option A for the first bootstrap capability.
Support a planning store, explicit manifest, and local workset instructions.
Evaluate a separately versioned OpenSpec upgrade only after the initial
capability has proven what the product needs that 1.8.0 lacks.

## Required Fixture and Manual Tests Before Decision

1. Create an isolated temporary planning-store fixture and register it.
2. Configure at least two empty Git repositories as explicit members without
   modifying their implementation files.
3. Verify `store doctor`, `context`, and `workset` behavior under OpenSpec 1.8.
4. Verify what `openspec init --tools claude,codex` generates under the pinned
   version and whether it preserves unrelated configuration.
5. Compare that fixture with a separately isolated current-OpenSpec environment
   only if upgrade Option B is being considered.
6. Test missing repositories, an invalid manifest, a moved store, and partial
   assistant-generation failure.
7. Confirm every automated write has an explicit owner, preview, and recovery
   instruction.

## Plan Corrections to Carry Into the Decision Phase

- Do not assume a `workspace` command or workspace-generated file layout while
  targeting OpenSpec 1.8.0.
- Do not template `.claude/skills/` or `.agents/skills/` contents that
  OpenSpec owns; invoke the version-appropriate OpenSpec generator instead.
- Treat a product repository manifest as product-owned configuration, while
  OpenSpec worksets remain personal machine-local convenience state.
- Keep a future mobile application's product specs in its planning store, not
  in this reusable skills repository.
- Keep the global skill installer independent from bootstrap. The bootstrap may
  document it as a prerequisite but should not duplicate its behavior.

## Research Sources

- [OpenSpec stores user guide](https://openspec.dev/docs/stores)
- [OpenSpec CLI reference](https://openspec.dev/docs/reference/cli)
- [Using OpenSpec in an existing project](https://openspec.dev/docs/existing-projects)
- [How OpenSpec commands work](https://openspec.dev/docs/how-commands-work)
- [OpenSpec FAQ](https://openspec.dev/docs/faq)
- [OpenSpec GitHub repository](https://github.com/Fission-AI/OpenSpec)

All sources were accessed on 2026-08-10. Stores, worksets, and the newer
workspace features are documented as beta or evolving surfaces. The local
OpenSpec 1.8.0 command inventory is the authoritative compatibility baseline
for any near-term implementation in this repository.
