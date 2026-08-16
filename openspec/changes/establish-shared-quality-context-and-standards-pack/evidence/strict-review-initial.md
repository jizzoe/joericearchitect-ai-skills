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

The strict review of corrected commit
`ae2f3ed946329677eb952cf6ee7bff6633b15831`, record
`strict-0da4604b-91a5-4cce-8978-34c99ce79904`, found malformed collection,
referential-integrity, and private-host validation gaps. Its archive cleanup
succeeded; those findings are disposed in the next correction record.

The strict review of corrected commit
`bb309c07f54f938acbf0efa1efa3c56101553fcb`, record
`strict-02dd1adc-5125-41fd-8a36-efd6b5b72a06`, found verification result
metadata and deterministic CLI-error handling gaps. Its archive cleanup
succeeded; those findings are disposed in the next correction record.
