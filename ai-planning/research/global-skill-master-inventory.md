# Global Skill Master Inventory

Date: 2026-08-12

## Scope and Reading Method

This is the planning inventory for reusable global skills. It consolidates the
documents in this repository, `home-roots-reinvest-in-growth`, and the 2026 job
search workspace that explicitly propose a skill, describe a reusable workflow,
or mark a skill as deferred. It does not turn incidental references to skills,
generated wrappers, resume claims, or individual job/company research records
into candidate skills.

"Sources" below means the documents that contain implementation-relevant
detail for the candidate, not every file that happens to use the word "skill."
An item is **implemented** when the repository already has a canonical skill;
it remains in the inventory because planning documents refer to it and its
boundary affects new work. **Conditional** items are explicitly described as
sub-workflows that should remain inside another skill until repeated use proves
they deserve a separate trigger.

## Source Key

| Key | Document |
|---|---|
| S1 | `ai-planning/prompts/skill-ideas.txt` |
| S2 | `docs/research-topic-workflow-notes.md` |
| S3 | `ai-planning/handoff-docs/openspec-sdd-foundation-implementation-handoff.md` |
| S4 | `ai-planning/requirements/openspec-sdd-foundation.md` |
| S5 | `ai-planning/research/builtin-ai-assets-claude-vs-codex.md` |
| S6 | `ai-planning/plans/openspec-sdd-foundation-implementation-plan.md` |
| S7 | `ai-planning/plans/bounded-autonomous-sdd-execution-implementation-plan.md` |
| S8 | `ai-planning/research/google-apps-connectivity/handoff-job-search-automation.md` |
| H1 | `/Users/joerice/git/joericearchitect/home-roots-reinvest-in-growth/ai-planning/ai-planning/handoff-docs/mobile-bookkeeping-new-repository-handoff.md` |
| H2 | `/Users/joerice/git/joericearchitect/home-roots-reinvest-in-growth/ai-planning/research/tech-research/openspec-adoption-decision-and-structure.md` |
| J1 | `/Users/joerice/Library/CloudStorage/GoogleDrive-jizzoerice@gmail.com/My Drive/2026/job-search/application-assistance-workflow.md` |
| J2 | `/Users/joerice/Library/CloudStorage/GoogleDrive-jizzoerice@gmail.com/My Drive/2026/job-search/research/job-search-automation.md` |
| J3 | `/Users/joerice/Library/CloudStorage/GoogleDrive-jizzoerice@gmail.com/My Drive/2026/job-search/research/application-automation-field-notes.md` |
| J4 | `/Users/joerice/Library/CloudStorage/GoogleDrive-jizzoerice@gmail.com/My Drive/2026/job-search/handoff-docs/application-batch-session-handoff-2026-08-10-11.md` |
| J5 | `/Users/joerice/Library/CloudStorage/GoogleDrive-jizzoerice@gmail.com/My Drive/2026/job-search/master-job-search-checklist.md` |
| J6 | `/Users/joerice/Library/CloudStorage/GoogleDrive-jizzoerice@gmail.com/My Drive/2026/job-search/research/automation-apps-connectivity/handoff-job-search-automation.md` |
| J7 | `/Users/joerice/Library/CloudStorage/GoogleDrive-jizzoerice@gmail.com/My Drive/2026/job-search/research/automation-apps-connectivity/convo-with-claude-job-search-automation.txt` |
| S9 | `ai-planning/research/github-issues.md` |
| S10 | `ai-planning/research/sdlc-skills-repo-review.md` |
| S11 | `ai-planning/research/skills/github-research-job-search-and-sdlc-skills.md` |

## Public Repository Reference Key

The repository references below are source material to study and selectively
adapt, not dependencies or content to copy wholesale. Before implementation,
verify license, maintenance, version claims, platform fit, and security of any
scripts or hooks. A **pattern-only** reference provides reusable skill or
workflow structure but is not evidence of domain-specific coverage.

