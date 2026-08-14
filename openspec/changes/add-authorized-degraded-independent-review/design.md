## Context

See [proposal.md](proposal.md) and the delta specs. The strict v1 review path
already seals a package, creates a detached view, probes Codex/Claude adapters,
validates a common result, and binds review evidence into the delivery checker.
It deliberately fails closed if the adapter cannot prove OS-isolated read-only
execution. This change needs an explicit owner-selected exception without
turning a runtime limitation into silent policy.

## Goals / Non-Goals

**Goals:**

- Preserve strict-isolated review as the only default path.
- Allow one exact, expiring, owner-authorized fallback only after a durable
  strict unavailable result for the same sealed package.
- Bind reduced assurance and all remaining capability restrictions to durable
  checkpoint and delivery evidence.
- Keep canonical policy adapter-neutral and platform wrappers transport-only.
- Require zero operator mediation after a bounded run begins, including every
  correction and exact-head rereview.
- Let users select the complete safe policy through a small stable vocabulary,
  with deterministic expansion and one useful clarification when required
  inputs are missing.

**Non-Goals:**

- Do not let configuration, an adapter, a PR label, or a reviewer choose
  degraded review; do not broaden credentials, networking, mutation tools, or
  model-routing policy.
- Do not make a fallback claim OS isolation or edit normal user settings.
- Do not infer absent risk-bearing input, make `rapid` mean reduced quality, or
  let a repository preset create runtime permission.

## Decisions

### 1. Extend the current v1 record instead of adding an unbounded side channel

`independent-review-result-v1` gains an `assuranceLevel` discriminator,
capability ledger, strict-unavailable precursor, and degraded authorization
record. Strict values remain explicit and fully validated; degraded values have
their own required fields and reject assertions of strict isolation/read-only
enforcement. This preserves one package/result validator and prevents delivery
from accepting a loose auxiliary file.

Alternative: a second opaque fallback format. Rejected because its bindings,
findings, and recovery path could drift from the delivery gate.

### 2. Validate authorization before invoking the fallback

Add a pure validator that receives the run authorization, selected change and
transition, current SHA/manifest, strict unavailable record, current time, and
correction context. It returns a stable failure code and a normalized record.
The operation checker calls this only after strict review has failed unavailable
and before invoking a degraded reviewer. The execution path repeats the same
validation with a fresh runtime clock immediately after the reviewer returns
and binds acceptance to that post-invocation record, so a review that completes
at or after expiration cannot pass. It is not an adapter capability or
configuration feature flag.

Alternative: adapter decides whether to downgrade. Rejected because it makes
transport choose authorization and cannot bind risk acceptance to delivery.

### 3. Use a separately named degraded adapter result path

The platform adapter creates a new noninteractive process and the existing
owned detached view. Its fixed request exposes only the sealed package and
allowlisted inspection commands. Every adapter probe and strict or degraded
reviewer subprocess receives only an allowlist of cross-platform operational
environment variables plus fixed adapter overrides; it never inherits the
caller's ambient credential values or process-injection variables. Codex keeps
only the platform home/profile locations its parent CLI needs to load its own
cached login, while a strict-config OS permission profile limits every model-
generated command to minimal runtime paths and the detached workspace, disables
tool network access, and passes no parent environment into tools. Claude
processes receive an empty launcher-owned temporary home plus isolated config,
cache, data, and temp paths. The adapter also
disables configured GitHub, web, deployment, release, external-send, and
delegated-mutation tools where the runtime permits. The capability ledger
accurately categorizes controls as enforced, unavailable, or
instruction-constrained; it does not claim an OS boundary where one cannot be
proven.

Alternative: use a same-session subagent. Rejected because it receives
implementation history and cannot establish independent freshness.

### 4. Keep delivery evidence exact and re-evaluable

Checkpoint review records retain a strict unavailable precursor and, when
eligible, one exact degraded result. The delivery checker recomputes package
and authorization bindings, verifies the assurance discriminator, and applies
the existing result/finding logic. A new head or correction causes strict-first
re-evaluation. The one-time queue-1 bootstrap record uses the same durable
shape but is scoped in the run authorization and expires at Archive merge.

### 5. Recover nested-reviewer startup through separately authorized Codex and Claude launchers

Some managed outer sandboxes deny Git worktree creation, the nested Codex app-
server's local IPC initialization, or Claude's strict sandbox. A package-only
same-session retry would not satisfy the detached committed-view contract. The
recovery path therefore uses a configured review launcher capability that,
when runtime permission explicitly allows it, creates the owned detached exact-
head view outside the outer sandbox and starts either an ephemeral Codex process
requesting its inner read-only sandbox or a nonpersistent Claude process with
only read/search tools and sealed-package input.

