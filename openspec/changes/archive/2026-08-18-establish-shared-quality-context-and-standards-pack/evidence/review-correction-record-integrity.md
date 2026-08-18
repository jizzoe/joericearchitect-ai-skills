# Correction disposition: record integrity

Disposition of strict review record `strict-0da4604b-91a5-4cce-8978-34c99ce79904`:

- `F001` is corrected by iterating only verified arrays while retaining the
  corresponding structured invalid-field results.
- `F002` is corrected by rejecting duplicate rule IDs and override references
  that do not name a declared rule.
- `F003` is corrected by accepting only public HTTP(S) hosts and rejecting
  localhost, loopback, link-local, and RFC1918 private IPv4 hosts.

The new fixtures cover each fail-closed boundary. A fresh strict review of the
corrected immutable head remains required before delivery.
