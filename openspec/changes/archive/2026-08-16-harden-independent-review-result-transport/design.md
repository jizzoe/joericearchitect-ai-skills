## Context

See [proposal.md](proposal.md) for motivation and
`specs/isolated-independent-review/spec.md` for the behavioral contract. The
current Codex parent transport reads one owned `--output-last-message` file,
seals it, validates it, validates exact bindings, and cleans the archive in one
combined branch. Its generic failure result erases the distinction needed to
diagnose a transcript/final-artifact mismatch.

## Goals / Non-Goals

**Goals:**

- Make result-artifact consumption and its fail-closed state machine observable
  through safe stage metadata.
- Preserve one canonical result validator and exact strict/degraded bindings.
- Keep the runtime-owned archive temporary while preserving durable, safe
  diagnostics after cleanup.
- Make restricted Codex inspection deterministic without inheriting ambient
  permissions or credentials.

**Non-Goals:**

- Do not accept transcript content as a review result or relax an unavailable
  result into delivery approval.
- Do not change reviewer model policy, correction budgets, result assurance
  labels, or the boundary for strict and authorized-degraded review.
- Do not add package-content logging, credentials, network access, arbitrary
  command arguments, or new external dependencies.

## Decisions

### 1. Model consumption as staged data, not one opaque failure

The Codex parent consumer will derive a structured diagnostic record before
cleanup. It will validate: transport receipt; owned result-file type, presence,
size, and safe bounds; raw file digest; JSON parse; findings-payload shape;
sealed normalized result; strict/degraded bindings; and cleanup. Each outcome
maps to a stable unavailable code and safe metadata.

Alternative: retain one generic result-invalid code and inspect temporary files
manually. Rejected because cleanup removes the evidence and manual retention
would break the sealed-package privacy boundary.

### 2. Final owned bytes are the sole candidate findings payload

The transport will continue using the exclusively created result path. It will
document and test that only the final bytes from this path enter
`sealCodexDegradedReviewPayload`; stdout and transcript output remain
diagnostic-only and are never parsed as evidence. If the Codex CLI cannot
guarantee this handoff, use a fixed host-owned event-capture adapter that
receives no repository-controlled executable or arbitrary argument.

Alternative: parse stdout when the output file is absent. Rejected because
streamed intermediate messages are not an authenticated final artifact and can
carry unrelated tool output.

### 3. Retain diagnostics, not artifacts

The durable unavailable record will retain stage, byte count, SHA-256 digest,
parse classification, validation/binding result, and cleanup outcome. It will
not retain raw output, full temporary paths, package content, or environment
values. The owned archive remains removed through the existing guarded helper
on every completion path.

Alternative: preserve the archive until a human inspects it. Rejected because
it unnecessarily retains sealed review content and weakens deterministic
cleanup.

### 4. Resolve a minimal inspection command path at the platform boundary

The adapter will add only a platform-owned deterministic `PATH` suitable for
read-only inspection commands to the already scrubbed environment. It will not
inherit caller `PATH` or other arbitrary variables. Tests will assert that the
reviewer cannot regain credentials, network, writes, GitHub mutation, release,
or delegated-mutation capability.

Alternative: hard-code a local absolute path in canonical assets. Rejected for
portability and because reusable assets must not encode machine-specific paths.

## Risks / Trade-offs

- **Safe diagnostics omit the decisive raw body.** → Stage code, digest, byte
  count, and parse classification provide enough correlation without retaining
  potentially sensitive content.
- **A minimal path permits unintended commands.** → Treat it as a fixed
  adapter-level runtime input; retain the read-only permission profile and
  explicit denied-capability tests.
- **Codex final-message semantics differ by runtime version.** → Add a faithful
  process fixture and return a terminal unavailable code if final-artifact
  semantics cannot be proven.
- **The repair has a circular review dependency.** → The owner authorized a
  human-reviewed bootstrap PR for this repair only; the implementation still
  runs all deterministic validation and does not waive independent review for
  `add-base-skills-research-and-planning`.

## Migration Plan

1. Add the staged diagnostic representation and deterministic tests while
   retaining the current public success result shape.
2. Update the Codex parent transport to produce and consume the safe record.
3. Validate strict-only and authorized-degraded rejection behavior plus
   portability and secret checks.
4. Deliver this repair through the owner-authorized human-reviewed bootstrap
   PR; rollback is a revert of the repair PR if it changes transport behavior
   unexpectedly.

## Verification Strategy

- Exercise each result-artifact inspection outcome and safe diagnostic field
  through focused adapter tests.
- Simulate transcript `passed` output paired with a malformed final artifact to
  confirm that final-artifact-only acceptance remains fail closed.
- Run the focused transport tests, complete Node test suite, adapter drift,
  OpenSpec artifact quality, strict OpenSpec validation, and whitespace/scope
  checks before delivery.

## Attribution and Licensing

This repair modifies repository-owned JavaScript and OpenSpec artifacts only.
It introduces no third-party code, dependency, model, or attribution obligation.

## Recovery

If the final result artifact is unavailable, inspect the stable transport code
and safe diagnostic record, repair the precise platform condition, and launch
a fresh isolated review. Do not recover by parsing transcript output, restoring
ambient credentials, or retaining sealed content. This recovery path preserves
security and portability while keeping unavailable evidence diagnosable.

## Reuse Plan

The staged diagnostics remain in the canonical independent-review adapter so
all callers use the same result contract and recovery behavior. No duplicate
platform wrapper or product-specific configuration is introduced.
