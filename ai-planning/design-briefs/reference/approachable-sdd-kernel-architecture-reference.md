# An approachable explanation of the SDD execution-kernel idea

Date: 2026-08-17

Status: **Explanatory draft/reference — not an architecture decision.** This
document preserves a clear, low-jargon explanation for later public-facing
writing. It does not select an implementation, authorize an OpenSpec change,
or replace the evidence-derived
[runtime-kernel brief](../autonomous-sdd-runtime-kernel.md) and
[scoped work-unit brief](../scoped-work-unit-context-orchestration.md).
The final direction is still for the owner to settle.

## The simple idea

The proposal is not to give one long-running AI agent a whole software project
and hope it remembers the rules, stays in scope, and accurately reports what it
did.

Instead, break the work into small, explicit jobs. Give each job a fresh,
limited context. Pass forward the files and evidence that matter, rather than a
long chat history. Then let a small, deterministic system decide what may happen
next.

```text
Requirements / spec
        |
        v
  [Author tests]       fresh, limited context
        |
        | red-test evidence
        v
  [Implement]          another fresh context
        |
        | exact code version + change evidence
        v
  [Verify]             fresh, read-only context
        |
        | green-test evidence
        v
  [Independent review] stricter, separate review when needed
```

The important distinction is this:

> The model reasons inside a job; the kernel controls the process around it.

In other words: **models reason; the kernel controls.**

The model can investigate, write, and explain within the boundaries of its
assigned job. It cannot quietly widen its permissions, alter another job's
artifacts, declare its own work trustworthy, or decide that dependent work is
still valid after an input changed.

## Why this is needed

The repository already has many valuable ingredients for reliable
spec-driven development (SDD): lifecycle rules, authorization, exact-version
evidence, independent review, Git/GitHub/OpenSpec reconciliation, cleanup
rules, and points where a human must decide.

What is still missing is one mechanism that can consistently answer:

```text
What is the next safe job?
What does that job need to see?
What may it change?
What result and evidence must it return?
Did the evidence actually satisfy the gate?
What becomes stale if an input changed?
What is safe to do after an interruption?
```

That mechanism is the proposed **SDD execution kernel**. It does not redefine
SDD. It is the careful coordinator underneath the existing SDD rules.

```text
Authorization and configuration
              |
              v
      Workflow definition
              |
              v
  +-----------------------------+
  | SDD execution kernel        |
  | choose -> package -> run     |
  | check -> record -> continue  |
  | invalidate -> reconcile      |
  +-----------+-----------------+
              |
     +--------+--------+
     v                 v
fresh contexts       adapters
for bounded jobs     Git / GitHub / OpenSpec / review
     |                 |
     +--------+--------+
              v
    evidence and outcomes
              |
              v
        durable run record
              |
              v
      understandable status
```

## A job is a real contract, not just a good prompt

Each small job—called a work unit—would spell out its purpose and boundaries.
For example, an implementation job might say:

```text
Goal:
    Implement requirement R17.

May read:
    the requirement, the agreed tests, production source code.

May change:
    src/payment/**

May not change:
    tests/**

Must return:
    changed-file list, unchanged-test fingerprint,
    exact Git revision, and test results.

If it cannot proceed:
    return a structured challenge, correction request, or human decision.
```

This makes the job an executable capability contract: the system can check
whether the job used the allowed inputs, stayed in its allowed write area, and
produced the kind of evidence the next job requires.

## Tests first, made enforceable

Tests-first development becomes more than a recommendation when the workflow
enforces different roles.

```text
requirements snapshot
        |
        v
 [author tests] -- red evidence + test fingerprint --> [implement]
        ^                                                |
        | test-contract challenge                         | exact code version
        +-------------------------------------------------+
                                                         v
                                                   [verify green]
                                                         |
                                            exact-version evidence
                                                         v
                                            [independent review]
                                            when required
```

1. **The test author** gets the requirements, relevant interfaces, and a
   limited part of the codebase. It can change test files, not production code.
   It must show that the new test fails for the expected reason. A random,
   unrelated failure does not count.

