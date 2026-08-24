## MODIFIED Requirements

### Requirement: Thin sealed review loop invalidates on any review-relevant change
The slice SHALL reuse the existing independent-review and verification skills.
For the production profile the review step SHALL route through the strict
host-captured transport and SHALL require a parent-owned schema-valid terminal
artifact, never a transcript or claimed success; the prototype profile SHALL
keep its same-session-local review path. It MUST require fresh review when the
sealed package digest, exact head or tree, artifact manifest, Apply evidence,
findings dispositions, or policy gates change. The reviewer MUST NOT fix the
change.

#### Scenario: Unchanged sealed bindings reuse review lineage
- **WHEN** a review-gated operation's sealed bindings are all still current
- **THEN** the slice may consume the existing review lineage without launching a
  redundant reviewer

#### Scenario: A review-relevant binding changes
- **WHEN** any sealed review binding changes after a review result was accepted
- **THEN** the result is invalid and the next review-gated operation requires fresh review

#### Scenario: A reviewer finding never mutates the change
- **WHEN** the independent reviewer records a finding
- **THEN** the change is routed to a fresh implementer correction and is never
  edited by the reviewer

#### Scenario: Production review requires the terminal artifact
- **WHEN** a production-profile review step completes
- **THEN** it accepts only a parent-owned schema-valid terminal artifact from the
  strict host-captured transport and rejects transcript-only or claimed success
