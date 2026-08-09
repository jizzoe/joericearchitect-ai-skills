# SDLC Skills Repo Review

Date: 2026-08-08

Scope: local clones under `/Users/joerice/git/public-repos/sdlc-skills`.

## Executive Synthesis

The strongest patterns are not "more skills." The strongest repos combine small triggerable skills, progressive disclosure, deterministic scripts/checks, and explicit pass/fail gates. For our base set, copy the patterns, not the whole catalogs.

Best sources to mine first:

| Priority | Repo | Why |
|---|---|---|
| 1 | `anthropics/skills` | Canonical open reference for `SKILL.md`, scripts, references, and document/tool workflows. |
| 2 | `spring-boot-skills` | Best focused technology-specific structure; explicitly supports Claude Code and Codex. |
| 3 | `awesome-skills/code-review-skill` | Best broad review workflow and severity taxonomy. |
| 4 | `spartan-ai-toolkit` | Best quality-gate and end-to-end workflow orchestration pattern. |
| 5 | `sethdford/claude-skills` | Best standards-grounded taxonomy and anti-pattern sections, but likely generated and shallow in places. |
| 6 | `metabase/metabase` | Best production example of repo-specific skills used in a real large codebase. |
| 7 | `grounded` + `research-mode` | Best narrow guardrail ideas. |

## Repo Reviews

### `anthropics/skills`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/start-here-official-anthropic-repo/anthropics-skills`
- Clone URL: `https://github.com/anthropics/skills.git`
- Local inventory: 18 `SKILL.md` files.
- Latest local commit: 2026-08-07.

Summary: Anthropic's official reference implementation for skills. Includes `skill-creator`, document skills (`docx`, `xlsx`, `pptx`, `pdf`), `frontend-design`, `webapp-testing`, `mcp-builder`, `claude-api`, and artifact/design examples.

Strengths to take:

- Canonical skill anatomy: concise metadata, procedural body, optional scripts/references/assets.
- Progressive disclosure done cleanly, especially in document skills.
- Deterministic helper scripts for file formats and testing workflows.
- `skill-creator` as an eval/optimization loop, not just a template generator.

Weaknesses to avoid:

- Several examples are Claude/artifact-specific and should not be copied into generic SDLC base skills.
- Document skills are complex; use as dependencies/patterns rather than reimplementing.

Useful base skills to copy/adapt:

- `skill-creator` pattern.
- `webapp-testing`.
- `frontend-design`.
- `mcp-builder`.
- `doc-coauthoring`.
- Document skill QA patterns from `docx`, `xlsx`, `pptx`, `pdf`.

Maturity/activity: mature reference repo, active as of 2026-08-07.

Security/guardrails: strong emphasis on scoped instructions and deterministic scripts; still requires trusted-source review for bundled scripts.

### `spring-boot-skills`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/java-spring-boot/spring-boot-skills`
- Clone URL: `https://github.com/rrezartprebreza/spring-boot-skills.git`
- Local inventory: 46 skills, two versions of 23 skills for Spring Boot 3 and 4.
- Latest local commit: 2026-08-07.

Summary: Focused, production-oriented Spring Boot skill catalog. Covers architecture, JPA, REST conventions, security JWT/OAuth2, Flyway, testing pyramid, transactions, Spring AI, MCP server, resilience, HATEOAS, Redis, batch, null safety, and versioning.

Strengths to take:

- Explicitly documents common AI failure modes in a stack.
- Versioned skill sets for platform major versions.
- Strong folder taxonomy by target runtime.
- Clear examples of how generic SDLC skills become stack-specific overlays.

Weaknesses to avoid:

- Duplicating full versioned trees creates maintenance cost.
- Some descriptions use folded YAML that needs normalization if reused across platforms.

Useful base skills to copy/adapt:

