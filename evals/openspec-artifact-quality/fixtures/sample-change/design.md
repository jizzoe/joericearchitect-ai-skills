## Context

The sample product generates local report files. The quality fixture models a
small OpenSpec change without depending on this repository's GitHub Project.

## Goals / Non-Goals

Goals:

- Validate local report exports.
- Preserve existing report compatibility.

Non-goals:

- No network upload.
- No credential or token handling change.

## Decisions

### DEC-001: Validate files locally

The validator reads report metadata from disk.

Rationale: local validation avoids external state and preserves security.

## Verification Strategy

- Run the report validator against a passing fixture.
- Run a failing fixture that omits required metadata.

## Attribution and Licensing

The fixture is repository-authored sample content and adds no third-party
runtime dependency.

## Recovery

If validation fails, keep the existing report file and regenerate only the
derived metadata.

## Reuse Plan

The pattern is portable because repository paths and product names are supplied
by fixture content, while validation behavior stays product-neutral. The
portability boundary is the supplied change path.
