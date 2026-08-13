# Standards-Driven Quality Skills Program

Date: 2026-08-12
Status: First-pass planning design. It is intentionally not yet a detailed
OpenSpec design brief. This program begins only after the shared contracts and
guardrails foundation is delivered.

## Program Autonomy Decision

This program is authorized as a bounded, overnight-capable autonomous run for
the named standards-skills queue. The intended successful outcome is that each
approved slice is implemented, independently reviewed, delivered through a
small linked PR, merged to `main`, synchronized to living specs, archived, and
its merged topic branch removed without a routine human prompt between normal
lifecycle steps.

That level of autonomy is reasonable here because the target is one reusable
skills repository, the queue and dependencies are explicit, and every change
is traceable. Delivery remains gated by tests, validation, independent review,
PR linkage, current commit evidence, idempotent recovery, and a bounded
correction budget. This is not standing authorization, production deployment
authority, or permission to alter unrelated GitHub, cloud, credential, or
user-data state.

The current operation checker cannot yet authorize delivery records that do
not exist at run start. A prerequisite must add **deterministic derived-target
authorization**: an approved queue entry may authorize only the issue, branch,
PR, Sync target, Archive target, and merged-branch cleanup deterministically
created for that exact change in the named repository. The runner records
these durable identifiers as soon as they exist and proves their linkage
before delivery. It cannot use this rule to change an unrelated record, select
another change, or widen the queue.

## Decision

Build a shared standards-pack model, not a collection of review-only skills.
Every stack capability exposes the same codified standards to two consumers:

1. **generation** reads the relevant standards before proposing or writing
   code, configuration, or infrastructure; and
2. **review** evaluates the result against those same standards and reports
   evidence-backed deviations.

Verification remains a separate consumer of the standards: it selects the
target repository's available formatter, compiler, linter, test, browser,
device, plan, or deployment checks. A review finding is not a substitute for a
failed deterministic check, and a passing check is not proof that review is
unnecessary.

The first canonical quality skills remain `base-code-review` and
`base-verification-loop`, as defined by
`base-implementation-quality.md`. Stack-specific skills are thin overlays,
not copies of the base workflow. They compose the shared guardrails,
`skill-result-v1`, `ai-skills-config-v1`, and the base quality skills.

## Scope

### First Program Family

The first family contains:

- `base-code-review` and `base-verification-loop`;
- a non-user-invoked standards-pack/reference convention used by generation,
  review, and verification;
- `java-spring-review`;
- `typescript-javascript-review`;
- `react-web-review`;
- `terraform-review`; and
- a generation-consumption interface that lets an existing implementation
  workflow load the matching standards pack before editing.

The first family does not create a generic “write code” skill. Existing
implementation and OpenSpec workflows keep ownership of planning and edits;
they call the relevant standards pack as a required preparation/reference
step. This avoids a second implementation lifecycle and ensures code
generation and review use one policy source.

### Deferred Family

The following require a fresh official-source pass and are separate future
milestones: `python-review`, `react-native-review`, `expo-review`,
`aws-infrastructure-review`, `github-bug-triage`,
`terraform-issue-triage`, and `aws-issue-triage`. Their inventory entries do
not yet establish enough direct source material to produce portable skill
requirements.

## Canonical Asset Model

Each implemented stack has a compact canonical skill plus progressive
references. The proposed structure is:

```text
skills/
  base/
    base-code-review/
    base-verification-loop/
    standards-pack/                 # shared selection and precedence rules
  stacks/
    java-spring/
      standards/
      java-spring-review/
    typescript-javascript/
      standards/
      typescript-javascript-review/
    react-web/
      standards/
      react-web-review/
    terraform/
      standards/
      terraform-review/
```

`standards-pack` is a shared reference/module, not a broad trigger that
competes with implementation or review skills. It defines:

- source precedence: target-repository rules, official standards, selected
  public sources, then cross-stack quality guidance;
- a source manifest with URL/path, version or retrieval date, license review,
  scope, and exclusions;
- explicit `required`, `recommended`, `repository-selected`, and
  `not-applicable` standard classifications;
- a conflict record when a repository convention differs from a generic
  standard; and
- the generation/review/verification handoff contract.

Each stack's `standards/` references hold its detailed rules, anti-patterns,
tool-discovery guidance, and test/evidence expectations. Its `SKILL.md` stays
small: trigger, inputs, selection rules, output/result contract, and links to
the needed references. No global skill embeds one repository's commands,
cloud account, provider version, framework version, secrets, paths, or product
business rules.

