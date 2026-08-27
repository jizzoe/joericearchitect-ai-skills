## Why

A real multi-step Codex independent review can complete its read-only inspection and exit successfully while failing to write the final findings file required by the parent transport. The gate correctly fails closed, but production delivery remains blocked even when Codex emitted a usable final response in its structured event stream; issue [#247](https://github.com/jizzoe/joericearchitect-ai-skills/issues/247) tracks the corrective work.

## What Changes

- Replace Codex review-result dependence on the CLI's `--output-last-message` side effect with a fixed host-owned JSONL event capture path.
- Accept exactly one final completed agent message only after a valid completed turn, validate it against the existing findings schema, and atomically create the existing parent-owned result artifact.
- Reject intermediate messages, tool events and output, incomplete or failed turns, duplicate or post-terminal events, malformed JSONL, schema-invalid payloads, and arbitrary stdout or transcript substitution.
- Replace the one-line package file with a digest-indexed, byte-bounded review capsule whose complete ordered chunks reconstitute the unchanged sealed package.
- Make the durable runtime adapter selection authoritative at review dispatch and reject any prepared launcher, reviewer, or accepted result that does not match it.
- Preserve strict and authorized-degraded assurance boundaries, immutable package binding, reviewer separation, credential and network denial, result validation, safe diagnostics, and exact owned-resource cleanup.
- Add deterministic replay fixtures plus a real multi-step installed-CLI acceptance probe that demonstrates host-written artifact delivery after tool use.

## Non-Goals

- Do not waive, downgrade, or bypass independent review for controller-recovery PR #246 or any other delivery.
- Do not accept free-form stdout, transcripts, repository-written files, or model claims as review evidence.
- Do not change correction policy, controller phase advancement, D1 requirements-to-plan behavior, deployment, release, or credentials.
- Do not make an unproven Codex event shape a permanent compatibility promise; unsupported CLI revisions remain typed unavailable states.

## Scope and Security

The scope is limited to Codex review-result transport, bounded sealed-package
exposure, its installed-runtime host boundary, authoritative product adapter
dispatch, canonical protocol text, and focused evidence. The capture adapter
is a new elevated trust boundary, so its content identity, child executable and
arguments, independently supplied request digest, owned paths, expiry, event
bounds, credential scrubbing, network denial, and read-only reviewer profile
must all be sealed and revalidated. Raw events, stderr, commands, package
content, paths, credentials, and findings payloads are excluded from durable
diagnostics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `isolated-independent-review`: Require the host transport to derive the Codex findings artifact from a versioned, validated terminal JSONL event sequence, expose the sealed package through a bounded digest-indexed capsule, consume the durable adapter selection at dispatch, and fail safely when any binding or contract is absent, ambiguous, malformed, or unsupported.

## Impact

- Primary issue: [#247](https://github.com/jizzoe/joericearchitect-ai-skills/issues/247); blocked dependent delivery: [PR #246](https://github.com/jizzoe/joericearchitect-ai-skills/pull/246).
- Affected asset types: canonical review transport, package-capsule and adapter-dispatch scripts, installed runtime copies and manifest metadata, isolated-review specifications and protocol documentation, product configuration, deterministic tests, and a live acceptance probe.
- Users: autonomous production deliveries using the Codex strict or authorized-degraded independent-review adapters.
- Compatibility: the existing findings schema, package binding, result artifact, and downstream validators remain authoritative. Unsupported or changed CLI event contracts fail closed with safe metadata-only diagnostics.
- Migration: deliver and install a new runtime generation before retrying PR #246; no existing accepted review result is rewritten or reclassified.

## Reuse Plan

- Keep terminal-event parsing, bounded capsule creation, dispatch binding, and artifact creation product-neutral and assistant-neutral inside the canonical `scripts/sdd/` transport boundary.
- Keep Codex-specific invocation and event classification in the Codex platform adapter; Claude behavior remains unchanged.
- Keep repository, branch, issue, executable, credential, model, and Project values in authorization or configuration rather than reusable assets.
- Update generated or thin platform exposure only if the canonical skill contract changes; do not duplicate capture logic in wrappers.

This proposal is planning-only and does not authorize Apply, review bypass, delivery, runtime installation, or resumption of PR #246 or D1.
