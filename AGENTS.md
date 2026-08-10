# Agent Guidance

This repository uses OpenSpec SDD for changes.

- Read `docs/sdd-workflow.md` and `docs/sdd-foundation-operations.md` before
  changing governed assets.
- Keep assistant wrappers thin and point them at canonical `skills/base/*`
  skills.
- Run `openspec validate --all --strict` before delivery.
- Use PR bodies with both issue linkage and `OpenSpec change: <change-name>`.
- Do not expose secrets to pull request workflows or commit product-specific
  constants into reusable global assets.

