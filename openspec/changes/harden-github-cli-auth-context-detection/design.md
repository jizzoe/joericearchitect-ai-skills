## Context

See [proposal.md](proposal.md) for motivation and the delta specifications for
the behavior contract. GitHub helpers currently return raw process-level
success or failure, while autonomous controller state can bind issue intake and
lifecycle resources but has no typed authentication-context record. The
runtime manifest already distributes explicit payload-wrapper and subcommand
entrypoints to both assistant integrations.

## Goals / Non-Goals

**Goals:**

- Introduce one assistant-neutral classifier for a bounded `gh` read-only
  identity or repository probe.
- Make authentication contrast, safe evidence, and retry binding deterministic
  and independently testable without a live keychain or GitHub account.
- Persist only normalized, operation-bound recovery evidence in the
  controller, then use it before autonomous GitHub lifecycle operations.
- Make the contract available through the shared runtime and canonical
  autonomous-SDD guidance without creating duplicate Claude/Codex logic.

**Non-Goals:**

- Detecting, reading, or selecting a platform credential store directly.
- Replacing GitHub CLI, changing `gh` authentication configuration, or adding
  dependencies.
- Making a host preflight a substitute for operation authorization or runtime
  permission.

## Decisions

### Separate probe mechanics from SDD binding

Create a small reusable GitHub adapter module for structured read-only probe
execution and conservative error normalization. It accepts an injected command
runner in tests and returns a redacted evidence shape rather than process
output. A companion SDD module validates operation/repository/payload/expiry
binding and decides whether a contrast retry is eligible.

This keeps GitHub CLI mechanics reusable by non-SDD callers while retaining
authorization and durable-state policy in the SDD layer. Embedding the whole
classifier in the issue helper would make later Project and PR transitions
duplicate it; reading macOS Keychain, Linux secret stores, or environment
variables directly is rejected because it breaks the non-secret boundary.

### Use a semantic probe contract and two-context contrast

The probe contract names a stable command kind and target, not an arbitrary
shell command. The default uses a bounded GitHub identity probe; a configured
repository probe is allowed where repository access itself is required. The
restricted result is normalized to success, authentication-shaped failure,
unavailable CLI, or unknown without retaining raw stderr/stdout. Only an
authentication-shaped restricted result can request the active host-permission
boundary for the same contract.

The contrast evaluator emits restricted-runtime unavailability only after a
host success for the same probe binding. A second authentication-shaped failure
emits invalid-or-expired; denial before host execution emits host-permission
denied; all other combinations remain unknown and fail closed. This prevents a
single 401 from claiming either invalidity or a keychain boundary.

### Bind evidence to a typed, versioned controller record

Extend the controller record with an optional collection of validated,
independently versioned authentication-context evidence records containing the
selected entry, operation kind, repository, optional payload digest, expiry,
command kind, context classifications, timestamps, account identity when
returned, and a recovery reference. Exclude raw command output and
credential-derived values by construction and validation. A helper will persist
a pending probe binding before a host retry and then persist the normalized
terminal evidence, mirroring exact issue-intake binding behavior.

The controller will reject stale, cross-entry, cross-repository, digest,
operation, expiry, or command-kind mismatches. Existing controller records
without this optional collection remain readable; malformed or forged
authentication-context records fail closed rather than being inferred or
silently upgraded.

### Expose one runtime payload entrypoint and thin guidance

Add a declared runtime payload-wrapper entrypoint for probing, comparing, and
validating auth-context evidence. Register it in `scripts/runtime/manifest.json`
with smoke coverage. Update the canonical autonomous-SDD lifecycle and delivery
guidance plus workflow documentation to require it before GitHub lifecycle
calls. Generated Claude and Codex assets remain thin generated exposure; no
platform-specific duplicate classifier is created.

### Integrate at the GitHub helper boundary

The create-or-find issue path will accept current auth-context evidence for a
bound operation and fail closed before invoking `gh` when the evidence is
missing, stale, denied, unknown, invalid, or mismatched. A successful current
context preserves existing exact-title idempotency. Controller orchestration
uses the same contract for subsequent SDD GitHub operation adapters as they
are added, rather than making issue creation a special credential path.

## Risks / Trade-offs

- [Authentication errors vary by GitHub CLI and host] → normalize only narrow
  known authentication-shaped signals; classify unfamiliar failures as unknown.
- [Host retry could grow authority] → use a fixed read-only command contract;
  bind repository, operation, payload digest, and expiry; require the host
  runtime permission separately for both probe and original operation.
- [Safe evidence becomes too sparse to diagnose] → retain only stable class,
  context, timestamp, command kind, and returned account identity; include a
  documented recovery reference rather than raw output.
- [Evidence evolution affects resumed runs] → version the nested auth-context
  record and treat its absence as preflight-required, while rejecting malformed
  or stale records; never infer evidence from stale chat or raw logs.
- [Reusable assets acquire product constants] → put issue/Project/branch values
  only in config, exact operation requests, and test fixtures.

## Verification Strategy

- Unit-test probe normalization, output redaction, context contrast, binding
  equality, expired/mismatched rejection, and every terminal classification
  with injected runners.
- Extend controller and issue-intake tests for persisted auth records and
  GitHub invocation refusal without accepted current evidence.
- Verify runtime manifest registration, payload wrapper help, closure, and
  smoke tests; inspect canonical Claude/Codex exposure for thin linkage.
- Run focused Node suites, artifact and tracking validators, strict OpenSpec
  validation, secret-pattern review, portability review using alternate fixture
  values, and a same-session read-only code review.

## Migration and Recovery

The change adds no external service migration and no stored credentials.
Existing users continue to invoke `gh` through supported credential sources.
On an unfamiliar or failed preflight, the lifecycle pauses with a normalized
class and recovery reference; it does not attempt reauthentication, copy a
credential, or execute a substitute host command. Reverting removes the new
preflight integration and runtime declaration together, leaving previously
recorded controller evidence inert but non-sensitive.

## Attribution and Licensing

No third-party code, dependency, documentation excerpt, or asset is introduced.
The implementation uses Node.js standard-library facilities and the existing
GitHub CLI adapter, so there is no new attribution or license obligation.

## Recovery

The recovery boundary is security-sensitive: a failed or unrecognized probe
creates only normalized diagnostic evidence and pauses the affected GitHub
transition. Operators can restore a valid host permission or credential state
outside this repository, then resume with the same exact operation binding; no
recovery path prints, stores, bridges, rotates, or broadens credentials.

## Reuse Plan

The probe adapter, SDD binding, controller validation, and runtime wrapper are
canonical reusable assets. A second repository supplies its own configured
repository, lifecycle operation, payload digest, expiry, and runtime permission
without changing those assets. Claude and Codex invoke the declared shared
runtime helper through their thin canonical guidance. No third-party code,
assets, or dependencies are introduced, so no attribution or license update is
required.
