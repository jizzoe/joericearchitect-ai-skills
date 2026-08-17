# Cross-Assistant AI Asset Best Practices

Date: 2026-08-08
Last audited: 2026-08-15 — see [Audit Notes](#audit-notes-2026-08-15) for corrections and additions from this pass.

## Goal

Design skills, workflows, hooks, agents, and related assets that work across Claude and Codex without losing each platform's strengths.

## Current State

### The instruction-file layer: AGENTS.md and CLAUDE.md

This is a different, more foundational layer than skills, and the original
pass of this document omitted it. Get this wrong and every downstream skill
and workflow loses its repo-level grounding for one of the two assistants.

- `AGENTS.md` is an open, assistant-neutral standard: a plain Markdown
  "README for agents" at the **repository root** (`AGENTS.md`, not inside any
  subdirectory). It was formalized as a spec in August 2025 with OpenAI,
  Google, Cursor, and Factory participating, and donated to the Linux
  Foundation's Agentic AI Foundation in December 2025. As of the standard's
  own numbers, 60,000+ repos and 20+ tools — Codex, Cursor, GitHub Copilot,
  Gemini CLI, Aider, Windsurf, Zed — read it natively.
- **Correction to a common misconception**: `AGENTS.md` does not live at
  `.agents/AGENTS.md`. The `.agents/` directory is a separate, Codex-specific
  convention used only for **skill discovery** (`.agents/skills`, walked from
  cwd up to repo root, plus `$HOME/.agents/skills`, admin, and system
  locations). The two conventions are unrelated: `.agents/skills/*` holds
  skill packages; `AGENTS.md` is a single root-level instructions file.
  Conflating the two paths produces a file Codex won't discover as
  instructions and Claude won't discover at all.
- Claude Code does **not** read `AGENTS.md` natively — confirmed directly
  against Anthropic's current docs. It reads `CLAUDE.md` (root, or
  `.claude/CLAUDE.md`; both are equivalent). The officially documented way to
  keep one source of truth is to make `CLAUDE.md` import `AGENTS.md`:

  ```markdown
  @AGENTS.md

  ## Claude Code
  <Claude-only additions, if any, go here>
  ```

  A plain `ln -s AGENTS.md CLAUDE.md` symlink also works if there is no
  Claude-specific content to add, but it requires Administrator privileges or
  Developer Mode on Windows, so the `@AGENTS.md` import is the more portable
  default. Either way, `AGENTS.md` stays canonical and `CLAUDE.md` stays a
  thin pointer — the same base → thin-adapter pattern this document already
  recommends for skills.
- **This repo today**: `AGENTS.md` exists at the repo root (correct
  location), but there is no `CLAUDE.md` anywhere in the tree. Practically,
  Claude Code sessions in this repo load zero automatic repo-root guidance —
  the `AGENTS.md` content Codex reads on every session is invisible to
  Claude. Adding a root `CLAUDE.md` containing `@AGENTS.md` (plus any
  Claude-only notes) closes this gap without duplicating content.

### The emerging common standard

The center of gravity is the open Agent Skills format: a directory with a `SKILL.md` file containing required metadata (`name`, `description`) and instructions, plus optional references, scripts, assets, and platform-specific metadata. Anthropic's docs describe this as an open standard, and OpenAI's docs say ChatGPT and Codex skills build on it.

The practical portability rule: write the core skill as assistant-neutral Markdown, then add platform adapters in separate folders.

### Claude current state

Claude publicly supports skills across Claude.ai, Claude Code, Claude Agent SDK, and the Claude Developer Platform. Public docs name built-in Anthropic skills for Excel, Word, PowerPoint, and PDF workflows, and the reference repo adds examples such as `skill-creator`, `webapp-testing`, `frontend-design`, and `mcp-builder`.

Claude Code loads skills from `.claude/skills/` (project) and `~/.claude/skills/` (personal); these are the direct counterpart to Codex's `.agents/skills` hierarchy and are the paths this repo's `.claude/skills/*` thin adapters already target correctly.

Claude-specific assets to isolate:

