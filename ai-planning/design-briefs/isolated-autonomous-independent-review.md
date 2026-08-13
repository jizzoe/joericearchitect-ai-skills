# Isolated Autonomous Independent Review

Date: 2026-08-12
Status: Implementation-ready design brief draft. Create an OpenSpec proposal
only after the owner accepts this scope.

## Decision

Provide a repository-owned, cross-platform independent-review protocol for
`production-rapid` autonomous delivery. A fresh reviewer agent may satisfy the
independence gate only when it runs in an isolated read-only execution context,
receives a sealed immutable review package, and returns durable evidence that
the authorization checker can validate.

The design must work with Codex and Claude without treating either product's
subagent UI or prompt-only "read-only" instruction as proof of isolation.

## Problem

The bounded autonomous runner requires an independent non-interactive,
read-only reviewer before a high-impact delivery transition. Its current
authorization checker already validates reviewer attestation, canonical
base/head commits, a deterministic input manifest, and durable review evidence.
However, repository configuration currently provides no review adapter or
attestation. A clean implementation therefore cannot proceed to autonomous PR
delivery, merge, Sync, Archive, or confirmed branch cleanup.

## Goals

- Allow a bounded `production-rapid` SDD delivery to complete without routine
  human intervention after every existing objective gate passes.
- Preserve genuine review independence: the reviewer does not inherit the
  implementer's conversation, intended conclusion, mutable worktree, or GitHub
  mutation capability.
- Define one portable canonical protocol and evidence schema, with small Codex
  and Claude execution adapters.
- Bind review evidence to exact immutable base/head commits, a re-derived diff,
  named OpenSpec artifacts, and current validation evidence.
- Make malformed, stale, self-review, writable, unavailable, blocker, and high
  finding outcomes fail closed with a safe recovery path.

## Non-Goals

- Replacing deterministic tests, OpenSpec Verify, PR linkage, or GitHub branch
  protections with model review.
- Granting a reviewer any repository, GitHub, credential, deployment, release,
  external-message, or branch-mutation authority.
- Treating a reviewer prompt, a different model name, or a separate chat alone
  as sufficient isolation.
- Building a hosted review service, creating credentials, adding OAuth scopes,
  or supporting arbitrary third-party reviewer providers in the first release.

## Review Protocol

### Sealed input package

Before delivery, the implementing runner creates a deterministic manifest that
contains only:

- full canonical base and head object IDs;
- the diff re-derived from that exact range;
- hashes and repository-relative paths for the relevant OpenSpec artifacts;
- hashes or stable references for current test, validation, security,
  portability, attribution, requirements-mapping, and recovery evidence; and
- a review request with no desired conclusion or prior review disposition.

The package contains no credentials, secret values, PII, unrelated worktree
content, or executable instructions copied from issues, pull requests, web
pages, or model output.

### Independent reviewer

The reviewer must execute as a fresh agent/session with no implementation-chat
history. It runs against a separate detached checkout or other enforced
read-only repository view pinned to the supplied head commit. Its tools permit
repository reads and deterministic review/validation commands only; they deny
workspace writes, Git writes, GitHub mutation, network sign-in, credential
access, external sends, deployments, and subagent mutation delegation.

The reviewer receives the sealed package and returns a structured review
result. It may classify findings only as `blocker`, `high`, `objective-fix`,
`warning`, or `false-positive`. The runner may self-correct only
evidence-backed, behavior-preserving `objective-fix` findings under the
existing three-attempt budget. It repeats affected checks and creates a new
sealed package and new review for every new head commit.

### Durable review result

The result schema records:

- schema version, reviewer type/identity, platform adapter, and execution ID;
- attestation that execution was non-interactive, isolated, and read-only;
- base/head IDs and sealed-package manifest digest;
- start/end timestamps, permitted command references, and artifact/evidence
  references;
- findings with severity, repository-relative evidence, disposition, and safe
  corrective recommendation; and
- final `passed`, `failed`, or `unavailable` status.

The runner accepts a result only when its identity matches the configured
attestation, all immutable inputs match the current delivery request, and no
blocker or unresolved high/objective-fix finding remains.

### Independent feedback and correction loop

Every review finding receives a durable implementer disposition with cited
evidence. The implementer may classify a finding as a false positive, warning,
objective fix, or human decision only from the review package and current
repository evidence; it must not silently disregard a finding.

