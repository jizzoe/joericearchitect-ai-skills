## MODIFIED Requirements

### Requirement: Lifecycle completion includes owned-resource reconciliation
The lifecycle SHALL not report autonomous delivery complete until Archive,
configured issue and Project convergence, finalizer outcomes, and a visible
lifecycle-hygiene cleanup report are current. The hygiene report MUST remain
read-only and distinguish recommendations from authorized cleanup actions.
Every ineligible or blocked exact resource MUST have durable classification and
recovery evidence.

#### Scenario: Finalization finds an ineligible resource
- **WHEN** finalization cannot safely remove an exact resource
- **THEN** lifecycle records its classification and recovery evidence

#### Scenario: Archive hygiene report is available
- **WHEN** Archive evidence is current for a selected delivery
- **THEN** lifecycle presents a read-only hygiene report before claiming
  close-out, without deleting or changing any local resource
