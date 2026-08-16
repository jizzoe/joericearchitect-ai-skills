## Why

Strict Codex review correctly fails closed when its exclusively owned final
result artifact is absent, but the current transport can invoke a valid
read-only reviewer that emits a response without producing that artifact. A
separate operator error also ran executable trust preflight across the elevated
host boundary, causing a safe mutation-denial check to be misdiagnosed as an
untrusted executable. This prevents a clean implementation from satisfying a
strict-only delivery gate even though the same signed Codex executable has
produced valid strict-isolated findings evidence.

This change makes the artifact-only strict transport reliable and makes the
managed-preflight versus elevated-launch boundary explicit, observable, and
regression-tested. It does not weaken strict review by accepting transcript,
stdout, or JSONL output as evidence.

Primary GitHub issue: [#104](https://github.com/jizzoe/joericearchitect-ai-skills/issues/104).

## What Changes

- Define a strict Codex transport preflight that runs only in the managed
  parent sandbox and records a distinct safe diagnostic when invoked from an
  elevated boundary.
- Keep elevation limited to execution of a previously sealed, fixed reviewer
  request; the elevated phase must not resolve, select, or trust an executable.
- Harden parent-owned final-result artifact delivery so a valid strict review
  either leaves the configured owned artifact for validation or returns an
  accurate fail-closed transport diagnostic with recovery guidance.
- Add deterministic adapter tests and a bounded live acceptance fixture for
  the two execution boundaries and a valid empty-findings `passed` artifact.
- Preserve artifact-only evidence acceptance. Transcript text, stdout, tool
  output, and intermediate structured messages remain inadmissible.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `isolated-independent-review`: distinguish managed executable-trust
  preflight from elevated reviewer execution and require reliable
  parent-owned final-result artifact delivery without a transcript fallback.

## Impact

- Affected code: Codex parent strict transport, executable identity resolver,
  result-artifact inspection, safe diagnostics, and their unit/eval fixtures.
- Affected users: autonomous `production-rapid`, `strict-only` delivery runs
  gain an actionable boundary diagnostic and a reliable strict result path.
- Compatibility: no result-schema or caller-facing repository configuration
  migration is intended. Existing artifact-only acceptance remains the sole
  successful-result provenance.
- Reuse plan: policy stays in assistant-neutral canonical contracts and
  adapters; Claude/Codex exposure remains thin. Repository paths, executable
  locations, and runtime approval state remain configured or host-derived,
  never embedded in reusable skill text.