- `testing-pyramid`.
- `rest-api-conventions`.
- `spring-data-jpa`.
- `flyway-migrations`.
- `transactional-patterns`.
- `spring-security-jwt`.
- `mcp-server`.
- `hexagonal-architecture` / `layered-architecture`.

Maturity/activity: active and focused; relatively young but high-quality.

Security/guardrails: good stack-specific guardrails against invented APIs, wrong injection patterns, and outdated artifact names.

### `dr-jskill`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/java-spring-boot/dr-jskill`
- Clone URL: `https://github.com/jdubois/dr-jskill.git`
- Local inventory: 1 main skill plus references/scripts/assets.
- Latest local commit: 2026-06-21.

Summary: Opinionated agent skill for generating Spring Boot apps following Julien Dubois-style conventions. Uses start.spring.io, Java 25, PostgreSQL, Docker/native images, and selectable frontend options.

Strengths to take:

- A single end-to-end generator workflow with supporting references.
- Version manifest and scripts rather than hardcoding transient versions into prose.
- Clear admission that agent generation is not deterministic.

Weaknesses to avoid:

- Very opinionated generator workflows can be hard to reuse outside their target architecture.
- Recommended model and runtime details may become stale quickly.

Useful base skills to copy/adapt:

- Project generation workflow.
- Version manifest pattern.
- Docker/test/deployment reference split.

Maturity/activity: active experiment with strong author credibility.

Security/guardrails: useful through manifests and scripted generation, but generation output still needs human review.

### `jeffallan/claude-skills`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/java-spring-boot/jeffallan-claude-skills`
- Clone URL: `https://github.com/Jeffallan/claude-skills.git`
- Local inventory: 67 skills plus 9 workflow commands.
- Latest local commit: 2026-08-07.

Summary: Broad full-stack Claude skills repo. Covers languages, backend/frontend frameworks, infrastructure, APIs, testing, DevOps, security, data/ML, and platform specialists. Includes workflow commands for epics and Atlassian integration.

Strengths to take:

- Good "multi-skill workflow" mental model.
- Strong full-stack role taxonomy.
- Explicit project workflow lifecycle from discovery through retrospectives.
- `common-ground` context-engineering concept is worth copying.

Weaknesses to avoid:

- Broad catalog can become role/persona-heavy.
- Some workflows depend on Atlassian MCP and should be optional.
- Avoid creating "expert persona" skills where a checklist or reference would be enough.

Useful base skills to copy/adapt:

- `code-reviewer`.
- `debugging-wizard`.
- `feature-forge`.
- `test-master`.
- `secure-code-guardian`.
- `architecture-designer`.
- `spec-miner`.
- `java-architect` and `spring-boot-engineer` as examples for stack overlays.

Maturity/activity: active and maintained; looks like a real community/plugin project.

Security/guardrails: good use of verification commands and security reviewer concepts; must audit any workflow that calls external MCP tools.

### `piomin/claude-ai-spring-boot`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/java-spring-boot/claude-ai-spring-boot`
- Clone URL: `https://github.com/piomin/claude-ai-spring-boot.git`
- Local inventory: 5 visible skills plus Claude agents.
- Latest local commit: 2026-04-29.

Summary: Spring Boot application template optimized for Claude Code. Includes `.claude/agents`, `.claude/skills`, `CLAUDE.md`, and a Maven app skeleton.

Strengths to take:

- Shows how skills, agents, and project instructions work together in a real starter repo.
- Useful Java/Spring skills: clean code, design patterns, JPA, logging, Spring Boot.

Weaknesses to avoid:

- More template than portable skill library.
- `.claude`-specific layout needs adaptation for Codex/OpenAI.

Useful base skills to copy/adapt:

- `clean-code`.
- `java-code-review` / code-quality.
- `logging-patterns`.
- `jpa-patterns`.

Maturity/activity: active enough; mostly a template and blog companion.

Security/guardrails: includes security agent concepts, but less explicit enforcement than `spring-boot-skills` or `spartan`.

