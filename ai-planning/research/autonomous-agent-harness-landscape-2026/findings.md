# Public landscape research: autonomous agents, SDD workflow automation, harness engineering (2026)

Date: 2026-08-16

Purpose: independent public-source check on whether
[autonomous-sdd-reliability-control-plane.md](../../design-briefs/archived/autonomy/autonomous-sdd-reliability-control-plane.md)
(the proposal to build a deterministic "control plane" — canonical run
schema, lease + compare-and-swap, event ledger, typed operation graph,
review dispatcher — for this repo's autonomous SDD lifecycle) is pointed in
a direction the wider field would recognize as sound, and whether better
reference examples exist. This is desk research from public sources, not a
vendor evaluation or a benchmark run.

## Method

Web search + source fetch across three topics: (1) autonomous agents —
official Anthropic/OpenAI guidance, (2) SDD workflow automation — GitHub
Spec Kit and adjacent tooling, (3) harness engineering — Martin Fowler's
essay, the `awesome-harness-engineering` list, and recent arXiv papers.
Followed threads that came up repeatedly (durable execution, agent control
planes) even though they weren't in the original three-topic list, because
they turned out to be the most load-bearing comparison. Full source list at
the end.

## 1. Autonomous agents — what the primary sources actually say

**Anthropic, "Building Effective Agents"** (the canonical reference):
start from the simplest thing that works; add multi-step agentic complexity
"only when it demonstrably improves outcomes." Distinguishes **workflows**
(LLMs and tools orchestrated through predefined code paths — predictable,
good for well-defined tasks) from **agents** (the model dynamically directs
its own process and tool use — good when the path can't be hardcoded in
advance). Names five workflow patterns (prompt chaining, routing,
parallelization, orchestrator-workers, evaluator-optimizer). For anything
autonomous and higher-stakes: sandboxed testing, explicit stopping
conditions, human checkpoints at blockers, and — the line that generalizes
best — Anthropic spent more engineering effort on tool/interface design than
on the prompt itself.

**Anthropic's own current answer to "orchestrate a lot of long-running agent
work reliably" (Claude Code Dynamic Workflows, 2026):** the model writes a
JavaScript orchestration *script*; a runtime executes it in the background;
progress is saved as it runs so an interrupted job resumes instead of
restarting; results are verified/cross-checked before being folded back in.
Notably, this is **not** a hand-specified typed state-machine schema with a
registry and generated conformance tests — it's "coordination lives in
software, not in the conversation," realized as a comparatively lightweight
generated script plus a host-managed resume primitive.

**OpenAI Agents SDK:** small primitive set (Agent, Runner, Tools, Handoffs,
Guardrails, Sessions). Two orchestration patterns: agents-as-tools for
bounded subtasks, and handoffs when routing itself is part of the workflow.
Sessions give persistent conversation state across runs. Lighter-weight than
what's being proposed here; doesn't attempt lease/CAS-grade durability
either.

**Takeaway:** both labs converge on "keep the model's job narrow and
verifiable, put control flow in code, checkpoint for resumability." Neither
lab's own production answer, as of 2026, reaches for a hand-built
distributed-systems primitive set (lease, compare-and-swap, monotonic
revision, event ledger) — they reach for a generated script plus a
managed resume mechanism.

## 2. SDD workflow automation

**GitHub Spec Kit** is the most visible public reference implementation:
`specify → plan → tasks → implement`, spec treated as an executable,
living contract, with **a human checkpoint at every phase boundary**. It is
explicitly agent-agnostic (30+ coding agents) and does not attempt
multi-hour unattended runs across a milestone queue — the checkpoints *are*
the reliability mechanism.

This repo's ambition — "no routine owner approvals... over a multi-hour
run" across ~5 milestone slices — is a materially higher bar than the
most popular public SDD reference implementation attempts. That's not
disqualifying, but it means there's no off-the-shelf SDD project to copy
the reliability answer from; the closest comparable ambition (see below) is
"agent control planes" / autonomous-ops agents, not SDD tooling per se.

Nothing in the SDD literature contradicts the phase model already in this
repo's workflow (`autonomous-sdd-lifecycle`); the gap this brief targets is
orchestration reliability, not the lifecycle definition, and public SDD
sources don't have a stronger answer to that specific problem.

## 3. Harness engineering

**Martin Fowler, "Harness Engineering for AI Coding Agents"** — the term's
best-credentialed public definition. Core framing: `Agent = Model + Harness`;
the harness = guides (feedforward, prevent bad output before it happens) +
sensors (feedback, catch it after). Crucially: **computational (deterministic,
cheap) controls should run frequently; inferential (LLM-judged, expensive)
controls are reserved for higher-cost checkpoints.** "Harnessability" —
strong typing, clear module boundaries — determines how governable a system
even can be.

This maps almost exactly onto the brief's core thesis ("evidence — not
model inference — determines whether the run continues"), which is a
correct application of the harness-engineering thesis, not an idiosyncratic
invention.

**`awesome-harness-engineering`** (curated list) groups the field into
Agent Loop, Planning, Context Delivery, Tool Design, Permissions, Memory &
State, Task Runners/Orchestration, Verification, Observability,
Human-in-the-Loop. Named orchestration/state analogs worth knowing about:
**LangGraph** (typed state graph + checkpointing), **statewright**
(state-machine guardrails that constrain tool availability per phase —
conceptually close to this brief's typed operation graph), **AgentSPEX**
(declarative YAML workflows with typed steps/branching).

**arXiv, "AI Harness Engineering: A Runtime Substrate for Foundation-Model
Software Agents"** proposes essentially the same shape this brief proposes —
a substrate with state, transitions, evidence, resumability — and frames
the central open design question as *build a custom control plane vs. adopt
an existing durable-execution/workflow engine*. The brief resolves that
question by choosing "build," but doesn't cite this tension explicitly as
a named, general tradeoff — see §5.

## 4. The comparison that actually matters: durable execution engines

This is the one the three original topics didn't name but that the research
kept surfacing, and it's the most direct structural analog to what the
brief proposes:

**Temporal** (and similar durable-execution systems, e.g. Dapr Workflows):
production-grade platforms that already solve, as a reusable primitive,
almost every item in the brief's "Recommended architecture" §4.1–4.2 —
canonical run record with event history, automatic crash recovery, exactly-once
step execution, distributed coordination so two runners can't both claim a
transition, replay-based resumption, horizontal scaling. This is not a
niche pattern; it is the standard industry answer to "I need a long-running,
resumable, exactly-once state machine that survives process death."

**The most pointed critique found ("Checkpoints Aren't Durable Execution,"
Diagrid, on LangGraph/CrewAI/Google ADK):** even well-funded, widely-used
agent frameworks that ship "checkpointing" do **not** provide true durable
execution — no automatic crash detection, no distributed coordination
(two processes can resume the same workflow and race), no guaranteed
completion. The argument is that this requires "fundamental architectural
changes," not incremental patches — bolting a lease and a CAS check onto a
checkpoint file is exactly the kind of incremental patch the article says
doesn't get you there.

This is close to a word-for-word match for the brief's own diagnosis of its
current controller/checkpoint state (item 5 in "Initial sweep": no run ID,
revision, CAS, lease, or event ledger; atomic file replacement prevents
torn JSON but not concurrent last-writer-wins corruption). The brief is
correctly diagnosing a known, named failure mode. What's less certain is
whether hand-rolling the fix (lease + CAS + event ledger as bespoke local
JSON-file code) is the right level to solve it at, versus adopting or
embedding an existing durable-execution primitive.

## 5. Where the brief is well-aligned vs. where to be skeptical

**Well-aligned with the field:**

- Choosing "workflow" (predefined code path, deterministic transitions) over
  free-form agent autonomy for this task matches Anthropic's own guidance
  directly — this is a well-defined, high-stakes, repeatable process, exactly
  the case where Anthropic says to hardcode the path.
- "Evidence, not model inference, decides continuation" is a correct,
  textbook application of harness engineering's computational-before-
  inferential principle.
- The "control plane" vocabulary and shape (canonical state, typed
  operation graph, policy/evidence gates, human approval reserved for
  material/high-risk decisions, observability/status interface) matches
  what 2026 trade coverage (IBM, Chainlink, Obot, and others) converges on
  as the reference architecture for scaling autonomous agents in production.
  The brief is not inventing an idiosyncratic shape; it's naming the same
  shape the rest of the field is naming.
- Rejecting Option A (prose fixes) and Option B (patch-as-you-go) is
  well-supported: the harness-engineering literature is explicit that
  probabilistic prompt compliance without deterministic enforcement is the
  failure mode being escaped, and the brief's own direct probes back that
  up with reproduced counterexamples rather than assertion.
- Treating this as evidence-derived recommendation pending owner sign-off,
  with reproduced probes for every claimed gap, is itself good practice —
  better sourced than most of what's in the trade blogs surveyed.

**Where to be honest about risk:**

1. **You may be about to hand-build a smaller, less battle-tested Temporal.**
   Lease + compare-and-swap + monotonic revision + append-only event ledger
   is a well-known, hard-to-get-right distributed-systems primitive set.
   The brief's Option D dismisses "move orchestration to an external CI or
   workflow service" mostly on integration-cost grounds ("adds service
   credentials, infrastructure... before the local contract is stable").
   That's a fair sequencing argument, but it sidesteps the build-vs-adopt
   question the arXiv runtime-substrate paper calls out explicitly, and the
   Diagrid critique suggests the "incremental patch onto a checkpoint file"
   path specifically tends not to reach real durability. Recommend an
   explicit, time-boxed spike (embed a lightweight local durable-execution
   library, e.g. something SQLite-backed, or a local Temporal dev server)
   before committing to schema/lease/CAS as from-scratch code — cite it as
   a rejected-with-reasons alternative if the spike doesn't pan out, rather
   than reasoning about it only in the abstract.

2. **Check whether the concurrency threat model is real.** Lease + CAS
   solve *multiple concurrent writers*. This repo's actual usage is a single
   developer running one control loop against one repository at a time. If
   that's genuinely the only realistic scenario (vs. e.g. a stale orphaned
   process plus a freshly resumed CLI both touching the same run record),
   a much cheaper single-writer lock (flock/pidfile) may deliver the same
   safety at a fraction of the implementation and test surface. Don't build
   distributed-systems generality the actual deployment topology doesn't
   need — worth an explicit line in the brief's open questions, not just
   implied by "the first release may target one local repository."

3. **Anthropic's own 2026 answer is lighter than what's proposed.** Dynamic
   Workflows — generated orchestration script + host-managed resume — is
   the platform vendor's own realization of "scripts own state, models own
   bounded work" on the exact runtime this repo already depends on (Claude
   Code). It's worth a deliberate compare against Option C before Explore:
   is there a version of the control plane that rides on that primitive
   instead of introducing a fully independent schema/registry/engine? If
   Dynamic Workflows' resume guarantee is good enough, some of the planned
   custom event-ledger/lease work may already be provided by the host.
   (Caveat: public documentation on Dynamic Workflows' resume guarantees
   under crash/process-death is thin — this needs direct verification, not
   another blog search, before being relied on.)

