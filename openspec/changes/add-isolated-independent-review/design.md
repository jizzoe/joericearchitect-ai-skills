## Context

See [proposal.md](proposal.md) for motivation. The current foundation already
has independent-review policy and evidence checks in
`scripts/sdd/independent-review.mjs` and the operation-authorization path, but
it deliberately delegates process isolation to an adapter. No repository-owned
adapter currently packages the exact review state, launches a reviewer, or
produces a schema-validated result.

The design crosses canonical skill policy, deterministic scripts, durable
checkpoint evidence, assistant-specific invocation, and security boundaries.
It must work in Codex and Claude even though their subagent/session and runtime
permission mechanisms differ. The implementing session and all issue, PR, or
web content are untrusted inputs; GitHub and deployment state are outside the
reviewer's authority.

## Goals / Non-Goals

**Goals:**

- Turn the existing abstract independent-review gate into an executable,
  testable protocol without weakening authorization checks.
- Make freshness, package integrity, reviewer identity, isolation, findings,
  dispositions, and transition scope machine-validatable.
- Keep review-provider details replaceable and assistant wrappers thin.
- Provide deterministic failure codes and a resumable pause for every rejected
  package, execution, result, or correction state.

**Non-Goals:**

- Select, require, route, or evaluate a particular model in the canonical
  contract, configuration, or adapter behavior.
- Give the reviewer network, credential, external mutation, or implementation
  authority.
- Build a hosted review service or a generic plug-in marketplace.
- Replace tests, OpenSpec Verify, CI, branch protections, or the existing
  bounded-authorization checker.

## Decisions

### 1. Extend the existing policy module behind a three-stage protocol

The implementation will preserve `scripts/sdd/independent-review.mjs` as the
authorization-facing policy facade and add three deterministic stages:

1. `build-independent-review-package.mjs` resolves canonical commits, derives
   the exact diff, identifies allowed artifacts/evidence, canonicalizes a JSON
   manifest, and computes its SHA-256 digest.
2. `execute-independent-review.mjs` validates readiness and delegates only the
   sealed package to the selected platform adapter.
3. `validate-independent-review-result.mjs` validates JSON Schema, configured
   identity/attestation, immutable bindings, finding semantics, and freshness,
   then supplies the existing authorization checker with normalized evidence.

The existing module will share these canonical helpers instead of retaining a
second evidence contract. This preserves current call sites while allowing a
staged migration and focused fixtures.

Alternatives considered:

- Replacing `independent-review.mjs` outright would create unnecessary churn in
  already-delivered authorization tests and recovery behavior.
- Letting each assistant build and validate its own package would duplicate the
  security boundary and invite policy drift.

### 2. Use content-addressed JSON records and repository-derived content

The request manifest uses sorted keys, normalized repository-relative POSIX
paths, lowercase 40-character Git commit object IDs, explicit schema versions,
and SHA-256 digests. Large diff and evidence payloads may be separate immutable
files, but the manifest records each file's digest, byte length, media type, and
logical role. The validator re-derives the Git range and hashes configured
OpenSpec artifacts rather than trusting caller-supplied content.

The durable result uses `independent-review-result-v1` and binds to one unique
review record and one named transition. A package or result is data only; no
field is interpolated into a shell command. Adapter commands are selected from
trusted configuration and receive input through fixed arguments or standard
input.

Alternatives considered:

- A prompt-only package is easy to tamper with and cannot be compared
  deterministically on resume.
- Embedding all files inline makes records hard to inspect and needlessly
  duplicates potentially large diffs.

### 3. Separate review environment enforcement from reviewer invocation

The canonical executor requires the adapter to establish two independent
controls before invoking a reviewer:

- a fresh execution/session with no implementation conversation or persisted
  reasoning context; and
- a detached repository view pinned to the requested head under an enforced
  read-only runtime profile.

The runtime profile must deny filesystem and Git writes to the review view,
GitHub mutation, credential access, authenticated network actions, external
sends, deployments/releases, and mutation-capable delegation. A disposable
temporary checkout is used so reviewer reads cannot observe unrelated worktree
changes. Read-only instructions in a prompt and a file-permission toggle that
the reviewer can undo are insufficient.

