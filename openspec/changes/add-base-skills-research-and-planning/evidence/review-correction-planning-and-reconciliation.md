# Independent review correction: planning and reconciliation

- Review record: `strict-f7e240d5-78e2-4881-a117-810c8e1a948b`
- Reviewed head: `dab2757317053c189c283ef0a476e2d932affe42`
- Manifest digest: `b6b54e0f9dde9c2e2ffa7a7d4f7e818dc54298cea458aafd3e2212fe86990418`
- Assurance: `strict-isolated`; canonical result validation and cleanup passed
- Correction attempt: 1 of 3 for each failure signature

## Planning pause derivation

- Failure signature: `independent-review/high/planning-pause-conditions-not-enforced/merge-pr`
- Disposition: objective fix
- Correction: every candidate now carries structured dependency states, risk
  classifications, and undecided-decision entries. Unresolved dependencies,
  prototype-versus-risk conflicts, and undecided product/architecture/legal/
  security/governance decisions each pause before authorization or writing.

## Mixed-profile candidate planning

- Failure signature: `independent-review/objective-fix/mixed-candidate-plans-unsupported/merge-pr`
- Disposition: objective fix
- Correction: plan execution accepts a nonempty candidate collection. Each
  candidate owns its delivery profile and explicit data, exposure, and
  recovery rationale; validation and rendering operate per candidate, and a
  fixture exercises a production/prototype mixed plan.

## Prior research reconciliation

- Failure signature: `independent-review/objective-fix/prior-research-is-preserved-wholesale/merge-pr`
- Disposition: objective fix
- Correction: existing output requires a bounded reconciliation callback that
  returns generated-plus-retained content and enumerates retained, stale, and
  conflicting excerpts. The runtime verifies retained excerpts came from and
  remain in the output, stale excerpts came from and are absent from the
  output, and conflicts are empty. Missing, invalid, or conflicted
  reconciliation pauses without writing.
