# Requirements Mapping

| Delta requirement | Implementation | Verification |
|---|---|---|
| Explore → Propose requires owner-approved open questions | `skills/base/autonomous-sdd-lifecycle/SKILL.md` step 4; `human-decision-classification.md` pause list; `open-question-resolution.md` | `openspec validate --all --strict` |
| Presentation contract (jargon + plain English + options + tradeoffs + recommendation) | `open-question-resolution.md` "Presentation Contract" | manual review of the reference |
| Durable recording (`owner-approved` + reference) | `open-question-resolution.md` "Approval and Recording" | manual review |
| Review uses shared checklist + severity-tagged findings | `platform-review-adapters.mjs` `REVIEW_CHECKLIST_PROMPT`; `review-severity-classification.test.mjs` | focused test |
| Only material findings drive a loop; advisory non-blocking | `review-findings.mjs` `validateFindingDispositions`; `review-severity-classification.test.mjs` | focused test |
| Correction budget (3 fixes → fail-closed) | `review-findings.mjs` `validateFindingDispositions`; `review-severity-classification.test.mjs` | focused test |
| Completeness-pass prompt hook (retains checklist + carries prior findings) | `platform-review-adapters.mjs` `completenessReviewPrompt`; `review-severity-classification.test.mjs` | focused test |

The implementer self-review pre-flight and the completeness-pass escalation
*triggering* are runner-orchestration behaviors. They are documented as
runner-followed prose in `review-matrix.md` and deferred to a follow-up
controller change; they are intentionally NOT normative spec requirements in
this change.
