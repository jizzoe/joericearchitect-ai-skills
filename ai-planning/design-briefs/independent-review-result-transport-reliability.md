# Independent Review Result Transport Reliability

Date: 2026-08-14

Status: Propose-ready design brief. This is a follow-on reliability change;
it does not weaken the strict or authorized-degraded review gate.

## Decision

Create a focused OpenSpec change, proposed as
`harden-independent-review-result-transport`, that makes the Codex
parent-launch result handoff observable, atomic, and diagnosable.

The delivery gate will continue to accept a review only when it consumes the
schema-valid final payload from the sealed result path and all existing
package, authorization, reviewer, and cleanup checks pass. It must retain
safe diagnostic evidence long enough to report precisely why it rejected a
launch. A transcript message that resembles a passing JSON payload is never
delivery evidence.

## Problem

During an authorized-degraded Codex review of a sealed exact-head package, the
reviewer transcript displayed:

```json
{"schemaVersion":1,"findings":[],"status":"passed"}
```

The reviewer then continued tool activity. The parent gate reads a different
channel: the file named by Codex's `--output-last-message` argument. It
returned the generic unavailable code
`review-launcher-codex-tool-result-invalid` and removed the owned temporary
review archive.

That code currently represents all of these materially different conditions:

- invalid prepared request or execution receipt;
- absent, unreadable, or non-JSON final output file;
- invalid findings payload;
- failure while sealing or validating the normalized result;
- mismatch with the strict-unavailable precursor or degraded authorization;
- failed ownership-guarded cleanup.

The current success fixture manually writes valid JSON directly to the result
path. It does not exercise a real Codex `--output-last-message` run in which a
structured-looking assistant message is emitted before later tool activity or
final-message capture. Therefore the observed event cannot yet distinguish a
Codex final-output behavior from a consumer, binding, or cleanup defect.

## Evidence and Analysis

- `scripts/sdd/platform-review-adapters.mjs` renders Codex with both
  `--output-schema` and `--output-last-message <owned path>`.
- The consumer reads only that owned path, parses it, seals it into an
  `independent-review-result-v1`, validates the result, then cleans the owned
  archive.
- On any failure in that combined path it emits only
  `review-launcher-codex-tool-result-invalid`; it does not preserve a safe
  parse classification, output digest, byte count, validation code, or cleanup
  code.
- A locally constructed schema-valid `{ schemaVersion: 1, findings: [],
  status: "passed" }` payload seals and validates under the same expected
  package, reviewer, strict precursor, and degraded authorization bindings.
- The reviewer environment supplied no `PATH`; initial `sed` and `git` tool
  calls failed before the reviewer switched to absolute paths or shell
  built-ins. This is a separate contributor to unreliable inspection and must
  be diagnosed without broadening the reviewer's permissions, credentials, or
  network access.

## Goals

- Make the exact terminal payload consumed by the gate observable through
  non-sensitive metadata before owned cleanup.
- Distinguish missing, unreadable, malformed, schema-invalid, sealing-invalid,
  binding-mismatch, and cleanup-failure outcomes with stable machine-readable
  codes.
- Ensure a schema-valid terminal `passed` payload for the exact sealed package
  is accepted unless a separately reported binding or cleanup condition fails.
- Ensure a transcript-only or intermediate JSON message cannot be mistaken for
  delivery evidence.
- Provide a deterministic, minimal runtime environment for repository-read
  tools required by the configured Codex reviewer, while retaining the existing
  credential scrub, network denial, read-only filesystem boundary, and fixed
  invocation shape.
- Preserve the existing strict-first and fail-closed behavior for every
  unavailable, ambiguous, stale, or malformed outcome.

## Non-Goals

- Do not treat terminal transcript text as a substitute for the owned result
  file.
- Do not weaken `--output-schema`, the sealed package, reviewer freshness,
  result bindings, degraded authorization, or cleanup ownership checks.
- Do not allow network access, credentials, GitHub mutation, workspace writes,
  arbitrary shell input, or model-selected commands.
- Do not change model-selection policy, increase correction budgets, or make
  authorized-degraded review equivalent to strict isolation.
- Do not modify the in-flight `add-base-skills-research-and-planning` change
  merely to bypass its current delivery gate.

## Proposed Design

### 1. Split consumption into observable stages

Refactor the Codex parent transport consumer into explicit stages:

1. validate the prepared request and host-tool receipt;
2. inspect the owned result path with regular-file and size checks;
3. read and parse the final payload;
4. validate the findings payload against the canonical shape;
5. seal and validate the normalized degraded result;
6. validate strict-precursor and authorization bindings; and
7. perform ownership-guarded cleanup.

