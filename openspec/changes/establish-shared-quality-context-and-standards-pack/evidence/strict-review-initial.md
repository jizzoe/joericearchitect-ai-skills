# Initial strict independent review

The sealed Codex strict review of commit `8ba1b62d5a2ebae22736a559a26a35b760ce6211`
completed under `strict-isolated` assurance. Review record
`strict-f7134521-0624-48f4-b15f-e37e7a4a2f7c` reported three findings:

- `F001` high: required `expectedEvidence` and `gaps` arrays were not enforced.
- `F002` high: nested selection objects did not reject unrecognized fields.
- `F003` objective-fix: selected rules lacked the scope required by the delta
  specification.

The exact review archive cleanup succeeded. The findings are preserved here as
review data; the corrected head requires a fresh strict review.

The fresh strict review of corrected commit
`f044db83257f37544e8f32f82ed1978be372ce8e`, record
`strict-5f4857fe-3009-4e65-a5ae-c5fe05c933b7`, found URL-userinfo,
Windows/UNC-path, and positive override/handoff-fixture gaps. Its exact review
archive cleanup also succeeded; those findings are disposed in the next
correction record.
