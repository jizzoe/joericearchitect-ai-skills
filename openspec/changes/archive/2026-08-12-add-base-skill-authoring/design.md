## Context

See proposal.md for motivation. The prerequisite supplies the schemas, shared
guardrail link, configuration contract, and operation checker that this skill
must consume rather than reimplement.

## Goals / Non-Goals

**Goals:** provide concise authoring instructions, progressive references for
the contract/result/evaluation shapes, and deterministic synthetic coverage.

**Non-Goals:** create a generic skill generator, copy platform instructions,
or add configurable external integrations.

## Decisions

- Keep `SKILL.md` procedural and link detailed contract/eval material from one
  reference level. This preserves progressive disclosure; a monolithic guide
  was rejected for discovery cost.
- Reuse `skill-result-v1`, `ai-skills-config-v1`, shared guardrails, and the
  operation checker. A parallel authoring-specific policy was rejected because
  it could drift from the foundation.
- Use synthetic Node fixtures to check structural behavior instead of invoking
  a model. This makes safety, portability, and adapter parity repeatable.
- Make platform exposure a thin relative link to canonical instructions. Copied
  wrappers were rejected because they duplicate policy.

## Risks / Trade-offs

- [Instruction-only behavior can be interpreted inconsistently] → encode
  required package sections and deterministic fixture expectations.
- [Future profile expansion] → consume the foundation vocabulary and pause on
  unknown profiles rather than predicting policy.
- [New global install surface] → retain canonical-only implementation and avoid
  installation or credential behavior in this change.

## Migration Plan

1. Add canonical instructions and progressive reference material.
2. Add fixtures/evals and validate metadata, shared-link, contracts, and
   OpenSpec artifacts.
3. Generate only thin assistant exposures if repository conventions require
   them; rollback removes the new change-owned files and leaves foundations.

## Reuse Plan

Canonical assets contain no repository owner, issue, Project, absolute path,
credential, or product behavior. Product values are explicit inputs or optional
configuration, and the second-workspace fixture demonstrates that boundary.
