# Independent review correction: source canonicalization and workspace binding

## Review evidence

- Review record: `strict-417ad61b-e6ea-4b9c-9025-1203358aed7d`
- Reviewed head: `563e9bab1432a629ad9be17524482c201207b08b`
- Manifest digest: `265cd54be5c65fdc78b9fabf4d1e3ad6ba45a9f348d8513942130c2caef802c1`
- Assurance: `strict-isolated`; canonical result validation passed and detached
  review cleanup completed.

## Explicit primary-source classification

- Failure signature: `independent-review/high/source-type-substring-bypass`
- Correction: source type is validated against the closed `primary`,
  `secondary`, and `tertiary` enum. Primary-preferred claim domains require
  exact `primary` equality; phrases such as `not primary` are rejected.

## Target-workspace path binding

- Failure signature: `independent-review/objective-fix/delivery-plan-target-workspace-not-enforced`
- Correction: planning source, current-state, and output paths are resolved
  relative to the named target workspace. The autonomous authorization target
  is constructed from the resolved output path, and approval evidence names
  the resolved design-brief path.

## Canonical distinct-source counting

- Failure signature: `independent-review/objective-fix/source-depth-count-trivially-inflatable`
- Correction: source IDs are Unicode-normalized and case-folded; HTTP(S)
  locations discard fragments and tracking parameters, sort query parameters,
  and normalize trailing slashes; workspace paths normalize separators and
  dot segments. Depth counts only canonical distinct identities and locations.
- Regression evidence covers misleading source types and superficial URL
  variants in addition to exact duplicate IDs and locations.
