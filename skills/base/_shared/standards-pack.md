# Standards-Pack Selection

Use this reference as the shared preparation contract for quality work. It is
not a user-triggered skill and does not grant implementation, review, or
delivery authority.

## Selection order

Apply sources in this order: scoped target-repository rules; applicable
official standards; selected public sources with recorded provenance; then
cross-stack quality guidance. Record each candidate as `required`,
`recommended`, `repository-selected`, or `not-applicable`. A repository rule
may override generic guidance only when its scope and overridden rule are
recorded. An unresolved required conflict is a gap, not a guessed policy.

## Selection record

A version-1 record has a `target.path`; selected rules with `id`,
`classification`, `source`, and workspace-relative `scope`; nonempty
identifier-only `expectedEvidence`; scoped resolved overrides; and a `gaps`
array. A not-applicable rule includes a reason. Paths are workspace-relative;
public references are URLs. Each nested record is closed to unrecognized
fields. Records never contain commands, credentials, absolute paths, product
constants, or source-catalog copies.

Preparation, review, and verification reuse one valid record for one bounded
change. They report selected rule identifiers, not-applicable classifications,
and role-specific gaps. A record is not passing evidence and never replaces
OpenSpec, CI, independent review, or authorization.