### `mindrally/skills`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/java-spring-boot/mindrally-skills`
- Clone URL: `https://github.com/mindrally/skills.git`
- Local inventory: 240 skills.
- Latest local commit: 2026-06-09.

Summary: Large conversion of Cursor rules into Claude Code `SKILL.md` files. Broad coverage across frontend, mobile, backend, cloud, languages, data, testing, and tools.

Strengths to take:

- Excellent raw catalog for technology checklist ideas.
- Consistent simple structure.
- Useful for initial coverage discovery.

Weaknesses to avoid:

- Converted rules are often generic; many are not workflow-complete.
- Little evidence of deep evaluation or deterministic verification.
- Broad catalogs can pollute skill matching if installed wholesale.

Useful base skills to copy/adapt:

- `general-best-practices`.
- `clean-architecture`.
- `ci-cd-best-practices`.
- `github-workflow`.
- `git-workflow`.
- Stack-specific rules only after review.

Maturity/activity: useful collection, but more aggregator/conversion than mature workflow library.

Security/guardrails: varies by source; treat as raw material.

### `mastering-typescript-skill`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/typescript-javascript/mastering-typescript-skill`
- Clone URL: `https://github.com/SpillwaveSolutions/mastering-typescript-skill.git`
- Local inventory: 1 skill.
- Latest local commit: 2025-12-31.

Summary: Single TypeScript 5.9+ skill covering type system mastery, enterprise patterns, Zod validation, React, NestJS, Vite, pnpm, ESLint, and Vitest.

Strengths to take:

- Clear scope and modern TypeScript defaults.
- Good strictness baseline: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Mentions multi-agent installer compatibility, including Codex.

Weaknesses to avoid:

- Single large skill may overload context.
- Version claims need regular verification.

Useful base skills to copy/adapt:

- TypeScript strictness baseline.
- Zod/API contract patterns.
- React/NestJS split into separate overlays.

Maturity/activity: older than the active repos; likely useful but requires version refresh.

Security/guardrails: type safety and validation are strengths; not a dedicated security workflow.

### `metabase/metabase`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/typescript-javascript/metabase`
- Clone URL: `https://github.com/metabase/metabase.git`
- Local inventory: 19 `.claude/skills` plus 4 additional `skills/*`.
- Latest local commit: 2026-08-08.

Summary: Real production codebase with repo-specific Claude skills. Skills include TypeScript review/write, Clojure review/write/eval, docs review/write, E2E tests, tracing, analytics events, mutation testing, Playwright MCP, serialization workflows, and UI-from-Figma.

Strengths to take:

- Best example of skills scoped to a real codebase instead of a marketplace catalog.
- Splits write/review/test workflows.
- Strong "no implicit/explicit `any`" style blocking rules in TypeScript review.
- Shows how repository conventions belong close to the repo.

Weaknesses to avoid:

- Highly Metabase-specific; copy patterns, not content.
- Full repo is heavyweight for skill research.

Useful base skills to copy/adapt:

- `typescript-review`.
- `typescript-write`.
- `docs-review`.
- `docs-write`.
- `e2e-test` / `e2e-test-review`.
- `mutation-testing`.
- `add-tracing`.

Maturity/activity: very mature, highly active production codebase.

Security/guardrails: strong review discipline; not primarily a security catalog.

### `everything-claude-code` / ECC

- Path: `/Users/joerice/git/public-repos/sdlc-skills/typescript-javascript/everything-claude-code`
- Clone URL: `https://github.com/affaan-m/everything-claude-code.git`
- Local inventory: 927 `SKILL.md` files across many harness directories.
- Latest local commit: 2026-08-07.

Summary: Large "agent harness operating system" with agents, skills, commands, hooks, rules, memory, continuous learning, and security scanning. Supports Claude best today, with Codex sync paths and adapters for other harnesses.

Strengths to take:

