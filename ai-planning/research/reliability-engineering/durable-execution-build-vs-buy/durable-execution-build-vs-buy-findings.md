# durable-execution-build-vs-buy research findings

Depth: deep

## Summary
Summary: Build-vs-buy spike on durable-execution/workflow-orchestration engines \(Temporal, Dapr Workflows, Restate, DBOS, Inngest\) versus a lightweight single-writer-lock baseline and the design brief's originally proposed bespoke lease/compare-and-swap/event-ledger reliability core, for the autonomous-sdd-reliability-control-plane design brief.

## Verified facts
- Temporal achieves durability through an Event History mechanism: every workflow step is recorded as an event, so if a Worker Process crashes the Workflow Execution resumes from the last recorded event without losing progress, giving an exactly-once-to-completion execution guarantee. Deployment separates a Temporal Service \(orchestration\) from self-operated Worker Processes, and can run as Temporal Cloud \(managed\), self-hosted, or a local development service.
- The temporalio/temporal server is MIT-licensed, written primarily in Go, has roughly 22k GitHub stars and about 9,600 commits on main, and is maintained by Temporal Technologies, a company founded by the creators of Uber's Cadence project \(which Temporal originally forked from\).
- Self-hosting the Temporal Service, SDKs, CLI, and UI is free and open source with community support. Temporal Cloud is a separate paid managed tier: Essentials starts at $100/month \(1M actions, 1GB active storage\), Business at $500/month \(2.5M actions\), and Enterprise is custom-priced; overage is billed per million actions \($50/M down to $25/M with volume\) plus per-GB-hour storage.
- Dapr Workflows run application-defined workflow logic orchestrated by the Dapr sidecar over a gRPC stream, persist event-sourced history to a pluggable state store \(only state stores that explicitly support workflows; Azure Cosmos DB and AWS DynamoDB have documented complexity limitations\), and can optionally sign history cryptographically via mTLS/SPIFFE identities for tamper detection.
- Restate is a self-contained runtime that journals every step of a handler so it resumes exactly where it left off after a crash, giving built-in idempotency, retries, timers, and durable AI agents \(including pausing mid-run for human approval\) without an external message broker; it deploys as a single binary locally, on Kubernetes/bare metal, or as a managed Restate Cloud.
- The restatedev/restate server is written in Rust, has roughly 4.3k GitHub stars and 4,100+ commits, ships SDKs in TypeScript, Java/Kotlin, Python, Go, and Rust, and is maintained by a dedicated company \(Restatedev\) rather than an individual maintainer; the exact OSS license identifier was not confirmed from the fetched page content beyond the presence of a LICENSE file.
- DBOS persists durable workflow state directly in an existing Postgres database instead of running a separate orchestration service: developers annotate functions with workflow/step decorators, and on failure a new process resumes from the last Postgres-recorded checkpoint. DBOS Transact \(the core library\) is open source and free; DBOS Pro is a paid tier adding dashboards/support; DBOS Cloud \(managed\) or a self-hosted DBOS Conductor \(hybrid control plane\) are optional deployment layers.
- dbos-transact-py is MIT-licensed, has roughly 1.5k GitHub stars and 588 commits with active CI, and is maintained by DBOS Inc.; the project explicitly frames itself as adding minimal infrastructure since Postgres is typically already present in a backend team's stack, unlike an external always-on orchestrator cluster.
- Inngest embeds durability into application code as step functions: durable steps retry individually rather than restarting the whole run, execution can pause mid-run to wait for an external event and resume from that exact point, and full tracing/replay is built in. It deploys inside an existing app on any cloud, serverless platform, or self-hosted setup rather than requiring a dedicated always-on cluster.
- The inngest/inngest server/CLI is licensed under a Server Side Public License with a delayed open-source Apache-2.0 publication, while all Inngest SDKs are Apache-2.0 licensed; the project has roughly 5.7k GitHub stars and 6,200+ commits, and the docs explicitly state self-hosting the Inngest server is supported and documented.
- LangGraph's checkpointer persists a StateSnapshot after every super-step keyed by thread\_id, enabling resume-after-interrupt and human-in-the-loop workflows, but ships only a development-grade MemorySaver and basic production-grade SQLite/Postgres persistence primitives -- it does not itself provide automatic crash detection, distributed multi-writer coordination, or a guarantee that a run reaches completion.
- AWS Step Functions is a fully managed, cloud-native serverless state-machine service that requires an AWS account and operates exclusively within AWS infrastructure \(integrating with 220+ AWS services\); the product page gives no local or on-premises self-hosting option, making it the least compatible surveyed option with this repo's stated single-local-repository, no-persistent-server-infrastructure first-release scope.
- The design brief's recommended architecture item 1 specifies a canonical autonomous-sdd-run-v2 record including a run ID, schema version, monotonic revision, authorization/configuration snapshots with digests, canonical repository/worktree locators, ordered queue entries, an explicit transition graph, typed status, attempts, evidence bindings, an append-only event ledger, and 'a lease plus compare-and-swap update so only one runner owns a transition' -- item 2 then specifies one executable transition engine that performs admission, selects exactly one next transition, invokes its adapter, and atomically records the outcome. This is, in structure, the same set of guarantees \(durable state, single-owner transitions, resumability, an audit trail\) that the surveyed durable-execution engines already provide as a reusable primitive.