2. **The implementer** gets the agreed test package and the red-test evidence.
   It can change production code, but not the tests. If it thinks the test is
   wrong, it cannot conveniently rewrite it; it must raise a
   `test-contract-challenge`. The workflow then sends the problem back to test
   design or, if necessary, to a human decision.

3. **The verifier** receives the exact finished code and unchanged tests in a
   separate, source-read-only context. It runs the declared checks and records
   the results. It cannot repair what it finds; a real failure goes back to a
   new implementation attempt.

4. **Independent review** remains a stronger, optional assurance step. Passing
   tests offers computational evidence. Independent review adds a separate
   judgment about whether the result makes sense and meets the intended bar.

Fresh context and independent review are related but not identical. A new,
focused context helps keep ordinary work small and clean. Strong independent
review also requires separation of authority, a pinned read-only view, and a
separate reviewer identity where the delivery profile calls for it.

## Evidence is more useful than “done”

An agent saying “Done, everything passes” is not enough for the system to rely
on. The kernel instead looks for structured evidence that binds a claim to the
thing it checked:

```text
requirements version
        |
        v
tests fingerprint ABC
        |
        v
implementation revision 123
        |
        v
verification result XYZ
```

Evidence can record the producing job, the exact Git revision, the relevant
file or test fingerprints, the command run, its result, and when and how it was
checked.

This matters when something changes. If the tests change from `ABC` to `DEF`,
the old implementation and verification evidence depended on `ABC`. They are no
longer current. The system should go back to the earliest affected job rather
than pretending the later steps are still valid.

```text
tests ABC  -> implementation 123 -> verification XYZ
    |
    +-- tests change to DEF
             |
             +-- implementation and verification become stale
                 and the workflow returns to the first affected step
```

That is similar to the way a build system knows which outputs need rebuilding
after an input changes.

## Durable enough for the current problem

The idea does not require building a distributed workflow platform on day one.
For one repository and one active mutating runner, the initial shape can remain
local and deliberately modest:

```text
one repository-wide runner lock
        +
atomic run-state snapshots
        +
immutable records of attempts and evidence
        +
reconciliation after a crash
```

If a process stops mid-job, the next run should not blindly repeat the action.
It first inspects reality: the Git state, stored artifacts, and any outside
system it may have touched. Then it records what actually happened and safely
continues, retries, or pauses.

```text
start implementation
        |
        X process stops
        |
restart
        |
        v
inspect Git, artifacts, and outside state
        |
        v
reconcile the real outcome
        |
        v
continue safely, retry safely, or ask for a decision
```

This is intentionally different from prematurely building leases, heartbeats,
custom distributed failover, or a replay engine. Those may become justified if
the system eventually needs multiple hosts, high availability, scheduled
server-side work, or proves that local recovery is not enough. They should be
an interchangeable runtime choice, not the definition of SDD.

```text
SDD concepts: workflows, work units, evidence, invalidation, review
                              |
                              v
                      stable kernel boundary
                              |
              +---------------+----------------+
              v                                v
        local run record                 later runtime option
        (first practical step)           (for example, a durable engine)
```

## What this framing is really trying to protect

The point is not to make agents feel constrained for its own sake. It is to
make a long, autonomous development process understandable, recoverable, and
safe enough to trust.

The model should have room to do the work it is good at: reasoning about a
bounded problem, writing code, evaluating a result, and communicating a
structured outcome. The kernel should own the things that should not depend on
the model's self-report: permissions, ordering, evidence gates, freshness,
recovery, and the decision about what happens next.

```text
Model:  “Within my bounded job, here is my work and evidence.”
Kernel: “The contract and evidence say whether that unlocks the next job.”
```

That is the heart of the design: not a better giant prompt, but a system in
which useful model judgment is surrounded by clear boundaries and evidence that
other people—and later jobs—can inspect.

## How this direction compares with current public guidance

Research check: 2026-08-17. This is a directional comparison with current
public guidance, not a claim that the architecture has been approved or proven
in this repository.

The current local-first, evidence-gated kernel direction is well aligned with
the main ideas emerging from Anthropic, OpenAI, Martin Fowler, and Thoughtworks:

| This design choice | What the public guidance supports |
|---|---|
| Deterministic workflows for repeatable SDD stages | Anthropic distinguishes workflows—where code defines the path—from agents that dynamically choose their path. It recommends workflows where predictability is valuable and adding complexity only when it earns its keep. [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) |
| Fresh, small contexts with structured handoffs | Anthropic's long-running-agent work uses tractable chunks and structured artifacts between sessions. It found that compaction alone does not reliably provide a clean handoff. [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) |
| Separate implementation from checking | Anthropic reports that separating the agent doing work from the agent judging it is a strong way to counter weak self-evaluation. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) |
| Tests and exact evidence before downstream progress | Martin Fowler and Thoughtworks call deterministic tests, linters, type checks, and structural analysis “sensors.” They distinguish these computational checks from slower, less certain LLM judgment. [Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html) and [Harness engineering and agent feedback](https://www.thoughtworks.com/en-us/insights/blog/generative-ai/harness-engineering-agent-feedback-exploring-ai-coding-sensors) |
| Repository-local, versioned knowledge and status | OpenAI describes agent legibility as a prerequisite: relevant rules, artifacts, and decisions should be discoverable in the repository, rather than living only in chat, documents elsewhere, or people's heads. [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) |
| A modest first runtime rather than immediate distributed infrastructure | Anthropic advises starting with the simplest workable harness and testing whether each added component remains useful as models improve. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) |

OpenAI's recent [Symphony orchestration specification](https://openai.com/index/open-source-codex-orchestration-symphony/)
is also a useful comparison. It treats tasks—not agent sessions—as the unit of
work, gives them isolated workspaces, and makes dispatch, retries,
reconciliation, and status visible to an operator. This draft's kernel is more
specific: it should own SDD authorization, evidence, invalidation, and
assurance, while a future scheduler could own broader task dispatch.

### What must be true for the framing to hold

The phrase “the kernel controls” must mean more than a well-written prompt.
Before implementation, the design should make the following controls real and
testable:

1. **Mechanically enforce write boundaries.** An implementation work unit must
   be unable to change test-owned files, or a validator must fail the attempt
   closed. Declaring paths in a prompt is guidance; a restricted workspace,
   filesystem policy, or post-write validator is a control.