The pure controller and host never self-escalate. The runner first records the
stable launcher-unavailable code and proceeds only when the current run
authorization and runtime permission explicitly permit the configured
launcher. The in-sandbox recovery controller can only validate and prepare a
digest-bound structured request. A separately configured host script, invoked
outside the failed sandbox by the parent runtime transport,
validates that request, reconstructs the full diff and every declared artifact
hash directly from regular Git blobs in its detached committed view, rejects
symlinks and other non-regular artifact entries, rejects any canonical package
mismatch, and exclusively creates the sealed-package file so a committed file
or symlink at that reserved path fails closed. The host owns review-view setup
and reviewer invocation. The
controller accepts the response only with runtime-supplied outside-sandbox
execution data bound to the request digest and host execution. Under the
accepted degraded-risk decision, this ordinary data is evidence of the intended
launch but not cryptographic proof against an adversarial implementation
process. The prepared
host request omits the controller's caller-supplied clock; host execution and
controller acceptance independently evaluate expiration using their current
runtime clocks, preventing replay of a previously valid timestamp.

Neither component receives arbitrary shell text, implementation history,
GitHub/deployment tools, or credentials as review input. Evidence records the
external host launch separately from the inner reviewer's assurance ledger.

Alternative: run a package-only reviewer outside the outer sandbox. Rejected
because it loses the detached committed view required by the review protocol.

### 6. Treat degraded host evidence and executable identity as accepted, unverified risks

The first release does not introduce a trusted service, OS-protected signing
key/capability, authenticated IPC channel, or host-owned executable registry.
The controller and host exchange ordinary digest-bound JSON, and the executable
path is accepted when its basename matches the selected `codex`/`codex.exe` or
`claude`/`claude.exe` launcher. A sufficiently adversarial implementation
process can forge the runtime evidence or substitute a malicious executable
with that basename.

The owner explicitly accepts these two findings for authorized degraded review
only. They remain recorded as accepted risks, not resolved controls. The result
is a best-effort fresh independent quality signal and is never described as
strict, OS-isolated, read-only-enforced, or security-verified. Strict review is
unchanged, still attempted first, and still requires its verified adapter
boundary. Finding severity remains separate from disposition: an objective,
behavior-preserving correction may proceed within budget regardless of
severity, while a finding classified `human-decision` remains subject to the
normal pause.

Alternative: add a trusted launcher service, protected key/capability,
authenticated IPC, executable pinning, rotation/audit lifecycle, and equivalent
CI provisioning. Deferred because it adds platform-specific machine and CI
setup that the owner judged disproportionate for an explicitly authorized
degraded fallback.

### 7. Resolve concise delivery requests through a closed preset vocabulary

Add a pure request resolver in `scripts/sdd` and a canonical runner reference
that define six required inputs: target, mode, quality profile, authorization
profile, independent-review policy, and expiration. The resolver accepts only
published values, emits a normalized effective-authorization record, and
returns a stable structured gap for every missing or invalid field. The skill
renders all gaps in one concise message with each field's meaning and possible
values before selecting or mutating anything.

`production-rapid` means production quality with the full evidence gates and
the existing three-correction maximum per failure signature; the complete
chain remains globally ordered even when it contains more than three distinct
signatures. `rapid` means routine, already bounded
transitions and objective corrections do not require repeated conversational
approval. `sdd-delivery` expands to the selected entry's normal linked SDD
lifecycle and excludes deployments, releases, credentials, external messages,
and unrelated mutations. `strict-first-degraded` is the affirmative owner
choice that derives an exact degraded authorization only after strict
unavailability and also permits configured Codex or Claude launcher recovery
when the active runtime separately permits that launcher. `strict-only` pauses at strict
unavailability.

The resolver does not parse arbitrary prose or execute commands. The assistant
maps explicit prompt labels and unambiguous named targets to its input, then the
pure resolver validates the result. A duration is converted to one absolute
expiration from the recorded goal start so recovery cannot extend it.

Alternative: require every caller to restate all lifecycle and review safety
details. Rejected because duplicated prompt policy drifts and makes safe
behavior depend on individual memory.

### 8. Make the parent runtime transport explicit and terminal

Add one assistant-neutral orchestration operation:

`invokePreparedReviewHost(preparedRequest) -> hostResponse + runtimeReceipt`.

The production review orchestrator owns the complete state transition. It
prepares the request, invokes exactly one configured transport, validates the
returned response and receipt, and returns either the accepted review result or
a terminal stable unavailable record. It never returns
`review-launcher-external-host-required` as an instruction for an operator.

The Codex-facing adapter translates the operation into one shell-tool call for
the fixed Node host entrypoint with `sandbox_permissions` set to
`require_escalated`. Under `approval_policy = "on-request"` (or an equivalent
granular interactive policy) and `approvals_reviewer = "auto_review"`, Codex
routes that eligible boundary request to its separate approval reviewer. The
adapter captures the tool result directly. It does not change user settings,
use `danger-full-access`, add a broad prefix rule, or pass elevation to the
inner reviewer. Other assistants or CI implement the same operation with their
strongest policy-governed noninteractive transport.

