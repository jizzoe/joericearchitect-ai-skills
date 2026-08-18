# Design brief portfolio

This index separates current design direction from historical decisions,
delivered-change records, explanatory reference material, and adjacent
portfolios. A design brief explains a direction; living OpenSpec
specifications remain authoritative for observable behavior, and archived
OpenSpec changes remain authoritative for delivered intent.

## Autonomous SDD and orchestration

| Category | Canonical brief | Status |
| --- | --- | --- |
| Runtime kernel | [Autonomous SDD runtime kernel](autonomous-sdd-runtime-kernel.md) | Evidence-derived recommendation; local-first durability is not yet an implemented successor runtime. |
| Scoped work units | [Scoped work-unit context orchestration](scoped-work-unit-context-orchestration.md) | Evidence-derived recommendation; the tests-first vertical slice is not yet implemented. |
| Review assurance | [Independent-review assurance and profiles](independent-review-assurance-and-profiles.md) | Consolidates delivered review contracts and explicitly identifies remaining transport, configuration, and profile decisions. |
| Lifecycle integration | [SDD lifecycle integration and safe recovery](sdd-lifecycle-integration-and-safe-recovery.md) | Current architecture plus remaining composition/status gaps. |
| Milestone and cross-repository coordination | [SDD milestone/slice delivery cadence](sdd-milestone-slice-delivery-skill.md) | Current implementation-ready design; this file is also receiving separate in-progress collaboration-profile work. |
| Planning provenance | [SDD design-brief provenance](sdd-design-brief-provenance.md) | Owner-approved design direction that is not yet implemented. |

The responsibility boundary is:

```text
single-repository execution
runtime kernel -> scoped work units -> review/lifecycle adapters

cross-repository coordination
milestone/slice contract -> durable handoff -> component delivery -> returned evidence
```

The milestone layer is a client of the single-repository runtime. It does not
define another run record, review policy, lifecycle engine, or authority model.

## How to read status

- **Canonical** means the current decision surface for its category. It does
  not imply that every recommendation is implemented.
- **Reference** explains a design without becoming a decision record.
- **Historical** preserves why a delivered or superseded decision existed.
- **Superseded** means current planning should use the named canonical brief.
- **Out of scope** means the document belongs to another portfolio.

When a canonical brief conflicts with an older brief, use the canonical brief
for current planning and follow its links to living specs or code to determine
what is implemented today.

## Source disposition

| Source | Status | Current destination |
| --- | --- | --- |
| `autonomous-sdd-reliability-control-plane.md` | Superseded | Split across Runtime, Review assurance, and Lifecycle integration; full source retained under [archived/autonomy](archived/autonomy/autonomous-sdd-reliability-control-plane.md). |
| `autonomous-sdd-durable-execution-and-isolated-work-units.md` | Superseded | Split between Runtime and Scoped work units; full source retained under [archived/autonomy](archived/autonomy/autonomous-sdd-durable-execution-and-isolated-work-units.md). |
| `strict-review-multistep-artifact-delivery.md` | Historical open-gap evidence | Review assurance; full source retained under [archived/autonomy](archived/autonomy/strict-review-multistep-artifact-delivery.md). |
| `prototype-rapid-same-session-review.md` | Unselected alternative | Review assurance; full source retained under [archived/autonomy](archived/autonomy/prototype-rapid-same-session-review.md). |
| `independent-review-configuration-provenance.md` | Superseded input | Review assurance; full source retained under [archived/autonomy](archived/autonomy/independent-review-configuration-provenance.md). |
| `independent-review-inspection-environment-fallback.md` | Conditional design input | Review assurance; full source retained under [archived/autonomy](archived/autonomy/independent-review-inspection-environment-fallback.md). |
| `allow-artifact-missing-degraded-review-recovery.md` | Delivered history | Review assurance; full source retained under [archived/autonomy](archived/autonomy/allow-artifact-missing-degraded-review-recovery.md). |
| `sdd-controller-terminal-cleanup.md` | Delivered history | Lifecycle integration; full source retained under [archived/autonomy](archived/autonomy/sdd-controller-terminal-cleanup.md). |
| `sdd-lifecycle-hygiene-and-brief-provenance.md` | Superseded | Split between Lifecycle integration and Planning provenance; full source retained under [archived/autonomy](archived/autonomy/sdd-lifecycle-hygiene-and-brief-provenance.md). |
| `sdd-milestone-slice-delivery-skill.md` | Canonical | Milestone and cross-repository coordination. |
| `ideas/approachable-sdd-kernel-architecture-reference.md` | Reference | [Approachable SDD kernel explanation](reference/approachable-sdd-kernel-architecture-reference.md). |

### Delivered historical foundations

| Historical brief | Category | Current authority |
| --- | --- | --- |
| [Isolated autonomous independent review](archived/isolated-autonomous-independent-review.md) | Review assurance | Delivered foundation; use the Review assurance brief and living `isolated-independent-review` spec for current planning/behavior. |
| [Authorized degraded independent review](archived/authorized-degraded-independent-review.md) | Review assurance | Delivered foundation; use the Review assurance brief and living `authorized-degraded-independent-review` spec. |
| [Independent-review result transport reliability](archived/independent-review-result-transport-reliability.md) | Review assurance | Delivered transport/diagnostic foundation; the remaining real multi-step artifact gap is recorded in Review assurance. |
| [Independent-review worktree lifecycle and diagnostics](archived/independent-review-worktree-lifecycle-and-diagnostics.md) | Review assurance | Delivered view-lifecycle foundation; use Review assurance for current architecture. |
| [Autonomous SDD continuation default](archived/autonomous-sdd-continuation-default.md) | Runtime and lifecycle | Delivered schema-v4/continuation foundation; use Runtime and Lifecycle for current architecture. |
| [SDD post-Archive workspace cleanup](archived/sdd-post-archive-workspace-cleanup.md) | Lifecycle | Delivered cleanup foundation; use Lifecycle and the living cleanup spec for current behavior. |

Other files under [archived](archived/) belong to their skill, quality,
installation, or foundation portfolios rather than this autonomous-SDD set.

## Adjacent portfolios

[Claude cross-tool repository gaps](claude-cross-tool-repo-gap-inventory.md)
belongs to cross-assistant parity. Its live strict-review qualification finding
is relevant to Review assurance, but the root `CLAUDE.md` and adapter-coverage
work are not autonomous orchestration design.

The standards-driven quality, React Native/Expo quality, project bootstrap,
and catch-all idea briefs remain outside this portfolio.
