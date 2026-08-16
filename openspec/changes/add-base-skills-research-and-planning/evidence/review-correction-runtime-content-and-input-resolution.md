# Independent review correction: runtime content and input resolution

- Review record: `strict-d41df1ad-56e2-41f2-ab98-e91d394b2111`
- Reviewed head: `eed05fa04f5fecad01223338d1644f702a6074cf`
- Manifest digest: `1ab2f7eebe5305ada9a1f362052770cfaadcd058e41bd02c06579d76ab3fde66`
- Assurance: `strict-isolated`; canonical result validation and cleanup passed
- Correction attempt: 1 of 3 for each failure signature

## F-001 — generated content was absent from writer operations

- Failure signature: `independent-review/high/runtime-writer-without-content/merge-pr`
- Disposition: objective fix
- Correction: the three executable runtimes now read supplied material,
  generate the required findings, sources, seven-section brief, or delivery
  plan Markdown, and include that content in the fixed bounded write
  operations. Synthetic fixtures assert the generated contract content and
  the absence of extra operation types.

## F-002 — required input paths were not resolved

- Failure signature: `independent-review/high/unresolved-required-input-paths/merge-pr`
- Disposition: objective fix
- Correction: every path-backed source, research/context path, requirements
  path, and design-brief path is resolved through a bounded reader before
  authorization or writing. Missing, unreadable, empty, absolute, or
  traversal paths produce a structured blocking result. Synthetic fixtures
  exercise nonexistent paths for all three workflows.

## F-003 — documented portable defaults file was absent

- Failure signature: `independent-review/objective-fix/missing-ai-skills-config/merge-pr`
- Disposition: objective fix
- Correction: `config/ai-skills.json` now provides schema-valid portable
  defaults for `researchRoot`, `designBriefRoot`, and `planRoot`, and the
  governed implementation path list includes that file.
