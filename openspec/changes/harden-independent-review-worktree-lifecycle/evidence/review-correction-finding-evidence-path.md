# Review correction: finding evidence must name a committed file

- Review record: `strict-a9f64316-8009-44fe-b77e-75a7f246bd79`
- Finding: `IR-001` (`objective-fix`)
- Failure signature:
  `independent-review/IR-001/scripts/sdd/independent-review-contract.mjs/merge-pr`
- Correction attempt: 1 of 3 for this signature

## Defect

The reviewer-result contract accepted an evidence value with a line or column
suffix, such as `scripts/example.mjs:12`. That is not the required single,
repository-relative file path and cannot be checked unambiguously against the
sealed review tree.

## Correction

The finding schema and every parent-side payload/result validator now reject
colon-suffixed evidence. Before a strict payload is sealed, each finding path
is resolved only inside the exact detached review view and must name a regular,
non-symlink committed file. The correction is validation-only and does not
alter review permissions, transport, or findings semantics.

## Evidence

- Focused contract and platform-adapter tests reject a line-suffixed evidence
  value and pass all existing cases.
- A fresh strict-isolated review is required for the corrected head before the
  delivery transition resumes.
