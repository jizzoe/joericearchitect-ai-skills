# Independent review correction: workflow contract enforcement

- Review record: `strict-d16e4920-a29a-45c3-b777-19e2ad24272a`
- Reviewed head: `72a493ccdf0ecb247f9814d18c700fcc5d448ba9`
- Manifest digest: `6a19135e16a75bfd3d8b93034802d6394d5fe93eebba743c818704137052e2b0`
- Assurance: `strict-isolated`; canonical result validation and cleanup passed
- Correction attempt: 1 of 3 for each failure signature

## Existing content preservation

- Failure signature: `independent-review/high/research-existing-content-overwritten/merge-pr`
- Disposition: objective fix
- Correction: the bounded reader checks both destination artifacts before
  writing. Existing content is retained verbatim in a reconciliation section,
  and the result reports `updated` rather than `created`. A synthetic fixture
  asserts preservation for both files.

## Depth source targets

- Failure signature: `independent-review/objective-fix/research-depth-source-target-not-enforced/merge-pr`
- Disposition: objective fix
- Correction: quick, standard, and deep runs now require at least 5, 10, and
  25 resolved sources respectively; insufficient depth returns a structured
  blocked result before writing.

## Research pause conditions

- Failure signature: `independent-review/objective-fix/research-pause-conditions-ignored/merge-pr`
- Disposition: objective fix
- Correction: new credentials, an unapproved connector, sensitive data,
  material source conflict, or an unauthorized material decision each produce
  a distinct structured blocking result before source use or writing.

## Proposed preapproval validation

- Failure signature: `independent-review/objective-fix/preapproval-fields-not-validated/merge-pr`
- Disposition: objective fix
- Correction: a proposed preapproval is accepted only for `prototype-rapid`
  and only with nonempty target, action, evidence, recovery, and a valid future
  expiration. Fixtures cover wrong-profile, missing-field, expired, and valid
  proposals.

## Pre-execution model guidance

- Failure signature: `independent-review/objective-fix/model-guidance-not-displayed/merge-pr`
- Disposition: objective fix
- Correction: the runtime invokes a bounded display callback before source
  resolution or writing. Guidance is depth- and provider-aware, shows both
  providers when detection is uncertain, labels last-known exact model names
  as stale-risk with official documentation URLs, and states that session
  model state was not changed.
