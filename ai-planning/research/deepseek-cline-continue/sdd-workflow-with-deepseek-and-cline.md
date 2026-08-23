# Full-Stack Mobile App Workflow: Cline + Multi-Model Integration

This document maps out a complete end-to-end engineering workflow—from early research to production and prototype SDD execution—using **Cline** inside IntelliJ/VS Code, leveraged alongside Frontier Models (**Claude Opus**, **GPT-5.6 Sol**) and **DeepSeek-V4 Pro**.

---

## Workflow Overview & Model Allocation

```text
[Phase 1: Research & Stack Selection] ──► [Phase 2: High-Level Architecture]
  (Frontier: Opus / Sol)                    (Frontier: Opus / Sol)
                                                     │
                                                     ▼
[Phase 4: SDD Execution Loop]         ◄── [Phase 3: Slice Design Brief]
  (DeepSeek-V4 Pro via Cline/Aider)         (Tier-2 / Frontier Hybrid)
```

| Phase | Core Objective | Primary LLM Tier | Cline Mode / Tooling |
| :--- | :--- | :--- | :--- |
| **1. Research & Stack** | Trade-off analysis, web research | Claude Opus / GPT-5.6 Sol | Plan Mode + Web Search MCP |
| **2. Architecture & Plan** | Data models, UI flows, milestones | Claude Opus / GPT-5.6 Sol | Act Mode (Markdown generation) |
| **3. Slice Design Brief** | Just-in-Time spec & design brief | Sonnet / Haiku / Sol / Opus | Plan Mode + Context Tagging (`@file`) |
| **4. SDD Execution** | TDD, implementation, fix loops | DeepSeek-V4 Pro | Act Mode (Human Gates or YOLO) |

---

## Phase 1: Research & Tech Stack Selection

**Goal:** Evaluate requirements, research frameworks, compare trade-offs, and search official docs, GitHub, Reddit, and forums.

### Cline Execution Strategy
1. **Set Model:** Select **Claude Opus** or **GPT-5.6 Sol** in the Cline model dropdown.
2. **Tooling:** Connect a Web Search MCP Server (e.g., Brave Search, Context7, or Puppeteer).
3. **Execution (Plan Mode):** Instruct Cline to run read-only research without touching project files:
   > *"Analyze React Native vs. Flutter for our mobile requirements. Perform web searches across GitHub and technical forums to summarize developer consensus on state management and performance in 2026."*

---

## Phase 2: Synthesis & High-Level Project Plan

**Goal:** Synthesize research, map screens, define data models, and break work down into milestones and architectural slices.

### Cline Execution Strategy
1. **Set Model:** Continue with **Claude Opus** or **GPT-5.6 Sol**.
2. **Execution (Act Mode):** Instruct Cline to document system architecture directly into your repository:
   > *"Synthesize our tech stack decision and requirements into `docs/ARCHITECTURE.md`, `docs/DATA_MODELS.md`, and `docs/MILESTONES.md`."*
3. **Approval Gate:** Review Cline's proposed file creations in the diff panel and click **Approve**.

---

## Phase 3: Slice-Level Design Brief

**Goal:** Author a proposal-ready Design Brief for an incoming slice, answering functional, technical, UI, and non-functional questions before coding.

### Cline Execution Strategy
1. **Set Model:** Switch to a Tier-2 model (e.g., **Claude Sonnet**, **GPT-5.6 Terra/Luna**) or keep **Opus/Sol** for complex architecture slices.
2. **Pin Context:** Tag architectural documents directly in the prompt using `@docs/ARCHITECTURE.md` and `@docs/DATA_MODELS.md`.
3. **Interactive Drafting:**
   > *"Draft a proposal-ready Design Brief for Slice 1 (Auth & Session Management) in `docs/briefs/slice-1-auth.md`. Identify open technical, security, or UI questions."*
4. **Iterate:** Address open questions in chat until `slice-1-auth.md` is complete and marked `status: proposal-ready`.

---

## Phase 4: SDD Lifecycle Execution (Production vs. Prototype)

Once the Design Brief is finalized, hand off execution to **DeepSeek-V4 Pro** to run the Spec-Driven Development (SDD) cycle for pennies per run.

### Option A: Production Mode (Human-in-the-Loop)
* **Target Environment:** IntelliJ via Cline Plugin.
* **Model:** **DeepSeek-V4 Pro** (API).
* **Workflow:**
    1. Hand the brief to Cline:
       > *"Read `docs/briefs/slice-1-auth.md` and generate the OpenSpec proposal and task breakdown under `openspec/changes/auth/`."*
    2. **Plan Mode Gate:** Review and approve the proposed tasks.
    3. **Act Mode Gate:** Cline writes tests, implements feature code, and executes test suites in the background terminal.
    4. **Approval Step:** Inspect each file diff card, security review, and test result before approving progress to the next task.

### Option B: Prototype Mode (Fully Autonomous Execution)
* **Target Environment:** Aider CLI (Terminal) or Cline in YOLO Mode.
* **Model:** **DeepSeek-V4 Pro** (API).
* **Workflow:**
    1. Open terminal or launch Cline with **Auto-Approve / YOLO Mode** enabled.
    2. Point the agent at the proposal-ready design brief:
       ```bash
       aider --model deepseek/deepseek-v4-pro --yes-always --test-cmd "pytest"
       ```
    3. The agent autonomously generates tests, writes code, reads failing execution logs, and loops through fixes until the test suite passes completely without requesting manual intervention.

---

## Key Advantages of This Setup

1. **Seamless Model Switching:** Use high-reasoning frontier models for strategy and research, then instantly switch Cline to DeepSeek-V4 Pro for execution without losing context.
2. **Cost Optimization:** Cuts API costs by 80–90% by delegating multi-step execution, refactoring, and test-fix loops to DeepSeek.
3. **Safety & Rollback:** Cline's isolated visual checkpoints allow one-click rollbacks if an autonomous iteration strays off target.