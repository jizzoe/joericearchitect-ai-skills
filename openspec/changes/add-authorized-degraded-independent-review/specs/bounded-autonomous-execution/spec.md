## ADDED Requirements

### Requirement: Concise SDD delivery requests resolve before mutation
The runner SHALL normalize a concise SDD delivery request into a complete,
durable effective-authorization record before selecting work or mutating local
or external state. The request MUST explicitly provide or unambiguously name a
target change or ordered queue, `mode`, `qualityProfile`,
`authorizationProfile`, `independentReviewPolicy`, and expiration. Supported
values MUST be published by the canonical runner: `mode` is `autonomous` or
`interactive`; `qualityProfile` is `production-rapid` or `prototype-rapid`;
`authorizationProfile` is `sdd-delivery`; `independentReviewPolicy` is
`strict-only` or `strict-first-degraded`; expiration is a positive bounded
duration or future UTC timestamp. A `production-rapid` preset MUST retain all
production validation, security, portability, attribution, recovery, Verify,
and independent-review gates and MUST set the existing maximum of three
materially different behavior-preserving corrections per failure signature
unless the user supplies a narrower budget. `sdd-delivery` MUST derive only the
named change's normal issue, Project item, OpenSpec, branch, implementation PR,
Sync PR, Archive PR, closure, Done-status, and confirmed merged-branch cleanup
targets and MUST NOT authorize deployment, release, credentials, external
messages, or unrelated mutation.

#### Scenario: Concise request resolves completely
- **WHEN** the user names the target and supplies every required shorthand
  field with supported values
- **THEN** the runner records and reports the expanded effective authorization,
  including the exact lifecycle boundary, quality gates, review policy,
  expiration, and correction budget, before work selection

#### Scenario: Required shorthand inputs are missing
- **WHEN** one or more required request inputs are absent or ambiguous
- **THEN** the runner performs no work selection or mutation and sends one
  concise clarification that lists every missing input with a short meaning and
  its supported values or value form

#### Scenario: A shorthand value is unsupported
- **WHEN** a supplied request value is unknown or conflicts with another
  controlling input
- **THEN** the runner identifies that field, shows its supported values, and
  pauses without silently choosing a risk-bearing alternative

#### Scenario: Strict-first-degraded is selected
- **WHEN** `independentReviewPolicy` is `strict-first-degraded`
- **THEN** the effective authorization requires strict review first and, only
  after exact-package strict unavailability, permits a fresh transition-bound
  degraded reviewer and the configured permission-gated Codex or Claude
  launcher recovery for the same change, head, manifest, expiration, and
  correction envelope; the degraded launch evidence remains explicitly
  non-security-verifiable

#### Scenario: Runtime permission remains unavailable
- **WHEN** the selected review policy authorizes launcher recovery but the
  configured launcher or active runtime permission is unavailable
- **THEN** the runner reports the runtime gap and pauses without treating the
  shorthand as platform permission or weakening the inner reviewer boundary

## MODIFIED Requirements

### Requirement: Production-rapid delivery requires independent review evidence
The runner SHALL require strict independent review in a configured
non-interactive fresh, separate, enforced read-only execution context after
Apply and after every behavior-preserving objective fix before it authorizes a
`production-rapid` high-impact delivery transition. The reviewer input MUST be
a validated sealed package containing only immutable canonical base/head object
IDs, the exact re-derived diff, relevant OpenSpec artifacts, and current
validation evidence; it MUST NOT contain inherited implementation-session
history or a desired conclusion. The runner MUST reject self-review, writable
reviewers, malformed or stale evidence, and unresolved blocker, high, or
`objective-fix` findings. If and only if strict review produces durable
unavailability, the runner MAY accept `authorized-degraded` evidence under the
exact bounded authorization defined by the degraded-review capability. It MUST
retain the strict result, authorization, risk reason, capability ledger,
assurance level, reviewer identity, package/base/head, findings, dispositions,
transition, and expiration in a unique durable review record. It MUST retry
strict review first for every new head and MUST pause on an absent, expired,
mismatched, malformed, broad, or out-of-envelope degraded authorization.
Declared artifact hashes MUST be derived from regular Git blobs at the exact
head rather than from symlink-following working-tree reads.

#### Scenario: Clean independent review authorizes exact-head delivery
- **WHEN** an isolated configured reviewer returns current passed evidence for
  the immutable base and head after Apply
- **THEN** the runner may use `strict-isolated` review only for the named
  authorized transition

#### Scenario: Caller attempts to bypass the production review gate
- **WHEN** a high-impact SDD transition omits its delivery profile or supplies
  a profile that differs from the resolved durable authorization
- **THEN** the runner rejects the transition before delivery and does not use
  the caller-supplied value to weaken the independent-review requirement

#### Scenario: Objective fix requires review of the new head
- **WHEN** a reviewer identifies a bounded `objective-fix` and the runner
  applies the behavior-preserving fix and reruns affected evidence
- **THEN** the prior result is stale, strict review is attempted for the new
  exact head, and degraded review is eligible only inside its derived envelope

#### Scenario: Warning or false positive remains reviewable
- **WHEN** the implementer records a warning or false-positive disposition with
  cited evidence
- **THEN** the runner gives it to the next fresh strict or degraded reviewer as
  challengeable evidence rather than an intended conclusion

#### Scenario: Reviewer capability or evidence is invalid
- **WHEN** strict review is unavailable but the degraded authorization, sealed
  package, result, capability ledger, reviewer freshness, or detached view is
  missing, stale, mismatched, or mutation-capable
- **THEN** the runner pauses without downgrading the production-rapid gate

#### Scenario: Explicit degraded evidence authorizes exact-head delivery
- **WHEN** strict review is durably unavailable and an exact active degraded
  authorization permits a fresh separate fallback result for the same package
- **THEN** the runner may use only `authorized-degraded` evidence for that
  named transition while preserving the reduced-assurance record
