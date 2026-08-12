# Base Skill Contracts And Guardrails

Date: 2026-08-11
Status: Implementation-ready design brief draft. Create an OpenSpec proposal
only after the owner accepts this scope.

## Ownership And Delivery Boundary

This brief owns the prerequisite change `establish-base-skill-contracts-and-guardrails`.
It creates the shared contracts used by every later base skill:

- `schemas/skill-result-v1.schema.json`;
- `schemas/ai-skills-config-v1.schema.json`;
- `skills/base/_shared/guardrails.md`;
- a deterministic shared-guardrail linkage validator and synthetic fixtures;
- migration of every existing canonical `skills/base/*/SKILL.md` to the shared
  guardrail link.

Later changes consume these assets and do not redefine them. The clean proposal
sequence is: contracts/guardrails, skill authoring, research/planning skills,
then implementation-quality skills.

## Guardrail Migration And Enforcement

The first change migrates every existing canonical skill, not only newly
created or high-risk skills. Each `skills/base/<name>/SKILL.md` receives a
`## Guardrails` section with one relative link to
`../_shared/guardrails.md`. The shared directory has no `SKILL.md` and is not
discoverable as a skill.

The validator dynamically discovers every `skills/base/*/SKILL.md` and rejects
missing, malformed, duplicate, copied, or broken guardrail links. A copied
guardrail section is invalid because the shared file is the sole policy source.
The validator has no grandfathering baseline and no risk-based opt-out. This is
small, explicit migration work and prevents two guardrail standards from
coexisting.

## `skill-result-v1` Schema

The JSON schema uses draft 2020-12, has `additionalProperties: false` at the
top level, and requires:

| Field | Type and rule |
|---|---|
| `schemaVersion` | Integer constant `1`. |
| `skill` | Non-empty lowercase kebab-case string. |
| `status` | `completed`, `paused`, `blocked`, or `no-op`. |
| `mode` | `interactive` or `autonomous`. |
| `summary` | Non-empty string. |
| `artifacts` | Array of objects with `kind` (`file`, `record`, `external-state`, `other`), `operation` (`read`, `created`, `updated`, `unchanged`), and non-empty `subject`. File subjects must be workspace-relative paths with no absolute path or `..` segment. |
| `evidence` | Array of objects with unique `id`, `type` (`command`, `validation`, `test`, `review`, `screenshot`, `accessibility`, `record`, `other`), non-empty `subject`, `result` (`passed`, `failed`, `not-applicable`, `informational`), and optional non-secret `reference`. |
| `assumptions` | Array of non-empty strings. |
| `openQuestions` | Array of objects with unique `id`, non-empty `question`, and `blocking` boolean. |
| `nextAction` | Object with `kind` (`continue`, `user-decision`, `resume`, `openspec-explore`, `openspec-propose`, `none`) and non-empty `description`. |

The schema permits one optional `details` object for skill-specific data. It is
the only extension point. Additive common fields require a new schema version;
unsupported versions fail locally and return a structured `blocked` result.
The Markdown report is rendered from this JSON object and must not introduce
fields absent from it.

## `ai-skills-config-v1` Schema

`config/ai-skills.json` is optional. Its absence is valid and requires callers
to provide every destination/path explicitly. When present, it uses draft
2020-12, `schemaVersion: 1`, and `additionalProperties: false`.

| Key | Type and rule |
|---|---|
| `defaults` | Optional object with `researchRoot`, `designBriefRoot`, and `planRoot`; each is a workspace-relative path without `..`. |
| `paths` | Optional map of named workspace-relative paths without `..`; names are lowercase kebab-case. |
| `adapters` | Optional map of names to `{ kind, enabled, operations }`; `kind` is non-empty, `enabled` is boolean, and `operations` is a unique array from the operation vocabulary below. No credentials, scopes, endpoints, or account identifiers are stored. |
| `policies` | Optional map of named policy identifiers to non-empty strings. |
| `featureFlags` | Optional map of lowercase kebab-case names to booleans. |

Unknown top-level/configured object keys fail validation. Schema additions or
semantic changes require `schemaVersion: 2` and a documented migration; version
1 consumers reject unknown versions rather than guessing.

## Autonomous Operation Authorization

Per-run authorization uses the existing `autonomous-goal-runner` object and
validator. The adapter additionally calls a deterministic operation checker
before each action. An action is allowed only when all four conditions hold:

1. Its operation is in the named profile's fixed allowlist.
2. Its operation/mutation class is explicitly present in `allowedMutations`.
3. The target is in the authorization's `targets` and matches the relevant
   workspace path, record, or configured adapter.
4. Runtime sandbox/tool permission and configured adapter capability allow it.

| Operation | Permitted mechanism |
|---|---|
| `read-source` | Workspace read or public/previously authorized connector read. It cannot create credentials or consent to new scopes. |
| `write-findings`, `write-sources`, `write-result` | Local write only under an authorized workspace-relative destination. |
| `read-workspace`, `local-edit` | Local workspace tools restricted to the permitted path allowlist. |
| `run-test`, `run-validation` | Named local commands from the approved repository/toolchain; never shell text taken from untrusted content. |
| `objective-correction` | A behavior-preserving local change after evidence-backed classification; maximum three materially different attempts. |
| `read-tracker`, `backup-tracker`, `upsert-allowlisted-record`, `write-reconciliation-report` | Only through a configured adapter with the exact capability and target record. |
| `issue-create-or-update`, `project-update`, `draft-pr-create-or-update`, `run-lifecycle-action` | Existing SDD/GitHub deterministic helpers against exact authorized records. |
| `notify-state` | Local app/task-state notification with no external recipient. |

All other connector/tool actions pause. External send, calendar update,
submission, release, and deployment are outside every first-release profile.
Merge, OpenSpec Archive, and merged-topic-branch deletion are also paused by
default, with only these narrow delivery exceptions:

1. a bounded autonomous run whose existing authorization names the exact
   `merge-pr`, `archive-change`, or `delete-merged-topic-branch` transition,
   target, evidence, recovery behavior, and expiration; or
2. an explicitly selected `prototype-rapid` delivery with an equally exact,
   one-change, time-bounded preapproval.

The exceptions apply only after existing target, adapter-capability,
runtime-permission, and lifecycle evidence gates pass. They never authorize a
generic merge, archive, or branch deletion, and do not create standing
permission. In interactive `production-rapid` work, those three transitions
require a just-in-time approval after their objective gates pass.

## Evaluation Requirements

Fixtures and deterministic tests cover: migration of current canonical skills,
missing/broken/copied link rejection, all schema enums/types/unknown keys/path
rejection, missing-config explicit-input behavior, unsupported schema version,
each profile operation allow/deny case, interactive production approval pause,
bounded-autonomous and prototype-rapid delivery-preapproval allow cases,
unauthorized target, adapter capability mismatch, expired authorization,
incomplete lifecycle evidence, correction-limit pause, and portability using a
second workspace with different configured paths.

## Acceptance Gate

This foundation change is complete only when all existing and new canonical
skills validate against the shared link rule, both JSON schemas validate valid
and invalid fixtures deterministically, no configuration/fixtures contain
secrets or product constants in reusable assets, and the existing autonomous
runner contract remains the sole authorization model for autonomous runs.
