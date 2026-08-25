# Requirements Mapping

| Delta requirement | Implementation | Verification |
|---|---|---|
| Explore → Propose requires owner-approved open questions | `skills/base/autonomous-sdd-lifecycle/SKILL.md` step 4; `human-decision-classification.md` pause list; `open-question-resolution.md` | `openspec validate --all --strict` (49/49) |
| Presentation contract (jargon + plain English + options + tradeoffs + recommendation) | `open-question-resolution.md` "Presentation Contract" | manual review of the reference |
| Durable recording (`owner-approved` + reference) | `open-question-resolution.md` "Approval and Recording" | manual review |
| Review uses shared checklist + severity-tagged findings | `review-matrix.md` "Shared Review Checklist", "Finding Classes" | `openspec validate --all --strict` |
| Self-review pre-flight | `review-matrix.md` "Self-Review Pre-Flight" | manual review |
| Completeness escalation + 3-fixes budget | `review-matrix.md` "Completeness Escalation" | manual review |

Every scenario in the delta `specs/bounded-autonomous-execution/spec.md` maps to
the reference/skill text above. No scenario requires new runtime code in v1.