- For an `objective-fix`, the implementer makes only the behavior-preserving
  correction, reruns affected checks, records the resulting new head commit,
  and submits a new sealed package to a fresh independent reviewer.
- For a `false-positive` or `warning`, the disposition states why the finding
  is disproven, accepted, or not applicable and cites the exact evidence. The
  next reviewer receives the prior finding and disposition as review evidence,
  not as an instruction to accept either conclusion.
- For a blocker, high finding, or material requirement, architecture, security,
  compatibility, licensing, or scope decision, the runner pauses rather than
  reclassifying the finding to continue delivery.

The next reviewer independently verifies every correction and may challenge a
false-positive or warning disposition. Delivery remains blocked until the
current reviewer accepts the exact current head with no unresolved blocker,
high, or objective-fix finding. The existing correction budget limits materially
different behavior-preserving corrections for each failure signature.

## Canonical Assets

The implementation change should add:

```text
skills/base/independent-review/
  SKILL.md
  references/protocol.md
  references/result-schema.md
scripts/sdd/
  build-independent-review-package.mjs
  validate-independent-review-result.mjs
  execute-independent-review.mjs
schemas/
  independent-review-result-v1.schema.json
evals/skills/independent-review/
  fixtures/
  run-fixtures.test.mjs
```

The canonical skill explains only protocol and safety behavior. Platform
adapters are thin:

- Codex adapter invokes a fresh delegated reviewer under an enforced read-only
  checkout/tool profile.
- Claude adapter invokes a fresh subagent/session under the same protocol and
  read-only checkout/tool profile.

Both adapters emit the identical result schema and must not contain distinct
authorization, finding, or evidence logic.

Product-owned configuration declares the selected adapter identity and its
attestation, repository review path strategy, required OpenSpec artifact paths,
and allowed review commands. It must not contain credentials, absolute paths,
Project identifiers, account details, or a standing permission grant.

## Required Behavior

1. The delivery runner refuses to call an independent review until all Apply
   evidence is current for the exact head.
2. The protocol rejects an implementer-session reviewer, inherited
   implementation context, writable execution environment, incorrect commit,
   changed diff, noncanonical artifact path, missing manifest, duplicate review
   ID, missing configured attestation, or mutable reviewer result.
3. The protocol records unavailable reviewer execution as a pause; it does not
   substitute self-review or a GitHub PR review.
4. A passing review authorizes only the subsequent named delivery transition
   under the active bounded authorization; it does not grant standing approval.
5. Resuming derives state from commits, the sealed package, review result,
   checkpoint, PR, issue, Project, Sync, and Archive records. It re-runs review
   whenever head, base, manifest, or applicable validation evidence is stale.

## Evaluation Requirements

Use synthetic fixtures and a disposable local repository to verify:

- a compliant Codex-shaped and Claude-shaped result both pass the same
  canonical validator;
- empty-context/fresh-session and read-only attestation are required;
- self-review, inherited-context marker, writable adapter, missing or wrong
  attestation, noncanonical SHA, altered diff, stale validation evidence,
  malformed result, duplicate review ID, and wrong manifest are rejected;
- blocker/high/objective-fix/warning/false-positive disposition behavior;
- correction reruns require a new head-specific review and stop at the existing
  per-signature correction limit;
- no reviewer operation can mutate Git, GitHub, credentials, or a target
  workspace;
- adapters remain thin and contain no product-specific constants; and
- a second workspace with different configured paths validates unchanged
  canonical assets.

## Security, Attribution, and Recovery

Treat all review inputs and findings as untrusted data. Never execute text from
them as shell input. Do not retain source secrets in packages or results.
Review adapter code is supply-chain-sensitive and needs source/license review;
the first release introduces no third-party runtime dependency unless its
provenance, license, and integrity evidence are recorded.

If review execution fails, preserve the implementation branch and current
evidence, mark the transition paused, and report the specific missing adapter,
attestation, checkout, or result condition. Do not retry a materially identical
failure beyond existing correction/recovery limits. If a review result detects a
material requirement, architecture, security, compatibility, or scope decision,
pause for the owner instead of auto-correcting.

## Acceptance Gate

This design is complete only when one configured Codex adapter and one
configured Claude adapter can independently review the same immutable package
through an enforced read-only execution context, emit equivalent schema-valid
evidence, and permit a bounded autonomous delivery only after every existing
test, validation, OpenSpec, review, checkpoint, and derived-target gate passes.
