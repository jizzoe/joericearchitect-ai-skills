## 1. Contract Foundations

- [x] 1.1 Inventory the existing Node validation/test entry points and autonomous-runner helper interfaces; record the selected integration boundary without changing OpenSpec-generated assets.
  - Depends on: none (first task).
  - Evidence: reviewed interface map identifies canonical helper ownership, normal local validation command, and existing runner regression suite.
- [x] 1.2 Add strict draft-2020-12 `skill-result-v1` and `ai-skills-config-v1` schemas with required fields, enums, closed objects, version behavior, and the defined `details` extension boundary.
  - Depends on: 1.1.
  - Evidence: schemas are valid JSON and match every contract requirement without product-specific values.
- [x] 1.3 Implement deterministic local schema/path validation and structured blocked-result reporting for invalid or unsupported contract inputs.
  - Depends on: 1.2.
  - Evidence: stable rule identifiers cover required fields, unknown keys, versions, relative paths, duplicate IDs, non-secret references, and missing-config explicit-input behavior.
- [x] 1.4 Add synthetic valid/invalid result and configuration fixtures plus focused tests for every enum, nested type, unknown key, unsafe path, duplicate operation/identifier, unsupported version, missing configuration case, and the interactive-production versus autonomous/prototype high-impact approval policy.
  - Depends on: 1.3.
  - Evidence: focused Node tests pass deterministically without network, credentials, or production paths.

## 2. Shared Guardrail Migration

- [x] 2.1 Author `skills/base/_shared/guardrails.md` as the sole shared reference for untrusted content, secret/PII exclusion, explicit authorization, runtime permissions, evidence/recovery, least privilege, and pause conditions.
  - Depends on: 1.1.
  - Evidence: the shared directory has no `SKILL.md`; policy contains no product constants, credentials, PII, or duplicated platform wrapper content.
- [x] 2.2 Implement a dynamically discovering guardrail-link validator that accepts exactly one valid relative shared link and rejects missing, malformed, duplicate, broken, and copied policy content.
  - Depends on: 2.1.
  - Evidence: deterministic diagnostics identify the discovered skill and failed link rule, with no hard-coded skill baseline or opt-out.
- [x] 2.3 Migrate every existing canonical `skills/base/*/SKILL.md` to one `## Guardrails` section that links to the shared reference, preserving substantive skill behavior and thin wrapper ownership.
  - Depends on: 2.2.
  - Evidence: dynamic validation passes for every discovered canonical skill and the shared directory is not discovered as a skill.
- [x] 2.4 Add synthetic link-validator fixtures and focused tests covering a valid newly discovered skill plus every missing/broken/malformed/duplicate/copied-link failure case.
  - Depends on: 2.2.
  - Evidence: the tests prove discovery is dynamic and every invalid condition fails precisely.

## 3. Bounded Autonomous Operation Enforcement

- [x] 3.1 Define the fixed first-release profile operation allowlists and approval policy for `research-read-only`, `local-implementation`, `tracker-maintenance`, and `sdd-delivery`, treating execution mode and delivery profile as independent inputs.
  - Depends on: 1.1.
  - Evidence: profile policy pauses external send, calendar update, submission, release, and deployment; it requires just-in-time approval for interactive-production merge, branch deletion, and Archive, while permitting only exact, time-bounded, evidence-gated autonomous authorization or recorded prototype one-change preapproval exceptions.
- [x] 3.2 Implement the deterministic operation and delivery-preapproval checker: layer autonomous checks over the existing runner authorization object, and validate the distinct recorded `prototype-rapid` one-change preapproval before its named high-impact transition.
  - Depends on: 3.1.
  - Evidence: checker returns explicit allow or structured pause outcomes for both modes without creating credentials, changing sandbox permissions, or adding a second autonomous authorization model.
- [x] 3.3 Extend the current runner fixtures and focused tests for every profile allow/deny case, unauthorized target, adapter-capability mismatch, runtime permission gap, expiration, reserved operation, correction success, and three-attempt pause.
  - Depends on: 3.2.
  - Evidence: new tests prove interactive `production-rapid` pauses for merge/archive/branch deletion; exact authorized `sdd-delivery` transitions and selected `prototype-rapid` one-change deliveries proceed only after every evidence gate; mismatched or incomplete boundaries pause. Existing autonomous-runner regression tests pass using synthetic targets and adapters only.

## 4. Integration, Portability, and Delivery Evidence

- [x] 4.1 Wire the contract, guardrail-link, and operation-check validators into the normal repository validation boundary and CI-owned checks after confirming ownership; do not execute skill content or introduce network access.
  - Depends on: 1.4, 2.4, 3.3.
  - Evidence: local and CI paths run the same deterministic checks with nonzero failure behavior.
- [x] 4.2 Add a second-workspace portability fixture with different valid configuration paths and verify schemas, guardrail discovery, and operation checks need no canonical asset edits.
  - Depends on: 4.1.
  - Evidence: focused portability test passes without personal paths, repository-specific constants, or real connectors.
- [x] 4.3 Update only the relevant authoring/runner documentation and references to describe the new contracts, shared guardrail link, operation checker, profile limits, and safe recovery behavior.
  - Depends on: 4.1.
  - Evidence: documentation matches implementation and explicitly preserves human pause and runtime-permission boundaries.
- [x] 4.4 Review schema, fixtures, canonical skill migration, and runner changes for untrusted-content handling, secrets/PII, product constants, wrapper thinness, licensing/attribution, recovery, and unrelated changes.
  - Depends on: 4.2, 4.3.
  - Evidence: review records any findings with classification and confirms synthetic-only data and no unapproved external-state changes.
- [x] 4.5 Run focused tests, normal validation, `openspec validate establish-base-skill-contracts-and-guardrails --strict`, `openspec validate --all --strict`, `git diff --check`, and a final scope review before requesting formal OpenSpec Verify.
  - Depends on: 4.4.
  - Evidence: recorded command output is current to the reviewed diff; any unavailable required evidence yields a blocked or paused result rather than a completion claim.