## Source-reported claims
- Temporal markets durable execution as the missing reliability layer for agentic AI workflows: agent loops need automatic retries, state persistence across crashes, and replay-based recovery for the same reasons any other long-running business workflow does, and Temporal's cluster stores full execution state so it can be recovered, replayed, or paused at any point.
- A 2026 roundup lists Restate, Inngest, DBOS, Trigger.dev, Orkes Conductor, Camunda, Kestra, AWS Step Functions, Azure Durable Functions, and Diagrid Catalyst as Temporal alternatives, and its selection criteria \(governance, air-gapped/cloud deployment, team workload, production-AI compliance\) implicitly assume an organizational/team deployment context; none of the ten is explicitly positioned for a single-developer, local, or CLI-only use case.
- Temporal runs a dedicated persistence cluster and replays full event history to reconstruct workflow state; Restate has a lighter, more application-programming feel where code records completed operations into a journal that is replayed and skipped on recovery; DBOS reuses Postgres as the durability layer instead of running a separate orchestrator, trading away some of Temporal's distributed cross-service coordination power for a much smaller operational footprint.
- A worked single-process durable-execution engine \(Persistasaurus\) stores step invocations in one SQLite execution-log table, intercepts method calls via a proxy to log invocation-then-result, and on replay returns cached results for steps already marked COMPLETE instead of re-running them; the author explicitly flags a residual crash-window race \(crash after execution but before result-logging causes a repeat\) that still requires idempotency keys, and states this embedded single-database model trades away Temporal-style distributed cross-service coordination for simplicity and tight in-process data consistency.
- The article argues that agent frameworks offering checkpointing \(LangGraph, CrewAI, Google ADK\) are not equivalent to durable execution: they provide no automatic failure detection/restart, no coordination preventing two processes from resuming the same workflow concurrently, and no process-pool-level durability, and concludes that closing this gap requires a fundamentally different architecture \(as in Temporal-class systems or Dapr Workflows\), not incremental checkpoint improvements.
- The 2026 industry usage of 'agent control plane' separates a control plane \(what agents are permitted to do, and the record of every action taken -- governance\) from a data plane \(agents actually executing tasks\), typically layered as Management/Control/Planning planes with a bounded Plan-Execute-Verify loop, policy guardrails, human-approval gates for high-risk actions, and observability/audit -- a governance-layer definition that a durable-execution engine like Temporal or DBOS does not itself provide out of the box and that this repo's SDD-specific typed operation graph and review dispatcher would still need to supply regardless of which durable-execution substrate is chosen underneath.
- The article argues session/chat-history memory alone does not prove durability \(it does not record which shell command ran, which email was sent, or which approval was granted\), and that for autonomous coding and operations agents specifically -- ones with persistent side effects such as package installs, file modification, pull requests, service restarts, or payment operations -- full durable-execution engines \(Temporal, Restate, DBOS\) become necessary, requiring idempotent tool wrappers, durable approval records, and deliberate crash-injection recovery testing rather than trusting checkpoints alone.

