# Built-In AI Assets: Claude vs Codex

Date: 2026-08-08

## Purpose

Use the platform-provided assets before duplicating them in this repo. In these notes, "assets" means skills, workflows, hooks, agents, MCP-backed workflows, and other reusable AI assistant capabilities.

## Current Public Source Baseline

### Claude / Anthropic

Anthropic publicly defines skills as folders of instructions, scripts, and resources that Claude loads dynamically for specialized tasks. It describes progressive disclosure as the mechanism: Claude sees skill metadata first, then loads relevant skill content only when needed.

Publicly documented Anthropic skill types:

| Type | What it means | Notes |
|---|---|---|
| Anthropic skills | Anthropic-created and maintained skills | Public docs explicitly name enhanced Excel, Word, PowerPoint, and PDF skills as built-in examples available to all users when Code execution and file creation are enabled. |
| Custom skills | User or organization-created skills | Markdown-first, can include examples, references, scripts, tools, and dependencies. |
| Organization-provisioned skills | Team/Enterprise skills pushed by owners | Used to distribute approved workflows consistently across a team. |
| Partner skills | Skills in the Skills Directory from partners | Intended to work with MCP connectors such as Notion, Figma, Atlassian, and others. |

Anthropic's public reference repository currently contains these skills:

| Skill | Category | Reuse implication |
|---|---|---|
| `skill-creator` | Skill authoring/evaluation | Do not duplicate. Use as the model for writing and improving skills. |
| `docx` | Word documents | Avoid writing a generic Word skill. Build domain-specific document workflows on top. |
| `xlsx` | Spreadsheets | Avoid writing generic spreadsheet manipulation. Add domain-specific analysis templates only. |
| `pptx` | Presentations | Avoid writing generic deck generation. Add deck strategy/format skills only. |
| `pdf` | PDF extraction, creation, manipulation | Avoid generic PDF skills. Add review/reporting workflows if needed. |
| `frontend-design` | UI design guidance | Use as a baseline for frontend craft; add project-specific UI standards separately. |
| `webapp-testing` | Playwright-based web app testing | Use as a reference for browser verification workflows. |
| `mcp-builder` | MCP server creation | Use before writing MCP-specific builder guidance. |
| `claude-api` | Claude API guidance | Claude-specific; keep separate from OpenAI API guidance. |
| `web-artifacts-builder` | Claude HTML artifacts | Claude-specific artifact workflow. |
| `theme-factory` | Artifact/document styling | Useful pattern for reusable style assets. |
| `canvas-design` | Static visual design | Claude/artifact-oriented design workflow. |
| `algorithmic-art` | p5.js generative art | Creative/example skill, not core SDLC. |
| `brand-guidelines` | Brand application | Useful pattern for organization style kits. |
| `doc-coauthoring` | Structured documentation workflow | Strong candidate for an AI-agnostic documentation workflow. |
| `internal-comms` | Internal communications | Domain workflow, not SDLC base. |
| `slack-gif-creator` | Slack GIFs | Niche media workflow. |
| `template` | Skill scaffold | Reference only. |

### Codex / OpenAI

OpenAI's current docs describe skills as a shared ChatGPT and Codex format built on the open agent skills standard. A skill is a directory containing `SKILL.md` with required `name` and `description`, plus optional `scripts/`, `references/`, `assets/`, and `agents/openai.yaml`.

Officially documented Codex/OpenAI asset primitives:

| Asset | Publicly documented state | Reuse implication |
|---|---|---|
| Skills | Shared ChatGPT/Codex authoring format; activated explicitly with `$skill-name` or implicitly by description | Make new base skills in standard `SKILL.md` form. |
| `skill-creator` | Built-in creator invoked as `$skill-creator` in Codex and `@skill-creator` in ChatGPT Work | Do not duplicate. Use for first-draft generation and later optimization. |
| Plugins | Distribution unit for skills, MCP servers, hooks, and optional UI | Treat plugin packaging as a distribution concern, not the base skill format. |
| MCP servers/connectors | Live data/actions; skills define workflows around MCP tools | Keep tool access and workflow instructions separate. |
| Hooks | Codex lifecycle scripts such as `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `UserPromptSubmit` | Use for deterministic enforcement, validation, logging, and guardrails. |
| Subagents | Codex agent configuration surface | Use for specialization where independent context is valuable. |
| `AGENTS.md` | Project/repo agent instructions | Use for repo-wide defaults; do not overload it with every domain workflow. |
| Record & Replay | Workflow capture that can draft a reusable skill | Candidate for turning repeated local workflows into skills. |

OpenAI public docs do not currently expose a single stable list of every built-in Codex system skill. In this workspace, the available system/plugin-bundled skill set includes:

| Visible skill | Scope | Duplicate? |
|---|---|---|
| `skill-creator` | Create/edit/evaluate skills | No. Build on it. |
| `skill-installer` | Install skills | No. |
| `plugin-creator` | Scaffold Codex plugins | No. |
| `openai-docs` | Current OpenAI/Codex/API documentation workflow | No. |
| `imagegen` | Raster image generation/editing | No. |
| `documents` / `pdf` / `presentations` / `spreadsheets` | Office/PDF artifacts | No generic duplicates. Build domain templates only. |
| `sites` | Website build/hosting workflow | No. |
| `browser` | In-app browser control | No. |
| `visualize` | Interactive visualizations | No generic duplicate. |

## Overlap: Good AI-Agnostic Base Skills

These areas are covered or strongly supported on both platforms and should be written in an assistant-neutral way:

| Area | Why it is portable | Base skill recommendation |
|---|---|---|
| Skill authoring | Both use or support the open `SKILL.md` pattern | `base-skill-authoring`: naming, description triggers, progressive disclosure, examples, tests/evals. |
| Document workflows | Claude has document skills; Codex has document/PDF/presentation/spreadsheet skills in this workspace | `base-document-workflow`: artifact goal, input inventory, output contract, visual/semantic QA. |
| Research grounding | Both can browse/read files and both benefit from citation discipline | `base-grounded-research`: source cascade, claims table, quote-then-synthesize, uncertainty rules. |
| Code review | Both platforms support code reading, search, test execution, and comments | `base-code-review`: severity labels, review phases, evidence requirements, no-auto-fix mode. |
| Web/app testing | Claude reference repo and Codex tool ecosystem both support Playwright/browser verification | `base-verification-loop`: reproduce, test, implement, verify, report evidence. |
| MCP-backed workflows | Both recognize MCP as a tool/data layer; skills encode procedure | `base-mcp-workflow`: tool boundaries, auth assumptions, fallback handling, final output format. |
| Guardrails | Both need deterministic constraints for high-risk workflows | `base-guardrails`: read-before-edit, no secret exfiltration, approval points, stop conditions. |

## Covered By Claude More Explicitly

| Area | Notes |
|---|---|
| Consumer-visible built-in document skills | Anthropic publicly names Excel, Word, PowerPoint, and PDF skills as built-in Anthropic skills. |
| Skill recording | Claude docs describe recording a workflow in Claude for Mac/Cowork to generate a skill proposal. |
| Organization skill provisioning | Claude support docs describe owner-provisioned Team/Enterprise skills and skill sharing. |
| Claude artifacts | Claude has a distinct artifact model and artifact-building skills. Keep those Claude-specific. |

## Covered By Codex More Explicitly

| Area | Notes |
|---|---|
| Hooks | Codex has a detailed hook lifecycle with review/trust behavior and hook discovery in `.codex/` and user config. |
| Repo-local skill loading | Codex documents `.agents/skills` lookup from CWD to repo root plus user/admin/system locations. |
| Plugin bundling | OpenAI docs emphasize plugins as the distribution unit for shared ChatGPT/Codex skills, MCP servers, hooks, and optional UI. |
| `agents/openai.yaml` | Codex/OpenAI skill structure includes optional OpenAI-specific agent appearance/dependencies. |

## Practical Decision

Create base skills in the open `SKILL.md` structure, keep platform-specific adapters thin, and avoid generic duplicates of document, browser, site, skill-creation, plugin-creation, and OpenAI/Claude API documentation capabilities.

Recommended split:

| Layer | Contents |
|---|---|
| `skills/base/*` | AI-agnostic reusable workflows and standards. |
| `skills/platform/claude/*` | Claude-only artifact, Claude API, Claude Code/plugin installation notes. |
| `skills/platform/codex/*` | Codex hooks, `.agents/skills` loading, `agents/openai.yaml`, plugin packaging. |
| `hooks/codex/*` | Deterministic Codex hook implementations. |
| `templates/*` | Skill, workflow, hook, and agent scaffolds. |

## Sources

- Anthropic Help Center, "What are skills?": https://support.claude.com/en/articles/12512176-what-are-skills
- Anthropic Help Center, "Use skills in Claude": https://support.claude.com/en/articles/12512180-use-skills-in-claude
- Anthropic Help Center, "How to create custom skills": https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- Anthropic Engineering, "Equipping agents for the real world with Agent Skills": https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic reference skills repo: `/Users/joerice/git/public-repos/sdlc-skills/start-here-official-anthropic-repo/anthropics-skills`
- OpenAI Learn, "Build skills": https://learn.chatgpt.com/docs/build-skills
- OpenAI Developers, "Skills - Plugins": https://developers.openai.com/plugins/concepts/skills
- OpenAI Developers, "Build skills - Plugins": https://developers.openai.com/plugins/build/skills
- OpenAI Learn, "Hooks": https://learn.chatgpt.com/docs/hooks