| Key | Public repository | Best-supported use |
|---|---|---|
| R1 | [`anthropics/skills`](https://github.com/anthropics/skills) | `SKILL.md` shape, skill authoring, MCP, document workflows, frontend and web-app testing patterns. |
| R2 | [`assafkip/research-mode`](https://github.com/assafkip/research-mode) | Grounded research and citation discipline. |
| R3 | [`Pinperepette/grounded`](https://github.com/Pinperepette/grounded) | Guardrails, stale-assumption detection, and repeated-failure controls. |
| R4 | [`awesome-skills/code-review-skill`](https://github.com/awesome-skills/code-review-skill) | Base review phases, severity taxonomy, and language-specific progressive disclosure. |
| R5 | [`spartan-stratos/spartan-ai-toolkit`](https://github.com/spartan-stratos/spartan-ai-toolkit) | Quality gates, stack profiles, CI/CD, browser QA, and Terraform review. |
| R6 | [`microsoft/win-dev-skills`](https://github.com/microsoft/win-dev-skills) | Review-only and cross-assistant plugin packaging patterns. |
| R7 | [`affaan-m/everything-claude-code`](https://github.com/affaan-m/everything-claude-code) | Coding standards, verification, TDD, security review, and harness patterns. |
| R8 | [`binyamineden/claude-combine`](https://github.com/binyamineden/claude-combine) | Planning, debugging, worktree, review, and verification workflow patterns. |
| R9 | [`sethdford/claude-skills`](https://github.com/sethdford/claude-skills) | Standards-grounded SDLC taxonomy, threat modeling, QA, and defect triage. |
| R10 | [`rrezartprebreza/spring-boot-skills`](https://github.com/rrezartprebreza/spring-boot-skills) | Java/Spring Boot conventions, architecture, persistence, security, testing, and AI failure modes. |
| R11 | [`jdubois/dr-jskill`](https://github.com/jdubois/dr-jskill) | Opinionated end-to-end Spring Boot generation and version-manifest patterns. |
| R12 | [`Jeffallan/claude-skills`](https://github.com/Jeffallan/claude-skills) | Java/Spring overlays tied to Maven/JaCoCo verification commands. |
| R13 | [`piomin/claude-ai-spring-boot`](https://github.com/piomin/claude-ai-spring-boot) | Java code-quality/review, JPA, logging, and Spring Boot starter composition. |
| R14 | [`mindrally/skills`](https://github.com/mindrally/skills) | Broad technology checklist discovery; raw material only. |
| R15 | [`SpillwaveSolutions/mastering-typescript-skill`](https://github.com/SpillwaveSolutions/mastering-typescript-skill) | TypeScript strictness, Zod contracts, and React/NestJS split patterns. |
| R16 | [`metabase/metabase`](https://github.com/metabase/metabase) | Production TypeScript write/review and E2E testing patterns. |
| R17 | [`theaayushstha1/job-applier-agent`](https://github.com/theaayushstha1/job-applier-agent), [`neonwatty/job-apply-plugin`](https://github.com/neonwatty/job-apply-plugin), [`MadsLorentzen/ai-job-search`](https://github.com/MadsLorentzen/ai-job-search), [`proficientlyjobs/proficiently-claude-skills`](https://github.com/proficientlyjobs/proficiently-claude-skills) | Supervised job-search, fit, application, and tracking workflow patterns. |
| R18 | [`aiagentwithdhruv/skills`](https://github.com/aiagentwithdhruv/skills) | Lead discovery, browser automation, and outreach-adjacent patterns. |

## Research, Planning, and Skill Authoring

| Skill name | Summary | Purpose | Sources | Notes |
|---|---|---|---|---|
| `research-topic-workflow` | Researches a defined topic at quick, standard, or deep depth and writes findings plus sources to a durable directory structure. | Produce grounded, reusable technology research for planning and architecture decisions. | S1, S2 | The most complete candidate definition. It requires current-source checks for volatile model/pricing facts and recommends, rather than silently changes, models. |
| `research-to-prototype-architecture-planner` | Turns unfamiliar product/architecture context into risk-ordered research, a specification decision, vertical slices, and a cross-session handoff. | Move from discovery to a decision-ready, implementation-ready prototype plan without embedding a product stack. | H1 | Primary candidate from the home-roots project. It should include cost/compliance work as a sidecar, not hard-code React Native, AWS, or OpenSpec. |
| `artifact-currency-and-handoff-audit` | Inventories durable artifacts, assesses currency and conflicts, establishes sources of truth, and makes continuation possible without repeated research. | Prevent stale or contradictory handoffs. | H1 | **Conditional:** H1 recommends keeping it within the research-to-prototype skill unless it proves independently reusable. |
| `nonprofit-technology-cost-and-ownership-research` | Records service cost, nonprofit eligibility, account ownership, delegation, renewal, and exit risks from official sources. | Support responsible purchase and account decisions for nonprofit technology work. | H1 | **Conditional:** retain as a sidecar until nonprofit projects recur. |
| `design-brief-from-research` | Synthesizes research and relevant conversation history into problem, outcome, options, decision, scope, constraints, questions, and next step. | Create a concise input to OpenSpec Explore or Propose. | S1 | Must not claim a decision that the source material leaves open. |
| `skill-authoring-security-review` | Reviews new skill instructions for prompt-injection surfaces, untrusted-content handling, secret exposure, and arbitrary-command risk. | Make skill creation and autonomous workflows safe by design. | S1, S7 | The name is provisional; S1 states the required injection check but does not name a standalone skill. This may be a required phase of `base-skill-authoring` instead. |
| `base-skill-authoring` | Defines portable `SKILL.md` authoring, triggers, progressive disclosure, examples, tests, and evals. | Give Claude and Codex a common canonical-skill authoring standard. | S5 | Prefer the built-in `skill-creator` for platform mechanics; this candidate is the assistant-neutral policy layer. |
| `base-document-workflow` | Defines input inventory, output contract, and visual/semantic QA for document work. | Standardize domain document workflows without duplicating built-in Office/PDF skills. | S5 | Should compose existing document, PDF, presentation, and spreadsheet capabilities. |
| `base-grounded-research` | Applies a source cascade, claims table, quote-then-synthesize approach, and uncertainty rules. | Supply the generic research discipline beneath topic-specific research. | S5 | Overlaps with `research-topic-workflow`; keep this as reusable policy or merge it after a trigger review. |
| `base-code-review` | Provides severity labels, review phases, evidence expectations, and a no-auto-fix mode. | Make code review consistent across assistants. | S5, S4 | Overlaps with the deferred generic code-review skill and the product's quality-review practices. |
| `base-verification-loop` | Uses reproduce, test, implement, verify, and report-evidence steps for web/application work. | Standardize an evidence-driven implementation loop. | S5 | Must remain distinct from OpenSpec lifecycle verification and from browser-control tooling. |
| `base-mcp-workflow` | Defines tool boundaries, authentication assumptions, fallback behavior, and final output format for connector-backed work. | Make MCP-backed integrations predictable and safe. | S5, S4 | Closely overlaps with the deferred MCP-design skill; decide whether one is policy and the other is architecture/design. |
| `base-guardrails` | Captures read-before-edit, no-secret-exfiltration, approval points, and stop conditions. | Supply shared high-risk workflow constraints. | S5 | Likely a shared reference/module, not a user-invoked skill. Avoid duplicating repository `AGENTS.md` policy. |

## Specification-Driven Development and OpenSpec

| Skill name | Summary | Purpose | Sources | Notes |
|---|---|---|---|---|
| `sdd-product-bootstrap` | Safely adopts or initializes OpenSpec, assistant integrations, context, recovery, and ownership boundaries in a product repository. | Establish a reusable SDD starting point. | S3 | Do not silently mutate global assistant configuration. |
| `sdd-requirements-to-plan` | Converts PRD-like requirements into milestones, independently deliverable changes, acceptance evidence, and initial identifiers. | Create an outcome-oriented delivery plan. | S3 | Generalizes the foundation's existing requirements-to-plan reasoning. |
| `sdd-dependency-planning` | Models hard dependencies, conflicts, blockers, critical path, safe parallelism, and issue dependency operations. | Keep milestone/change/task ordering valid. | S3 | Must consider shared files, interfaces, and external state, not only logical dependency edges. |
| `github-sdd-project-bootstrap` | Creates/adopts a GitHub Project with field/view/configuration and least-privilege guidance. | Provide traceable work-state management for a product. | S3 | Mutations require deterministic scripts, preview, and confirmation. |
| `github-issue-authoring` | Creates high-quality feature/bug issues, checks duplicates, and keeps intake separate from durable specifications. | Provide governed work intake. | S3 | **Implemented:** canonical `skills/base/github-issue-authoring/`. Keep it out of a duplicate build queue. |
| `github-issue-to-openspec` | Links an issue to an OpenSpec change while preserving the issue as lifecycle record. | Start a governed change from accepted intake. | S3 | **Implemented:** canonical `skills/base/github-issue-to-openspec/`. |
| `openspec-github-sync` | Audits or explicitly repairs reciprocal links, managed issue blocks, Project membership, and lifecycle status. | Reconcile OpenSpec and GitHub records. | S3 | **Implemented:** canonical `skills/base/openspec-github-sync/`. |
| `github-pr-linkage` | Validates issue-closing, OpenSpec change references, verification evidence, and no-code rules for a PR. | Keep GitHub delivery traceable to governed work. | S1, S3 | **Implemented:** canonical `skills/base/github-pr-linkage/`. S1 also proposes a broader repair-capable version; reconcile before extending it. |
| `sdd-project-navigation` | Answers what is active, blocked, parallelizable, and next by reading Project, issue, OpenSpec, and task state. | Select the next dependency-valid work without default mutation. | S3 | Broadly overlaps with **implemented** `dependency-aware-work-selection`; clarify whether navigation is a broader user-facing composition. |
| `sdd-change-switching` | Safely moves a session between active changes, preserving worktree state and loading target context. | Prevent context and shared-resource errors in multi-change work. | S3 | S3 says it may become a `sdd-project-navigation` capability rather than a separate skill. |
| `openspec-action-context` | Resolves selected change, Git branch, formal issue/PR/Project state, authorization boundaries, and stopping point before an OpenSpec action. | Prevent an action from relying on chat memory or executing unapproved lifecycle mutations. | S1 | Likely a thin context layer used by generated OpenSpec actions, not a replacement for them. |
| `sdd-change-readiness-review` | Checks readiness: scope, acceptance scenarios, design, dependencies, test/eval plan, security, portability, attribution, and rollback. | Surface gaps before implementation. | S3 | Must report gaps, not quietly promote an item to Ready. |
| `sdd-verification-and-closeout` | Composes verification, evidence collection, lifecycle-state checks, spec sync, and archive. | Finish a change only when implementation and delivery evidence are complete. | S3 | Must compose OpenSpec built-ins, not duplicate their artifact logic. |
| `sdd-session-handoff` | Produces a compact handoff covering state, selected changes, preserved work, caveats, blockers, next action, and evidence links. | Support safe continuity across long-running sessions. | S3, H1 | Similar intent to the conditional artifact audit, but this is execution-state-focused. |
| `spec-workflows` | A placeholder for a workflow-oriented skill family around specifications. | Capture the unelaborated request to build specification workflows. | S1 | Not yet a buildable standalone skill. Resolve whether it means OpenSpec action context, SDD planning, or generated OpenSpec workflows before proposing work. |

## Git, GitHub, CI, and Delivery

| Skill name | Summary | Purpose | Sources | Notes |
|---|---|---|---|---|
| `git-change-inspection` | Inspects changes across worktree, index, commits, branches, and PRs, separating scoped work from user/generated/unrelated work. | Produce a safe change summary and verification inventory. | S1 | Read-only by default. This is the detailed form of the earlier "change description" idea. |
| `git-topic-branch-management` | Creates correctly based `feature/`, `fix/`, `hotfix/`, or `chore/` branches from `main` after state checks. | Start issue-backed work without branch or dirty-worktree mistakes. | S1 | Requires an issue number and slug but treats branch naming as context, not formal linkage. |
| `dirty-worktree-to-topic-branch` | Classifies a dirty `main` worktree, proposes the exact carried file scope, and creates a topic branch while preserving unrelated work. | Safely begin a new effort when work already exists locally. | S1 | Overlaps with branch management; likely a mode/sub-workflow, not a separate first implementation. |
| `git-commit-authoring` | Reviews the intended staged scope, proposes a meaningful message, and commits only approved files. | Make commits accurate without staging unrelated user work. | S1 | Includes identity, hook, and result verification. |
| `github-pr-authoring` | Creates or updates a draft PR with a governed body, linkage, evidence, security/attribution, and release impact. | Prepare a reviewable delivery record. | S1 | Preview GitHub mutations and return the resulting URL. |
| `github-pr-readiness` | Reviews scope, checks, unresolved comments, links, conflicts, and verification evidence. | Recommend draft readiness without merging or changing ready state. | S1 | Explicitly advisory unless authorized otherwise. |
| `github-squash-merge` | Re-audits the exact PR head, creates the squash message, requires immediate authorization, merges, and independently verifies closure and branch deletion. | Complete a safe, evidence-bound squash merge. | S1 | Must stop before spec sync/archive unless separately authorized. |
| `git-topic-branch-cleanup` | Checks merge/abandonment intent, unique commits, PRs, worktrees, and references before deletion. | Avoid destructive loss during branch cleanup. | S1 | Deletion must be previewed and approval-gated. |
| `github-ruleset-audit` | Audits `main` rulesets and merge configuration against GitHub Flow. | Report or explicitly repair repository protections. | S1 | Read-only by default. |
| `github-actions-workflow-authoring` | Designs focused Actions with least privilege, concurrency, idempotency, pinned actions, and test/dry-run behavior. | Create secure, maintainable CI/CD workflow definitions. | S1 | Separate trusted mutation work from untrusted PR validation. |
| `github-actions-security-review` | Reviews events, tokens, secrets, forks, `pull_request_target`, injection, pins, and recursion. | Treat workflow changes as supply-chain and credential-boundary changes. | S1 | Could become a required review module of workflow authoring. |
| `github-actions-run-diagnostics` | Investigates failed/skipped runs, jobs, annotations, logs, payload assumptions, and permissions. | Find a targeted recovery without weakening required checks. | S1 | Do not make speculative retries or policy reductions. |
| `github-lifecycle-audit` | Compares issue, OpenSpec, branch, PR, Project, merge, and archive state and optionally repairs drift. | Verify lifecycle convergence. | S1 | Overlaps with `openspec-github-sync` and `project-pr-status-sync`; establish composition boundaries first. |
| `pr-review-comment-remediation` | Makes code changes that address PR review comments. | Apply approved review feedback and re-verify affected behavior. | S1 | Source calls this "re-code" only; the inventory name is provisional and needs an explicit review-comment/approval boundary. |
| `github-release-readiness` | Assesses readiness to release. | Gate release work once release policy exists. | S1 | Later candidate pending release decisions; no detailed contract yet. |
| `github-release-publishing` | Publishes an approved release. | Automate release delivery only with explicit authorization. | S1 | Later candidate; requires release policy and credentials boundary. |
| `github-environment-audit` | Audits deployment environments. | Verify environment configuration and protections. | S1 | Later candidate pending Environment decisions. |
| `github-deployment-promotion` | Promotes an approved deployment between environments. | Control deployment progression. | S1 | Later candidate; production promotion requires explicit authorization. |
| `github-artifact-provenance` | Establishes release/build artifact provenance. | Support trustworthy release artifacts. | S1 | Later candidate; scope depends on the selected release model. |

## Job Search and Supervised Application Assistance

| Skill name | Summary | Purpose | Sources | Notes |
|---|---|---|---|---|
| `job-search-post-review` | Processes completed manual pursue decisions: archives No roles, researches Maybe/Needs Research, deepens Yes-company research, learns from reasons, adds verified replacements, and updates the tracker. | Maintain a healthy job-search pipeline after human review. | J1, J2, J5 | **Implemented:** installed global skill. Treat the documents as policy/reference material when updating it. |
| `linkedin-job-lead-intake` | Ingests saved jobs, recruiter-shared roles/messages, and profile-view signals into the shared first-pass queue with provenance and approval-gated outreach drafts. | Consolidate LinkedIn leads without inferring pursue intent or messaging automatically. | J1, J2, J5 | Preserve native IDs and use upserts. Anonymous recruiter views are company/job-discovery signals, not named-person attribution. |
| `gmail-job-lead-intake` | Ingests recruiter/contact email leads with message/thread references into the same first-pass queue. | Consolidate email-originated opportunities without automatic replies or pursue decisions. | J1, J2, J5 | Requires least-privilege Gmail access and duplicate-safe upserts; connection/auth details are in J6 and J7. |
| `supervised-job-application-assistance` | Resolves official ATS paths, prepares non-sensitive fields and tailored material, validates field values, pauses at human gates, confirms submission, and transactionally updates the tracker. | Reduce repetitive application work while preserving candidate control, privacy, and explicit submission approval. | J1, J2, J3, J4, J5, J6, J7 | This is the strongest job-search candidate. It must remain supervised: no credentials, OTPs, self-ID, or final submission without per-application approval. J4 defines the state machine and ATS validation lessons. |
| `job-application-fit-and-preparation` | Produces structured fit summaries, recommendation, resume selection, answer/outreach drafts, tracker preparation, and follow-up reminders. | Prepare high-quality applications from trusted source files. | J1 | J1 presents these as a future skill/workflow; likely a planning/preparation phase inside supervised application assistance unless a separate trigger proves useful. |

## Deferred SDLC Foundation Skills With Minimal Definition

| Skill name | Summary | Purpose | Sources | Notes |
|---|---|---|---|---|
| `generic-code-review` | Reviews implementation quality and correctness. | Provide a standalone code-review workflow after repeated use defines its boundary. | S4, S5, H1 | Likely converges with `base-code-review`; do not create two generic code-review skills. |
| `debugging` | Investigates runtime or behavioral defects. | Provide a reusable defect-analysis workflow. | S4 | Mentioned only as deferred; needs its own design and tool boundary. |
| `tdd` | Guides test-driven development. | Improve implementation feedback loops. | S4 | Mentioned only as deferred; avoid hard-coding one language/framework. |
| `threat-modeling` | Identifies security threats, mitigations, and residual risks. | Add a structured security-design review. | S4 | Mentioned only as deferred; may compose `base-guardrails` and security-review practices. |
| `adr-authoring` | Captures architecture decisions and alternatives. | Preserve decision context in durable records. | S4 | Mentioned only as deferred; distinguish from `design-brief-from-research`. |
| `stack-review` | Assesses a technology stack against project constraints. | Make architecture/tool choices explicit and defensible. | S4 | Mentioned only as deferred; overlaps with research-to-prototype planning. |
| `mcp-design` | Designs MCP/connector integrations. | Define tool, auth, data, and safety boundaries for new integrations. | S4, S5 | Needs a clear split from `base-mcp-workflow`, which governs operation of an existing integration. |

## Language, Infrastructure, and Triage Candidates

These candidates close gaps exposed by the SDLC repository review and the
GitHub-planning research. They are not part of the current base-skill design
briefs and need their own design work after the shared base-review and
guardrail foundations are implemented. “Research gap” means that a public
repository may be useful for portable skill structure, but this inventory has
not yet identified and reviewed a direct domain-specific skill source.

| Skill name | Summary | Purpose | Sources | Public repository references | Notes |
|---|---|---|---|---|---|
| `java-spring-review` | Reviews Java and Spring Boot changes for language, framework, persistence, security, API, transaction, test, and build hazards. | Provide a stack overlay for `base-code-review`; it does not replace repository-specific conventions. | S10, S11 | R10, R12, R13 | Direct, detailed public sources exist. R10 is the primary reference; use R12/R13 for evidence-bound review and code-quality patterns. |
| `typescript-javascript-review` | Reviews TypeScript and JavaScript changes for strict typing, unsafe `any`, async/error behavior, API-contract drift, test gaps, and framework-specific risks. | Provide a stack overlay for `base-code-review`. | S10, S11 | R15, R16, R4 | Direct TypeScript sources exist. JavaScript-specific rules require a separate decision so JavaScript is not incorrectly held to TypeScript-only checks. |
| `react-web-review` | Reviews React web changes for component boundaries, state/effect behavior, accessibility, performance, type safety, and browser-test evidence. | Add a React overlay that composes the base and TypeScript/JavaScript reviews. | S10 | R15, R1, R4 | R15 contains React integration patterns; R1 and R4 supply portable frontend/test and review structure. No React-focused review skill has been independently vetted yet. |
| `python-review` | Reviews Python changes for correctness, typing, package/toolchain conventions, dependency risks, tests, and framework-specific hazards. | Add a Python overlay that composes `base-code-review`. | S10 | R4, R9 (pattern-only) | **Research gap:** the reviewed material contains broad review/taxonomy patterns, not a vetted Python-specific skill. Research direct Python sources before design. |
| `react-native-review` | Reviews React Native changes for component/state behavior, native boundaries, platform differences, accessibility, performance, and device-test evidence. | Add a mobile overlay without assuming Expo or a particular backend. | H1, S10 | R1, R4 (pattern-only) | **Research gap:** React Native is explicitly not part of the generic architecture planner. No direct React Native skill source has been identified. |
| `expo-review` | Reviews Expo-managed application changes for SDK compatibility, native module/configuration boundaries, permissions, builds, updates, and device-test evidence. | Add an Expo-specific layer above `react-native-review` only when Expo is selected. | S10 | R1 (pattern-only) | **Research gap:** no Expo-specific public skill source was identified. Keep separate from React Native because it has distinct SDK, config, build, and update behavior. |
| `terraform-review` | Reviews Terraform changes for plan safety, provider/module behavior, state impact, IAM/security, drift, and validation evidence. | Add an infrastructure-as-code overlay to `base-code-review`. | S10 | R5 | Direct candidate source exists, but its content must be reviewed for provider/version assumptions before adaptation. |
| `aws-infrastructure-review` | Reviews AWS infrastructure changes for IAM, network, encryption, observability, cost, resilience, service limits, and deployment evidence. | Add an AWS overlay that can compose Terraform, application, and operational reviews. | S10 | R5, R9 (pattern-only) | **Research gap:** no vetted AWS-specific skill source was identified. Do not treat a generic Terraform review as adequate AWS service/security guidance. |
| `github-bug-triage` | Classifies reproducibility, severity, duplicates, evidence, and whether reported behavior is already specified. | Turn incoming bugs into evidence-backed, actionable work without silently mutating GitHub. | S9 | R9, R4 (pattern-only) | Detailed internal concept exists; R9 supplies defect-triage taxonomy, but no GitHub-specific public triage implementation is yet vetted. |
| `github-issue-decomposition` | Recommends whether a concern becomes OpenSpec tasks or independently deliverable linked issues. | Keep issue scope, dependencies, and implementation sequencing understandable. | S9 | R8, R9 (pattern-only) | Must compose with the implemented GitHub/OpenSpec skills instead of duplicating their mutations. |
| `github-backlog-grooming` | Finds stale, duplicate, blocked, underspecified, or misclassified work and proposes evidence-backed updates. | Maintain a reliable backlog while keeping mutations previewed and authorized. | S9 | R9 (pattern-only) | No direct public GitHub-backlog skill was identified in reviewed sources. |
| `github-duplicate-detection` | Searches open and closed issues for materially similar work before feature or bug intake. | Avoid duplicate work and preserve prior decisions. | S9 | R9 (pattern-only) | Needs a future decision on similarity evidence and human resolution of ambiguous matches. |
| `github-dependency-mapping` | Creates or validates blocked-by relationships and identifies critical sequencing. | Make delivery dependencies visible and support safe work selection. | S9 | R8, R9 (pattern-only) | Closely related to `sdd-dependency-planning`; decide whether this is an adapter/module rather than a separate trigger. |
| `github-project-status-audit` | Compares issue, PR, OpenSpec, and Project state, then reports or explicitly repairs drift. | Keep work tracking convergent and evidence-backed. | S9 | R8, R9 (pattern-only) | Overlaps with implemented `openspec-github-sync` and `project-pr-status-sync`; define composition before proposing it. |
| `terraform-issue-triage` | Classifies Terraform incidents and defects by reproducibility, affected state/environment, plan safety, provider/module scope, severity, and required evidence. | Give infrastructure reports a safe, domain-aware intake path before remediation. | S9, S10 | R5 | Extends generic GitHub bug triage with Terraform context. No dedicated Terraform triage source was identified. |
| `aws-issue-triage` | Classifies AWS incidents and defects by affected account/environment/service, blast radius, IAM/security exposure, cost, observability, reproducibility, and evidence. | Give AWS reports a safe, domain-aware intake path before remediation. | S9, S10 | R5, R9 (pattern-only) | **Research gap:** no AWS-specific triage source was identified. Require an AWS-focused research pass before design. |

## Public Repository References for Existing Candidates

This section provides at least one reusable public reference for every existing
inventory row. References are grouped only for readability; each listed skill
is covered by the repositories in its row. “Pattern-only” carries the same
meaning defined above and must not be treated as a complete domain contract.

| Existing inventory skills | Public repository references | Reference use and limits |
|---|---|---|
| `research-topic-workflow`; `design-brief-from-research`; `base-grounded-research` | R2, R3, R1 | Grounded research discipline, uncertainty, skill structure, and eval patterns. |
| `research-to-prototype-architecture-planner`; `artifact-currency-and-handoff-audit`; `nonprofit-technology-cost-and-ownership-research`; `stack-review` | R1, R8, R9 (pattern-only) | Planning, architecture, handoff, and decision-record patterns. Direct nonprofit/cost-ownership sources have not been identified. |
| `skill-authoring-security-review`; `base-skill-authoring`; `base-guardrails` | R1, R3, R7 | Canonical skill authoring plus guardrail/harness patterns; audit bundled scripts/hooks before use. |
| `base-document-workflow` | R1 | Official document-workflow and skill-composition reference. |
| `base-code-review`; `generic-code-review`; `pr-review-comment-remediation` | R4, R5, R6 | Review phases/severity, gated remediation, and review-only cross-assistant patterns. |
| `base-verification-loop`; `debugging`; `tdd` | R5, R7, R8 | Quality gates, verification, debugging, and TDD workflow patterns. |
| `base-mcp-workflow`; `mcp-design` | R1, R7 | MCP-builder and MCP-server workflow patterns; do not inherit connector credentials or product constants. |
| `threat-modeling`; `adr-authoring` | R9, R7 | Standards/taxonomy and security workflow patterns; verify cited standards before adoption. |
| `sdd-product-bootstrap`; `sdd-requirements-to-plan`; `sdd-dependency-planning`; `sdd-change-readiness-review`; `sdd-verification-and-closeout`; `spec-workflows` | R1, R5, R8, R9 (pattern-only) | Plan, gate, dependency, and verification patterns. OpenSpec-specific semantics remain repository-owned. |
| `github-sdd-project-bootstrap`; `github-issue-authoring`; `github-issue-to-openspec`; `openspec-github-sync`; `github-pr-linkage`; `sdd-project-navigation`; `sdd-change-switching`; `openspec-action-context`; `sdd-session-handoff` | R8, R9, R12 (pattern-only) | Workflow, planning, and GitHub/Atlassian integration patterns. The current canonical skills remain the authoritative implementation sources. |
| `git-change-inspection`; `git-topic-branch-management`; `dirty-worktree-to-topic-branch`; `git-commit-authoring`; `git-topic-branch-cleanup` | R8, R7 | Worktree, planning, coding-standards, and verification patterns. Preserve repository-specific Git safety rules. |
| `github-pr-authoring`; `github-pr-readiness`; `github-squash-merge`; `github-ruleset-audit`; `github-lifecycle-audit` | R5, R6, R8 | Quality-gate, PR review, and lifecycle workflow patterns; no reference permits autonomous merge without explicit authorization. |
| `github-actions-workflow-authoring`; `github-actions-security-review`; `github-actions-run-diagnostics` | R5, R7, R9 | CI/CD, security, and diagnosis patterns. Review every workflow for token and untrusted-input boundaries. |
| `github-release-readiness`; `github-release-publishing`; `github-environment-audit`; `github-deployment-promotion`; `github-artifact-provenance` | R5, R7, R9 (pattern-only) | CI/CD and supply-chain patterns. Direct release/deployment skills were not independently reviewed, so release policy remains a prerequisite. |
| `job-search-post-review`; `linkedin-job-lead-intake`; `gmail-job-lead-intake`; `supervised-job-application-assistance`; `job-application-fit-and-preparation` | R17, R18 | Direct job-search/application and lead-intake references. Preserve the inventory's human approval, privacy, credential, and final-submission limits. |

## Reconciliation Notes and Next Planning Step

- The inventory deliberately does not create generic copies of built-in skill creation, document, browser, or Office-artifact capabilities. Candidate base skills should supply reusable policy and composition only.
- Several rows are overlapping names for the same eventual workflow: `base-grounded-research` versus `research-topic-workflow`; `base-code-review` versus `generic-code-review`; `base-mcp-workflow` versus `mcp-design`; `git-topic-branch-management` versus `dirty-worktree-to-topic-branch`; and lifecycle audit versus existing OpenSpec/Project sync skills. A proposal should choose one owner and make the other a module or mode.
- The specific product material repeatedly requires assistant-neutral, configurable skills. Do not bake repository owner, Project, paths, ATS credentials, candidate PII, or other product-specific constants into global assets.
- Build order should follow demonstrated reuse. In particular, H1 advises keeping the research planner's artifact-audit and nonprofit-cost components internal until independently justified; S3 likewise advises against building every SDD recommendation upfront.
- Before proposing an inventory item, reread every source listed in its row plus the corresponding existing canonical skill, if marked implemented. Confirm its trigger, mutation/approval boundary, outputs, configuration, and eval evidence before creating an OpenSpec change.
