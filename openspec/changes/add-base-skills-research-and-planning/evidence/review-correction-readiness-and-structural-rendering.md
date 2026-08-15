# Independent review correction: readiness entries and structural rendering

## Review evidence

- Review record: `strict-7ed615d0-550f-4def-afea-1817a10c8220`
- Reviewed head: `f64d7ed147d11caf4bc873246bb6693c5880bd72`
- Manifest digest: `9e79159f78e6a5fd7a73a02a9b9f06778994b9646fd5fe27810c6220e63fc7a9`
- Assurance: `strict-isolated`; canonical result validation passed and detached
  review cleanup completed.

## Candidate readiness entry validation

- Failure signature: `independent-review/high/candidate-readiness-allows-empty-evidence`
- Correction: every required candidate readiness array now requires at least one
  entry and validates every entry as a non-empty string. Empty or whitespace-only
  acceptance evidence and other readiness claims pause planning.
- Regression evidence: executable planning fixtures cover whitespace-only
  acceptance evidence.

## Structural Markdown rendering

- Failure signature: `independent-review/objective-fix/generated-markdown-allows-structural-injection`
- Correction: all user-controlled research, design-brief, and delivery-plan text
  is normalized and escaped before Markdown rendering. Workspace source links
  use segment-encoded destinations rather than raw user-controlled targets.
- Regression evidence: each workflow supplies heading-like content through its
  own input fields and proves that the generated document retains its fixed
  heading topology.
