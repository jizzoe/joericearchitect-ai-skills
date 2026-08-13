# Quality Standards Source Baseline

Date: 2026-08-12
Status: Research input for `standards-driven-quality-skills.md`; not a skill
implementation or a substitute for a repository's approved local conventions.

## Purpose

This document records the source hierarchy for planned standards-driven
generation, review, verification, and triage skills. It fills inventory gaps
where the public-repository review did not identify a direct domain skill.

Each future skill uses this order of precedence:

1. the target repository's explicit, versioned conventions and toolchain;
2. applicable official framework, language, provider, or vendor documentation;
3. reviewed, focused public skill sources listed below;
4. cross-stack quality patterns.

The future skill must report a conflict between these sources rather than
silently treating a generic standard as a repository rule. It must record the
specific source version/date used for volatile ecosystems.

## Reviewed Public Skill Sources

| Domain | Primary sources to adapt | Selection boundary |
|---|---|---|
| Base review and verification | [`awesome-skills/code-review-skill`](https://github.com/awesome-skills/code-review-skill), [`spartan-stratos/spartan-ai-toolkit`](https://github.com/spartan-stratos/spartan-ai-toolkit), [`microsoft/win-dev-skills`](https://github.com/microsoft/win-dev-skills) | Adapt the four-phase review structure, severity/evidence model, gated verification, and cross-assistant packaging patterns. Do not import their entire command, agent, hook, or persona surfaces. |
| Java/Spring | [`rrezartprebreza/spring-boot-skills`](https://github.com/rrezartprebreza/spring-boot-skills), [`Jeffallan/claude-skills`](https://github.com/Jeffallan/claude-skills), [`piomin/claude-ai-spring-boot`](https://github.com/piomin/claude-ai-spring-boot) | Prefer the focused Spring catalog for common failure modes. Use the others only for narrowly scoped verification and review patterns. |
| TypeScript/JavaScript | [`SpillwaveSolutions/mastering-typescript-skill`](https://github.com/SpillwaveSolutions/mastering-typescript-skill), [Metabase TypeScript review](https://github.com/metabase/metabase/blob/master/.claude/skills/typescript-review/SKILL.md) | Adapt strictness and review patterns. Never make Metabase-local paths, APIs, or commands global policy. |
| React web | The TypeScript sources above plus [`anthropics/skills`](https://github.com/anthropics/skills) | Use only as structure/pattern references; official React documentation governs framework correctness. |
| Terraform | [`spartan-stratos/spartan-ai-toolkit`](https://github.com/spartan-stratos/spartan-ai-toolkit) | Adapt its Terraform-review workflow after checking provider/version assumptions. HashiCorp documentation governs Terraform semantics. |
| Cross-stack triage | [`sethdford/claude-skills`](https://github.com/sethdford/claude-skills) | Use for taxonomy and artifact patterns only. Verify every asserted standard independently. |

## Opinionated-Source Rule

`jdubois/dr-jskill` is the intentionally opinionated source in the reviewed
catalog. It is an exception-only donor: future work may adapt a capability
from it only when the reviewed focused libraries do not already provide the
same capability. Its unique candidates are its version-manifest approach and
end-to-end Spring project-generation composition. Do not adopt its Java,
database, container, frontend, or deployment defaults as global standards.

This rule prevents duplicated or conflicting skill guidance while retaining
useful, uniquely opinionated patterns. If a different repository was intended
as the "opinionated library," update this designation before implementation.

## Official and Industry Baselines

| Domain | Official / industry baseline | Use in future skill |
|---|---|---|
| Python | [PEP 8](https://peps.python.org/pep-0008/) and [PEP 257](https://peps.python.org/pep-0257/) | Establish baseline style and docstring conventions. Select formatter, linter, type checker, test runner, supported Python versions, and framework rules from the target repository instead of hard-coding them. |
| TypeScript | [TypeScript strictness guidance](https://www.typescriptlang.org/docs/handbook/2/basic-types.html), [TSConfig reference](https://www.typescriptlang.org/tsconfig/), and [module/compiler-option guidance](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options) | Treat `strict` as the default recommendation for new code, while respecting the target's runtime and compiler configuration. Do not require TypeScript-only checks for plain JavaScript without an explicit opted-in `checkJs` or equivalent policy. |
| React web | [Rules of React](https://react.dev/reference/rules) and official React accessibility/performance guidance selected for the target version | Require purity, Rules of Hooks, and immutable state/props. Tie accessibility/performance checks to the changed UI and existing build/test stack. |
| React Native | [React Native accessibility](https://reactnative.dev/docs/accessibility) and [performance](https://reactnative.dev/docs/performance) documentation | Require platform-aware accessibility and performance assessment, including device/emulator evidence where applicable. Do not pretend web-only browser checks prove native behavior. |
| Expo | [Expo app configuration](https://docs.expo.dev/workflow/configuration/), [EAS Update](https://docs.expo.dev/eas-update/getting-started/), and [Expo Updates testing](https://docs.expo.dev/versions/latest/sdk/updates/) | Review SDK/config/runtime-version compatibility, permissions, build variants, and update behavior. Release-build evidence is required for update behavior that cannot be exercised in Expo Go or a development build. |
| Terraform | [HashiCorp Terraform style guide](https://developer.hashicorp.com/terraform/language/style) | Use `fmt`/`validate`, module/resource/variable/output clarity, lifecycle/versioning, sensitive-data, and state-safety guidance. The target provider and backend determine concrete policy. |
| AWS | [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) | Assess operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability. Use service-specific AWS documentation and the target account/environment policy for concrete controls. |
| Java/Spring | [Spring Boot testing](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html), [Spring Boot security](https://docs.spring.io/spring-boot/reference/security/index.html), and [Spring Security](https://docs.spring.io/spring-boot/reference/web/spring-security.html) | Base framework-specific review/generation guidance on the version selected by the target project. Java style, build tool, persistence, and API standards must be resolved from the repository or an approved stack profile. |

## Recommended Initial Scope

- Java/Spring uses a common Java 17+ pack with repository-selected Spring Boot
  3.x or 4.x compatibility references; unsupported major versions are a
  research gap, not an inferred migration target.
- TypeScript is the default JavaScript-family language. React Native and Expo
  use the TypeScript path by default. Existing JavaScript repositories use
  their configured lint/test rules and optional `checkJs`, without pretending
  they have TypeScript guarantees.
- Terraform begins with local static evidence only. Real plans, state backends,
  provider credentials, and cloud environments remain outside the first
  release.

## Research Gaps And Refresh Rules

- No direct, vetted public skill source has yet been identified for Python,
  React Native, Expo, AWS infrastructure review, AWS triage, or Terraform
  triage. Their first design pass must cite the official baseline above and
  perform a fresh source search before creating a canonical skill.
- Official documentation changes frequently for TypeScript, React Native,
  Expo, AWS, Terraform providers, and Spring Boot. A proposed or applied skill
  must recheck its version-sensitive claims against the official sources and
  record the date/version in its source manifest.
- A standards document is evidence, not executable policy. Deterministic
  checks are enabled only where the target repository has the relevant tool,
  configuration, and version pinned or otherwise approved.
