# Correction disposition: public IPv4 and local path safety

Disposition of strict review record `strict-2aa6e271-258a-4114-b43a-226daba60061`:

- `IR-001` is corrected by rejecting special-use IPv4 ranges, including
  carrier-grade NAT, link-local, documentation, benchmarking, multicast,
  reserved, broadcast, and existing private ranges; focused fixtures cover the
  representative addresses named in the finding.
- `IR-002` is corrected by requiring workspace-relative paths and local
  sources to contain non-whitespace content and no control characters;
  focused fixtures cover target paths, rule scopes, and local sources.

These bounded corrections require a fresh strict exact-head review before any
delivery operation.
