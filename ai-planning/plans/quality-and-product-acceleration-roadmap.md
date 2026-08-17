# Quality and Product Acceleration Roadmap

Date: 2026-08-16
Status: Roadmap and candidate-change plan. It creates no GitHub issue, branch,
OpenSpec change, or implementation authorization.

## Outcome and priority basis

This roadmap turns the remaining design-brief work into dependency-valid,
independently deliverable slices. It prioritizes the two owner outcomes:

1. build a full-stack mobile application quickly and safely; and
2. build a supervised job-search skills repository quickly and safely.

Priority favors reusable capabilities that help both outcomes first, then the
React Native/Expo path for the mobile application and the product-owned
job-search path. Technology-specific backend, web, or infrastructure overlays
are conditional: the mobile application's selected stack, not this global
roadmap, determines whether Java/Spring, React web, or Terraform work is next.

The plan follows the repository's [SDD implementation planning rules](archive/openspec-sdd-foundation-implementation-plan.md): one independently deliverable
slice becomes one primary issue and one semantic OpenSpec change; milestones
group outcomes rather than task lists; every slice has objective exit evidence;
and only a reviewed proposal owns its delta specs, design, and tasks. Names
below are proposed candidate-change names, not created records.

The current OpenSpec list contains no active change. Before starting any
candidate, re-read Git status, the selected brief, target repository facts, and
the applicable living specs. Preserve the existing unrelated dirty work and
reconcile any target-owned unarchived files rather than creating a duplicate
change around them.

## Design-brief completion inventory

“Completed” below means a directly related implementation change is archived
with zero unchecked tasks; the OpenSpec archive is the durable lifecycle
evidence. “Not completed” includes a planning-only checkpoint, partial
prerequisites, or unarchived local work; none is treated as a delivered
capability merely because files currently exist in the worktree.

### Briefs with completed changes

| Design brief | Completed OpenSpec change(s) | Durable evidence |
| --- | --- | --- |
| [Base Skill Contracts And Guardrails](../design-briefs/archived/base-skill-contracts-and-guardrails.md) | `establish-base-skill-contracts-and-guardrails` | [Archived change](../../openspec/changes/archive/2026-08-12-establish-base-skill-contracts-and-guardrails/) has zero unchecked tasks; living contracts, shared guardrails, and validators exist. |
| [Base Skills: Authoring And Guardrails](../design-briefs/archived/base-skill-authoring-and-guardrails.md) | `add-base-skill-authoring`, using the completed contracts/guardrails prerequisite | [Archived change](../../openspec/changes/archive/2026-08-12-add-base-skill-authoring/) has zero unchecked tasks; the canonical authoring skill and thin adapters exist. |
| [Global Skill Installation](../design-briefs/archived/global-skill-installation.md) | `document-global-skill-installation-planning` and `normalize-skill-metadata-and-document-global-installation` | [Implementation archive](../../openspec/changes/archive/2026-08-12-normalize-skill-metadata-and-document-global-installation/) has zero unchecked tasks; its planning checkpoint is separately archived. |
| [Isolated Autonomous Independent Review](../design-briefs/archived/isolated-autonomous-independent-review.md) | `add-isolated-independent-review` | [Archived change](../../openspec/changes/archive/2026-08-13-add-isolated-independent-review/) has zero unchecked tasks and supplies the strict review capability used by `production-rapid`. |

### Briefs without completed changes

