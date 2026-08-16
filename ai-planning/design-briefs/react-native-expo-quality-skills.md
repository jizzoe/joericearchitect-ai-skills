# React Native and Expo Quality Skills

Date: 2026-08-15
Status: Owner-approved direction; ready for OpenSpec Explore. Each future
change still requires explicit target-repository facts and normal SDD gates.

## Problem and desired outcome

The standards-driven quality program deliberately deferred React Native and
Expo until an official-source research pass existed. That pass is now available
in [React Native and Expo Quality Research](../research/mobile/react-native-expo-quality/react-native-expo-quality-findings.md)
with a dated [source manifest](../research/mobile/react-native-expo-quality/sources.md).

Future code generation, local code review, pull-request review, and
verification need the same portable, repository-aware quality guidance. They
must cover React correctness and mobile-specific concerns without treating a
web check as native evidence, imposing an Expo workflow on plain React Native,
or hard-coding one product's SDK, commands, accounts, devices, or security
policy.

The desired outcome is a coordinated React Native/Expo standards pack and
thin review overlays that:

- select repository-owned rules before official framework/platform guidance;
- give generators, reviewers, and verifiers one consistent selected standard
  set for each bounded change;
- distinguish defects from configuration gaps and unavailable runtime evidence;
- preserve the canonical `base-code-review`, `base-verification-loop`,
  `skill-result-v1`, guardrail, and independent-review contracts; and
- remain economical enough to be loaded routinely for generation and every
  bounded review without consuming a full mobile handbook as context.

## Evidence and key findings

The research is the primary evidence record; this brief links to it rather
than repeating vendor documentation. Its central, evidence-derived findings
are:

1. The target repository's pinned React Native/Expo SDK, package manager,
   TypeScript policy, native directories, platform targets, and configured
   commands are the first authority. A portable skill cannot prescribe a
   dependency version, router, formatter, EAS use, build provider, or command.
2. Static checks establish limited evidence. Repository-configured formatting,
   linting, type checking, tests, and Expo Doctor can find declared or static
   issues, but cannot prove native permission behavior, accessibility with
   TalkBack/VoiceOver, release performance, update compatibility, or store
   policy compliance.
3. React Native requires platform-aware review. Platform divergence may be
   intentional, but changes to native modules, permissions, deep links,
   platform branches, or native interaction require both-platform reasoning
   and suitable Android/iOS evidence when applicable.
4. Expo has conditional delivery surface: resolved app configuration, config
   plugins/CNG, native dependency compatibility, development builds, EAS
   environment visibility, runtime versioning, updates, signing, and app
   versioning are relevant only when the repository and changed paths enable
   them.
5. Client code and public app configuration are observable to app users.
   Review must redact suspected credentials and never mistake a naming
   convention or an EAS secret classification for proof that a client-bundled
   value is safe.
6. Performance and native accessibility claims need scoped runtime evidence.
   Development-mode results and web-only scans cannot establish release-like
   mobile behavior; unavailable simulator, device, build, or account evidence
   must remain a gap, not a pass.
