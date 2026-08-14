# Verification Profiles

## Common Minimum

Both profiles retain shared guardrails, core data-integrity checks, the critical
flow, focused deterministic evidence, local code and security review, explicit
gaps, and bounded corrections. Every completed readiness check and local-review
finding carries a details record matching the current workspace or commit and
the current changed-path list, and each selected-check result agrees with its
referenced evidence result. Local findings retain an explicit resolution;
unresolved findings prevent readiness, corrected findings link a current passed
correction, and accepted warnings or false positives preserve their disposition
evidence. A latest failed correction prevents readiness; an exhausted failed
signature is blocked.

The result records UI scope as `none` or `web`, plus layout-change and material-
change flags. The validator derives the complete mandatory check inventory from
that record and the delivery profile; callers cannot establish readiness by
omitting a minimum check.

## Prototype Rapid

Require focused unit or integration evidence and the critical flow. When UI
behavior exists, also require Chromium desktop `1440x900`, mobile web
`390x844`, and a critical interaction path. A non-UI change can mark browser
evidence not applicable with a scope reason.

## Production Rapid

Add appropriate regression coverage, repeatability, operational checks,
stronger release evidence, exact-head CI, and strict isolated independent
review. Exact-head CI and strict review are never not applicable, must retain
their production-gate evidence bindings, and must pass. UI work also retains
applicable browser and device matrix evidence. Profile selection never grants
mutation or delivery authority.

## Web UI Evidence

Layout-changing work produces current screenshots at `1440x900` and `390x844`
plus a critical-path interaction assertion. New or materially changed UI runs
axe-core through the browser integration and records applicable manual keyboard
or semantic review. Native mobile is outside the first release and must not be
silently inferred.

Playwright, Chromium, and axe-core are prerequisites when UI evidence is
required. Missing tools cause an interactive installation or approved-
environment request and an autonomous pause. They never convert a required
check to not applicable.
