## MODIFIED Requirements

### Requirement: Real ownership activates only as a minimum vertical bundle
The plan SHALL treat initialization, claim acquisition and fencing, deterministic
advancement, interruption recovery, terminalization, claim release, external
convergence, exact-owned cleanup, and tested rollback as one minimum activation
bundle. Real repository ownership MUST remain disabled until the bundle is
implemented together and its applicable qualification gate passes.

#### Scenario: Only admission and claim acquisition are implemented
- **WHEN** downstream recovery, terminalization, convergence, cleanup, or rollback is absent or unqualified
- **THEN** the new generation cannot become the real mutating owner even if its schemas and claim provider are available

#### Scenario: M2 work is selected after stabilization
- **WHEN** M1 contracts and repair closeout are reconciled and this stabilization plan is accepted
- **THEN** M2-S1 (`prove-autonomous-sdd-vertical-slice`) is the next implementation slice, followed by M2-S2 (local durable execution backend) and M2-S3 (run status and recovery), while operational activation remains gated by the complete vertical bundle

## ADDED Requirements

### Requirement: Cross-repository coordination is a gated first-class milestone
The plan SHALL treat cross-repository SDD coordination (M5-S1) as a first-class
milestone gated after M4-S4 qualifies repeated single-change v1, rather than a
deferred parallel-execution concern. A cross-repository change SHALL open the
central planning change first and close it last, with component changes
archiving inside it and a linkage ledger recording dispatch and return against
exact revisions.

#### Scenario: Cross-repository work is selected before single-change qualification
- **WHEN** a cross-repository coordination slice is proposed before M4-S4 qualifies repeated single-change v1
- **THEN** planning rejects or defers it because the single-change vertical bundle is not yet qualified

#### Scenario: A central change closes before its component changes
- **WHEN** a central planning change attempts to archive before its dispatched component changes return evidence
- **THEN** the lifecycle pauses and requires the component evidence and exact revisions before the central change can close
