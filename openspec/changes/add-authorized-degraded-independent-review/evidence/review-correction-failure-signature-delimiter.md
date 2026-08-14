# Failure-Signature Delimiter Correction Evidence

## Failure and disposition

- Review record: `degraded-f7e6c7d3-9040-4b72-bdc6-2b15b2d27d66`.
- Reviewed head: `15e6950efe0bcfe6b8b1500e3cc58baeeb22ee54`.
- Reviewed manifest:
  `a3a30fe25270c48c2dca1b10285fbf0852ccb96e5df8aec1cd253573bfeb8cd3`.
- Finding: `failure-signature-delimiter-collision` (`objective-fix`).
- Disposition: `objective-fix`; signature framing is a deterministic correction-
  budget integrity defect and requires no human judgment.
- Behavior-preserving: yes. Existing durable signatures remain unchanged while
  previously ambiguous boundary values become distinct.

## Correction

The canonical failure signature now percent-escapes percent signs and slash
delimiters in `findingId` and `transition` before framing them around the
evidence field. Evidence remains unchanged, preserving every existing durable
path-valued signature. Because the first and last boundary fields can no longer
contain an unescaped delimiter, path separators inside evidence cannot migrate
between fields. Escaping percent first also distinguishes an encoded slash from
a literal `%2F` value.

## Correction budget and verification

- Overall ordered correction chain: attempt 17.
- Attempts for this failure signature: 1 of 3.
- Regression coverage preserves an existing path-valued signature and proves
  distinct signatures for finding/evidence delimiter migration, literal versus
  encoded percent values, and evidence/transition delimiter migration.
- The corrected commit and package require affected validation plus fresh exact-
  head strict-first review.
