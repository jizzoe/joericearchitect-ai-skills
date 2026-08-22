## ADDED Requirements

### Requirement: Initialization recognizes only evidence-verified terminal v2 controllers
Before legacy compatibility classification, the initializer SHALL recognize a prior schema-5 controller as compatible terminal only when the controller is complete and immutable local v2 archive evidence binds the same repository, authorization, selected change, parent run, work unit, claim, terminalization receipt, and released-claim disposition. Recognition MUST be derived internally from configured repository state and MUST NOT be caller-selectable. The initializer MUST preserve the controller and archive records unchanged.

#### Scenario: Prior terminal schema-5 controller permits later initialization
- **WHEN** Git-common inventory contains a prior schema-5 controller whose completed state and admission identities exactly match a valid archived v2 run, terminalization receipt, and claim release for the configured repository and selected change
- **THEN** initialization classifies that controller as compatible terminal and continues ordinary admission without rewriting either audit record

#### Scenario: Terminal-looking controller lacks matching archive evidence
- **WHEN** a prior schema-5 controller appears complete but its archived run, terminalization receipt, claim release, repository, authorization, selected change, parent, work unit, claim, provider, or digest evidence is missing or mismatched
- **THEN** initialization treats that controller as ambiguous and pauses before creating a parent run, work unit, or claim

#### Scenario: Pending or active schema-5 controller remains authoritative
- **WHEN** Git-common inventory contains a prior schema-5 controller whose lifecycle or v2 admission has not been proven terminal
- **THEN** initialization pauses without excluding, reconciling, deleting, or modifying that controller

#### Scenario: Installed initializer evaluates real prior terminal state
- **WHEN** the manifest-declared initializer runs against a real Git common directory containing its own pending checkpoint and a different evidence-verified terminal schema-5 checkpoint backed by a real local v2 archive layout
- **THEN** it excludes only its own checkpoint, accepts only the verified terminal sibling, persists matching new v2 identities, and resumes those identities on retry
