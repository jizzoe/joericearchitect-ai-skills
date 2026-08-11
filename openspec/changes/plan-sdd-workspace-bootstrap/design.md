## Context

SDD workspace bootstrap is a separate concern from global skill installation.
It needs independent review because workspace initialization can affect several
repositories and assistant configuration.

## Goals / Non-Goals

**Goals:** retain a durable planning record and make its issue linkage
machine-verifiable.

**Non-Goals:** implement bootstrap behavior, choose product topology, or modify
user configuration.

## Decisions

### Preserve a separate planning boundary

The change records only portable planning material for issue #57. A later
implementation change must define observable requirements, scripts, fixtures,
and approved mutation behavior.

### Keep configuration explicit

Any future implementation must take repositories, branches, paths, and
credentials as configuration. It cannot infer ownership from local filesystem
layout.

## Verification Strategy

- Validate tracking metadata against tracking v1.
- Validate the change and all OpenSpec artifacts strictly.
- Confirm the planning document contains no credentials, personal paths, or
  product-specific constants.

## Attribution and Licensing

This planning record is repository-authored and imports no third-party
implementation content.

## Recovery

Correct broken linkage or planning text locally without modifying any workspace
or assistant configuration.

## Reuse Plan

The planning structure is portable across products. Its configuration model
preserves portability, while security is maintained by excluding credentials,
executable actions, and user-specific paths.