7. The context policy is independently consistent with current primary-source
   context-engineering guidance: preserve lightweight identifiers, retrieve
   details just in time, use progressive disclosure, and keep the smallest
   high-signal context that supports the decision. See Anthropic's
   [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
   (consulted 2026-08-15). This source informs context packaging only; the
   React Native and Expo manifest remains authoritative for mobile rules.

The source hierarchy and portability rules already accepted for this repository
are in [Quality Standards Source Baseline](../research/quality-standards-source-baseline.md)
and [Standards-Driven Quality Skills Program](standards-driven-quality-skills.md).
The latter names React Native and Expo as research-gated future work and
requires a shared standards-pack model rather than isolated review skills.

## Options considered

### One generic mobile review skill

This minimizes initial files but mixes framework selection, Expo-specific
delivery logic, and generic review ownership. It would either load too much
context for ordinary React Native changes or hide conditional Expo boundaries.
It also invites duplication of base-review policy.

### Separate, independent React Native and Expo quality skills

This gives strong discoverability, but two separate standards sources would
drift: generator, reviewer, and verifier could select inconsistent React,
native, and Expo rules. It also duplicates the overlapping React Native core
that Expo applications use.

### Selected recommendation: shared mobile standards pack with thin React Native and Expo overlays

Create one selected standards set with an additive Expo overlay. The React
Native overlay owns framework and Android/iOS cross-platform concerns; the
Expo overlay adds only enabled Expo, CNG/config-plugin, development-build, or
EAS/update concerns. Both delegate review process and verification lifecycle
to the existing base skills.

This preserves source precedence, gives plain React Native repositories a
small relevant context, and lets an Expo repository receive additional checks
without pretending Expo is merely a cosmetic wrapper.

## Accepted design and owner decisions

The owner accepted the following evidence-derived recommendations on 2026-08-16.
They are the program-level direction for a future OpenSpec Explore and Propose;
they do not authorize implementation, external account access, or invented
target-repository facts.

### Canonical assets and ownership

The proposed canonical shape is:

```text
skills/
  base/
    standards-pack/                         # existing/shared convention owner
    _shared/
      context-management.md                 # proposed global quality-policy owner
  stacks/
    react-native-expo/
      standards/
        selection-and-precedence.md
        core-react-native.md
        expo-delivery.md
        evidence-ladder.md
        context-selection.md
      react-native-review/
        SKILL.md
      expo-review/
        SKILL.md
```

The exact directory names remain a proposal until the program owner accepts
them. If the shared `standards-pack` is not yet present at implementation time,
the dependency must be delivered first rather than recreated inside this
family.

### Global context-management policy and README publication

**Owner decision:** every quality skill must follow one global,
context-efficient policy rather than repeat an overlay-specific token strategy.
The later implementation creates `skills/base/_shared/context-management.md`
as the sole canonical policy source, alongside the existing shared guardrails.
It defines the selector-first model, progressive-reference rules, compact
selection-record shape, cache/invalidation boundary, bounded tool-output
requirements, evidence/rule-ID handoff, and prohibited duplicated context.

`base-code-review`, `base-verification-loop`, the shared standards-pack, and
every future quality overlay link to that reference before their required final
`## Guardrails` section. They may name only stack-specific selectors or
exceptions locally; they must not copy the global policy. This establishes one
implementation-time policy edit for every quality capability.

The root [README](../../README.md) publishes a concise **“Quality skills and
context management”** section immediately after its existing skill-authoring
link. It explains the selection-record/progressive-disclosure model for users
and links to the canonical policy; it is intentionally a short overview, not
a second policy definition. Therefore, a future global policy change requires
only two deliberate documentation updates: the canonical shared reference and
the README summary/link. Thin Claude/Codex adapters continue to point to their
canonical skills and carry no copied policy.

- `standards/` is non-user-invoked reference material. It defines source
  precedence, manifest references, rule identifiers, applicability, evidence
  boundaries, and selection metadata. It is the only mobile quality-policy
  source consumed by generation, review, and verification.
- `react-native-review` is a thin, read-only stack overlay. It is selected for
  a bounded React Native change after the base review skill and standards-pack
  selector identify React Native.
- `expo-review` is an additive thin overlay, selected only where Expo-owned
  configuration or dependencies are present or changed. It is not a separate
  general review workflow and it must not run for a plain React Native project.
- `base-code-review` remains the sole owner of finding order, severity,
  disposition, evidence gaps, read-only behavior, and `skill-result-v1`
  rendering. The overlays supply mobile rule selection and mobile-specific
  coverage only.
- `base-verification-loop` remains the sole owner of implementation evidence,
  correction limits, readiness, and `production-rapid` strict independent
  review. The mobile standards only map selected changed surfaces to eligible
  repository-declared evidence.

As required by [Skill Authoring](../../docs/skill-authoring.md) and the
[base-skill-authoring contract](../../skills/base/base-skill-authoring/references/contract-package.md),
each future canonical overlay uses unique lower-case kebab-case metadata, a
single shared-guardrail link, thin Claude/Codex adapters, `skill-result-v1`,
workspace-relative/configured values, and synthetic portable evaluations.

### Repository and source selection

For every bounded generation, local review, PR review, or verification request,
the caller first derives a compact selection record from repository-owned
facts:

- declared React Native and Expo SDK versions, package manager, TypeScript or
  JavaScript policy, platforms, native-directory/CNG state, EAS/update state,
  and project configuration;
- changed paths and changed surfaces (for example component, Hook, list,
  image, permission, deep link, app config, config plugin, native module,
  runtime version, update, signing, or dependency); and
- trusted repository-declared commands and available evidence already bound to
  the change.

The selection record applies this fixed precedence:

1. explicit, versioned target-repository conventions and toolchain;
2. applicable official source in the dated mobile manifest;
3. the selected repository-wide standards-pack convention; and
4. cross-stack quality patterns.

An override is valid only when it is explicit, scoped, and recorded. A
conflict, absent version, or missing repository policy is a gap or
`human-decision`; it is not permission to invent a command, install a package,
upgrade an SDK, or assert compliance.

### Rule and evidence model

Each mobile rule is compactly represented by a stable rule ID, short statement,
applicability selector, source-manifest reference, evidence boundary, and
classification: `required`, `recommended`, `repository-selected`, or
`not-applicable`. Detailed rationale stays in progressive reference files.

The first release should cover the following selected areas without turning
each into an unconditional release gate:

| Selected surface | Review focus | Required evidence boundary |
| --- | --- | --- |
| React component or Hook | purity, Rules of Hooks, immutable inputs, render side effects, state/update/error behavior | source and repository-configured static/test evidence; runtime claim only when available |
| Platform divergence, native module, deep link | explicit platform intent, affected Android/iOS branch, error/recovery behavior | suitable affected-platform observation when behavior changes materially |
| List, image, animation, navigation, startup, high-frequency input | scenario-specific resource/frame/startup risk; no speculative tuning | release-like measurement or observation only when a performance claim/risk is in scope |
| Interactive native UI | labels, roles/states, loading/error feedback, focus and platform interaction | TalkBack/VoiceOver or configured native evidence for material interaction changes; web scans are supplemental only |
| Client config, credentials, auth, storage, network, permissions | public-value exposure, least privilege, data sensitivity, safe native/config boundary | redacted source/config evidence; never reveal or exercise a suspected secret |
| Expo config, CNG/plugins, native dependency, SDK update | resolved configuration, compatibility, generated native boundary | repository-configured Expo checks and development/release build evidence when applicable |
| EAS Update/runtime version/signing/channel | binary/update compatibility and explicit delivery intent | compatible binary/update evidence; account, publish, and credential operations remain owner-controlled |

Findings must use the existing base review taxonomy. A source-proven defect has
repository-relative evidence and an applicable rule. Missing configuration,
missing platform runtime evidence, or an unconfigured command is an evidence
gap or `not-configured`, not an invented failure. Style preference alone is
advisory and cannot become a strict independent-review blocker.

### Generation, review, and verification handoff

Before editing, a generator reads only the selection record and the applicable
progressive references. It records selected rules, repository overrides,
not-applicable rules, known gaps, and expected checks; then it makes the
smallest approved change. It must preserve a JavaScript repository's approved
configuration rather than silently migrating it to TypeScript, avoid disabling
type/lint rules without repository-owned justification, avoid embedding
secrets, and avoid adding a formatter, EAS project, native dependency, signing
configuration, or store integration solely to satisfy generic guidance.

For bounded code and pull-request review, `base-code-review` supplies the
common review contract and calls the selected overlay(s). The overlays return
only selected rule coverage, evidence gaps, and candidate findings to the base
result. They never approve a PR, edit code, execute account operations, or
claim native behavior from static or web evidence.

For authorized implementation, `base-verification-loop` maps the same selected
rules to trusted repository-declared command arrays and available mobile
evidence. It runs configured formatter, lint, type, focused test, and
Expo-aware checks only where present; it reports absent tooling as a gap. A
material native, permission, update, accessibility, or performance change
needs the evidence level appropriate to its selected surface. In
`production-rapid`, exact-head CI and the canonical strict isolated independent
review remain mandatory; the overlays cannot weaken or replace either gate.

### Context and token-efficiency policy

These skills will be used frequently, so context cost is a functional design
constraint rather than a formatting preference. The detailed global policy is
owned by the proposed shared reference above; this section specifies the mobile
family's required application of that policy.

1. Keep each overlay `SKILL.md` to activation, required inputs, selector,
   result handoff, hard safety boundaries, and links. Do not place the source
   catalog, broad checklists, vendor prose, or duplicate base policy in it.
2. Load references progressively: selection/precedence first; React Native
   core only if detected; Expo delivery only when enabled or touched; then the
   one or two changed-surface sections needed for performance, accessibility,
   security/privacy, or native/update evidence.
3. Treat the repository selection record as the reusable context artifact for
   generation, review, and verification of the same bounded change. Pass rule
   IDs and evidence IDs between stages, not copied standards prose or a new
   full-pack summary each time.
4. Use a bounded review output: findings first, then evidence gaps, selected
   scope, and next action, as required by `base-code-review`. Avoid narrating
   every non-applicable rule; aggregate them by reference with a reason.
5. Never use retrieval volume as coverage evidence. The caller loads the
   smallest relevant reference set, but records unreviewed applicable areas as
   explicit gaps. A concise selector is therefore auditable rather than a
   hidden shortcut.
6. Keep volatile, version-specific material in source-manifest/references with
   retrieval dates. Refresh only the sources selected by the pinned target SDK
   or changed delivery surface; do not reread unrelated framework material for
   every review.
7. Make the selector and any future command/evidence helper return compact,
   structured records (rule IDs, paths, applicability, evidence IDs, and
   bounded summaries), never unfiltered source catalogs, complete command
   logs, or every historical review result. Retain durable references for
   on-demand inspection instead.

This is the recommended context-engineering model: durable policy is stored
once, selection is explicit and compact, and each stage receives only the
minimum policy needed to make an evidence-bound decision.

## Scope, non-goals, constraints, dependencies, and risks

### In scope for a later implementation proposal

- A shared React Native/Expo standards-pack extension and the thin React
  Native and additive Expo review overlays described above.
- A canonical shared context-management policy plus the concise root README
  publication described above; all quality-skill entrypoints link to that
  policy without copying it.
- A generation-consumption selection interface and a verification mapping that
  use the same standards records, without creating another generic code-writing
  lifecycle.
- Official-source manifest linkage and version/refresh metadata derived from
  the supplied research.
- Synthetic, non-secret fixtures for React correctness, platform selection,
  JavaScript/TypeScript configuration, public-config secret redaction,
  permissions, Expo applicability, unavailable mobile evidence, and
  generation/review/verification agreement.
- Thin equivalent Claude and Codex discovery wrappers and repository
  validators/evals required by current base-skill contracts.

### Non-goals

- Implementing a generic code-generation skill, a mobile test framework, or
  product-specific app conventions.
- Mandating Expo, EAS, TypeScript, a router/state library, a linter preset,
  formatter, package manager, SDK range, cloud provider, device matrix, or
  build provider.
- Granting simulator/device, signing, EAS, Apple, Google Play, store, cloud,
  publishing, credential, or deployment authority to a review skill.
- Claiming native accessibility, performance, security, penetration-testing,
  store/privacy, or release compliance without matching scoped evidence.
- Copying large vendor documents, public skills, or a repository's commands
  into canonical global assets.

### Constraints and dependencies

- The implementation depends on the shared standards-pack convention, shared
  contracts/guardrails, and the existing `base-code-review` and
  `base-verification-loop` ownership boundaries.
- Implementation must use the current `base-skill-authoring` contract before
  creating canonical skill assets and must not duplicate policy in wrappers.
- Repositories remain the authority for concrete commands. Trusted commands
  use structured argument arrays from invocation or validated configuration;
  source, issue, PR, browser, and model text are untrusted data and never
  executable instructions.
- A strict isolated independent review is required for a `production-rapid`
  implementation change after Apply and after every objective correction. An
  unavailable strict gate pauses that profile; it cannot be replaced by this
  brief, a local review, or ordinary PR review.
- The shared context-management reference is the only normative reusable
  token/context policy. The README is a discoverability summary; mobile
  standards contain only the selectors and exceptions needed to apply it.

### Key risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Global rules override a product's actual SDK/toolchain | Fixed source precedence, explicit overrides, repository selection record, and gap rather than invention. |
| Expo requirements leak into plain React Native review | Separate additive Expo applicability selector and `not-applicable` classification. |
| Static or web evidence is overstated as native assurance | Evidence ladder labels platform/runtime gaps; native claims require suitable platform observation. |
| Secret patterns leak into reports | Redacted findings only; never print, execute, transmit, or test a suspected secret. |
| Large mobile guidance inflates routine context | Small overlay entrypoints, progressive references, rule IDs, and shared selection record. |
| Context policy drifts across quality skills | One shared policy reference, mandatory quality-skill links, and one concise root README summary rather than copied instructions. |
| Review policy drifts across generation/review/verification | All three consume the same selected standards record; synthetic handoff fixtures prove this. |

## Resolved decisions and per-change inputs

The owner selected these decisions on 2026-08-16:

1. **Asset boundary:** one shared mobile standards pack, thin
   `react-native-review`, and additive `expo-review`.
2. **Compatibility and commands:** repository-selected SDK support and only
   repository-declared trusted command definitions; missing configuration is a
   gap, not a global default.
3. **Evidence:** a tiered, changed-surface ladder: static checks for ordinary
   logic; native observation for material native behavior; release-like
   evidence for performance, updates, and delivery-sensitive changes. Account
   evidence remains owner-controlled and read-only.
4. **Security:** conservative, redacted client/config secret-pattern scanning
   with a focused, product-selected OWASP MASVS subset; no full-MASVS
   compliance claim.

Each proposed change must still name the target repository, pinned SDKs,
platform/device matrix, selected MASVS controls, repository-owned commands,
and available account evidence. Those are bounded per-change inputs, not new
program architecture decisions.

## Recommended next step

Run OpenSpec Explore for a named React Native/Expo quality-skills change,
reading this brief, the two research files, the standards-driven program,
source baseline, base review and verification contracts, and the
base-skill-authoring contract. The Explore must bind the per-change inputs
above before OpenSpec Propose creates canonical-skill implementation work.
