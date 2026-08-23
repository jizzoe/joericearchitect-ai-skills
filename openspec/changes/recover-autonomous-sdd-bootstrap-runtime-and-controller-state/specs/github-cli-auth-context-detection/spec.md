## ADDED Requirements

### Requirement: Exact host contrast is consumable by the matching lifecycle helper
An installed GitHub lifecycle helper SHALL accept a fixed host execution-context
selector only when the supplied authentication-context evidence is current,
exactly bound to the selected operation, repository, payload digest, and
expiry, and proves restricted-runtime credential unavailability through a
matching successful host probe. It MUST reject missing, restricted, stale,
mismatched, or unsupported context without attempting a GitHub write.

#### Scenario: Exact host-bound issue intake proceeds
- **WHEN** an issue-intake helper receives `host` context and current evidence bound to its exact issue operation with a successful matching host probe
- **THEN** it may evaluate the separately authorized issue-intake request through the existing host permission boundary

#### Scenario: Host selector does not broaden an issue action
- **WHEN** the host selector is paired with evidence for a different repository, payload digest, operation, expiry, or context classification
- **THEN** the helper rejects the request before searching for or creating an issue