- Holistic lifecycle: plan -> test -> implement -> review -> verify -> remember -> improve.
- Cross-harness packaging ideas.
- Continuous learning and memory patterns.
- AgentShield/security scanning idea.
- Rich use of hooks and tests.

Weaknesses to avoid:

- Too broad for our base repo if copied wholesale.
- High churn and many assets make quality uneven.
- Some assets may be domain/business-specific rather than SDLC foundational.

Useful base skills to copy/adapt:

- `coding-standards`.
- `tdd-workflow`.
- `verification-loop`.
- `security-review`.
- `mcp-server-patterns`.
- `e2e-testing`.
- `documentation-lookup`.
- `repo-scan`.
- `continuous-learning-v2` as an idea, not a direct first copy.

Maturity/activity: extremely active; serious project, but noisy.

Security/guardrails: explicit official-source warnings, AgentShield, supply-chain workflows. Audit carefully before running bundled hooks/scripts.

### `claude-combine`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/typescript-javascript/claude-combine`
- Clone URL: `https://github.com/binyamineden/claude-combine.git`
- Local inventory: 39 skills plus hooks/rules.
- Latest local commit: 2026-06-29.

Summary: Aggregates patterns from `superpowers` and `everything-claude-code`: TDD, systematic debugging, planning, review, worktrees, continuous learning, hooks, rules, and productivity tooling.

Strengths to take:

- Strong workflow primitives: TDD, systematic debugging, planning, worktrees, code review.
- More digestible than ECC while retaining key ideas.
- Has hooks and explicit rules.

Weaknesses to avoid:

- Aggregator provenance needs scrutiny.
- Some skills force invocation too aggressively.

Useful base skills to copy/adapt:

- `test-driven-development`.
- `systematic-debugging`.
- `writing-plans`.
- `executing-plans`.
- `requesting-code-review`.
- `receiving-code-review`.
- `verification-before-completion`.
- `using-git-worktrees`.

Maturity/activity: active aggregator; useful but audit before adoption.

Security/guardrails: contains `security-scan`; hooks should be reviewed before enabling.

### `awesome-skills/code-review-skill`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/code-review-design-review/code-review-skill`
- Clone URL: `https://github.com/awesome-skills/code-review-skill.git`
- Local inventory: 1 skill with large reference tree.
- Latest local commit: 2026-07-16.

Summary: Comprehensive modular code review skill covering many languages/frameworks with architecture, security, performance, quality, and language-specific references.

Strengths to take:

- Four-phase review process: context, high-level, line-by-line, summary/decision.
- Severity taxonomy: blocking, important, nit, suggestion, learning, praise.
- Progressive disclosure with language-specific references.
- Treats review as mentoring and quality control.

Weaknesses to avoid:

- Single skill can be large; split into base review plus language overlays.
- Some tone markers may be too casual for strict engineering contexts.

Useful base skills to copy/adapt:

- Base code review workflow.
- Severity labels.
- PR analyzer script idea.
- Security/performance/architecture reference split.

Maturity/activity: active, focused, high-value.

Security/guardrails: strong review security checklist; still needs repo-specific threat models.

### `spartan-ai-toolkit`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/code-review-design-review/spartan-ai-toolkit`
- Clone URL: `https://github.com/spartan-stratos/spartan-ai-toolkit.git`
- Local inventory: 61 skills across `.codex/skills` and toolkit skills, plus commands, rules, agents, stack profiles, quality gates.
- Latest local commit: 2026-06-18.

Summary: Structured AI coding toolkit built around quality gates. Includes slash-command workflows, coding rules, stack profiles, domain skills, agents, and memory.

Strengths to take:

- Quality gates in strict order: spec/design/plan/TDD/review/PR.
- Stack profiles and rules as configurable layers.
- Separates workflow leaders from underlying skills.
- Good candidate model for our base workflow architecture.

Weaknesses to avoid:

- Some skills are startup/content/business oriented, not SDLC base.
- Opinionated command surface may not map directly across Claude and Codex.

