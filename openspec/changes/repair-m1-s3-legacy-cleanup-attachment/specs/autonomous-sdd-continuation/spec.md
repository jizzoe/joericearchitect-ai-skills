## ADDED Requirements

### Requirement: Exact bootstrap cleanup attachment is a separate, bounded transition
The controller SHALL attach legacy cleanup resources to an existing v2 run only
through a separately invoked, expiry-bound bootstrap-repair transition. The
transition MUST bind one existing parent run, work unit, claim, repository,
approved change, and signed migration record per resource. It MUST verify the
fresh resource inspection, persist the attached record and every cleanup
receipt outside removable worktrees, and MUST NOT create a v2 run, claim,
lifecycle checkpoint, or replacement admission record.

#### Scenario: Signed migration attaches to the named bootstrap run
- **WHEN** an unexpired repair binding and a signed migration both match one
  freshly inspected eligible legacy resource for the named active run
- **THEN** the controller persists only that attached resource and returns a
  recovery-safe cleanup record for the existing run

#### Scenario: Attachment exceeds its exact repair scope
- **WHEN** a migration names another run, resource, repository, head, owner,
  or expired repair binding
- **THEN** the controller returns a typed pause without changing run state,
  claims, cleanup records, or local resources

#### Scenario: Attachment cannot imitate normal admission
- **WHEN** a caller submits a valid bootstrap cleanup attachment
- **THEN** the controller preserves the original admission bytes and creates
  neither a new v2 run nor a new native claim
