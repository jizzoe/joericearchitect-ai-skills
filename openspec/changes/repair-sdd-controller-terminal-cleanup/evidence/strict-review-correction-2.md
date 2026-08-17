## Strict-review correction 2

The strict isolated review of commit `d6535a4` returned two high findings.

- Migration authorization now signs and verifies the exact resource binding:
  kind, identity, head, recovery reference, ownership token, and delivery
  evidence. Fresh inspection must match that binding before migration.
- Queue advancement and completed-entry validation now require every retained
  resource to have current, exact delivery evidence.

Validation after the correction: 210 focused tests, strict OpenSpec validation,
artifact-quality validation, tracking validation, and whitespace validation
pass. The changed head requires a fresh strict review before delivery.