The runtime receipt states the actual transport kind, request digest, fixed
host entrypoint, execution reference, completion status, and host execution
binding. Because the first release lacks authenticated IPC, the receipt remains
ordinary reduced-assurance evidence and must not use a misleading
`attestedBy: trusted-runtime` assertion. Missing transport, denial, timeout,
malformed output, or failed acceptance becomes a stable terminal unavailable
result with no manual command or copy/paste fallback.

Official OpenAI documentation describes Auto-review as a reviewer replacement
for eligible interactive approval requests, including escalated shell calls;
it does not expand the sandbox or run under `approval_policy = "never"`:
https://learn.chatgpt.com/docs/sandboxing/auto-review and
https://learn.chatgpt.com/docs/agent-approvals-security.

Alternative: keep the prepared request as a handoff artifact for a person.
Rejected because the owner would remain the workflow transport and every new
exact head would require manual retriggering.

## Risks / Trade-offs

- **Reduced enforcement on some hosts** → Require affirmative, exact,
  expiring owner risk acceptance; show assurance prominently.
- **Schema compatibility drift** → Test strict v1 fixtures and malformed
  degraded fixtures through the same validator.
- **Fallback accidentally gains authority** → Fixed adapters, capability
  ledger, secret/environment tests, and no mutation-capable command path.
- **Resume ambiguity** → Re-derive strict record, authorization, package,
  result, checkpoint, correction count, and transition from durable records;
  the correction count equals the already-recorded chain length, and every
  record links to one canonical base/head/manifest anchor and its predecessor.
- **Nested runtime denied by outer sandbox** → Return a stable launcher
  permission code; route an explicitly authorized fixed host launch through the
  configured parent runtime transport, preserving the detached view and
  strongest configured Codex/Claude reviewer restrictions.
- **Parent transport absent or denied** → Record terminal machine-readable
  unavailable evidence and stop without a command or evidence-relay request.
- **Forgeable degraded launch evidence or executable substitution** → Label the
  result reduced-assurance, retain the exact owner risk acceptance, require
  strict-first and bounded authorization, and never claim a security-verified
  boundary. Authenticated host infrastructure remains a documented hardening
  option.
- **Preset hides a consequential choice** → Use a closed vocabulary, report the
  expanded effective authorization, and ask once for all missing or invalid
  required inputs before mutation.

## Verification Strategy

Run deterministic authorization, schema, contract, adapter, checkpoint, and
delivery-gate tests for strict success, strict unavailable, valid degraded,
launcher-denied/recovery, concise-request expansion and missing-input rendering,
and every malformed/expired/mismatched rejection
path. Run synthetic
second-workspace portability, command-injection, secret, security, and
thin-adapter-drift checks,
then formal OpenSpec validation and independent review for the exact Apply head.

## Attribution and Licensing

No third-party code, model provider, dependency, or asset is introduced. Any
future platform invocation remains a product-owned adapter configuration; the
canonical change retains existing repository licensing and attribution rules.

## Recovery

On interruption or invalid evidence, preserve the branch and re-read Git,
OpenSpec, authorization, strict unavailable result, sealed manifest, degraded
result, checkpoint, issue, Project, and transition state. Never retry a
materially identical correction past the active budget or translate strict
unavailability into a standing exception.

## Migration Plan

1. Add schema and pure authorization/capability validators with fixtures.
2. Extend canonical review execution, adapters, checkpoint, delivery gate, and
   canonical documentation without changing strict behavior.
3. Add the permission-gated controller/external-host launcher recovery with
   request-digest, non-security-verifiable runtime receipt, detached-view,
   cleanup, and inner read-
   only-boundary tests; record stable unavailable behavior when it is absent.
4. Add the parent-runtime transport contract, Codex escalated-tool adapter,
   direct response acceptance, and terminal unavailable behavior.
5. Add the concise request resolver, canonical preset reference, and missing-
   input/invalid-combination tests.
6. Exercise strict failure, actual automatic parent launch, restricted inner
   review, objective correction, and exact-head rereview with no operator
   relay; add deterministic regression coverage for denial and missing
   transport.
7. Add focused deterministic tests and recorded planning/Apply evidence.
8. Use the bootstrap authorization only for this change's delivery review;
   archive terminates it. Revert by removing the feature from a future change;
   existing strict records and fail-closed behavior remain intact.

## Reuse Plan

Product-neutral contracts live in schemas, `scripts/sdd`, and the canonical
skill. The selected change, transition, SHA, expiry, reason, and reviewer are
runtime evidence. Claude/Codex wrappers remain thin and are checked for drift.
A second-workspace fixture uses different relative artifact/evidence paths and
contains no repository owner, Project, branch, credentials, or product data.