- Claude artifacts and artifact-builder workflows.
- Claude Code installation/plugin commands.
- Claude API guidance.
- Claude organization provisioning and skill sharing behavior.
- Claude skill recording workflow.
- `CLAUDE.md` (root or `.claude/CLAUDE.md`) plus `.claude/rules/` for
  path-scoped instructions — the Claude counterpart to `AGENTS.md`; see
  [instruction-file layer](#the-instruction-file-layer-agentsmd-and-claudemd)
  above.
- Claude Code hooks, configured under the `hooks` key in
  `.claude/settings.json` (or the user/local/managed variants) — not a
  standalone hooks file the way Codex uses one.

### OpenAI/Codex current state

OpenAI now documents skills as shared ChatGPT/Codex workflows. Codex loads local skills from `.agents/skills` from current working directory up to repo root, plus user/admin/system locations. OpenAI also documents plugins as distribution bundles for skills, MCP servers, hooks, and optional UI.

Codex-specific assets to isolate:

- `.agents/skills` loading and skill-selection budget constraints. This is a
  skill-discovery path only — it is unrelated to where the root `AGENTS.md`
  instructions file lives; see
  [instruction-file layer](#the-instruction-file-layer-agentsmd-and-claudemd).
- `agents/openai.yaml`.
- Codex hooks in `.codex/hooks.json` or `config.toml`.
- Codex plugin packaging and trust/review flow for hooks.

**Hook vocabulary has converged, hook config has not.** As of the 2026 Codex
hooks system, both Codex and Claude Code use the same lifecycle event names —
`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`,
`PermissionRequest`, `PreCompact`/`PostCompact`, `SubagentStart`/`SubagentStop`,
`Stop` — so a workflow described in terms of these events ports across both
assistants conceptually. What does **not** port is the config location and
enforcement model: Codex reads `.codex/hooks.json` / `config.toml` and layers
its lifecycle hooks on top of OS-level sandboxing (Seatbelt, Landlock,
seccomp) as the primary enforcement boundary; Claude Code reads the `hooks`
key inside `.claude/settings.json` (merged across user/project/local/managed
scopes) with no equivalent OS-level sandbox by default. Treat the event names
as the shared vocabulary and the config file plus enforcement layer as the
platform adapter.

## Best Practices

### 1. Write for progressive disclosure

Keep `SKILL.md` short enough to be read quickly. Put specialized detail in `references/`, deterministic logic in `scripts/`, templates in `assets/`, and platform-specific instructions in `platform/`.

Recommended skill shape:

```text
my-skill/
├── SKILL.md
├── references/
│   ├── decision-rules.md
│   └── examples.md
├── scripts/
│   └── validate-output.sh
├── assets/
│   └── template.md
└── platform/
    ├── claude.md
    └── codex.md
```

### 2. Make descriptions operational

The `description` is the trigger. It should say what the skill does, when to use it, and when not to use it. Avoid vague descriptions like "helps with backend work."

Good:

```yaml
description: Review TypeScript changes for type safety, explicit any usage, async error handling, API contract drift, and missing tests. Use for PR review or local diff review.
```

Weak:

```yaml
description: TypeScript expert.
```

### 3. Separate reusable knowledge from executable enforcement

Skills should explain the workflow. Hooks should enforce non-negotiable constraints. Scripts should do deterministic parsing/checking.

Examples:

| Need | Best asset |
|---|---|
| Teach review process | Skill |
| Require read-before-edit | Hook |
| Parse a PR diff | Script |
| Chain plan -> test -> implement -> review | Workflow/command |
| Use Jira/Linear/GitHub APIs | MCP server plus skill |
| Specialized independent review | Agent/subagent |

### 4. Build base -> stack -> repo overlays

Do not create one giant "software engineering" skill.

Use layered specialization:

```text
base/code-review
stacks/typescript/typescript-review
stacks/java-spring/spring-review
repo-specific/my-service/review-conventions
```

The base skill defines review phases and severity labels. The stack skill adds language/framework hazards. The repo-specific skill adds local architecture and commands.

### 5. Use quality gates, not vibes

A good workflow has explicit gates:

1. Task understood.
2. Relevant files/sources read.
3. Plan written.
4. Tests or verification strategy identified.
5. Change implemented.
6. Local checks run or blocked reason documented.
7. Review performed.
8. Final evidence reported.

Each gate should have a pass/fail condition. If there is no objective evidence, the assistant should say so.

### 6. Make epistemic guardrails first-class

For research and codebase analysis:

- Prefer local files and primary sources.
- Record confirmed-not-found identifiers.
- Do not reuse facts that were not verified.
- Separate direct evidence from inference.
- Use "unknown" when evidence is missing.
- Cite file paths, command outputs, URLs, issue IDs, or docs.

### 7. Keep MCP boundaries clean

MCP servers provide data, authentication, authorization, and controlled actions. Skills provide workflow: which tools to call, in what order, how to handle incomplete results, and what output to produce.

Do not bury credentials, tokens, endpoint assumptions, or irreversible actions inside a skill. Put those in MCP/tool configuration and require explicit approval for risky actions.

### 8. Treat scripts as supply-chain risk

Before installing or running third-party skills:

- Read `SKILL.md`.
- Inspect `scripts/`, hooks, manifests, package files, and network calls.
- Check dependencies and install commands.
- Prefer read-only first runs.
- Pin versions for organization-wide distribution.

### 9. Evaluate skills with representative tasks

Every serious base skill should include examples or evals:

```text
evals/skills/code-review/
├── fixture-small-diff.md
├── fixture-security-bug.md
├── expected-findings.md
└── rubric.md
```

Evaluate for:

- Correct trigger behavior.
- Avoiding false invocation.
- Correct evidence gathering.
- Output format consistency.
- Failure/stop behavior.
- Token efficiency.

### 10. Keep AGENTS.md canonical and make CLAUDE.md a thin import

Apply the same base → thin-adapter pattern used for skills to the
instruction-file layer:

- Write repo guidance once, in root `AGENTS.md`.
- Give Claude Code a root `CLAUDE.md` whose first line is `@AGENTS.md`, with
  any Claude-only instructions (plan-mode triggers, artifact rules, hook
  notes) added below the import.
- Do not hand-duplicate `AGENTS.md` content into `CLAUDE.md` — duplication is
  exactly the drift risk this document flags for skills, and it applies
  identically here.
- Treat a repo with `AGENTS.md` but no `CLAUDE.md` (or vice versa) as an
  incomplete cross-tool setup, not a stylistic choice: one assistant is
  silently running without repo-level guidance.

### 11. Avoid installing giant catalogs wholesale

Large repos are useful for research, but a real working set should stay small. Too many skills degrade selection quality and context budget. Curate the base set and keep stack/repo overlays opt-in.

## Recommended Asset Types For This Repo

| Asset type | Use for | Location |
|---|---|---|
| Instruction file | Repo-wide guidance, both assistants | `AGENTS.md` (root, canonical) + `CLAUDE.md` (root, `@AGENTS.md` import) |
| Base skill | Reusable, assistant-neutral workflow | `skills/base/<name>/SKILL.md` |
| Stack skill | Language/framework-specific guidance | `skills/stacks/<stack>/<name>/SKILL.md` |
| Repo skill | Local codebase conventions | `skills/repo-specific/<repo>/<name>/SKILL.md` |
| Skill adapter | Per-assistant discovery pointer, not canonical | `.agents/skills/<name>/SKILL.md` (Codex) and `.claude/skills/<name>/SKILL.md` (Claude) |
| Workflow | Multi-step command/process | `workflows/<name>/` |
| Hook | Deterministic enforcement | `hooks/codex/` and `hooks/claude/` as a source-controlled staging area; deployed to `.codex/hooks.json`/`config.toml` (Codex) and the `hooks` key in `.claude/settings.json` (Claude) — neither tool scans a repo `hooks/` folder directly |
| Agent | Specialized independent context | `agents/<role>/` |
| Template | Repeatable artifact scaffold | `templates/<type>/` |
| Eval | Regression test for skill behavior | `evals/skills/<name>/` |

## Suggested Initial Base Assets

| Asset | Why |
|---|---|
| `base/skill-authoring` | Foundation for all future skills; incorporates trigger design, progressive disclosure, references/scripts/assets, and evals. |
| `base/grounded-research` | Prevents hallucinated facts and forces source discipline. |
| `base/code-review` | Common SDLC need across every stack. |
| `base/systematic-debugging` | Prevents speculative fixes. |
| `base/test-driven-development` | Gives implementation a verifiable loop. |
| `base/verification-loop` | Ensures final answers include evidence and known gaps. |
| `base/implementation-planning` | Separates discovery and design from edits. |
| `base/security-review` | Early threat and secure-code lens. |
| `base/mcp-workflow-design` | Keeps tool access and workflow logic separated. |
| `base/architecture-decision-record` | Captures decisions and tradeoffs as durable artifacts. |

## OpenAI Initiative: Current State

OpenAI's current direction is to make ChatGPT and Codex extensible through a shared plugin and skill ecosystem:

- Skills are reusable workflows for ChatGPT and Codex.
- Plugins are the distribution layer for skills, MCP servers, hooks, and optional UI.
- Codex supports repo-local skills and user/admin/system skills.
- Codex has first-class lifecycle hooks for deterministic enforcement.
- OpenAI docs explicitly position skills as complementary to MCP: MCP provides tools/data/actions, skills provide repeatable procedure around them.
- The public docs emphasize `$skill-creator` / `@skill-creator` as the built-in way to create a skill.

Strategic implication for this repo: keep the core assets open-standard and assistant-neutral, but maintain Codex adapters for hooks, plugins, and `.agents/skills` packaging.

## Claude Initiative: Current State

Anthropic's current direction is to make skills a broad context/workflow packaging format:

- Skills are available across Claude.ai, Claude Code, Agent SDK, and Developer Platform.
- Built-in Anthropic skills cover document creation/manipulation for Excel, Word, PowerPoint, and PDF.
- The Skills Directory includes partner skills that pair with MCP connectors.
- Team/Enterprise can provision and share skills.
- Claude for Mac/Cowork can record workflows and propose skills.
- Anthropic emphasizes progressive disclosure, deterministic scripts, eval-driven skill development, and trusted-source review.

Strategic implication for this repo: keep Claude artifact and document workflows as platform-specific overlays, while using the shared `SKILL.md` model for base assets.

## Audit Notes (2026-08-15)

This pass validated the document against current public documentation and
corrected/added the following:

1. **Corrected**: `AGENTS.md` does not live at `.agents/AGENTS.md`. It is a
   root-level file. `.agents/` is a Codex-only convention for skill
   discovery (`.agents/skills`) and was never a location for the
   instructions file itself. This document's original text did not make the
   claim, but it also never addressed the instruction-file layer at all,
   which left room for the conflation.
2. **Added**: the entire instruction-file layer (`AGENTS.md`/`CLAUDE.md`) was
   missing from the prior version. Added a dedicated subsection, a best
   practice (#10), and a table row, sourced directly against Anthropic's
   current memory docs.
3. **Confirmed**: Claude Code does not read `AGENTS.md` natively; the
   Anthropic-documented fix is a `@AGENTS.md` import at the top of
   `CLAUDE.md` (preferred) or a symlink (Windows-unfriendly).
4. **Confirmed**: Claude Code's own skill directories are `.claude/skills/`
   (project) and `~/.claude/skills/` (personal) — added explicitly so the
   Codex/Claude skill-path comparison in this doc is symmetric.
5. **Updated**: Codex's hook lifecycle event names have converged with
   Claude Code's (`PreToolUse`, `PostToolUse`, `SessionStart`,
   `UserPromptSubmit`, `Stop`, plus compact/subagent events on both sides) as
   of the 2026 Codex hooks system. The previous version implied these names
   were Codex-specific; they are now shared vocabulary. What remains
   platform-specific is the config file location and enforcement model, not
   the event names.
6. **Repo finding to carry into the next audit**: this repository has a root
   `AGENTS.md` but no `CLAUDE.md` anywhere, so Claude Code sessions currently
   load no automatic repo-root guidance. Flag this as a concrete gap in the
   follow-up inventory task, not just a documentation nicety.

## Sources

- Anthropic Help Center, "What are skills?": https://support.claude.com/en/articles/12512176-what-are-skills
- Anthropic Help Center, "Use skills in Claude": https://support.claude.com/en/articles/12512180-use-skills-in-claude
- Anthropic Help Center, "How to create custom skills": https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- Anthropic Engineering, "Equipping agents for the real world with Agent Skills": https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Claude Code Docs, "Extend Claude with skills": https://code.claude.com/docs/en/skills
- Claude Code Docs, "How Claude remembers your project" (CLAUDE.md, imports, AGENTS.md interop): https://code.claude.com/docs/en/memory
- Claude Code Docs, "Hooks reference": https://code.claude.com/docs/en/hooks
- OpenAI Learn, "Build skills": https://learn.chatgpt.com/docs/build-skills
- OpenAI Developers, "Skills - Plugins": https://developers.openai.com/plugins/concepts/skills
- OpenAI Developers, "Build skills - Plugins": https://developers.openai.com/plugins/build/skills
- OpenAI Developers, "Build skills" (Codex, `.agents/skills` discovery hierarchy): https://developers.openai.com/codex/skills
- OpenAI Learn, "Hooks": https://learn.chatgpt.com/docs/hooks
- AGENTS.md open specification (Linux Foundation Agentic AI Foundation): https://agents.md
- agentskills.io, Agent Skills open standard and specification: https://agentskills.io
