# Correction disposition: public source hostname validation

Disposition of strict review record `strict-8c59ef5d-33bc-45ae-84e8-f79833f6cfaf`:

- `public-source-host-validation` is corrected by accepting HTTP(S) hostnames
  only when they are valid multi-label public-domain syntax or validated public
  IP addresses. Single-label and special-use local, internal, invalid, test,
  and example names are rejected; focused fixtures cover each boundary.

This bounded correction requires a fresh strict exact-head review before any
delivery operation.
