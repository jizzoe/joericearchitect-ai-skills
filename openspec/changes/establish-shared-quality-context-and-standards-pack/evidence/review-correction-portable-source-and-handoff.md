# Correction disposition: portable sources and handoff coverage

Disposition of strict review record `strict-5f4857fe-3009-4e65-a5ae-c5fe05c933b7`:

- `F1` is corrected by parsing HTTP(S) source URLs and rejecting userinfo.
- `F2` is corrected by checking POSIX and Windows absolute-path forms before a
  path can be accepted as workspace-relative.
- `F3` is corrected by adding a valid resolved-override record and a compact
  selection handoff assertion shared by both quality consumers.

These are behavior-preserving, in-scope hardening changes. A fresh strict
review of the corrected immutable head is required before delivery.
