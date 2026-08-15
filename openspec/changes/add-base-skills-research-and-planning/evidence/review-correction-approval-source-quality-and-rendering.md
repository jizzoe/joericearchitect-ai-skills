# Independent review correction: approval, source quality, and rendering

- Review record: `strict-51eecd7e-a508-4729-b297-e4e1b1fd55e9`
- Reviewed head: `fa438c86d89e361adfd62735ea8dd245a82a2d23`
- Manifest digest: `c613d478d4bd18cee45bd9e265a3af7a09109615939c8b360c1d250066852855`
- Assurance: `strict-isolated`; canonical result validation and cleanup passed
- Correction attempt: 1 of 3 for each failure signature

## Approved design-brief provenance

- Failure signature: `independent-review/high/planning-accepts-unapproved-design-briefs/merge-pr`
- Disposition: objective fix
- Correction: planning requires approval evidence containing the exact brief
  path, owner, non-future approval time, and SHA-256. The runtime recomputes
  the digest from resolved content and pauses on missing or stale evidence.

## Proposed preapproval lifecycle semantics

- Failure signature: `independent-review/objective-fix/proposed-preapproval-fields-are-not-semantically-validated/merge-pr`
- Disposition: objective fix
- Correction: proposed preapproval actions are restricted to `merge-pr`,
  `archive-change`, and `delete-merged-topic-branch`, with exact `pr:`,
  `change:`, and `branch:` target forms respectively.

## Distinct, domain-appropriate research sources

- Failure signature: `independent-review/objective-fix/source-depth-can-be-satisfied-by-duplicate-low-quality-sources/merge-pr`
- Disposition: objective fix
- Correction: duplicate source IDs or locations cannot count toward depth.
  Technical, pricing, policy, API, and current-product domains require at
  least one primary source before completion.

## Untrusted Markdown rendering

- Failure signature: `independent-review/warning/untrusted-claims-can-inject-markdown-structure/merge-pr`
- Disposition: objective fix
- Correction: untrusted source claims, titles, provenance fields, and excerpts
  are whitespace-normalized and Markdown control characters are escaped before
  insertion. A fixture proves injected headings and links cannot create
  Markdown structure or add operations.
