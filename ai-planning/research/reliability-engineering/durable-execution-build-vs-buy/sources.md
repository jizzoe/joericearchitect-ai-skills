# Sources for durable-execution-build-vs-buy

## What is Temporal - Temporal Documentation
- Publisher: Temporal Technologies
- URL or path: https://docs.temporal.io/temporal
- Access date: 2026-08-17
- Source type: primary
- Relevance: Primary description of Temporal's durable-execution model \(Workflow Executions, Event History, exactly-once-to-completion\) and its three deployment modes.
- Classification: verified-fact
- Claim domain: technical

## temporalio/temporal - GitHub
- Publisher: Temporal Technologies \(GitHub\)
- URL or path: https://github.com/temporalio/temporal
- Access date: 2026-08-17
- Source type: primary
- Relevance: Confirms license, maturity, and organizational backing of the Temporal server itself.
- Classification: verified-fact
- Claim domain: technical

## Temporal Pricing
- Publisher: Temporal Technologies
- URL or path: https://temporal.io/pricing
- Access date: 2026-08-17
- Source type: primary
- Relevance: Confirms self-hosting is free/open-source and quantifies the managed Temporal Cloud cost tiers, needed for an honest operational-footprint comparison.
- Classification: verified-fact
- Claim domain: pricing

## Build resilient agentic AI with Temporal
- Publisher: Temporal Technologies \(blog\)
- URL or path: https://temporal.io/blog/build-resilient-agentic-ai-with-temporal
- Access date: 2026-08-17
- Source type: secondary
- Relevance: Vendor framing of why durable execution specifically matters for agentic AI workloads, for comparison against this repo's own reliability-gap diagnosis.
- Classification: source-reported-claim
- Claim domain: general

## Workflow overview - Dapr Docs
- Publisher: Dapr project \(Linux Foundation\)
- URL or path: https://docs.dapr.io/developing-applications/building-blocks/workflow/workflow-overview/
- Access date: 2026-08-17
- Source type: primary
- Relevance: Primary description of Dapr Workflows' sidecar execution model and pluggable state-store durability, the closest CNCF-ecosystem alternative to Temporal.
- Classification: verified-fact
- Claim domain: technical

## 10 Best Temporal Alternatives for Durable and Agentic Workflows in 2026
- Publisher: Diagrid
- URL or path: https://www.diagrid.io/infrastructure/10-best-temporal-alternatives-2026
- Access date: 2026-08-17
- Source type: secondary
- Relevance: Industry roundup of the durable-execution/workflow-engine market as of 2026, useful for confirming no option targets this repo's actual deployment shape.
- Classification: source-reported-claim
- Claim domain: general

## Restate - the durable execution engine
- Publisher: Restate \(restate.dev\)
- URL or path: https://restate.dev
- Access date: 2026-08-17
- Source type: primary
- Relevance: Primary description of Restate's journaling model, its explicit durable-AI-agent framing, and its single-binary deployment option.
- Classification: verified-fact
- Claim domain: technical

## restatedev/restate - GitHub
- Publisher: Restate \(GitHub\)
- URL or path: https://github.com/restatedev/restate
- Access date: 2026-08-17
- Source type: primary
- Relevance: Confirms Restate's implementation language, maturity signals, and organizational backing.
- Classification: verified-fact
- Claim domain: technical

## DBOS - Durable Workflow Orchestration
- Publisher: DBOS Inc.
- URL or path: https://www.dbos.dev
- Access date: 2026-08-17
- Source type: primary
- Relevance: Primary description of DBOS's Postgres-backed embedded durable-execution model, the option architecturally closest to a lightweight local substrate.
- Classification: verified-fact
- Claim domain: technical

## dbos-inc/dbos-transact-py - GitHub
- Publisher: DBOS Inc. \(GitHub\)
- URL or path: https://github.com/dbos-inc/dbos-transact-py
- Access date: 2026-08-17
- Source type: primary
- Relevance: Confirms license and maturity of the core open-source DBOS library, and its explicit minimal-infrastructure framing, relevant to the pricing/licensing comparison.
- Classification: verified-fact
- Claim domain: pricing