| Design brief | Current classification | Why it remains on the roadmap |
| --- | --- | --- |
| [Base Skills: Research And Planning](../design-briefs/archived/base-skills-research-and-planning.md) | Unarchived/incomplete | Canonical-looking files are present locally, but no archived, complete OpenSpec implementation change proves delivery of the three-skill planning path. |
| [Base Skills: Implementation Quality](../design-briefs/archived/base-implementation-quality.md) | Unarchived/incomplete | `base-code-review` and `base-verification-loop` files are present locally, but no completed lifecycle change proves the brief's acceptance and evaluation commitments. |
| [Standards-Driven Quality Skills Program](../design-briefs/standards-driven-quality-skills.md) | Partially enabled, program incomplete | Contracts, authoring, and independent review prerequisites are complete, but the standards-pack convention, shared quality base, and stack overlays are not delivered as the program requires. |
| [Authorized Degraded Independent Review](../design-briefs/archived/authorized-degraded-independent-review.md) | Design only | The current strict protocol remains fail-closed; no authorized fallback change has been accepted or completed. |
| [Claude Cross-Tool Repo Gap Inventory](../design-briefs/claude-cross-tool-repo-gap-inventory.md) | Design only | It explicitly records that none of its proposed fixes has been implemented; several scope decisions remain. |
| [React Native and Expo Quality Skills](../design-briefs/react-native-expo-quality-skills.md) | Owner-approved, not implemented | The owner accepted the asset shape, repository-selected compatibility/commands, evidence ladder, security model, and shared context policy. It is ready for Explore, not implementation. |

## Dependency and delivery rules

- Each candidate below is one bounded vertical slice: one primary issue, one
  OpenSpec change, one reviewable implementation PR, then Verify, Sync, and
  Archive. Do not turn a milestone into one giant change.
- A slice is ready for Propose only after it has an outcome, explicit scope and
  non-goals, acceptance evidence, source paths, delivery profile, hard
  dependencies, shared-resource hazards, and a first action. A missing item is
  a pause, not a guessed task.
- Use `production-rapid` for reusable quality capabilities and for any
  job-search capability that can touch personal data, external records, or a
  submission path. Those slices require exact-head CI and the existing strict
  isolated independent review. Planning-only research/brief work may use
  `prototype-rapid` with no external mutation.
- Normal interactive merge, merged-branch cleanup, and Archive remain
  just-in-time approval actions. A profile never supplies that authority.
- The global skills repository must not absorb product-specific job-search
  records, personal data, credentials, OAuth configuration, or application
  submission logic. Those belong to the job-search product repository and its
  product-owned configuration.

## Recommended milestone order

### Milestone 1 — Shared acceleration foundation

**Outcome:** both user cases can consistently research, plan, generate,
review, and verify bounded changes using one quality/context model.

| Priority | Proposed candidate change | Scope and non-goals | Depends on | Acceptance evidence | Profile / first action |
| --- | --- | --- | --- | --- | --- |
| P0 | `deliver-research-and-planning-base-skills` | Deliver `research-topic-workflow`, `design-brief-from-research`, and `sdd-requirements-to-plan`, including thin adapters and portable synthetic evals. Do not create product plans or issues as a side effect. | Completed contracts/guardrails and authoring skill. Reconcile the local unarchived target-owned files first. | All three canonical skills, adapters, result/config validation, trigger/non-trigger and portable fixture coverage; strict validation. | `production-rapid`; **Explore** using the research-and-planning brief and current local files. |
| P0 | `establish-shared-quality-context-and-standards-pack` | Define the reusable standards-pack selection/conflict contract and `skills/base/_shared/context-management.md`; publish the concise root README explanation. Do not implement any language/stack overlay. | Completed contracts/guardrails and authoring skill; coordinate with the preceding slice if it changes shared authoring validation. | Generation/review/verification select one shared synthetic rule set; repository override and unselected-stack cases pass; every quality entrypoint links to the one context policy; README links without duplicating policy. | `production-rapid`; **Explore** from the standards-driven and RN/Expo briefs. |
| P0 | `deliver-implementation-quality-base` | Deliver `base-code-review` and `base-verification-loop` with their existing severity, evidence, correction, and strict-review boundaries. Do not implement stack-specific rules or replace OpenSpec Verify/CI. | Completed contracts, authoring, and isolated independent review; shared context policy should land first if the skills must link to it. Reconcile existing unarchived target-owned assets. | Deterministic result validation; complete review/verification fixture matrices; no-auto-fix and correction-limit coverage; thin-adapter parity; strict independent review evidence. | `production-rapid`; **Explore** from the implementation-quality brief. |