2. **Keep work packages small.** A sealed package should preserve exact
   references and digests, not automatically dump every related artifact into
   context. Anthropic recommends lightweight references and just-in-time
   retrieval so an agent can load the relevant material without drowning in
   stale or irrelevant context. [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
3. **Evaluate the kernel, not only the code it produces.** The first slice
   needs adversarial cases for stale evidence, changed tests, write-boundary
   violations, false-green results, crash-after-side-effect recovery, duplicate
   runner rejection, and incorrect human escalation. OpenAI advises measuring
   representative task outcomes and required evidence, not simply fewer tool
   calls or tokens. [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
4. **Expose feedback to the correcting unit.** Skills, specifications, and
   packages are feed-forward controls. Tests, linters, policy checks, and review
   results are feedback sensors. The kernel should return structured findings to
   the eligible correction path rather than depend on an agent to rediscover
   them.
5. **Use explicit risk tiers.** Local, reversible code work can follow the
   evidence-gated flow. Security-sensitive, permission-changing, externally
   irreversible, or infrastructure-changing work should require stronger
   authority and explicit human approval. Current OWASP guidance recommends
   least-privilege tool access and gating actions by reversibility; NIST also
   emphasizes documented oversight, roles, auditability, and independent
   assessment. [OWASP](https://cornucopia.owasp.org/edition/companion/AAI9/1.0/en)
   and [NIST AI RMF Playbook](https://airc.nist.gov/docs/AI_RMF_Playbook.pdf)

The practical conclusion is encouraging: this is not an attempt to make a
giant prompt more elaborate. It is a harness-oriented design—structured
context, narrow authority, deterministic feedback, separated evaluation,
durable artifacts, and observable recovery. The remaining design discipline is
to keep the first implementation narrow, prove the controls with adversarial
kernel tests, and retain only the mechanisms that measurably improve
reliability.

## What to adopt rather than rebuild

The kernel idea should not mean rebuilding every capability from scratch. The
important distinction is between the **SDD-specific domain rules** that belong
to this project and the general-purpose infrastructure that mature tools already
provide.

OpenSpec already covers the first layer: the source-of-truth change artifacts
and SDD process. GitHub's [Spec Kit](https://github.github.com/spec-kit/index.html)
is a respected adjacent option, but its default `Spec -> Plan -> Tasks ->
Implement` process overlaps with OpenSpec. Running both as canonical systems
would create two sources of truth. Keep OpenSpec as the SDD authority; borrow
ideas or templates from Spec Kit only when they improve the OpenSpec workflow.

For the other layers, the practical options are:

| Layer | Established options | What this project should own |
|---|---|---|
| SDD intent and change artifacts | OpenSpec; Spec Kit | OpenSpec requirements, proposals, tasks, and lifecycle decisions. |
| Durable execution and recovery | [Temporal](https://docs.temporal.io/), [Restate](https://docs.restate.dev/), [DBOS](https://docs.dbos.dev/architecture), [Dapr Workflows](https://docs.dapr.io/developing-applications/building-blocks/workflow/) | The SDD workflow graph, evidence meanings, invalidation rules, and status vocabulary—not a new generic workflow engine. |
| Agent loop, handoffs, sandboxes, and tracing | [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) and provider-specific coding-agent runtimes | A provider-neutral work-unit contract; providers become execution adapters. |
| Agent-native state graphs and human pauses | LangGraph | SDD authorization and evidence policy; an agent graph does not define what makes an SDD transition valid. |
| Reusable policy decisions | [Open Policy Agent](https://www.openpolicyagent.org/docs) | The policy facts and enforcement points. OPA is only needed once those decisions must be shared across multiple runtimes or systems. |
| Multi-task dispatch | [OpenAI Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/) | The domain definition of “ready,” “blocked,” “evidence current,” and “done.” Symphony is a useful scheduler/runner reference, but is still too new and too general to substitute for this kernel. |

### The first runtime decision should be a comparison, not an assumption

Before implementing a production `RunStore`, run the same small tests-first
work-unit scenario through three candidates:

1. **Temporal** as the mature, conservative durable-workflow baseline. Its
   purpose is durable, recoverable workflow execution across crashes and other
   infrastructure failures.
2. **Restate** as a likely fit for a local-first, TypeScript-friendly agent
   runtime. It is explicitly designed to make agents and workflows durable,
   with persisted steps, recovery, state, concurrency control, and human
   approvals.
3. **A minimal local adapter** using a repository-wide lock, atomic snapshots,
   immutable receipts, and reconciliation—the smallest implementation this
   design currently proposes.

Compare only the outcomes that matter here: recovery after interruption,
duplicate-run prevention, reconciliation of an external side effect,
inspectable evidence, developer overhead, and whether the OpenSpec/SDD domain
semantics remain clean. This makes the question concrete: use a mature runtime
when it removes real risk without taking ownership of the domain; retain the
minimal adapter only when it demonstrably suits the single-runner local
topology better.

There is no widely adopted off-the-shelf product that already supplies this
project's complete combination of OpenSpec-aware SDD behavior, tests-first
authority separation, evidence freshness/invalidation, and strict independent
assurance. That is the part worth designing. The generic agent loop, durable
execution, task scheduling, and policy-evaluation layers are the parts to
reuse where a chosen runtime is a good fit.

## Relationship to the architecture work

This document deliberately stays at the explanation level. The companion
[runtime-kernel brief](../autonomous-sdd-runtime-kernel.md) and
[scoped work-unit brief](../scoped-work-unit-context-orchestration.md)
contains the evidence, alternatives, proposed domain objects, assumptions,
risks, and open decisions. It currently recommends a local-first kernel with
typed isolated work units, pending owner confirmation.

Before turning this into a public document, reconcile this explanation with the
final owner-approved architecture. Update or remove any example that no longer
matches that decision.
