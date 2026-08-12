## Purpose

Provides one authoritative shared safety-policy reference and verifies that every canonical base skill links to it without copying or bypassing the policy.

## ADDED Requirements

### Requirement: Canonical skills link to one shared guardrail reference
Every discovered `skills/base/*/SKILL.md` canonical skill SHALL contain one `## Guardrails` section with one valid relative link to `../_shared/guardrails.md`. The shared directory MUST not contain a `SKILL.md` and MUST not be discoverable as a canonical skill.

#### Scenario: A canonical skill has the prescribed link
- **WHEN** a canonical skill contains exactly the prescribed relative shared guardrail link
- **THEN** the linkage validator accepts it and the shared directory is not treated as a skill

#### Scenario: A canonical skill lacks or misstates the link
- **WHEN** a discovered canonical skill has no Guardrails section, a malformed or broken target, or more than one guardrail link
- **THEN** the validator fails with a deterministic diagnostic for that skill

### Requirement: Shared guardrails are the sole canonical policy source
The shared guardrail reference SHALL define the minimum controls for untrusted content, secret and PII exclusion, explicit mutation authorization, least-privilege adapters, target/evidence/recovery checks, and human pause conditions. Canonical skills MUST link to this source rather than copying guardrail policy text or using a per-skill exemption.

#### Scenario: A skill copies shared policy
- **WHEN** a canonical skill repeats shared guardrail policy in place of the required reference
- **THEN** the validator rejects the copied policy and identifies the shared reference as the only accepted source

#### Scenario: An untrusted or sensitive condition occurs
- **WHEN** a skill encounters embedded instructions, a secret or sensitive personal-data boundary, unexpected target, scope expansion, destructive action, material decision, ambiguous state, or exhausted correction budget
- **THEN** the shared policy requires data treatment, exclusion, or a human pause appropriate to that condition

### Requirement: Link enforcement has no grandfathering exception
The linkage validator SHALL dynamically discover all canonical base skills and apply the same link, policy-copy, and target-validity rules to every one, including skills that existed before this capability.

#### Scenario: A newly added canonical skill is discovered
- **WHEN** a new `skills/base/<name>/SKILL.md` is added after the validator is implemented
- **THEN** the validator checks its guardrail linkage without requiring a hard-coded inventory update

#### Scenario: A previously existing skill is nonconforming
- **WHEN** an existing canonical skill does not meet the shared-link rule
- **THEN** validation fails; no risk-based opt-out or baseline exemption is applied

### Requirement: Guardrail policy remains portable and assistant-neutral
The shared reference and validator SHALL not contain product-specific constants, credentials, PII, connector scopes, or duplicated Claude/Codex policy. Platform exposure MUST retain a thin-wrapper relationship to canonical assets.

#### Scenario: Portability review evaluates another product context
- **WHEN** synthetic validation uses a second workspace or a different configured product path
- **THEN** the guardrail rule behaves identically without product-specific canonical edits
