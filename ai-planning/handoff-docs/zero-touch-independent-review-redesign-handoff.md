# Zero-Touch Independent Review Redesign Handoff

- Date: 2026-08-13
- Status: Delivery stopped; ready for a new design-and-implementation session
- Repository: `jizzoe/joericearchitect-ai-skills`
- Workspace: `/Users/joerice/git/joericearchitect/joericearchitect-ai-skills`
- Active change: `add-authorized-degraded-independent-review`
- Delivery PR: [#90](https://github.com/jizzoe/joericearchitect-ai-skills/pull/90)
- Remote PR head: `36671fb08dcde612850d920f2667fe64be766cb6`

## 1. Purpose

This handoff resets the independent-review objective around the owner's actual
requirement: after the owner starts a bounded run, the normal implementation,
validation, independent-review, objective-correction, rereview, and delivery
path must require **zero operator mediation**.

Do not interpret zero operator mediation as one initial approval followed by
automation. The run must not ask the owner to:

- execute a Terminal command;
- approve a sandbox elevation dialog;
- copy a prepared request or response between processes;
- retrigger a review after a correction or new commit; or
- manufacture or attest runtime evidence.

An infrastructure or policy denial may fail closed with a durable machine-
readable result, but it must not turn the owner into the workflow's transport.
Human judgment findings may stop the run, but infrastructure must never ask a
human to perform the missing execution step.

PR #90 MUST NOT merge until this requirement is implemented and exercised end
to end. This handoff is a design reset, not evidence that the current change is
ready for delivery.

## 2. Direct Answer: Why Elevation Did Not Happen

The owner's expectation was reasonable: when strict review could not start in
the managed sandbox, the parent Codex run should have requested narrowly scoped
elevated execution, and the configured automatic approval reviewer should have
decided that request without stopping for a person.

That did not happen.

The current repository recovery path ends by returning:

```text
status: host-launch-required
code: review-launcher-external-host-required
```

`prepareReviewLauncherRecovery()` in
`scripts/sdd/review-launcher-recovery.mjs` creates a digest-bound JSON request.
It does not invoke `scripts/sdd/review-launcher-host.mjs`, and it does not call
the Codex shell tool with escalated sandbox permissions. The canonical skill,
protocol, design, and specification explicitly state that the controller may
only prepare the request, that "the runtime invokes" the host, and that neither
component self-escalates.

No runtime adapter was implemented to translate
`review-launcher-external-host-required` into an actual Codex tool call with
`sandbox_permissions: "require_escalated"`. The missing adapter was silently
replaced by instructions for the owner to run:

```text
node tmp/run-entry1-final-review.mjs host-debug
```

That was the manual switch. The controller and host scripts behaved as
implemented; the orchestration layer between them was absent.

Codex Auto-review cannot act on a JSON status or a command printed for a human.
It only runs when the main agent emits an eligible boundary-crossing approval
request. Official OpenAI documentation states that the main agent must request
approval, after which `approvals_reviewer = "auto_review"` routes the decision
to a separate reviewer. It also states that `approval_policy = "never"`
produces no approval request and therefore nothing to review:

- [Auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review)
- [Agent approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security)

The nested independent reviewer was intentionally launched with a restrictive
read-only boundary and no interactive approval. That is appropriate for the
inner reviewer. The missing escalation belonged to the **parent runtime host
launch**, not to the inner reviewer. Those two boundaries were conflated.

## 3. Why the Session Continued With Manual Verification

The preceding session followed the repository text literally:

1. Strict review failed because the managed environment could not create the
   required detached review boundary or start the nested Codex app server.
2. The recovery controller prepared the sealed host request.
3. The repository said the external runtime must invoke the host and neither
   component may self-escalate.
4. Instead of recognizing that the required runtime adapter did not exist, the
   session treated the owner's Terminal as that runtime.
5. Each independent-review finding caused a correction and therefore a new
   exact head. The exact-head rule correctly required fresh review, but the
   missing runtime adapter made the owner repeat the command for every head.

The manual reviews exposed real defects, including unresolved finding
dispositions and an ambiguous failure-signature encoding. The defects were
corrected and a later manual invocation returned no findings. That does not
validate the workflow. It only validates review output for the head reviewed at
that moment. Main was subsequently integrated and the remote PR head changed,
so the current head still requires fresh exact-head review.

The agent handling was also wrong. The available Codex execution layer had a
defined escalated-tool-call path and an automatic approval reviewer. The
session should have either:

- issued the fixed, narrow parent host-launch request through that tool layer;
  or
- stopped immediately and reported that the repository lacked the adapter
  needed to do so.

It should not have normalized a repeated user command. The repository's
"never self-escalates" guardrail was intended to prevent arbitrary privilege
expansion; it was incorrectly treated as a requirement for human process
mediation even when a policy-governed runtime escalation mechanism existed.

## 4. Current Durable State

At handoff creation:

- PR #90 is open, non-draft, and reports a clean merge state.
- PR head is `36671fb08dcde612850d920f2667fe64be766cb6`.
- `origin/main` is `2cd9b5b8f2fb6aefea2bc1b096c22358823de324`.
- GitHub `linkage` and `openspec-validate` checks pass on the PR head.
- Committed Apply evidence reports `240` passing Node tests and
  `openspec validate --all --strict` passing all `24` items.
- The committed verification report explicitly says the current head still
  needs a fresh strict-first result.
- The local checkout is at
  `49704a81ca32bca694ed1e23d8e3ba6af988f9ba`, five commits behind its remote
  feature branch.
- The local worktree contains unrelated modified and untracked implementation-
  quality and research/planning assets. They belong to concurrent/user work.
  Do not reset, overwrite, clean, or absorb them into this redesign.

Re-derive all of this in the new session. Durable Git, GitHub, OpenSpec, and PR
state outrank this snapshot.

## 5. Required Architecture Correction

Preserve the pure controller and restricted inner reviewer, but add a real
runtime transport between them.

### 5.1 Parent-runtime launch adapter

Define one narrow transport operation resembling:

```text
invokePreparedReviewHost(preparedRequest) -> hostResponse + runtimeEvidence
```

The canonical controller remains assistant-neutral. Platform adapters map this
operation to the strongest available noninteractive runtime:

- Codex local/desktop: issue a fixed host-launch tool call with
  `sandbox_permissions: "require_escalated"`. Under an eligible interactive
  approval policy with `approvals_reviewer = "auto_review"`, the separate
  reviewer evaluates it without a person.
- CI or a dedicated trusted review service: consume the exact prepared request
  automatically for every new PR head and return authenticated result evidence.
- Other assistants: implement an equivalent policy-governed runtime adapter;
  do not add assistant-specific policy to canonical assets.

The host command and arguments must be constructed from fixed code and a
validated prepared-request path. Do not accept arbitrary shell text. The inner
Codex or Claude reviewer remains fresh, noninteractive, credential-scrubbed,
and read-only/restricted; it never receives elevated implementation authority.

### 5.2 Automatic result return

The parent runtime must capture the host response directly and pass it to
`acceptReviewLauncherHostResponse()`. Runtime evidence must come from the tool
or trusted service that performed the launch. The implementer process must not
invent an `attestedBy: trusted-runtime` record.

### 5.3 Automatic exact-head loop

Every correction or main integration that changes the head must automatically:

1. rerun affected validation;
2. rebuild the sealed package;
3. attempt strict review;
4. invoke the authorized recovery transport when strict startup is unavailable;
5. accept and disposition the result;
6. repeat within the per-signature correction budget; and
7. proceed to delivery only after a current exact-head pass.

No step may emit a command for the owner to execute.

### 5.4 Failure behavior

If Auto-review, runtime policy, CI, or the trusted service denies the parent
launch, record a stable unavailable result and stop the run. Do not ask the
owner to reproduce the launch manually. A later session may fix configuration
or policy, but manual execution is not a fallback transport.

## 6. Preferred Durable Direction

Implement the parent Codex Auto-review adapter so the intended local recovery
path is real and testable. For production delivery, prefer a trusted CI or
dedicated review service triggered automatically by every new PR head. That
removes dependence on an interactive laptop session and can replace the
current accepted risks around forgeable parent-launch evidence and basename-
only reviewer executable identity.

Do not solve zero-touch operation with `:danger-full-access`, `--yolo`, broad
prefix rules, ambient credentials, or a writable inner reviewer. Auto-review
is a reviewer swap at a sandbox boundary, not a grant of unrestricted access.

## 7. Required Acceptance Tests

The redesign is not complete with mocked controller/host unit tests alone.
Add an exercised end-to-end test or rehearsal that proves:

1. A strict nested review fails with the expected stable sandbox/startup code.
2. The parent agent emits an actual escalated host-launch request.
3. Auto-review or the trusted noninteractive runtime evaluates and executes it
   without user action.
4. The host creates and cleans an owned exact-head detached view.
5. The inner reviewer remains restricted and returns structured findings.
6. The parent accepts request-bound runtime evidence and the review result.
7. An objective finding triggers correction, validation, and fresh review
   automatically.
8. A changed head retriggers the complete review path automatically.
9. No output instructs the owner to run a command, approve a prompt, copy a
   file, or attest execution.
10. An unavailable or denied runtime fails closed with durable evidence and no
    manual fallback instruction.

Add a regression test that fails if the production orchestration path can
return `review-launcher-external-host-required` without either invoking its
configured runtime transport or recording a terminal machine-readable
unavailable result.

## 8. What Must Not Be Reused As Final Evidence

- Do not treat prior `host-debug` executions as proof of zero-touch operation.
- Do not reuse a passing review after the repository head changes.
- Do not treat deterministic mocks of `executeReviewLauncherHost()` as proof
  that the Codex approval/elevation layer is connected.
- Do not describe an automatically approved parent launch as strict review;
  the inner result's actual assurance level remains authoritative.
- Do not merge PR #90 merely because its existing GitHub checks pass.

## 9. New-Session Starting Instructions

Use this prompt in a new session:

```text
Read `AGENTS.md`,
`ai-planning/handoff-docs/zero-touch-independent-review-redesign-handoff.md`,
`docs/sdd-workflow.md`, and `docs/sdd-foundation-operations.md`.

Re-derive current Git, GitHub PR #90, OpenSpec, validation, and worktree state.
Preserve all unrelated local changes. Do not merge PR #90 and do not run or ask
me to run `host-debug` or any other manual review command.

Redesign `add-authorized-degraded-independent-review` so that after I start a
bounded run, strict-review failure automatically routes the prepared host
request through a policy-governed, noninteractive parent runtime transport.
For Codex, connect the transport to an actual escalated tool request eligible
for Auto-review; keep the inner reviewer restricted. Prefer trusted CI or a
dedicated review service for durable production execution.

Treat zero operator mediation as a hard acceptance criterion. Implement and
exercise the full strict-failure -> automatic parent launch -> restricted
review -> objective correction -> fresh exact-head rereview path. A denied or
unavailable runtime must fail closed with durable evidence, never with a command
for me to execute. Run all required tests and `openspec validate --all --strict`
before proposing delivery.
```
