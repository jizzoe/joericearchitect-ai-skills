# Harness Engineering Sources

Research date: 2026-08-10
Depth: standard research

## Core Definition and Mental Model

- Martin Fowler / Birgitta Boeckeler, "Harness engineering for coding agent users"
  https://martinfowler.com/articles/harness-engineering.html
  Use: primary conceptual source for guides, sensors, computational/inferential controls, steering loop, maintainability harness, architecture fitness harness, behavior harness, harnessability, and harness templates.

- Thoughtworks, "Harness engineering and agent feedback: Exploring AI coding sensors"
  https://www.thoughtworks.com/en-ca/insights/blog/generative-ai/harness-engineering-agent-feedback-exploring-ai-coding-sensors
  Use: practical follow-up focused on sensors, deterministic feedback, static analysis, Semgrep, Dependency Cruiser, coverage, and mutation testing.

- Red Hat Developer, "Harness engineering: Structured workflows for AI-assisted development"
  https://developers.redhat.com/articles/2026/04/07/harness-engineering-structured-workflows-ai-assisted-development
  Use: practical workflow framing around repository impact maps, structured implementation constraints, and human review checkpoints.

- Thoughtworks Technology Podcast, "What is harness engineering?"
  https://www.thoughtworks.com/insights/podcasts/technology-podcasts/what-harness-engineering
  Use: podcast overview and practitioner discussion with Birgitta Boeckeler.

- Software Engineering Radio 730, "Birgitta Boeckeler on Harness Engineering for AI Agents"
  https://www.listennotes.com/podcasts/software/se-radio-730-birgitta-bFMr4uoeaVA/
  Use: podcast link and summary for SE Radio coverage of guides, sensors, CI/CD integration, PR processes, trust, and accountability.

## Evals, Agent Harnesses, and AIDLC

- Anthropic Engineering, "Demystifying evals for AI agents"
  https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
  Use: source for agent evals, multi-turn evaluation, agent harnesses, evaluation harnesses, outcomes, traces, grading, and evaluation suites.

- InfoQ, "Evaluating AI Agents in Practice: Benchmarks, Frameworks, and Lessons Learned"
  https://www.infoq.com/articles/evaluating-ai-agents-lessons-learned/
  Use: lifecycle framing for agent evaluation across intelligence, performance, reliability, responsibility, and user experience.

- Harness AI Evals
  https://www.harness.io/products/ai-evals
  Use: commercial Agent DLC framing for eval suites as CI/CD gates, offline/online evaluation, trajectory evaluation, datasets, metrics, thresholds, and AI asset registry.

- LangSmith, "Evaluation concepts"
  https://docs.langchain.com/langsmith/evaluation-concepts
  Use: datasets, examples, experiments, offline evals, online evals, traces, evaluators, code evaluators, LLM-as-judge, human review, and pairwise evaluation.

- Braintrust, "Evaluate systematically"
  https://www.braintrust.dev/docs/evaluate
  Use: systematic eval workflow covering data, tasks, scores, playgrounds, experiments, CI/CD, production scoring, and feedback loops.

## Open Source Tools and Libraries

- OpenAI Evals
  https://github.com/openai/evals
  Use: open-source framework and registry for evaluating LLMs and LLM systems.

- Inspect AI
  https://github.com/UKGovernmentBEIS/inspect_ai
  Use: open-source framework for large language model evaluations.

- Promptfoo intro
  https://www.promptfoo.dev/docs/intro/
  Use: local-first CLI/library for LLM app evaluation, red teaming, CI/CD use, caching, concurrency, and provider comparisons.

- DeepEval introduction
  https://deepeval.com/docs/introduction
  Use: Pytest-style LLM evaluation framework for agents, RAG, MCP systems, conversations, safety, and local-first testing.

- Ragas evaluate reference
  https://docs.ragas.io/en/latest/references/evaluate/
  Use: RAG evaluation metrics and evaluation API reference.

- Arize Phoenix docs
  https://arize.com/docs/phoenix
  Use: open-source observability, tracing, evaluations, prompt management, datasets, experiments, OpenTelemetry, and OpenInference.

- Claw-Eval
  https://github.com/claw-eval/claw-eval
  Use: evaluation harness for LLM agents with human-verified tasks and reproducibility emphasis.

## Paid and Managed Products

- Harness AI Evals
  https://www.harness.io/products/ai-evals
  Use: managed CI/CD-integrated eval gates and Agent DLC positioning.

- LangSmith evaluation docs
  https://docs.langchain.com/langsmith/evaluation-concepts
  Use: managed observability/evaluation workflow model.

- Braintrust eval docs
  https://www.braintrust.dev/docs/evaluate
  Use: managed evaluation, experiment tracking, and production scoring model.

- Arize Phoenix / Arize docs
  https://arize.com/docs/phoenix
  Use: Phoenix OSS and Arize-managed observability/eval ecosystem.

- Confident AI / DeepEval docs
  https://deepeval.com/docs/introduction
  Use: DeepEval OSS plus managed Confident AI platform integration.

## Secondary Context

- SSRN, "Harness Engineering: A Governance Framework for AI-Driven Software Engineering"
  https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6372119
  Use: academic/governance framing around context, constraint, and convergence. Treat as emerging/secondary.

- United Nations University, "Engineering and Governing the Agent Harness"
  https://unu.edu/publication/engineering-and-governing-agent-harness-technology-and-policy-framework-runtime-layer
  Use: governance framing for agent harnesses as runtime and policy layers. Treat as broad context.

- TechTarget, "Harness engineering: Agent harnesses as critical infrastructure"
  https://www.techtarget.com/searchapparchitecture/tip/Harness-engineering-Agent-harnesses-as-critical-infrastructure
  Use: enterprise architecture orientation. Treat as secondary commentary.

## Repo-Local Context Used

- `README.md`
  Use: product boundary: reusable AI assets for Claude and Codex.

- `docs/research-topic-workflow-notes.md`
  Use: research workflow structure, model-depth policy, and staleness rule.

- `openspec/specs/sdd-lifecycle/spec.md`
  Use: existing SDD lifecycle controls, evidence gates, and idempotent resume behavior.

- `openspec/specs/bounded-autonomous-execution/spec.md`
  Use: bounded authorization, batching, correction limits, evidence gates, human-pause classification, and external mutation controls.

- `openspec/specs/asset-quality/spec.md`
  Use: deterministic planning artifact quality rules and local validation behavior.

- `openspec/specs/cross-assistant-assets/spec.md`
  Use: Claude/Codex parity, canonical asset ownership, runtime adapters, and cross-assistant verification evidence.
