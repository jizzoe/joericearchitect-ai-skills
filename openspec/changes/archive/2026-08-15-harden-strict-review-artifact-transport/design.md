## Context

See [proposal.md](proposal.md) for motivation and
[the delta specification](specs/isolated-independent-review/spec.md) for the
observable contract. The current Codex parent transport builds the sealed
review view and executable identity before returning an elevated invocation.
Executable trust deliberately includes a write-denial check that is meaningful
only in the managed parent sandbox. The transport currently accepts only a
final owned file, which is the correct provenance boundary, but a completed
Codex invocation can omit that file for a clean result.

## Goals / Non-Goals

**Goals:**

- Make the managed preflight and elevated launch separate, explicit state
  transitions with safe, distinct diagnostics.
- Establish whether the exact pinned Codex invocation can produce the required
  owned final artifact before it is used for a production strict review.
- Keep successful-review provenance artifact-only for both clean and
  findings-bearing outcomes.
- Preserve cleanup ownership, exact-head bindings, and no-degraded-fallback
  behavior under `strict-only`.

**Non-Goals:**

- Parsing stdout, transcripts, tool output, or JSONL as a review result.
- Weakening the read-only reviewer profile or granting the reviewer write
  authority outside its parent-owned result handoff.
- Changing Claude transport behavior, repository-specific paths, or user
  authentication configuration.
- Claiming that a failed managed mutation proof proves a particular operating
  system cause; it establishes only that this strict preflight boundary is not
  available.

## Decisions

### 1. Model strict Codex review as three sealed phases

The implementation will represent:

1. **Managed preflight** — resolve only fixed platform locations; prove
   managed-boundary mutation denial and platform signing; seal the identity.
2. **Parent launch** — consume only the sealed request and execute its fixed
   host-owned argument vector through the elevated parent tool.
3. **Artifact receipt** — inspect only the named parent-owned final file,
   validate it, then remove only the request-owned review view.

No later phase can resolve an executable or accept a caller-selected binary.
The parent-launch API will require the preflight seal rather than deriving a
new identity. A missing mutation-denial proof maps to a dedicated
`strict-preflight-boundary-unavailable`-class diagnostic; it is not conflated
with a missing executable, failed signature, or user profile setting.

Alternative considered: rerun preflight elevated and treat it as equivalent.
Rejected because elevated write visibility invalidates the proof the trust
policy is intended to record.

### 2. Preserve a parent-owned file as the sole result channel

The transport will retain `--output-last-message` and a fresh result location
owned by the request's temporary root. Managed preflight validates the pinned
executable's CLI support for the required output-file, schema, strict-config,
and isolated-profile switches. The actual strict review is the bounded
artifact-delivery proof: it succeeds only when the final bytes appear at the
configured owned path and pass the findings schema.

A separate clean-result model probe is deliberately not used. It cannot prove
that a later independent model invocation will write its own final artifact,
and would add an extra authenticated invocation without strengthening the
accepted evidence. If preflight or the production receipt lacks the file, the
transport emits a stable artifact-delivery diagnostic, removes owned temporary
state, and pauses. This gives a precise recovery path (repair the supported
Codex invocation or executable version) without silently lowering assurance.

Alternative considered: parse the last JSON-looking stdout/JSONL record and
copy it into the artifact. Rejected because tool logs and repository-derived
content can contain ambiguous JSON and would expand the trusted input surface.

### 3. Keep diagnostics safe and actionable

Add stable diagnostics for preflight-boundary unavailability and artifact
delivery unavailability. They expose only stage, operation, code, category,
subject, optional safe exit code, and retry guidance. They must not retain
temporary paths, command arguments, raw CLI output, sealed package content,
or authentication state.

Alternative considered: return the raw CLI transcript so an operator can
manually decide whether to accept it. Rejected because it defeats the
artifact-only contract and can disclose untrusted or sensitive data.

### 4. Verify deterministic contracts before live acceptance

Unit tests will inject trusted/denied mutation checks, request seals, artifact
creation, and cleanup to cover every transition. A bounded live acceptance
test will use the configured signed executable and sealed read-only profile to
prove an empty-findings final artifact; it records only the normalized result
or safe unavailability diagnostic. A findings-bearing fixture remains covered
by deterministic tests, avoiding repository or credential mutation.

## Risks / Trade-offs

- [The current Codex version cannot produce the file under the sealed profile]
  → The pinned CLI capability check or the strict receipt fails closed with a
  precise diagnostic; a supported CLI update or invocation repair is required
  before strict-only delivery.
- [Overly broad diagnostics expose operational data] → Reuse the existing
  allowlisted diagnostic envelope and test redaction at every new boundary.
- [A later refactor calls preflight from the host boundary] → Require the
  managed-phase seal at launch and cover the denied mutation-proof case with
  regression tests.

## Migration Plan

1. Add the phase and artifact-delivery contracts behind the existing Codex
   parent strict adapter interface.
2. Add deterministic and live acceptance evidence for the configured adapter.
3. Run the complete validation suite and strict OpenSpec validation.
4. Resume the blocked #86 strict review only after a fresh exact-head package
   receives a valid owned `passed` or `failed` artifact.

Rollback is a normal Git revert of the adapter change. The previous behavior
already fails closed on an absent artifact, so rollback cannot convert an
unavailable review into a passing result.

## Reuse Plan

The canonical result contract and safe diagnostics remain shared, while the
Codex-specific executable proof and capability probe stay in the platform
adapter. Claude continues to use the shared artifact contract unchanged. A
portability fixture supplies alternate repository paths and a simulated signed
executable identity; no product-specific paths, users, or credentials are
embedded in reusable assets.
