# Independent review correction: write receipts and guidance provenance

## Reviewed state

- Strict review record: `strict-b6a0a18a-cd51-4da6-ba13-90bf1377627f`
- Reviewed commit: `5ff1b07afa5b9d938f06af7cb0254e78b93ccf91`
- Request manifest digest: `8da644892242149d557c7bd9b427e1c6d26b019ae61c9a40a8ce20902c9718e4`
- Findings corrected: `independent-review/objective-fix/IR-001` and
  `independent-review/objective-fix/IR-002`

## Corrections

- Single-artifact design-brief and delivery-plan writes now require an explicit
  `{ committed: true }` adapter receipt before returning `completed`.
- Missing and negative receipts pause as `artifact-write-failed`, matching
  thrown writer failures.
- Research model guidance now requires a valid calendar lookup date and writes
  the role, lookup date, provider, exact model, official source URL, and
  stale-risk notice into the durable findings artifact.
- Source access dates now reject invalid calendar dates rather than accepting
  any non-empty string.

## Regression evidence

- Design-brief fixtures cover missing and negative writer receipts and thrown
  writer failures.
- Requirements-to-plan fixtures cover missing and negative writer receipts and
  thrown writer failures.
- Research fixtures assert both official guidance URLs and the lookup date are
  present in generated findings.
- Research fixtures reject missing or invalid guidance dates and invalid source
  access dates.