The Codex adapter will map this contract to a fresh Codex execution with an
enforced read-only sandbox. The Claude adapter will map it to a fresh
noninteractive Claude process whose temporary review-only settings enable its
OS sandbox, deny review-view writes and home/credential reads, deny mutation
tools, disable unsandboxed-command fallback, and fail at startup if sandboxing
is unavailable. The adapter must not modify a user's normal Claude settings.
Exact CLI or harness syntax is product-owned configuration and must be
capability-probed; if the installed platform cannot establish the controls, the
adapter returns `unavailable` and the lifecycle pauses.

Alternatives considered:

- A same-context subagent may be useful for ordinary code review, but it does
  not meet the no-history requirement.
- A fresh same-session agent with shared write-capable tools establishes some
  contextual independence but still fails the enforced read-only requirement.
- A normal GitHub PR review is not bound to the sealed local evidence contract
  and cannot replace this gate.

Native Windows Claude cannot establish the required OS sandbox and therefore
returns `unavailable`; a supported WSL2 environment may become eligible after
the documented Linux sandbox prerequisites and capability checks pass.

### 4. Keep adapters transport-only and verify parity

Each adapter accepts the same request-envelope path and emits the same result-
envelope path. It may translate platform invocation and collect execution
metadata, but it cannot define severities, disposition rules, authorization,
package contents, or pass criteria. Thin exposures under `.agents/skills/` and
`.claude/skills/` point to `skills/base/independent-review/`; the canonical
skill links the shared guardrails and returns `skill-result-v1` for orchestration
status while the review payload follows `independent-review-result-v1`.

Adapter drift checks compare normalized capabilities and reject copied policy
or product constants. Synthetic Codex-shaped and Claude-shaped results run
through the same validator.

Alternative considered: platform-specific schemas would make equivalent review
evidence impossible to compare and would turn assistant selection into an
authorization decision.

### 5. Treat findings as a durable state machine

Each finding has a stable ID, severity, evidence locations, recommendation,
and lifecycle status. The implementer creates a separate disposition record;
the original reviewer record is immutable.

- `objective-fix` may enter `correcting` only when it is evidence-backed,
  behavior-preserving, in scope, and within the per-signature budget. A commit
  and affected-check evidence move it to `corrected`, but only a fresh review
  of the new head can move it to `verified`.
- `warning` and `false-positive` require cited rationale. A subsequent fresh
  reviewer can accept or challenge them; neither label suppresses the finding.
- `blocker`, `high`, or any material decision maps to `human-decision` and
  pauses the transition.

The next package includes previous findings and dispositions only in a clearly
marked evidence section. The reviewer prompt explicitly treats them as claims
to verify, not conclusions to preserve. Every new head, manifest, or applicable
validation-evidence set invalidates the previous passing review.

Alternative considered: allowing the implementer to close findings in place
would erase reviewer provenance and make false-positive classification a
self-approval path.

### 6. Configuration is product-owned and least-privileged

The existing product configuration schema gains an optional independent-review
section containing adapter ID, adapter version or integrity reference,
isolation-attestation reference, repository-view strategy, allowed deterministic
review commands, relevant artifact patterns, and evidence/checkpoint roots.
Canonical assets reject absolute paths, credentials, account/Project IDs,
shell fragments, unbounded commands, and standing mutation grants.

No new third-party runtime dependency is planned. If implementation discovers
one is necessary, Apply pauses for a material design update with source,
license, version, integrity, and maintenance evidence.

## Verification Strategy

Required evidence includes:

- JSON Schema positive and negative fixtures for packages, results, findings,
  dispositions, duplicate IDs, and stale bindings;
- a disposable Git repository proving exact diff/artifact re-derivation,
  head-specific invalidation, and content-addressed reproducibility;
- execution fixtures proving denied writes and Git/GitHub/credential targets,
  inherited-context rejection, unavailable-adapter recovery, and no shell
  execution from untrusted fields;
- shared Codex/Claude adapter-contract fixtures and drift checks;
- end-to-end correction-loop fixtures for objective fixes, disputed warnings
  and false positives, material pauses, and correction-budget exhaustion;
- second-workspace portability, secret-pattern, source/license, documentation,
  requirements mapping, recovery, focused OpenSpec validation, and
  `openspec validate --all --strict` evidence.

Live provider invocations are capability checks, not the sole automated test
oracle. CI remains deterministic and credential-free; a missing live provider
leaves autonomous delivery unavailable rather than fabricating a pass.

### 8. User enablement is separate from normal assistant configuration