## Inngest - Durable workflows and agents
- Publisher: Inngest
- URL or path: https://www.inngest.com
- Access date: 2026-08-17
- Source type: primary
- Relevance: Primary description of Inngest's step-function durability model and flexible deployment, relevant as a serverless-leaning alternative.
- Classification: verified-fact
- Claim domain: technical

## inngest/inngest - GitHub
- Publisher: Inngest \(GitHub\)
- URL or path: https://github.com/inngest/inngest
- Access date: 2026-08-17
- Source type: primary
- Relevance: Confirms Inngest's licensing model \(which is more restrictive than a permissive OSS license\) and self-hosting support, relevant to the policy/licensing comparison.
- Classification: verified-fact
- Claim domain: policy

## Durable Execution: How Temporal, Restate, and DBOS Are Rethinking Distributed State
- Publisher: Dev Note \(devstarsj\)
- URL or path: https://devstarsj.github.io/2026/04/03/durable-execution-temporal-restate-dbos-distributed-workflows-2026/
- Access date: 2026-08-17
- Source type: secondary
- Relevance: Independent technical comparison of the three architecturally distinct approaches \(dedicated cluster vs. lightweight journal vs. reused Postgres\), useful for the 'how does it work' comparison.
- Classification: source-reported-claim
- Claim domain: general