`deliver-research-and-planning-base-skills` can start before the two quality
slices. The standards-pack and implementation-quality slices share canonical
quality directories and validation surfaces, so run them sequentially unless a
reviewed shared-resource analysis proves a safe partition.

### Milestone 2 — Direct mobile and job-search acceleration

**Outcome:** the mobile project can consume relevant quality standards, while
the job-search product has a safe, implementable workflow plan. The two tracks
are independent after Milestone 1 and may proceed in parallel because their
product repositories and assets differ.

| Priority | Proposed candidate / planning deliverable | Scope and non-goals | Depends on | Acceptance evidence | Profile / first action |
| --- | --- | --- | --- | --- | --- |
| P1 | `add-typescript-quality-overlay` | Create the TypeScript-first standards/review overlay and JavaScript compatibility mode needed by React Native/Expo. Do not force TypeScript migration or implement React Native/Expo-specific rules. | Milestone 1 shared pack and quality base; official TypeScript source refresh. | Shared-pack selection works for TS and configured JS; type/async/error/test fixtures; generation-review-verification handoff; no global command/version assumption. | `production-rapid`; **Explore** from the standards-driven brief and source baseline. |
| P1 | `add-react-native-expo-quality-overlays` | Implement the owner-approved React Native core and additive Expo overlays, selected standards references, context policy links, and mobile synthetic fixtures. Do not add an app, install a tool, access EAS/store accounts, or claim native evidence without it. | Milestone 1, TypeScript overlay, and the owner-approved [RN/Expo brief](../design-briefs/react-native-expo-quality-skills.md). | Plain RN versus Expo selection; platform/permission/config/update/security redaction fixtures; unavailable runtime evidence is a gap; same selection record reaches generation, review, and verification. | `production-rapid`; **Explore** with target mobile repositories, pinned SDKs, commands, and device evidence inputs. |
| P1 | Job-search product design brief and requirements package *(product repository; no global OpenSpec change yet)* | Turn existing job-search research into a product-owned, supervised workflow brief: record identity, tracker ownership, lead sources, human review gates, PII/credential limits, and final-submission approval. Do not automate login, OTP/MFA, self-identification, or submission. | Milestone 1 planning skills; existing job-search research; owner selects the product repository and connectors/scopes. | Accepted product brief and requirements; explicit data/authority matrix; source and tracker contract; each later product slice has observable outcomes. | Planning-only `prototype-rapid`; use **design-brief-from-research**, then **sdd-requirements-to-plan**. |

### Milestone 3 — Product workflow slices and selected full-stack support

**Outcome:** turn the accepted product designs into direct value without
guessing a backend or granting unsafe job-search authority.