Useful base skills to copy/adapt:

- Build/debug workflow gate model.
- `browser-qa`.
- `security-checklist`.
- `testing-strategies`.
- `terraform-review`.
- `ci-cd-patterns`.
- Stack profile concept.

Maturity/activity: mature and actively released.

Security/guardrails: strongest deterministic workflow gating pattern in the set.

### `microsoft/win-dev-skills`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/code-review-design-review/win-dev-skills`
- Clone URL: `https://github.com/microsoft/win-dev-skills.git`
- Local inventory: 9 skills.
- Latest local commit: 2026-07-21.

Summary: Microsoft plugin for WinUI 3 and Windows App SDK development, covering setup, design, dev workflow, code review, UI testing, WPF migration, packaging, session reports, and PR review.

Strengths to take:

- Good plugin packaging example spanning GitHub Copilot, Claude Code, OpenAI Codex, and OpenClaw.
- Preview warning and release pinning guidance are excellent.
- Shows where Codex lacks agent concepts and how skills still remain useful.

Weaknesses to avoid:

- Highly Windows/WinUI-specific.
- Preview status means names/layouts may change.

Useful base skills to copy/adapt:

- `pr-review`.
- Session report pattern.
- Setup prerequisite checklist pattern.
- Packaging/deployment readiness pattern.

Maturity/activity: active, Microsoft-owned, preview-stage.

Security/guardrails: explicit human review warnings; setup commands require care due to installs/UAC.

### `research-mode`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/ai-guardrails-anti-hallucination-fact-grounding/research-mode`
- Clone URL: `https://github.com/assafkip/research-mode.git`
- Local inventory: 1 skill.
- Latest local commit: 2026-04-03.

Summary: Anti-hallucination research toggle enforcing source grounding, citation discipline, "I don't know" behavior, and quote-first analysis.

Strengths to take:

- Clear source cascade: local files -> search snippets -> fetched pages -> scholar.
- Explicit token/search budget.
- Separates research mode from creative mode.

Weaknesses to avoid:

- Quote-first can be overkill for every workflow.
- Claude-specific install commands.

Useful base skills to copy/adapt:

- `base-grounded-research`.
- Source cascade and budget policy.
- Uncertainty/claim retraction rules.

Maturity/activity: small, focused, useful.

Security/guardrails: strong epistemic guardrails; not a code security tool.

### `grounded`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/ai-guardrails-anti-hallucination-fact-grounding/grounded`
- Clone URL: `https://github.com/Pinperepette/grounded.git`
- Local inventory: no `SKILL.md`; hook/config style guardrail project.
- Latest local commit: 2026-04-25.

Summary: Guardrail project enforcing read-before-edit, real file verification, deterministic tool usage, and loop prevention.

Strengths to take:

- Strong premise: codebase facts must be verified, not inferred.
- "Confirmed not found" and loop prevention are high-value guardrails.
- Useful as hook inspiration.

Weaknesses to avoid:

- Rhetorical README; implementation quality needs closer audit before adoption.
- Claude-oriented; no direct Codex hook mapping without adaptation.

Useful base assets to copy/adapt:

- Read-before-edit hook.
- Search result ledger.
- Tool-loop breaker.
- "Do not reuse confirmed not-found identifiers" rule.

Maturity/activity: small project; promising guardrail ideas.

Security/guardrails: this is the main value of the repo.

### `sethdford/claude-skills`

- Path: `/Users/joerice/git/public-repos/sdlc-skills/ai-guardrails-anti-hallucination-fact-grounding/sethdford-claude-skills`
- Clone URL: `https://github.com/sethdford/claude-skills.git`
- Local inventory: 454 skills and 173 commands across 57 plugins.
- Latest local commit: 2026-03-11.

Summary: Large PDLC role collection across architect, engineer, product manager, tech lead, security, designer, QA engineer, and SDLC. Claims alignment to SWEBOK, TOGAF, OWASP, ISTQB, NIST, ISO standards, and other bodies of knowledge.