## Durable AI agents in 2026: long-running workflows with Temporal, Inngest, DBOS, and Restate
- Publisher: Reactify Solutions
- URL or path: https://www.reactify-solutions.com/articles/durable-ai-agents-2026
- Access date: 2026-08-17
- Source type: secondary
- Relevance: Directly compares all four leading candidates specifically for durable long-running AI agent workflows \(this repo's exact use case\) and names real production adopters.
- Classification: recommendation
- Claim domain: current-product

## Building a Durable Execution Engine With SQLite
- Publisher: morling.dev \(Gunnar Morling\)
- URL or path: https://www.morling.dev/blog/building-durable-execution-engine-with-sqlite/
- Access date: 2026-08-17
- Source type: secondary
- Relevance: A concrete worked example of the 'build a small embedded durable-execution engine yourself' option, including its explicitly acknowledged limitations -- directly informative for evaluating a lightweight local-first build.
- Classification: source-reported-claim
- Claim domain: technical

## moxystudio/node-proper-lockfile - GitHub
- Publisher: moxystudio \(GitHub\)
- URL or path: https://github.com/moxystudio/node-proper-lockfile
- Access date: 2026-08-17
- Source type: primary
- Relevance: The concrete, established single-writer-lock primitive that would replace lease+compare-and-swap if the repo's real concurrency threat model is single-writer rather than distributed.
- Classification: recommendation
- Claim domain: technical

## Persistence - LangGraph docs
- Publisher: LangChain
- URL or path: https://docs.langchain.com/oss/python/langgraph/persistence
- Access date: 2026-08-17
- Source type: primary
- Relevance: Documents the checkpointing primitive of the most widely used agent-orchestration framework, establishing the baseline this repo's own controller/checkpoint.mjs is closest to today, and its acknowledged limits.
- Classification: verified-fact
- Claim domain: technical

## Checkpoints Aren't Durable Execution: Why LangGraph, CrewAI, Google ADK, and Others Fall Short for Production Agent Workflows
- Publisher: Diagrid
- URL or path: https://www.diagrid.io/blog/checkpoints-are-not-durable-execution-why-langgraph-crewai-google-adk-and-others-fall-short-for-production-agent-workflows
- Access date: 2026-08-17
- Source type: secondary
- Relevance: The most direct public critique of exactly the failure mode this repo's own design brief diagnoses in its bespoke controller/checkpoint state -- essential evidence for the build-vs-buy question.
- Classification: source-reported-claim
- Claim domain: general

## AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents
- Publisher: arXiv \(preprint 2605.13357\)
- URL or path: https://arxiv.org/pdf/2605.13357
- Access date: 2026-08-17
- Source type: tertiary
- Relevance: An academic framing of exactly the same architecture \(state, transitions, evidence, resumability\) proposed in the repo's design brief, and it names the build-vs-adopt tension as the open question rather than resolving it -- context for why this spike is worth doing rather than assumed away.
- Classification: assistant-inference
- Claim domain: general

## What is an Agent Control Plane?
- Publisher: IBM
- URL or path: https://www.ibm.com/think/topics/agent-control-plane
- Access date: 2026-08-17
- Source type: secondary
- Relevance: Establishes that 'control plane,' as the term is used across the 2026 industry, is a governance-layer concept \(policy, approvals, audit\) distinct from -- and typically layered on top of -- a durable-execution substrate, clarifying what a bought durable-execution engine would and would not replace in the design brief.
- Classification: source-reported-claim
- Claim domain: general

## AWS Step Functions
- Publisher: Amazon Web Services
- URL or path: https://aws.amazon.com/step-functions/
- Access date: 2026-08-17
- Source type: primary
- Relevance: Confirms the fully managed, cloud-account-required end of the spectrum, as a contrast point against local/embeddable options for a repo whose first release targets one local repository with no persistent server infrastructure.
- Classification: verified-fact
- Claim domain: current-product

## Benchmarking External and Embedded Durable Workflows
- Publisher: DBOS Inc. \(blog\)
- URL or path: https://www.dbos.dev/blog/durable-execution-coding-comparison
- Access date: 2026-08-17
- Source type: secondary
- Relevance: A vendor-authored but concrete, code-level comparison of embedded \(DBOS\) versus external-orchestrator \(Temporal\) durable execution, giving quantified evidence for the operational-footprint tradeoff even though DBOS has an obvious stake in the outcome.
- Classification: recommendation
- Claim domain: technical

## Run a development server - Temporal Documentation
- Publisher: Temporal Technologies
- URL or path: https://docs.temporal.io/develop/run-a-development-server
- Access date: 2026-08-17
- Source type: primary
- Relevance: Confirms Temporal itself ships a genuinely local, single-process, dependency-free mode \(via the CLI's start-dev\), which changes the 'Temporal always requires a cluster' assumption and is directly relevant to a single-repository local-CLI deployment shape.
- Classification: recommendation
- Claim domain: technical

## Durable Execution for AI Agent Runtimes: Checkpointing, Replay, and Recovery
- Publisher: Zylos Research
- URL or path: https://zylos.ai/research/2026-04-24-durable-execution-agent-runtimes/
- Access date: 2026-08-17
- Source type: tertiary
- Relevance: Directly addresses when a lightweight/checkpoint approach suffices for an agent versus when a full durable-execution engine is warranted, which is the crux of this repo's own decision.
- Classification: source-reported-claim
- Claim domain: general

## Self-hosted Temporal Service guide
- Publisher: Temporal Technologies
- URL or path: https://docs.temporal.io/self-hosted-guide
- Access date: 2026-08-17
- Source type: primary
- Relevance: Checks whether Temporal's own docs explicitly disqualify the local start-dev mode from production use, which materially affects whether it is a viable substrate for unattended multi-hour runs.
- Classification: unknown
- Claim domain: technical

## Autonomous SDD Reliability Control Plane \(design brief\)
- Publisher: This repository \(internal\)
- URL or path: ai-planning/design-briefs/archived/autonomy/autonomous-sdd-reliability-control-plane.md
- Access date: 2026-08-17
- Source type: primary
- Relevance: The exact proposal under evaluation: the specific reliability primitives \(run ID, monotonic revision, lease, compare-and-swap, append-only event ledger, one executable transition engine\) this build-vs-buy spike is assessing against the surveyed market options.
- Classification: verified-fact
- Claim domain: general

## Public landscape research: autonomous agents, SDD workflow automation, harness engineering \(2026\)
- Publisher: This repository \(internal, prior research\)
- URL or path: ai-planning/research/autonomous-agent-harness-landscape-2026/findings.md
- Access date: 2026-08-17
- Source type: secondary
- Relevance: The prior desk-research pass that first identified the build-vs-buy tension and explicitly recommended this time-boxed spike before committing to a bespoke lease/CAS/event-ledger implementation; this document is the direct follow-up to that recommendation.
- Classification: assistant-inference
- Claim domain: general