## Assistant inferences
- This paper's proposed 'runtime substrate' for foundation-model software agents \(state management, transition logic, evidence collection, resumability\) is architecturally the same shape as both this repo's proposed control plane and the durable-execution engines surveyed in this research; it frames the central open design question as build-a-custom-control-plane vs. adopt-an-existing-durable-execution/workflow-engine, without resolving it for agent-specific use -- which is why an explicit, evidence-based spike \(this document\) is warranted rather than assuming either answer.
- The prior research pass concluded that the brief's proposed reliability core \(lease, compare-and-swap, event ledger, resumable transition engine\) is structurally the same problem established durable-execution engines already solve, cited a public critique that even well-funded agent frameworks get this wrong when patched incrementally rather than built on real durable execution, and explicitly recommended a time-boxed build-vs-adopt spike -- covering realistic engine options, what each would replace versus leave bespoke, and maturity -- before the repo's Contract Consolidation step finalizes the v2 run schema. This document is that spike.

## Unknowns
- Whether Temporal's local, single-process, SQLite-backed \`start-dev\` server is safe or intended for actual unattended production use \(as opposed to only local development/testing\) is not explicitly resolved by Temporal's own documentation: the guide states 'if you're still developing and testing your application locally, you may not need a production Temporal Service' and organizationally separates a 'Plan and deploy your service' production path, but stops short of explicit prohibitory language against running start-dev unattended in production. This should be confirmed directly with Temporal \(or via its support channels\) before relying on start-dev for a real multi-hour unattended run, rather than assumed either way from this research pass.

