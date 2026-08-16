# Correction disposition: coverage reporting and public IPv6 sources

Disposition of strict review record `strict-fb9b8c38-aa39-4da7-9f8b-4bef84dfd429`:

- `F001` is corrected by requiring code-review output to report
  not-applicable classifications alongside selected rule IDs and scoped
  overrides, matching the delta contract and verification consumer.
- `F002` is corrected by accepting IPv6 source hosts only when they are public
  global-unicast addresses outside IETF, documentation, and other special-use
  ranges; focused fixtures reject unspecified, IPv4-mapped loopback,
  multicast, and documentation addresses.

These bounded corrections require a fresh strict exact-head review before any
delivery operation.
