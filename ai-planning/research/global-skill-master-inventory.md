# Global Skill Master Inventory

Date: 2026-08-11

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

## Reconciliation Notes and Next Planning Step

- The inventory deliberately does not create generic copies of built-in skill creation, document, browser, or Office-artifact capabilities. Candidate base skills should supply reusable policy and composition only.
- Several rows are overlapping names for the same eventual workflow: `base-grounded-research` versus `research-topic-workflow`; `base-code-review` versus `generic-code-review`; `base-mcp-workflow` versus `mcp-design`; `git-topic-branch-management` versus `dirty-worktree-to-topic-branch`; and lifecycle audit versus existing OpenSpec/Project sync skills. A proposal should choose one owner and make the other a module or mode.
- The specific product material repeatedly requires assistant-neutral, configurable skills. Do not bake repository owner, Project, paths, ATS credentials, candidate PII, or other product-specific constants into global assets.
- Build order should follow demonstrated reuse. In particular, H1 advises keeping the research planner's artifact-audit and nonprofit-cost components internal until independently justified; S3 likewise advises against building every SDD recommendation upfront.
- Before proposing an inventory item, reread every source listed in its row plus the corresponding existing canonical skill, if marked implemented. Confirm its trigger, mutation/approval boundary, outputs, configuration, and eval evidence before creating an OpenSpec change.