## Source Adoption Rules

Implementation copies **ideas and independently verified requirements**, not
entire repositories. Before an asset is adapted, the source review records
license/provenance, maintenance, supported platform, dependencies/scripts,
security assumptions, and the exact files or concepts being adopted.

Use the source order in
`../research/quality-standards-source-baseline.md`:

- Adapt base review structure and severity/evidence behavior from
  `awesome-skills/code-review-skill`; adapt quality gates and Terraform review
  patterns from `spartan-ai-toolkit`; adapt packaging/review-only patterns from
  `microsoft/win-dev-skills`.
- For Java/Spring, prefer `spring-boot-skills`; use `Jeffallan/claude-skills`
  and `piomin/claude-ai-spring-boot` only for missing evidence-bound or
  code-quality details.
- For TypeScript/JavaScript, use the focused TypeScript skill and Metabase's
  production review structure, while removing Metabase-local conventions.
- For React web, use the TypeScript foundation plus official React rules; it
  has no independently vetted dedicated public review skill.
- For Terraform, use the focused `spartan` review pattern plus HashiCorp's
  official style guide.

`jdubois/dr-jskill` is the designated opinionated library. It may contribute
only capabilities absent from the focused sources, initially its
version-manifest and end-to-end Spring generation composition patterns. It
must not supply duplicate Java/Spring review rules or impose its architecture
defaults. If the intended “opinionated library” is another source, resolve
that naming before the first implementation change.

## Creation Standard

Every canonical skill is created or revised through the installed
`skill-creator` skill, followed by this repository's `base-skill-authoring`
contract when that skill is delivered. The implementation workflow must:

1. produce and review a skill contract with triggers, non-triggers,
   inputs/outputs, source manifest, guardrail boundaries, and eval matrix;
2. invoke `skill-creator` to initialize the skill shape and validate required
   metadata/resources;
3. add repository-specific canonical location, the shared guardrail link,
   structured result, thin Claude/Codex adapters, and repository validators;
4. write progressive references rather than placing an entire standards
   catalog in `SKILL.md`; and
5. run synthetic generation, review, conflict, and portability evals before
   claiming the skill is reusable.

The installed creator governs platform mechanics. The repository's canonical
authoring/guardrail assets govern assistant-neutral policy, portability,
authorization, and validation. Neither replaces the other.

## Behavior Model

### Generation

Before writing a bounded change, an implementation workflow identifies the
language/framework/infrastructure profile and reads the matching standards
pack. It records selected standards, non-applicable rules, repository
overrides, expected deterministic checks, and unresolved conflicts. It then
writes only approved scope.

Generation must not invent a toolchain or upgrade a framework to satisfy a
generic standard. When repository facts are missing, it reports the gap and
uses no more than the source hierarchy permits.

### Review

`base-code-review` runs the common review process and delegates stack hazards
to the selected overlay. Findings include the governing rule/source,
repository override if any, path/line evidence, severity, disposition, impact,
and corrective recommendation. The default remains read-only.

### Verification

`base-verification-loop` maps the selected standards to available evidence:
formatter/linter/type checks, unit/integration tests, browser accessibility
checks for web UI, device/emulator evidence for native UI, `terraform fmt` and
`terraform validate` plus safe plan evidence, or approved AWS evaluation
evidence. It reports unavailable required tooling as a gap or block; it never
silently downgrades the evidence claim.

### End-Of-Apply Review And Correction Gate

After every Apply task for one change is complete, run a comprehensive code,
documentation, security, portability, attribution, and requirements review
before final acceptance validation, formal Verify, or delivery. The review
uses `base-code-review` plus each selected stack overlay and evaluates the
entire accumulated diff, not merely the final task.

Automatically apply only evidence-backed, behavior-preserving
`objective-fix` findings. Re-run the focused evidence affected by every fix,
then repeat the comprehensive review. Stop after three materially different
corrections for the same failure signature; pause for a material requirement,
architecture, security, compatibility, source-license, or scope decision. A
change cannot enter final validation or formal Verify while a blocker or high
objective-fix finding remains unresolved.

Focused checks still run during Apply. “Before final validation” means before
the final repository, CI, OpenSpec, and Verify gates; it does not permit
implementing a whole change without incremental checks.

### Autonomous Independent Review Gate