Strengths to take:

- Best taxonomy for role/domain organization.
- Every skill aims to produce a concrete artifact.
- Anti-pattern sections are a strong design pattern.
- Standards mapping is exactly the kind of grounding we want.

Weaknesses to avoid:

- Only 3 commits locally; likely generated in bulk.
- Standards alignment should be verified per skill before trusting.
- Many skills are artifact templates, not executable workflows.

Useful base skills to copy/adapt:

- ADR / architecture decision record.
- Threat modeling family: STRIDE, trust boundaries, risk scoring, attack trees.
- TDD, code quality, debugging, root-cause analysis.
- PRD, user stories, acceptance criteria.
- QA/test strategy and defect triage.

Maturity/activity: broad and ambitious, but less evidence of iterative refinement.

Security/guardrails: strong conceptual security taxonomy; verify details against current standards before using.

## Cross-Repo Best Practices

1. Keep base skills small and triggerable. Use references for details.
2. Split nouns and verbs: skills hold domain knowledge; commands/workflows sequence work.
3. Build overlays: base SDLC -> language/framework -> repo-specific conventions.
4. Use deterministic scripts for parsing, validation, rendering, and checks.
5. Require evidence for claims: file path, command output, test result, source URL, or explicit uncertainty.
6. Use quality gates: spec -> plan -> test -> implementation -> review -> verification -> handoff.
7. Treat hooks as enforcement, not guidance. Use them for read-before-edit, secret checks, loop detection, and final validation.
8. Use severity labels consistently in reviews.
9. Prefer installed platform skills for documents, PDFs, sites, browsers, and skill creation.
10. Do not install large aggregators wholesale. Curate a small base set and keep noisy catalogs as research material.

## Recommended Directory Structure

```text
.
├── AGENTS.md
├── README.md
├── ai-planning/
│   ├── prompts/
│   └── research/
├── skills/
│   ├── base/
│   │   ├── skill-authoring/
│   │   ├── grounded-research/
│   │   ├── code-review/
│   │   ├── systematic-debugging/
│   │   ├── test-driven-development/
│   │   ├── verification-loop/
│   │   ├── architecture-decision-record/
│   │   ├── threat-modeling/
│   │   └── mcp-workflow-design/
│   ├── stacks/
│   │   ├── java-spring/
│   │   ├── typescript/
│   │   ├── frontend-react/
│   │   └── data/
│   ├── repo-specific/
│   └── platform/
│       ├── claude/
│       └── codex/
├── workflows/
│   ├── build-feature/
│   ├── debug-defect/
│   ├── review-pr/
│   ├── plan-implementation/
│   └── release-handoff/
├── hooks/
│   ├── codex/
│   └── claude/
├── agents/
│   ├── reviewers/
│   ├── researchers/
│   ├── implementers/
│   └── platform/
├── templates/
│   ├── skill/
│   ├── workflow/
│   ├── hook/
│   └── agent/
├── scripts/
│   ├── validate-skill-frontmatter/
│   ├── inventory-skills/
│   └── check-links/
└── evals/
    ├── skills/
    └── workflows/
```

## Suggested Base Skill Build Order

1. `skill-authoring`
2. `grounded-research`
3. `code-review`
4. `systematic-debugging`
5. `test-driven-development`
6. `verification-loop`
7. `implementation-planning`
8. `architecture-decision-record`
9. `threat-modeling`
10. `mcp-workflow-design`
11. `typescript-review`
12. `java-spring-review`

## Source Material

- Local clones under `/Users/joerice/git/public-repos/sdlc-skills`.
- Repo metadata gathered with local `git log`, `git rev-list`, `find`, and `rg`.
- Public platform docs cited in `builtin-ai-assets-claude-vs-codex.md` and `cross-assistant-ai-assets-best-practices.md`.
