# Correction disposition: URL scheme detection

Disposition of strict review record `strict-130b0d59-ce0a-42ec-8e6a-3b652701bf96`:

- `F001` is corrected by treating every case-insensitive URI-scheme-bearing
  source as a URL, accepting only HTTP(S) after parsing and public-host
  validation. Focused fixtures reject uppercase private-host URLs and an
  unsupported scheme.

This bounded correction requires a fresh strict exact-head review before any
delivery operation.