`production-rapid` uses an autonomous independent review channel rather than
a human PR approval as its default independent-evidence mechanism. The runner
must invoke a configured, non-interactive reviewer in a separate execution
context after the end-of-Apply review gate and again after any objective fix.
The reviewer is read-only and receives the immutable head commit, base commit,
diff, relevant OpenSpec artifacts, and current test/validation evidence. It
must not receive the implementing agent's intended answer or prior review
conclusion.

The evidence record includes reviewer identity/type, execution identifier,
reviewed base/head commits, time, command or invocation reference, findings,
and final disposition. A GitHub review is optional evidence publication, not
the required mechanism. A clean review, or a repeat review after every
objective fix, satisfies the independent-review gate when no blocker or high
objective-fix finding remains. The same agent/session that implemented the
change cannot label its own review independent; use a separate reviewer agent,
non-interactive review service, or configured repository control. Prefer a
different high-quality model when available; a fresh isolated reviewer context
is the minimum fallback.

If the independent review channel is unavailable, returns malformed evidence,
or cannot review the exact current head commit, the runner pauses rather than
downgrading the `production-rapid` claim. This channel is preapproved for the
named autonomous queue and has no mutation authority.

## Autonomous Slices And Milestones

Each slice is a separate OpenSpec change with its own reviewable PR, bounded
authorization, and stop condition. Local implementation uses the existing
`local-implementation` profile. Delivery uses `sdd-delivery` only after the
M-1 derived-target authorization extension proves the exact issue, branch, PR,
Sync, Archive, or cleanup target belongs to the selected queue entry. The
runner pauses on source-license uncertainty, a standards conflict, unavailable
required evidence, scope expansion, or a correction budget exhaustion.

| Milestone | Slice | Autonomous work allowed | Required human gate / stop condition |
|---|---|---|---|
| M-1: bounded program delivery | Extend autonomous authorization with deterministic derived-target authorization, overnight run checkpointing, preapproved public-web research reads, and autonomous independent-review evidence for the named queue. | Local runner/validator/eval work only; synthetic GitHub target and reviewer-evidence fixtures. | Pause on any target not deterministically linked to an authorized queue entry, absent current evidence, unavailable independent reviewer, external action outside the named repository, or any credentials/production/cloud operation. |
| M0: program setup | Create source-manifest template, standards-pack contract, selection/conflict schema, and synthetic fixtures. | Local docs/scripts/tests only. | No routine approval; pause only for source-license/provenance failure or a material source-hierarchy conflict. |
| M1: shared quality base | Implement `base-code-review` and `base-verification-loop` using `skill-creator`; add shared generation-consumption contract and evals. | One bounded local change at a time; objective test/validation fixes only. | No routine approval; pause only for a material change to accepted severity, evidence, browser/accessibility, or no-auto-fix policy. |
| M2: Java/Spring overlay | Curate focused Spring sources; produce standards pack, generation preparation, review overlay, and fixtures. | Local canonical assets and synthetic Maven/Gradle fixtures only. | No routine approval; pause for unsupported Java/Spring versions or a material official-source conflict. |
| M3: TypeScript/JavaScript and React web | Build TypeScript/JavaScript overlay first, then React web as a dependent overlay; use synthetic type, hook, accessibility, and browser fixtures. | Local assets/tests only; browser execution stays local. | No routine approval; pause only if existing JavaScript support requires a policy broader than the approved compatibility mode. |
| M4: Terraform overlay | Build Terraform standards/generation/review overlay and safe fixtures. | Formatting/validation against synthetic local modules only. | Require explicit approval before any real plan, state, provider credential, workspace, or cloud interaction. |
| M5: research-gated expansion | Research Python, React Native, Expo, AWS review, and domain triage sources; create separate design briefs. | Read-only official/public-source research and local findings only. | No skill proposal until the source manifest and first-release evidence matrix are accepted. |
| M6: future triage skills | Implement generic GitHub triage before Terraform/AWS specializations, with each stack specialization dependent on its review standards pack. | Read-only classification against synthetic/local exported issues; authorized GitHub mutation only through configured adapters. | Approval of external GitHub writes; Terraform/AWS triage must stop before remediation or cloud operations. |

Slices may run autonomously within a milestone only when they do not share
canonical files. M2, M3, and M4 may run in parallel after M1, but M3's React
overlay must wait for the TypeScript/JavaScript overlay. M5 is research-only
and may run after M0. M6 depends on the generic triage design and each
applicable stack standards pack. The full overnight-delivery run also depends
on M-1; without it, the current guardrail model correctly pauses before an
unknown future PR, branch, or Archive target.