| Priority | Proposed candidate change | Scope and non-goals | Depends on | Acceptance evidence | Profile / first action |
| --- | --- | --- | --- | --- | --- |
| P1 | `add-job-search-lead-intake-and-tracker-contract` *(product repository)* | Acquire and normalize verified job leads, deduplicate them, and safely update the owner-selected tracker under explicit permissions. Do not apply to jobs or infer pursuit decisions. | Accepted job-search brief/plan and configured tracker connector. | Synthetic lead/source/dedup fixtures; tracker field ownership and transactional recovery; no credentials/PII in reusable assets; human decision boundary preserved. | `production-rapid`; product-repository **Explore**. |
| P1 | `add-job-application-fit-and-preparation` *(product repository)* | Produce evidence-backed fit analysis and draft tailored materials for owner review. Do not submit, claim unsupported experience, or alter the tracker without the defined approval. | Lead/tracker contract and accepted product plan. | Source-grounded fit/preparation fixtures; sensitive-data handling; explicit human approval and correction flow. | `production-rapid`; product-repository **Explore**. |
| P2 | `add-supervised-job-application-assistance` *(product repository)* | Navigate official ATS paths, prepare non-sensitive fields/materials, validate them, and pause for per-application approval before final submission. Do not hold credentials, bypass OTP/MFA, answer self-ID questions, or auto-submit. | Fit/preparation capability, product connector decisions, and per-application human approval model. | End-to-end synthetic ATS-state fixture; idempotent tracker recovery; explicit final-submit stop; audit evidence for every approval boundary. | `production-rapid`; product-repository **Explore**. |
| Conditional P1 | `add-java-spring-quality-overlay`, `add-react-web-quality-overlay`, or `add-terraform-static-quality-overlay` | Implement only the overlay selected by the mobile application's actual services, admin-web, or infrastructure stack. Terraform remains static/local only. Do not choose the mobile product architecture from this roadmap. | Milestone 1; target stack/version and official-source refresh. | Stack-specific fixture matrix from the standards program; repository-selected toolchain; no product constants or real cloud plan/state. | `production-rapid`; **Explore** only after the target stack is known. |

The existing installed `job-search-post-review` capability can remain the
bridge for post-decision pipeline maintenance. It is not evidence that the
product repository has delivered lead intake, fit/preparation, or supervised
application assistance.

### Milestone 4 — Reliability and optional fallback work

**Outcome:** improve cross-assistant consistency and address only demonstrated
strict-review availability problems after the high-value user paths exist.

| Priority | Proposed candidate change | Scope and non-goals | Depends on | Acceptance evidence | Profile / first action |
| --- | --- | --- | --- | --- | --- |
| P2 | `close-accepted-claude-cross-tool-gaps` | Address accepted inventory fixes, beginning with root `CLAUDE.md` thin import and dynamic adapter-drift coverage. Split live-CLI sandbox validation into its own slice if required. Do not alter OpenSpec-generated assets manually. | Owner resolves the inventory's remaining OpenSpec-generated-pair and live-CLI scope questions. | Claude/Codex instruction parity, dynamic inventory tests, valid tool-policy behavior, and targeted live validation evidence where selected. | `production-rapid`; **Explore** from the Claude inventory. |
| P3 | `add-authorized-degraded-independent-review` | Add a narrowly authorized, expiring fallback only when strict isolated review is demonstrably unavailable for an otherwise valid run. Do not weaken the default fail-closed protocol. | Evidence of repeated strict-review unavailability and explicit owner acceptance of the fallback brief. | Authorization, expiry, sealed-package, correction-envelope, and fail-closed fixtures; strict path remains default. | `production-rapid`; **Explore** only when the trigger is real. |

## Recommended first action

Start with `deliver-research-and-planning-base-skills` if the unarchived files
are confirmed target-owned and complete enough to recover. It accelerates both
user cases immediately: it makes the job-search product brief/plan path
repeatable and makes every mobile/full-stack change enter the same reviewed SDD
flow. If recovery shows that work belongs to another in-flight effort, do not
take it over; start `establish-shared-quality-context-and-standards-pack`
instead.

After that, prioritize the mobile TypeScript and React Native/Expo path and the
job-search product brief in parallel. This provides direct value quickly while
keeping the irreversible or sensitive job-application actions behind explicit
human approval.

## Readiness checklist for the next slice

Before proposing the selected candidate, confirm:

- a named target repository and bounded change scope;
- the exact source brief, research, living specs, and target configuration;
- acceptance evidence and test/eval fixture scope;
- selected profile, strict-review availability, and expected delivery gates;
- known shared directories/worktrees and ownership of any local unarchived
  assets; and
- no unresolved material product, security, compatibility, connector, or
  external-authority decision.

If any item is absent, use Explore or planning work to resolve it; do not
create partial OpenSpec or GitHub tracking records.