4. **You're at the frontier, not implementing a settled recipe.** No public
   SDD reference tool (Spec Kit included) attempts unattended multi-hour,
   multi-slice delivery with zero routine approvals — the closest public
   ambition-match is autonomous-ops agents (e.g. cited SRE-agent case
   studies handling large incident volumes autonomously), which is still
   an emerging pattern, not a solved one. That raises the cost of getting
   the reliability primitives wrong and raises the value of building on a
   proven substrate rather than a bespoke one — it's an argument for more
   humility about Option C's estimated cost, not for abandoning it.

## 6. Honest answer to "am I in the right direction?"

Yes, directionally. The diagnosis is sound, evidence-backed, and matches
the vocabulary and shape the field is converging on for scaling autonomous
coding agents ("control plane," evidence-gated transitions, typed operation
graphs, harness engineering's computational-before-inferential gating).
Rejecting prose fixes and incremental patching in favor of one deterministic
engine is the correct call given what the direct probes found.

The place to slow down is the *implementation* of the reliability core
(§4.1 in the brief: run record, lease, CAS, event ledger), not the
decision to build a control plane at all. That specific slice is exactly
where the industry's hard-won lesson is "don't hand-roll this — even
well-resourced frameworks get it wrong" (§4 above). Before Contract
Consolidation, get an explicit answer — even a short spike, not just
brief-level reasoning — to: could an existing local-first durable-execution
primitive (or the host's own Dynamic Workflows resume mechanism) satisfy
the lease/CAS/event-ledger requirements at lower risk than bespoke code,
given that concurrency here is probably single-writer rather than truly
distributed? If the answer is genuinely no, the brief's Option C stands as
written and this research doesn't change the recommendation — it just adds
one more explicit open question and one more due-diligence step before the
schema is finalized.

## Sources

Autonomous agents:
- [Building Effective AI Agents — Anthropic](https://www.anthropic.com/engineering/building-effective-agents)
- [Introducing Dynamic Workflows — Claude (Anthropic blog)](https://claude.com/blog/introducing-dynamic-workflows-in-claude-code)
- [Orchestrate subagents at scale with dynamic workflows — Claude Code Docs](https://code.claude.com/docs/en/workflows)
- [Agent SDK overview — Claude Code Docs](https://code.claude.com/docs/en/agent-sdk/overview)
- [OpenAI Agents SDK — orchestration](https://openai.github.io/openai-agents-python/multi_agent/)
- [Orchestration and handoffs — OpenAI API docs](https://developers.openai.com/api/docs/guides/agents/orchestration)

SDD workflow automation:
- [GitHub - github/spec-kit](https://github.com/github/spec-kit)
- [Spec-driven development with AI — GitHub Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [What Is Spec-Driven Development? — Augment Code](https://www.augmentcode.com/guides/what-is-spec-driven-development)
- [Spec-Driven Development (SDD) for AI-Powered Engineering — Jama Software](https://www.jamasoftware.com/blog/what-is-spec-driven-development-sdd-for-ai-powered-engineering/)

Harness engineering:
- [Harness engineering for coding agent users — Martin Fowler](https://martinfowler.com/articles/harness-engineering.html)
- [GitHub - ai-boost/awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering)
- [AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents (arXiv 2605.13357)](https://arxiv.org/pdf/2605.13357)
- [From Model Scaling to System Scaling: Scaling the Harness in Agentic AI (arXiv 2605.26112)](https://arxiv.org/pdf/2605.26112)
- [Agentic Harness Engineering: Observability-Driven Automatic Evolution of Coding-Agent Harnesses (arXiv 2604.25850)](https://arxiv.org/pdf/2604.25850)

Durable execution / control planes (surfaced during research, not in the original three topics but directly relevant):
- [Checkpoints Aren't Durable Execution: LangGraph, CrewAI, Google ADK — Diagrid](https://www.diagrid.io/blog/checkpoints-are-not-durable-execution-why-langgraph-crewai-google-adk-and-others-fall-short-for-production-agent-workflows)
- [What are Agentic AI Workflows? — Temporal](https://temporal.io/blog/build-resilient-agentic-ai-with-temporal)
- [Persistence (checkpointing) — LangChain/LangGraph docs](https://docs.langchain.com/oss/python/langgraph/persistence)
- [What is an Agent Control Plane? — IBM](https://www.ibm.com/think/topics/agent-control-plane)
- [Agent Harness Engineering — The Rise of the AI Control Plane (Adnan Masood)](https://medium.com/@adnanmasood/agent-harness-engineering-the-rise-of-the-ai-control-plane-938ead884b1d)

## Caveats

- Desk research only: no benchmarks were run, no engine (Temporal, Dapr,
  LangGraph) was actually integrated or load-tested against this repo's
  requirements.
- Several sources are 2026 trade blogs / vendor content, not peer-reviewed;
  treated as directional signal on where the field's vocabulary and
  concerns are converging, not as authoritative technical claims.
- Dynamic Workflows' actual crash/resume guarantees were not independently
  verified beyond the blog post's marketing description — flagged above as
  needing direct verification before being relied on in a decision.
