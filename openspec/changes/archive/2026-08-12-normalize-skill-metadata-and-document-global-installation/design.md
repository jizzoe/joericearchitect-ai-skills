## Context

See [proposal.md](proposal.md) for the motivation and scope. The repository has
seven canonical skill sources under `skills/base/`, while Claude and Codex
exposure must remain thin adapters rather than divergent skill definitions.
GitHub CLI's preview `gh skill` flow supplies source selection, pinning,
provenance, agent choice, and updates, but it cannot make missing metadata
valid or establish an agent's discovery behavior without testing it.
The security and portability boundaries are material: installed skills can
contain operational guidance, while reusable behavior cannot depend on one
user's paths, credentials, or active assistant environment.

## Goals / Non-Goals

**Goals:**

- Make every dynamically discovered canonical skill machine-identifiable and
  validate that property without a network dependency.
- Provide one tested GitHub-source installation guide for Claude Code and
  Codex, with explicit preview, trust, recovery, and support boundaries.
- Produce portable isolated fixture evidence without reading or modifying a
  contributor's real assistant-global directories.

**Non-Goals:**

- Replace GitHub CLI's installer or guarantee behavior outside the pinned,
  documented `gh`, Claude Code, and Codex versions.
- Change canonical skill behavior, install credentials or MCP configuration,
  or update assistant-global configuration without the user's explicit command.

## Decisions

### Use `gh skill` as the supported installer

Documentation and fixtures will exercise GitHub CLI's `gh skill` preview
commands for user-scope Claude Code and Codex installation. Commands will use
Git references that can be pinned to release tags or commit SHAs; they will
include preview and listing/verification steps. `gh skill` owns installation
provenance, conflict behavior, version selection, and updates.

Alternatives considered:

- A repository copy installer duplicates platform behavior and adds a new
  compatibility surface, so it is deferred.
- Native Codex-only installation does not meet the cross-agent requirement.
- Symbolic links suit checkout development but are non-portable and fragile for
  user installation.

### Make the metadata rule dynamic and content-only

A small local validation command will enumerate distributable
`skills/base/*/SKILL.md` files, parse only YAML frontmatter, and check the
required fields, uniqueness, format, and directory match. It will neither load
nor execute a skill. Test fixtures will include valid discovery of a newly
created fixture skill and separate invalid conditions.

The rule will be wired into the existing local validation entry point and CI
after those boundaries are inspected during Apply. The skill-creation guide or
template will define the same frontmatter contract for authors.

Alternatives considered:

- A fixed seven-skill list is immediately stale when a new skill is added.
- Parsing Markdown with regular expressions is less reliable than a YAML
  frontmatter parser already available in the repository toolchain, or a small
  constrained parser if no dependency is available.

### Keep adapters as wrappers and test installations out of process

Canonical metadata remains only in `skills/base`; Claude/Codex adapters retain
their current thin-wrapper responsibilities. Disposable homes, temporary
directories, and isolated environment variables will be used to run `gh skill`
and each agent. The fixture will capture tool versions, source/ref, selected
agent, scope, result path, discovery, invocation, and command output with
credentials redacted.

An agent invocation is not substituted with filesystem inspection. When an
agent or CLI prerequisite is absent, the fixture reports a blocked result and
the documentation lists no support claim for that combination.

### A custom installer needs a separate evidence-backed decision

Fixture results determine whether `gh skill` is adequate. A custom installer
cannot be added in this change unless the evidence reveals a repeatable gap;
that outcome requires a new OpenSpec proposal defining its ownership, managed
manifest, dry-run, conflicts, update, and uninstall behavior.

## Affected Boundaries

- Canonical sources: `skills/base/*/SKILL.md`.
- Platform exposure: existing `.claude/skills/` and `.agents/skills/` wrappers;
  no canonical policy is copied into them.
- Validation and fixtures: repository-local scripts, test fixtures, package
  scripts, and CI configuration selected during Apply.
- Documentation: the normal `docs/` installation guide, repository discovery
  entry points, and skill-authoring guidance.
- External state: GitHub CLI uses an authenticated public-source fetch only in
  disposable fixture homes. No fixture may use real user homes, tokens in logs,
  or overwrite a destination.

## Risks / Trade-offs

- [`gh skill` is preview behavior] -> Pin and record CLI versions, use isolated
  tests, document the tested range, and avoid presenting untested behavior as a
  stable contract.
- [Agent discovery paths or CLI flags differ by version] -> Capture exact
  commands and paths in fixture evidence, state the support boundary, and open
  a separate decision only for a repeatable gap.
- [Metadata checker accidentally broadens to non-canonical Markdown] -> Scope
  discovery to distributable canonical skill directories and add negative
  fixtures for unrelated wrapper files.
- [Fixture actions reach a real account or filesystem] -> Require temporary
  homes, explicit disposable paths, preview before mutation, redaction, and
  cleanup only within fixture-owned paths.
- [Installed source contains executable operational guidance] -> Document
  source/ref review and preview before install; never auto-install credentials
  or run arbitrary skill-provided scripts in the validator.

## Attribution and Licensing

The implementation uses the documented GitHub CLI `gh skill` interface and
official Claude Code/Codex discovery guidance as behavioral references. Apply
will cite the relevant upstream documentation in user-facing material and keep
any copied command syntax or attribution within its source terms. No external
skill content, installer implementation, or license-incompatible code is
imported by this design.

## Recovery

Metadata failures are corrected at the canonical source rather than bypassed
with wrapper edits or validator exceptions. Fixture failures retain their
versioned, redacted evidence, remove or narrow an unsupported documentation
claim, and create a separate proposed change for any custom-installer decision.
All fixture cleanup is limited to fixture-owned temporary homes; the normal
guide never removes or overwrites user-authored global content.

## Migration Plan

1. Inventory canonical skills and normalize their frontmatter while preserving
   directory and wrapper identities.
2. Add and prove local metadata validation, then wire it into existing local
   and CI quality checks.
3. Publish the `gh skill` guide only after exact commands have passed isolated
   fixtures for the declared versions.
4. On a metadata-validation regression, correct canonical metadata or remove
   the invalid skill from distribution rather than weakening discovery.
5. On an installer-fixture failure, retain the evidence, remove the unsupported
   claim from documentation, and use the normal OpenSpec process for any
   follow-up installer decision. No rollback mutates user global state because
   fixtures are disposable and installation instructions remain user-initiated.

## Verification Strategy

- Unit tests cover valid metadata, each invalid condition, dynamic discovery,
  and offline operation.
- Integration fixtures cover Claude-only, Codex-only, and dual-agent `gh skill`
  flows, fresh install, preview/no mutation, second run, conflict reporting,
  update/listing, and invocation. Tests that require network or installed
  agents explicitly report skips or blocked prerequisites rather than passing.
- Review checks confirm wrapper thinness, no product-specific constants or
  secrets, path-with-spaces handling, documentation commands, license and
  attribution status, and recorded version evidence.
- Completion evidence includes fixture reports, focused test output, normal
  repository validation, `openspec validate --all --strict`, and a diff review.

## Reuse Plan

- Canonical metadata rules, validators, fixture harnesses, and documentation
  language are reusable and assistant-neutral.
- Repository URL, selected release ref, fixture temp-home path, and tested
  version data are configuration or generated evidence, not embedded reusable
  product constants.
- Claude/Codex platform differences are passed as installer selections and
  verified in one fixture per platform; a second-product fixture with a
  different source layout proves no dependency on this repository's personal
  paths or active user environment.
