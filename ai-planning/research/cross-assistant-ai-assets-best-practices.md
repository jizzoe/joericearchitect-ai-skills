# Cross-Assistant AI Asset Best Practices

Date: 2026-08-08

## Goal

Design skills, workflows, hooks, agents, and related assets that work across Claude and Codex without losing each platform's strengths.

## Current State

### The emerging common standard

The center of gravity is the open Agent Skills format: a directory with a `SKILL.md` file containing required metadata (`name`, `description`) and instructions, plus optional references, scripts, assets, and platform-specific metadata. Anthropic's docs describe this as an open standard, and OpenAI's docs say ChatGPT and Codex skills build on it.

The practical portability rule: write the core skill as assistant-neutral Markdown, then add platform adapters in separate folders.

### Claude current state

Claude publicly supports skills across Claude.ai, Claude Code, Claude Agent SDK, and the Claude Developer Platform. Public docs name built-in Anthropic skills for Excel, Word, PowerPoint, and PDF workflows, and the reference repo adds examples such as `skill-creator`, `webapp-testing`, `frontend-design`, and `mcp-builder`.

Claude-specific assets to isolate:

- Claude artifacts and artifact-builder workflows.
- Claude Code installation/plugin commands.
- Claude API guidance.
- Claude organization provisioning and skill sharing behavior.
- Claude skill recording workflow.

### OpenAI/Codex current state

OpenAI now documents skills as shared ChatGPT/Codex workflows. Codex loads local skills from `.agents/skills` from current working directory up to repo root, plus user/admin/system locations. OpenAI also documents plugins as distribution bundles for skills, MCP servers, hooks, and optional UI.

Codex-specific assets to isolate:

- `.agents/skills` loading and skill-selection budget constraints.
- `agents/openai.yaml`.
- Codex hooks in `.codex/hooks.json` or `config.toml`.
- Codex lifecycle events: `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `UserPromptSubmit`, and related events.
- Codex plugin packaging and trust/review flow for hooks.

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

### 10. Avoid installing giant catalogs wholesale

Large repos are useful for research, but a real working set should stay small. Too many skills degrade selection quality and context budget. Curate the base set and keep stack/repo overlays opt-in.

## Recommended Asset Types For This Repo

| Asset type | Use for | Location |
|---|---|---|
| Base skill | Reusable, assistant-neutral workflow | `skills/base/<name>/SKILL.md` |
| Stack skill | Language/framework-specific guidance | `skills/stacks/<stack>/<name>/SKILL.md` |
| Repo skill | Local codebase conventions | `skills/repo-specific/<repo>/<name>/SKILL.md` |
| Workflow | Multi-step command/process | `workflows/<name>/` |
| Hook | Deterministic enforcement | `hooks/codex/` and `hooks/claude/` |
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

## Sources

- Anthropic Help Center, "What are skills?": https://support.claude.com/en/articles/12512176-what-are-skills
- Anthropic Help Center, "Use skills in Claude": https://support.claude.com/en/articles/12512180-use-skills-in-claude
- Anthropic Help Center, "How to create custom skills": https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
- Anthropic Engineering, "Equipping agents for the real world with Agent Skills": https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- OpenAI Learn, "Build skills": https://learn.chatgpt.com/docs/build-skills
- OpenAI Developers, "Skills - Plugins": https://developers.openai.com/plugins/concepts/skills
- OpenAI Developers, "Build skills - Plugins": https://developers.openai.com/plugins/build/skills
- OpenAI Learn, "Hooks": https://learn.chatgpt.com/docs/hooks