`docs/autonomous-run-enablement.md` will document one-time readiness and
per-run behavior without prescribing a global sandbox. It will explain how to
start a bounded Codex run through `/goal`, how the Codex review adapter creates
its separate read-only reviewer, and how the Claude adapter launches its own
noninteractive temporary sandboxed reviewer. It will cover macOS, WSL2, and
native-Windows unavailability; list required sandbox settings and disabled
fallbacks; and make clear that ordinary interactive sessions retain manual
authorization. The guide will use configuration examples with placeholders
rather than secrets, account identifiers, or repository-specific absolute
paths.

## Data and Control Flow

```text
current Apply evidence + exact base/head
                 |
                 v
       canonical package builder
                 |
        sealed manifest + digest
                 |
                 v
  configured adapter capability check
       | unavailable -> durable pause
       v
fresh reviewer session in pinned read-only view
                 |
                 v
 immutable schema-versioned review result
                 |
                 v
 canonical validator + finding dispositions
       | material/invalid -> durable pause
       | objective fix -> correction/checks/new head/package/reviewer
       v
 exact named authorized delivery transition
```

## Reuse Plan

- **Canonical:** protocol skill, package/result schemas, canonicalization,
  validators, finding state machine, safety policy, eval semantics, and recovery
  codes.
- **Product configuration:** adapter selection, integrity/attestation reference,
  workspace-relative paths, allowed deterministic commands, artifact patterns,
  and evidence locations.
- **Platform exposure:** generated or packaged thin Codex and Claude wrappers
  plus transport-only invocation adapters.
- **Portability proof:** run identical canonical fixtures in a second disposable
  repository with different configured paths and both adapter-shaped results.
- **Intentional product-specific behavior:** the concrete sandbox/session
  invocation needed to establish fresh read-only execution on each platform.

## Risks / Trade-offs

- [Platform runtime cannot enforce all denied capabilities] → capability-probe
  before invocation and return `unavailable`; never infer isolation from prompt
  text.
- [A reviewer misses a defect] → retain deterministic gates and test
  representative reviewer evals.
- [Implementer biases rereview through dispositions] → mark dispositions as
  disputed evidence, omit a desired conclusion, and require a fresh reviewer.
- [Temporary checkout or package leaks unrelated data] → derive from committed
  objects only, allowlist artifacts, scan packages, and remove disposable local
  material through a narrowly scoped recovery operation.
- [Schema migration invalidates durable checkpoints] → version package and
  result schemas, reject unknown versions, and retain the existing validator
  during staged migration.
- [Adapter drift creates unequal Claude/Codex gates] → keep all policy canonical
  and require parity and drift fixtures before delivery.

## Migration Plan

1. Add versioned schemas, canonical package/result helpers, and negative
   fixtures without changing the active delivery path.
2. Refactor the existing independent-review facade and authorization checker to
   consume the normalized v1 result while retaining current fixture behavior.
3. Add the canonical skill and thin assistant exposures, then implement
   capability-probed Codex and Claude transports.
4. Add correction-loop, portability, drift, security, and recovery coverage.
5. Enable the adapter only in product configuration after both platform paths
   pass the acceptance suite; existing installations remain fail-closed until
   configured.

Rollback disables the configured adapter and restores the prior explicit
`independent-reviewer-not-configured` pause. It does not delete review records,
rewrite checkpoints, or downgrade `production-rapid`. Because the result schema
is versioned and the existing policy facade remains, code rollback does not
require destructive data migration.

## Recovery

Package, execution, validation, and lifecycle failures preserve the active
implementation branch, immutable inputs, result records, dispositions, and
checkpoint. Recovery reports one stable failure code and the exact missing or
stale adapter, attestation, checkout, package, result, evidence, or head
condition. A resume re-derives Git and durable lifecycle state before retrying;
it does not reuse stale passing evidence or repeat a materially identical
failure beyond the configured recovery/correction budget.

Temporary review views and package files are disposable local state. Cleanup is
limited to the exact recorded temporary paths after the reviewer process has
ended and evidence has been retained. If cleanup cannot be proved safe, the
artifacts remain for targeted manual recovery rather than broad deletion.

## Attribution and Licensing

The planned implementation uses repository-owned code and built-in platform
capabilities. Source and license review must confirm every adapted invocation
pattern and any borrowed fixture structure. No third-party runtime package may
be added without recorded provenance, compatible license, integrity evidence,
and an approved design update.