Each failed stage returns a specific stable unavailable code. The public result
contains safe metadata only: request digest, result-file presence, byte count,
SHA-256 digest of the raw final artifact, parse classification, validation
code, and cleanup code. It never stores raw reviewer output, credentials, or
package contents in logs, checkpoints, PRs, or source control.

### 2. Preserve diagnostic evidence until it is consumed

Do not delete the owned archive before the parent has derived the normalized
result or durable unavailable classification. The cleanup helper still runs on
every exit path and still refuses unowned paths. The durable record retains the
safe diagnostic metadata, not the temporary file itself.

This makes post-run triage possible without turning the archive into a retained
source of potentially sensitive package content.

### 3. Bind acceptance to the final output artifact

The adapter must regard only the bytes written to the owned
`--output-last-message` destination as the candidate findings payload. A
schema-valid JSON message observed in process stdout, a tool transcript, or an
intermediate stream event does not satisfy the gate.

If Codex can emit a schema-valid response and continue tool activity, the
adapter must test and document whether the output file contains the true final
message. If the CLI does not provide that guarantee, replace this single-file
handoff with a fixed host-owned wrapper that captures a defined terminal
structured event into the exclusively created owned file. The wrapper accepts
no repository-controlled executable or arbitrary arguments.

### 4. Supply a minimal deterministic command path

Add a fixed, platform-owned command-path value to the sanitized reviewer
environment only when required for the configured read-only inspection tools.
Keep the existing `env -i` launch, empty credential variables, explicit
network denial, and no inherited arbitrary environment. The implementation
must avoid machine- or product-specific absolute paths in reusable canonical
assets; platform resolution belongs in the adapter/runtime boundary.

## Required Behavior

| Condition | Required outcome |
| --- | --- |
| Final owned file is absent | `unavailable` with a missing-result-artifact code and safe receipt metadata. |
| Final owned file is non-regular, unreadable, empty, or oversized | `unavailable` with a specific artifact-inspection code. |
| Final file is not JSON or is not a valid findings payload | `unavailable` with parse or payload-validation code and digest/byte count. |
| Final file is valid `passed` JSON and all sealed bindings validate | normalized `authorized-degraded` passed review result. |
| Final file is valid but strict precursor or authorization differs | `unavailable` with the relevant binding-mismatch code. |
| Cleanup fails after a valid result | `unavailable` with cleanup failure; never claim delivery approval. |
| Transcript emits JSON before later activity | no acceptance unless the final owned file independently validates. |
| Read-only inspection command is unavailable | stable unavailable evidence that identifies the environment condition; no expanded permissions or fallback to writes/network. |

## Acceptance Evidence

An implementation proposal must include deterministic tests for:

- a real or faithful Codex transport fixture where an intermediate structured
  message is followed by tool activity and a distinct final capture;
- valid final `passed` and `failed` files accepted and sealed identically to the
  current canonical result contract;
- each result-file inspection, parse, payload, sealing, binding, and cleanup
  failure producing a distinct stable code with no raw output retention;
- result digest and byte-count metadata being deterministic and free of raw
  content or secret-like values;
- owned cleanup on every outcome, including a failed result read;
- a minimal sanitized command path allowing only intended read-only inspection
  commands, while credentials, network, GitHub mutation, workspace/Git writes,
  deployment, release, external sends, and delegated mutation remain denied;
- strict-only behavior remaining fail-closed and authorized-degraded behavior
  retaining its reduced-assurance labels and exact-package authorization; and
- portable second-workspace and thin-adapter checks continuing to pass.

## Risks and Mitigations

- **Diagnostic retention leaks review content.** Retain only metadata and a
  digest; always remove the owned archive through the existing guarded helper.
- **A command path broadens execution.** Use a fixed adapter/runtime value,
  retain the restricted permission profile, and test denied mutation/network
  capabilities explicitly.
- **More detailed codes reveal sensitive context.** Codes identify transport
  stage only, never paths outside the owned view, content, credentials, or
  environment values.
- **Fix masks an invalid review as passed.** Acceptance stays bound to the
  final owned bytes, canonical schema, exact sealed package, strict precursor,
  degraded authorization, and successful cleanup.

## Propose Readiness

This brief names a bounded reliability outcome, non-goals, observable
acceptance evidence, source paths, risk controls, and a first action. It is
ready for OpenSpec Propose.

Recommended first action: create an OpenSpec proposal named
`harden-independent-review-result-transport` with delta specifications for
`isolated-independent-review` and
`authorized-degraded-independent-review`, plus any narrowly necessary
`bounded-autonomous-execution` or delivery-evidence requirements.
