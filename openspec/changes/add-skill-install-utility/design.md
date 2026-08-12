## Context

See proposal.md and the `skill-install-utility` delta spec. `gh skill install`
already owns source acquisition, metadata injection, destination resolution,
conflict behavior, and provenance. The requested utility must reduce repeated
command construction without becoming a second installer.

## Goals / Non-Goals

**Goals:** provide one portable Node CLI for explicit local and remote
user-scope installs, a safe development overwrite path, dry-run visibility,
and deterministic tests.

**Non-Goals:** copy skill files, link directories, alter profiles or
credentials, hide `gh` errors, select a source automatically, or implement
update/uninstall behavior.

## Decisions

### Delegate to GitHub CLI without a shell

The utility will use a Node child-process API with an argument array to invoke
`gh skill install`. It will not construct a shell string or execute source,
skill, or agent values as shell code. `gh` remains the sole installer.

Alternative: a shell wrapper would be shorter but would make quoting and
untrusted-path handling less reliable.

### Require explicit source, selector, agent, and overwrite choice

The utility will expose mutually exclusive `--local <directory>` and
`--remote <owner/repository>` options, one of `--skill <path>` or `--all`, and
required `--agent <identifier>`. It always adds `--scope user`; `--force` and
remote-only `--pin <ref>` are opt-in. This matches the safe manual workflow
while making local iterative installation concise.

Alternative: infer the current checkout or default Codex. Rejected because it
could install the wrong source or alter a caller's global assistant state.

### Test argument construction with a stubbed executable

The command builder will be exported for unit tests. Execution tests will use a
temporary stub executable selected through a test-only dependency injection
point, proving no shell execution, dry-run non-mutation, argument order,
failure propagation, local mode, remote mode, pin rejection, and force scope.

## Risks / Trade-offs

- [GitHub CLI contract changes] → preserve direct `gh` documentation and run
  a disposable fixture against the tested CLI version.
- [Caller overwrites a global skill] → require explicit `--force`, selector,
  and user scope in every command.
- [Local checkout changes are not visible automatically] → document that each
  development iteration re-invokes the utility with explicit force.
- [Credential or path leakage] → never print environment values and pass
  argument arrays rather than shell strings.

## Verification Strategy

Focused tests will prove exact local and remote argument construction, dry-run
non-mutation, failure propagation, and malformed input rejection. A disposable
second-checkout fixture will prove portability across source paths without
performing an install. Security review will confirm no shell interpolation,
credentials, or user-profile mutation beyond the explicit `gh` invocation.

## Migration Plan

1. Add the utility, tests, documentation, and fixture evidence.
2. Retain all direct `gh skill` commands as supported alternatives.
3. Remove the utility only by deleting its files; it creates no state beyond
   the `gh`-managed installed skills already governed by existing recovery
   guidance.

## Attribution and Licensing

The utility uses GitHub CLI command syntax from the documented `gh skill`
interface. It imports no third-party installer implementation.

## Recovery

Callers inspect the printed dry-run arguments before installation. On failure,
the utility preserves `gh`'s status and output; users use `gh skill list` and
the existing installation guide for conflict recovery. No broad cleanup is run.

## Reuse Plan

The command accepts source, selector, agent, pin, and force at runtime. It is
assistant-neutral because `--agent` is caller input; Codex and Claude exposure
remains `gh`-owned. A second checkout fixture verifies no repository-specific
paths are embedded, preserving portability. Product-specific credentials,
repositories, and profiles are intentionally excluded.