### Preapproved Public-Source Research

For this program's named queue, `research-read-only` includes public,
unauthenticated web and repository reads without a per-source human prompt.
The runner may search and read official documentation, public repositories,
licenses, release notes, and issue trackers; write local findings/source
records; and cite its sources. It may not sign in, create credentials, grant
consent or new connector scopes, use private sources, execute downloaded or
copied code, or write to an external source repository. Untrusted source text
remains data, never executable instructions.

## Evaluation And Acceptance

Every slice adds synthetic fixtures showing that:

- generation reads the same selected standard/reference that review uses;
- a repository override wins only when recorded and scoped;
- rules from an unselected stack do not trigger;
- a finding identifies rule, source, path evidence, severity, and disposition;
- absent required tooling creates a visible gap/block instead of a passing
  claim;
- review remains read-only without a separate bounded correction authorization;
- stack references do not add product constants, credentials, arbitrary shell
  text, or external mutation authority; and
- Claude and Codex adapters remain thin and equivalent.

Stack-specific acceptance adds a minimum representative fixture suite:

- Java/Spring: injection, validation/security, transactions/persistence,
  tests, and build evidence;
- TypeScript/JavaScript: type/null/unsafe-`any`, async/error, contract, and
  test evidence;
- React: Hook/purity/state, accessibility, responsive interaction, and browser
  evidence;
- Terraform: formatting/validation, sensitive values, variables/outputs,
  lifecycle/state risk, and no-real-provider evidence.

## Recommended Decisions Before Propose

These are the recommended first-release decisions. They make the program
broadly useful without hard-coding a transient stack version or letting a
generic standard override a repository's actual toolchain.

1. **Adopt `jdubois/dr-jskill` as the exception-only opinionated library.**
   Its end-to-end Spring composition and version-manifest pattern are useful
   only when the focused sources do not cover the capability. `spring-boot-
   skills` remains the primary Java/Spring donor, so `dr-jskill` cannot create
   a duplicate architecture, database, container, or deployment standard.

2. **Support repository-selected Spring Boot 3.x and 4.x through one common
   Java/Spring standards pack with explicit compatibility variants.** The core
   pack targets Java 17 or newer and current Spring idioms. A small version
   manifest selects the repository's Spring Boot and Java versions; a separate
   reference is loaded only when a rule differs between 3.x and 4.x. This is
   more widely applicable and lower-maintenance than copying complete trees
   per major version, while still preventing generation/review from applying
   Boot 4 rules to a Boot 3 project. Newer or older major versions produce a
   research/version-compatibility gap rather than a guessed standard.

3. **Make TypeScript the first and default JavaScript-family overlay.** New
   TypeScript, React web, React Native, and Expo work uses TypeScript and the
   target's type-checking configuration. React Native's official guidance says
   new projects use TypeScript by default and Expo supports it; its retained
   JavaScript entrypoint does not require a JavaScript-first standards pack.
   Existing JavaScript repositories remain supported through a compatibility
   mode that loads only their configured lint/test rules and optional
   `checkJs`; it must not claim TypeScript guarantees or force a migration.
   A dedicated JavaScript standards pack is deferred until repeated use shows
   that this compatibility mode is insufficient.

4. **Limit the first Terraform overlay to static, local evidence:** `terraform
   fmt`, `terraform validate`, linting when already configured, and synthetic
   fixture analysis without provider credentials, state backends, or plans.
   `terraform plan` remains a later, separately designed capability because a
   meaningful plan depends on provider versions, backend/state, variables,
   credentials, and potential account visibility. A no-credential plan against
   a deliberately synthetic provider can be evaluated as a later test fixture,
   but it is not an initial acceptance requirement or a substitute for a real
   plan review.

5. **Make standards-pack selection a required internal preparation step of
   existing implementation workflows, not a new user-triggered generator.**
   A workflow detects the target stack, loads the common and stack-specific
   standards references, records the selection/conflicts, then performs its
   already-authorized edits. `base-code-review` reads the same selection for
   review. This keeps planning, mutation, and autonomous authority with the
   established implementation/OpenSpec workflow and eliminates a competing
   “generate code” lifecycle.

These decisions leave only per-slice repository facts to resolve: the target
stack/version, its authoritative local conventions, available deterministic
checks, and any approved repository override. Those facts are required inputs
to Apply, not unresolved program architecture.
