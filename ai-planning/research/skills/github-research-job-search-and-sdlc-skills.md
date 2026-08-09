# GitHub Research: Job Search Automation & SDLC Foundational Skills

_Captured 2026-08-06, part of the "Automated Job Search Workflow" thread. Curated from broader web research — not exhaustive, but a starting shortlist to study/fork from when actually building. Updated to include repo homepage + clone URL for every confirmed repo._

---

## Track 1: Job Search / Lead-Gen / Application Automation

### Purpose-built job search agents (most directly relevant)

| Repo | Homepage | Clone URL | Why it's worth studying |
|---|---|---|---|
| `theaayushstha1/job-applier-agent` | [Repo](https://github.com/theaayushstha1/job-applier-agent) | `https://github.com/theaayushstha1/job-applier-agent.git` | Full pipeline (resumes, cover letters, recruiter outreach, ATS optimization, interview prep, analytics). Privacy-conscious: no credentials stored, uses existing Gmail/LinkedIn browser sessions, requires confirmation before submitting/sending anything |
| `suxrobGM/jobpilot` | [Repo](https://github.com/suxrobgm/jobpilot) | `https://github.com/suxrobgm/jobpilot.git` | Searches boards, tailors resume per posting, fills applications, messages recruiters, tracks status on a dashboard. Runs on your existing Claude Code/Codex subscription; drives a real, visible browser you can watch |
| `neonwatty/job-apply-plugin` | [Repo](https://github.com/neonwatty/job-apply-plugin) | `https://github.com/neonwatty/job-apply-plugin.git` | Fills applications across LinkedIn Easy Apply, Greenhouse, Ashby, Lever, Rippling, Workday. "Confidence-aware answer reuse" flags inferred/sensitive answers for review rather than auto-submitting blindly — good reference for a cautious, human-in-the-loop design |
| `MadsLorentzen/ai-job-search` | [Repo](https://github.com/MadsLorentzen/ai-job-search) | `https://github.com/MadsLorentzen/ai-job-search.git` | Fit evaluation, drafter-reviewer application pipeline, interview prep. Core workflow explicitly language/country-agnostic — built for Denmark but meant to be forked; useful architecture reference even rebuilding search sources for US boards |
| `proficientlyjobs/proficiently-claude-skills` | [Repo](https://github.com/proficientlyjobs/proficiently-claude-skills) | `https://github.com/proficientlyjobs/proficiently-claude-skills.git` | Job search, resume tailoring, cover letters. Built as a Cowork plugin (not raw Claude Code); includes a Telegram bot mode — text a job URL from your phone to trigger the workflow remotely |

### Lead-gen / outreach / tracking patterns (same shape, broader use)

| Repo | Homepage | Clone URL | Why it's worth studying |
|---|---|---|---|
| `aiagentwithdhruv/skills` | [Repo](https://github.com/aiagentwithdhruv/skills) | `https://github.com/aiagentwithdhruv/skills.git` | 38 skills incl. `scrape-leads`, email automation, browser automation with anti-detection. Good reference for the "find leads" half of the workflow, decoupled from job-search framing specifically |

**Two items below could not be traced to a single confirmed repo** — they surfaced as descriptions within GitHub topic-page search results, and I don't have a verified owner/repo name for either. Rather than guess at a URL, here's the topic page to browse directly:

- A small bundle of 4 LinkedIn skills (outreach, high-intent lead scoring, feed engagement, profile enrichment) on a LinkedIn MCP server — browse: [`github.com/topics/linkedin-outreach`](https://github.com/topics/linkedin-outreach)
- A minimal job-tracking workspace (tracker CRUD + discovery + first-degree-only LinkedIn outreach via Claude in Chrome, replies/follow-ups deliberately manual) — this is the closest match to your stated risk tolerance, worth finding — browse: [`github.com/topics/lead-generation`](https://github.com/topics/lead-generation)

### Honest caveat

Several of these — especially the full "auto-apply to 100+ jobs" tools — brush up against LinkedIn's and various ATS platforms' Terms of Service around automated access. A few repos say so explicitly in their own docs ("automated access is against LinkedIn's ToS, keep volume low"). Worth reading each repo's own disclaimers before adopting patterns from it, independent of the technical value of studying its architecture.

---

## Track 2: SDLC Foundational Skills

### Start here — official Anthropic repo

| Repo | Homepage | Clone URL | Notes |
|---|---|---|---|
| `anthropics/skills` | [Repo](https://github.com/anthropics/skills) | `https://github.com/anthropics/skills.git` | 167k stars, Anthropic's own reference implementation. Includes `skill-creator` (the actual skill-authoring skill — teaches the SKILL.md format, includes an automated eval/optimization loop for testing skill descriptions), plus `mcp-builder`, `frontend-design`, `webapp-testing`, and the production document skills (docx/pdf/pptx/xlsx) that power Claude.ai itself. **Read this one first** — everything else follows its conventions |

### Java / Spring Boot

| Repo | Homepage | Clone URL | Notable detail |
|---|---|---|---|
| `rrezartprebreza/spring-boot-skills` | [Repo](https://github.com/rrezartprebreza/spring-boot-skills) | `https://github.com/rrezartprebreza/spring-boot-skills.git` | Opinionated, production-grade; explicitly documents common AI failure modes in Spring Boot (field injection instead of constructor injection, invented exception hierarchies, hallucinated pre-GA Maven artifact names) |
| `jdubois/dr-jskill` | [Repo](https://github.com/jdubois/dr-jskill) | `https://github.com/jdubois/dr-jskill.git` | Spring Boot-focused, referenced as a solid baseline in multiple write-ups |
| `Jeffallan/claude-skills` | [Repo](https://github.com/Jeffallan/claude-skills) | `https://github.com/Jeffallan/claude-skills.git` | (java-architect skill) Ties skill steps to actual verification commands (`./mvnw verify`, coverage thresholds via JaCoCo) rather than just describing conventions |
| `piomin/claude-ai-spring-boot` | [Repo](https://github.com/piomin/claude-ai-spring-boot) | `https://github.com/piomin/claude-ai-spring-boot.git` | Includes a dedicated code-quality/review skill combining clean-code principles with Java specifics |
| `mindrally/skills` | [Repo](https://github.com/mindrally/skills) | `https://github.com/mindrally/skills.git` | (java-spring-development skill) 213 stars, actively maintained, Spring Boot 3.x / Java 17+ features (records, sealed classes, pattern matching) |

### TypeScript / JavaScript

| Repo | Homepage | Clone URL | Notable detail |
|---|---|---|---|
| `SpillwaveSolutions/mastering-typescript-skill` | [Repo](https://github.com/SpillwaveSolutions/mastering-typescript-skill) | `https://github.com/SpillwaveSolutions/mastering-typescript-skill.git` | TS 5.9+, generics/mapped types/conditional types, React + NestJS integration |
| `metabase/metabase` | [Repo](https://github.com/metabase/metabase) ([skill file directly](https://github.com/metabase/metabase/blob/master/.claude/skills/typescript-review/SKILL.md)) | `https://github.com/metabase/metabase.git` | A real production example, not a demo — a large open-source codebase's actual enforced standard (in `.claude/skills/typescript-review`), including a hard "no implicit/explicit `any`" blocking rule. Note: cloning the full Metabase repo is heavyweight just to read one skill file — the direct file link may be more practical |

**One item below could not be traced to a single confirmed repo:** cross-stack coding-standards skill (naming, immutability, error handling, async/await for TS/JS/React/Node), seen referenced under both an "everything-claude-code" listing and a "binyamineden-claude-combine" aggregator listing on a third-party skills marketplace site, with inconsistent star counts between the two — likely the same skill mirrored/forked, but I can't confirm the canonical source repo. Worth searching GitHub directly for "everything-claude-code coding-standards" if you want to track down the original.

### Code review / design review

| Repo | Homepage | Clone URL | Notable detail |
|---|---|---|---|
| `awesome-skills/code-review-skill` | [Repo](https://github.com/awesome-skills/code-review-skill) | `https://github.com/awesome-skills/code-review-skill.git` | Standout: 20+ languages/frameworks, ~21,000 lines of review guidelines using progressive disclosure (loads only the relevant language file), four-phase review process, severity labeling (blocking/important/nit/suggestion/learning/praise) |
| `spartan-stratos/spartan-ai-toolkit` | [Repo](https://github.com/spartan-stratos/spartan-ai-toolkit) | `https://github.com/spartan-stratos/spartan-ai-toolkit.git` | Enforces quality gates: typecheck → lint → test → review in strict sequence, won't advance if a prior step fails — directly prevents the "patch the failing test to make it pass" failure mode |
| `microsoft/win-dev-skills` | [Repo](https://github.com/microsoft/win-dev-skills) | `https://github.com/microsoft/win-dev-skills.git` | Multi-dimensional PR review using parallel sub-agents; explicitly does NOT auto-apply fixes, reports only |

### AI guardrails / anti-hallucination / fact-grounding

This is a genuinely active, well-developed category — several strong options:

| Repo | Homepage | Clone URL | Notable detail |
|---|---|---|---|
| `assafkip/research-mode` | [Repo](https://github.com/assafkip/research-mode) | `https://github.com/assafkip/research-mode.git` | Packages Anthropic's own citation-discipline recommendations into a toggle; forces "I don't know" over guessing, requires grounding in direct quotes |
| `Pinperepette/grounded` | [Repo](https://github.com/Pinperepette/grounded) | `https://github.com/Pinperepette/grounded.git` | Hooks that block edits based on stale/hallucinated file assumptions, detect repeated failing tool-call loops, and track "confirmed NOT FOUND" identifiers to stop Claude from reusing them anyway |
| **`sethdford/claude-skills`** | [Repo](https://github.com/sethdford/claude-skills) | `https://github.com/sethdford/claude-skills.git` | **Most relevant to the "objectively proven facts, not guessing" goal specifically** — 454 skills across the full product development lifecycle, every one grounded in a named standard (SWEBOK, TOGAF, OWASP, ISTQB, NIST, AIPMM) with an explicit "Anti-Patterns" section targeting documented LLM failure modes (hallucination, over-generalization, constraint blindness, happy-path bias) |

**One item below could not be traced to a single confirmed repo:** a "6 cognitive firewalls" skill set specifically framed around blocking AI hallucination, bias, and sloppy reasoning, surfaced under the `ai-guardrails` GitHub topic without a clearly attributed owner/repo in the search results. Browse directly: [`github.com/topics/ai-guardrails`](https://github.com/topics/ai-guardrails)

**Broader pattern worth remembering when designing your own skills:** the dominant anti-hallucination architecture emerging across these projects is **atomic task decomposition + binary pass/fail gates** — break work into small, independently verifiable steps rather than trying to catch errors in a large finished output after the fact. Worth applying this same principle to the job-search automation skills, not just the SDLC ones.

---

## Suggested Next Steps

- [ ] Study `anthropics/skills`' `skill-creator` first — establishes the format/conventions everything else follows
- [ ] For job search: `neonwatty/job-apply-plugin` and the minimal `lead-generation` tracker workspace (once located via the topic page) look like the best-fit starting references given your stated caution level (confirmation-required, no blind auto-submit)
- [ ] For SDLC: `rrezartprebreza/spring-boot-skills` (Java) + Metabase's real production TypeScript review skill file + `awesome-skills/code-review-skill` (broad reviewer) as a starting trio
- [ ] For guardrails: `sethdford/claude-skills` is the standout for the "grounded in real standards, anti-pattern-aware" goal — worth reading a few of its 454 skills closely to understand the pattern before writing your own
- [ ] Two topic-page-only leads (LinkedIn outreach bundle, cognitive-firewalls guardrail skill) still need their actual repos tracked down — worth 5 minutes browsing those topic pages directly rather than trusting a guessed link