## Recommendations
- Recommendation, supported by this source: do not treat the Temporal-vs-Restate-vs-DBOS-vs-Inngest choice itself as the high-stakes decision. The article's own framing -- 'the choice between platforms is much smaller than the choice between durable execution and hoping the process stays up' -- and its adopter list \(Temporal used by OpenAI, Replit, and Cursor; Inngest for serverless TypeScript teams; DBOS for Postgres-centric Python teams; Restate for portability\) both indicate any of the four would close the reliability gap; the repo's control-plane design should therefore keep the SDD-specific pieces \(typed operation graph, review dispatcher, evidence gates\) substrate-agnostic rather than picking a durable-execution vendor first.
- Recommendation, supported by this source: if a full external durable-execution engine is deferred, satisfy the design brief's gap \#5 \(no run ID, revision, compare-and-swap, lease, or event ledger; last-writer-wins corruption possible\) with a well-established single-writer lock primitive -- proper-lockfile's atomic mkdir-based lock acquisition plus mtime-based staleness detection \(recovering from a process killed by SIGKILL or a VM fatal crash, which is exactly the case its own docs flag as not auto-released\) -- combined with the append-only event ledger already planned, instead of hand-rolling a lease-plus-compare-and-swap protocol from scratch.
- Recommendation, supported by this source with the caveat that it is vendor-authored: if the repo later needs true crash-safe multi-step resumability beyond what a single-writer lock provides \(i.e., surviving process death mid-transition, not just preventing concurrent starts\), an embedded Postgres-backed model in the DBOS style is the lowest-friction 'buy' option to evaluate first, because it is reported to add durability via annotations on existing code \(7 lines changed in a 110-line sample app\) rather than requiring a separately-run, always-up cluster \(which the same benchmark reports roughly tripling the sample app's line count and service count for the Temporal equivalent\).
- Recommendation, supported by this source: before ruling Temporal out as too heavyweight for a local single-developer tool, evaluate \`temporal server start-dev\` directly -- it runs as a single process with zero external runtime dependencies and supports SQLite-backed on-disk persistence \(so state survives a restart if the same database file is reused\), which is architecturally much closer to this repo's local-CLI deployment shape than Temporal Cloud or a self-hosted production cluster.

## Model guidance provenance
- Role: highest-quality
- Lookup date: 2026-08-17
- claude: Claude Opus 4.1; source: https://docs.anthropic.com/en/docs/about-claude/models; stale-risk; verify current official provider documentation before use

## Comparative analysis
- See the classified findings and linked sources above.

## Tradeoffs
- See the classified findings and linked sources above.

## Maturity signals
- See the classified findings and linked sources above.

## Implementation patterns
- See the classified findings and linked sources above.

## Risks
- See the classified findings and linked sources above.

## Source quality notes
- See the classified findings and linked sources above.

## Source material used as data
### What is Temporal - Temporal Documentation
> Temporal is a scalable runtime platform providing Durable Execution: reliable, resilient Workflow Executions even in the face of failures. A Temporal Application is a set of Workflow Executions, each maintaining local state and communicating via message passing. Worker Processes…

### temporalio/temporal - GitHub
> Repository metadata: MIT License; Go as primary language \(go.mod/go.sum, Go-focused samples\); ~22.3k stars; 9,644 commits on main; 547 open issues; 349 open pull requests. Maintained by Temporal Technologies, described in the docs as a company by the creators of Cadence, with Te…

### Temporal Pricing
> Self-hosted: free, open-source, includes Temporal Service, SDKs, CLI, UI, community support. Temporal Cloud tiers: Essentials \($100/mo min, 1M actions, 1GB active/40GB retained storage, 99.9% SLA\); Business \($500/mo min, 2.5M actions, 2.5GB active/100GB retained, 2hr P0 response…

### Build resilient agentic AI with Temporal
> Temporal's marketing content frames agentic AI systems as needing the same durable-execution guarantees as other long-running distributed workflows: automatic retries, crash recovery, and time-travel/replay debugging via full event history, positioning Temporal as general-purpos…

### Workflow overview - Dapr Docs
> Dapr Workflow engine runs in the Dapr sidecar; workflow code lives in the application and talks to the sidecar via gRPC. Activities and child workflows compose larger flows. Durability is event-sourced: every execution's history persists in a state store, and only state stores t…

### 10 Best Temporal Alternatives for Durable and Agentic Workflows in 2026
> The roundup separates lighter, code-centric options \(Restate, Inngest, DBOS, Trigger.dev\) from heavier server-based options \(Orkes Conductor, Camunda, AWS Step Functions\), but frames all ten around organizational concerns like governance, cloud-to-air-gapped deployment, and prod…

### Restate - the durable execution engine
> Restate positions itself as removing infrastructure complexity for resilient distributed apps: application code is plain code, and the Restate runtime journals completed steps so a handler can be replayed and resumed after a crash or infra failure. Stateful virtual objects give …

### restatedev/restate - GitHub
> Repository shows Rust as primary language \(Cargo.toml, rust-toolchain.toml\), ~4.3k stars, 4,114 commits on main, 333 open issues, 77 open pull requests. Multiple official SDKs across languages. Professional documentation and community channels \(Discord, Slack\) suggest company-ba…

### DBOS - Durable Workflow Orchestration
> DBOS frames itself as adding resilience via durable workflow orchestration without new infrastructure: connect the open-source library to an existing Postgres database, annotate functions, and the system automatically resumes failed workflows from checkpoint, handles retries, an…

### dbos-inc/dbos-transact-py - GitHub
> Repository metadata: MIT license, Python primary language, ~1.5k stars, 588 commits on main, GitHub Actions CI configured for unit tests. Maintained by DBOS Inc., with documentation at docs.dbos.dev and an active Discord community, indicating sustained organizational commitment …

### Inngest - Durable workflows and agents
> Inngest positions itself for AI agents, workflows, serverless functions, scheduled jobs, webhooks, and background jobs, marketed as 'Unbreakable Agents, Invisible Infra.' Flow-control features include rate limiting and per-tenant concurrency/throttling. Deployment flexibility is…

### inngest/inngest - GitHub
> Repository: Go primary language, ~5.7k stars, 6,237 commits on main, active GitHub Actions CI. Self-hosting explicitly documented as supported and 'easy to get started with.' Licensing is more restrictive at the server/CLI layer \(SSPL with delayed Apache-2.0 publication\) than th…

### Durable Execution: How Temporal, Restate, and DBOS Are Rethinking Distributed State
> The article frames 2026 as the point where durable execution matured enough to evaluate seriously across four players \(Temporal, Restate, DBOS, Dapr Workflows\). Temporal: mature, proven at scale, dedicated cluster and UI. Restate: elegant, simpler operation, application-code-fee…

### Durable AI agents in 2026: long-running workflows with Temporal, Inngest, DBOS, and Restate
> Temporal: mature multi-language SDKs, requires a cluster or Temporal Cloud, reportedly adopted by OpenAI, Replit, Cursor, integrates with AWS Bedrock AgentCore; best for polyglot teams with existing cluster infra. Inngest Agent Kit: serverless-native TypeScript-first, managed se…

### Building a Durable Execution Engine With SQLite
> Persistasaurus logs step invocations \(flow UUID, step sequence, method metadata, serialized params, return value, status PENDING/WAITING\_FOR\_SIGNAL/COMPLETE\) to a SQLite table via a ByteBuddy proxy interceptor. Recovery: if a step's log entry is COMPLETE, return its cached resul…

### moxystudio/node-proper-lockfile - GitHub
> proper-lockfile is an inter-process and inter-machine Node.js lockfile utility working on local or network filesystems. It acquires locks atomically via mkdir \(which, unlike open+O\_EXCL, is safe on network filesystems\), suffixing the target path with .lock. While held, the lock'…

### Persistence - LangGraph docs
> LangGraph checkpointers persist thread-scoped graph state as checkpoints, used for short-term memory, conversation continuity, human-in-the-loop workflows, time travel, and fault tolerance. Compiling a graph with a checkpointer saves a StateSnapshot at every super-step; thread\_i…

### Checkpoints Aren't Durable Execution: Why LangGraph, CrewAI, Google ADK, and Others Fall Short for Production Agent Workflows
> Checkpointing means 'I saved your state, you take it from here'; durable execution means 'your workflow runs to completion, period.' Missing guarantees in checkpoint-only frameworks: no automatic crash/failure detection or restart; no distributed coordination to stop two process…

### AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents
> The paper proposes a runtime substrate/control plane containing state management \(tracking execution state across operations\), transition logic \(governing movement between states\), evidence collection \(recording decisions/observations/outcomes for an audit trail\), and resumabili…

### What is an Agent Control Plane?
> An agent control plane is defined by core capabilities managing how agents are discovered, run, governed, and maintained. The control plane separates governance from execution: agents run tasks in the data plane; the control plane decides what they're permitted to do and records…

### AWS Step Functions
> AWS presents Step Functions as part of its serverless architecture offering, emphasizing integration with over 220 AWS services and requiring an AWS account; no local/on-premises deployment path is described on the product page, and detailed pricing \(a separate page\) was not ind…

### Benchmarking External and Embedded Durable Workflows
> DBOS's own benchmark reports adding durable-workflow annotations to a 110-line sample application required about 7 lines of changes and only Postgres as an added dependency, versus over 100 added/changed lines and growth to 187 lines to restructure the same app for Temporal, whi…

### Run a development server - Temporal Documentation
> The Temporal CLI's \`server start-dev\` command starts a local Temporal Service as a single process with zero runtime dependencies, automatically starting the Web UI \(localhost:8233\) and a default Namespace, with the service itself on localhost:7233. It supports both in-memory and…

### Durable Execution for AI Agent Runtimes: Checkpointing, Replay, and Recovery
> Shared primitives across durable-execution systems: event history/step journals to reconstruct past state, durable step results preventing re-execution of completed operations, timers/external-event waits for async coordination, idempotency keys to prevent duplicate side effects…

### Self-hosted Temporal Service guide
> The self-hosted guide describes production deployment as a distinct path from local development, with guidance such as 'we recommend this for local development regardless of whether you plan to use Temporal Cloud or self-host in production,' but does not contain an explicit stat…

### Autonomous SDD Reliability Control Plane \(design brief\)
> \# Autonomous SDD Reliability Control Plane Date: 2026-08-16 Status: Evidence-derived recommendation pending owner confirmation. This brief records analysis and a proposed solution; it does not authorize OpenSpec Propose, Apply, GitHub mutation, or implementation. \#\# 1. Problem a…

### Public landscape research: autonomous agents, SDD workflow automation, harness engineering \(2026\)
> \# Public landscape research: autonomous agents, SDD workflow automation, harness engineering \(2026\) Date: 2026-08-16 Purpose: independent public-source check on whether \[autonomous-sdd-reliability-control-plane.md\]\(../../design-briefs/autonomous-sdd-reliability-control-plane.md\)…
