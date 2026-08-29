# M4-S4 Campaign — Candidate Skill List (single-repo, global reusable skills)

Date: 2026-08-28
Status: Planning / decision input. The owner selects the **9 remaining M4-S4 real
completions** from the consolidated list in §4. This document creates no issue,
branch, OpenSpec change, or authorization.

## 0. Decision context

- **Job-search repo work is on hold.** The remaining qualification runs will
  build **reusable global skills in this repository** (`joericearchitect-ai-skills`),
  which are then installed and used in other repos.
- **Primary scenario:** code-review + code-quality skills for building the
  mobile app, consumed during **generation**, **review**, and (later) the
  **independent verifier**.
- **Qualification state:** 1/10 complete; **9 real completions remain**.
- Sources reconciled: `plans/autonomous-sdd-reliability-control-plane-roadmap-revision.md`
  (§2 ten-skill queue), `plans/quality-and-product-acceleration-roadmap.md`
  (milestones + design-brief completion inventory), the design-brief directory,
  and the `jra-sonarqube` research.

---

## Final selected 9 (owner-approved 2026-08-28)

The owner selected the 9 below to complete the campaign, following the already
completed `add-generic-git-repository-cleanup` (counts 1/10). Canonical order +
running status now lives in
[`plans/m4-s4-qualification-campaign-roadmap.md`](../plans/m4-s4-qualification-campaign-roadmap.md).

| Order | Change | Note |
|---|---|---|
| 1 | `establish-shared-quality-context-and-standards-pack` | foundation |
| 2 | `add-typescript-quality-overlay` | first JS overlay |
| 3 | `add-react-native-expo-quality-overlays` | **stress test** |
| 4 | `add-java-spring-quality-overlay` | backend |
| 5 | `add-terraform-static-quality-overlay` | infra |
| 6 | `add-sonarqube-client-and-quality-gate` | **stress test** |
| 7 | `add-sonarqube-issues-and-coverage` | verifier |
| 8 | `add-repository-status-skill` | low-risk filler |
| 9 | `add-git-health-skill` | low-risk filler |

---

## 1. Q1 — Unimplemented design briefs: propose-ready count

Counted against the non-archived design briefs that are **not already delivered**
(see §4 for the per-skill detail). Already-delivered briefs and the roadmap-gated
control-plane slice briefs (m6/m7/m8, M5 cross-repo) are excluded here.

**Answer: 6 briefs are already propose-ready; 2 more planning documents can each
be split into propose-ready slices with modest work.**

### Already propose-ready (6)

| Brief | State | Type |
|---|---|---|
| `react-native-expo-quality-skills.md` | Owner-approved; **ready for Explore** | global mobile quality skill |
| `sdd-milestone-slice-delivery-skill.md` | implementation-ready draft | global SDD lifecycle skill |
| `sdd-project-bootstrap-skill.md` | implementation-ready draft | global SDD skill |
| `ship-sdd-design-brief-goal-trigger.md` | owner-directed; Explore/Propose | harness shorthand |
| `explore-to-propose-owner-approval.md` | owner-approved; **ready for Propose** | harness |
| `reduce-implementer-reviewer-fix-loops.md` | owner-approved; **ready for Propose** | harness |

### Quickly proposable (2 planning docs → ~6-7 slices)

| Doc | Why quick | Resulting slices |
|---|---|---|
| `standards-driven-quality-skills.md` | program-level; decisions + "Recommended Decisions Before Propose" are already recorded | `typescript-quality-overlay`, `react-web-quality-overlay`, `java-spring-quality-overlay`, `terraform-static-quality-overlay`, formal `standards-pack` |
| `ideas/catch-all.md` | unshaped but small, read-only ideas | `repository-status`, `git-health`, `design-brief-delivery-shorthand` |

### Delivered / not candidates (for reference)

`claude-cross-tool-repo-hygiene` (Run #1), `generic-git-repository-cleanup`
(Run #2, counts #1), `github-cli-auth-context-detection`,
`shared-sdd-runtime-distribution`, `sdd-lifecycle-hygiene-and-brief-provenance`,
`sdd-controller-terminal-cleanup`, `strict-review-multistep-artifact-delivery`,
`allow-artifact-missing-degraded-review-recovery`,
`autonomous-prototype-frictionless-quality-loop`,
`stabilize-autonomous-sdd-bootstrap-and-cutover-plan`, and the independent-review
repair briefs (provenance / inspection-fallback / Claude runtime readiness).

---

## 2. Q2 — Skills needed for the mobile app (quality / standards / security)

### Mobile product stack (verified)

- **App** (`hrf-reinvest-to-grow-mobile-app`): Expo SDK `~57.0.13`, React
  Native `0.86.2`, React `19.2.3`, TypeScript `strict`, Jest (`jest-expo`),
  prettier; `expo-sqlite`, `expo-speech`, `expo-localization`, `expo-crypto`,
  `expo-status-bar`. Android-first (EAS internal APK). **No CI, no coverage
  collection, no Sonar config today.**
- **Backend/infra** (`home-roots-reinvest-in-growth` central planning): Spring
  Boot (Java) on AWS EKS, Terraform, RDS PostgreSQL, Cognito, S3,
  Transcribe/Polly, Docker, GitHub Actions.

### Skills required

| # | Skill (candidate change) | Covers | Brief | Brief state | Propose-ready? | What's needed |
|---|---|---|---|---|---|---|
| 1 | `base-code-review` | common review process / severity / correction | `archived/base-implementation-quality.md` | files present in `skills/base/`; formal delivery flagged incomplete | ✅ (exists) | optional formal delivery run |
| 2 | `base-verification-loop` | deterministic checks + evidence ladder | `archived/base-implementation-quality.md` | files present; formal delivery flagged incomplete | ✅ (exists) | optional formal delivery run |
| 3 | `establish-shared-quality-context-and-standards-pack` | selection/precedence + context policy | `standards-driven-quality-skills.md` + `react-native-expo-quality-skills.md` | shared files partially present | ✅ quick | formal slice → Explore/Propose |
| 4 | `add-typescript-quality-overlay` | TS type/null/async/contract/security + JS compat | `standards-driven-quality-skills.md` | program brief only | ✅ quick | split slice + official TS source refresh → Explore |
| 5 | `add-react-native-expo-quality-overlays` | RN platform/permissions/accessibility + Expo delivery + MASVS secret redaction | `react-native-expo-quality-skills.md` | owner-approved; Explore-ready | ✅ now | Explore: bind repo, pinned SDKs, device matrix, MASVS subset |
| 6 | `add-java-spring-quality-overlay` | Spring injection/auth/persistence/validation/security | `standards-driven-quality-skills.md` | program brief only | ✅ quick (conditional) | split slice → Explore once backend stack confirmed |
| 7 | `add-terraform-static-quality-overlay` | `fmt`/`validate`/lint/sensitive-values/state risk | `standards-driven-quality-skills.md` | program brief only | ✅ quick (conditional) | split slice → Explore; static/local only |
| 8 | `add-react-web-quality-overlay` | React hooks/a11y/browser (admin web) | `standards-driven-quality-skills.md` | program brief only | ✅ quick (conditional) | only if admin web is built |
| 9 | `sonarqube-*` verifier skills | quality gate / issues / coverage evidence | **none in this repo** | jra-sonarqube research only | ❌ no brief | new design brief(s) from research (see §3) |

Security is covered by: (a) stack overlays above (injection, secrets, permissions),
(b) the **OWASP MASVS subset + client/config secret redaction** resolved in the
RN/Expo brief, and (c) the **SonarQube** gate/issue/coverage evidence in §3.

---

## 3. Q3 — SonarQube skills (future independent-verifier add)

Source of truth: `jra-sonarqube` research + the live instance + the
`sonarqube-github-actions-mobile` findings. There is **no explicit skill list** in
that repo — the skills below are derived from its documented integration surface.

### Documented integration surface (jra-sonarqube)

- Live **SonarQube Community Build** at `https://sonar.joericearchitect.com`
  (cold-off ECS; main-branch analysis only; no PR decoration).
- **Read-only transport:** Web API (bearer token; projects / metrics /
  quality-gate status / issues / reports / `api/system/health`) **or** MCP —
  official `sonarsource/sonarqube-mcp` (SSAL, read-only mode, selective toolsets)
  and `wadew/sonar-mcp` (MIT, Community Edition: projects/metrics/quality-gate/
  issues/reports/prompt templates).
- **CI:** `sonarqube-scan-action@v7` + `sonarqube-quality-gate-action@v1`,
  Jest LCOV coverage via `sonar.javascript.lcov.reportPaths`.
- **Gate contract (mobile):** fail merge on any **Major-or-higher** issue or
  **< 80% coverage**.
- **Stance:** "treat SonarQube as an evidence provider, not an authority;
  read-only, narrow toolsets." Q7 (read-only MCP agent integration) is the
  deferred future milestone.

### Candidate global SonarQube skills (build in this repo)

| Skill | Role in verifier | Straightforward? | First-pass priority |
|---|---|---|---|
| `sonarqube-client` | read-only Web API/MCP transport + auth scoping (foundational) | moderate | **required foundation** |
| `sonarqube-quality-gate` | read gate status (pass/fail + conditions) as gate evidence | ✅ most deterministic | **highest** |
| `sonarqube-issues` | map issues → findings (rule / severity / path) | moderate | **high** |
| `sonarqube-coverage` | coverage % / LCOV evidence vs threshold | ✅ small | **high** (80% gate) |
| `sonarqube-scan` | trigger/consume CI analysis + task completion | moderate | medium |
| `sonarqube-project-config` | author `sonar-project.properties` + workflow | ✅ well-documented | medium (setup) |

**(A) Straightforward to brief + implement:** `sonarqube-quality-gate`,
`sonarqube-coverage`, `sonarqube-project-config` (small, deterministic, already
documented step-by-step), then `sonarqube-issues` and `sonarqube-client`
(moderate).

**(B) Most important for the first-pass independent-verifier add:**
`sonarqube-client` (transport prerequisite) → `sonarqube-quality-gate` (the
primary pass/fail evidence) → `sonarqube-issues` (review findings) →
`sonarqube-coverage` (the 80% gate). All are **read-only evidence providers**,
consistent with the independent-verifier contract ("consume sealed exact-head
evidence, emit redacted findings/gaps, never write code or mutate accounts").

**Gap:** none of these has a design brief in this repo. Recommended path: run
`design-brief-from-research` over the jra-sonarqube findings → Explore → Propose.
`sonarqube-client` + `sonarqube-quality-gate` can be one combined first slice.

---

## 4. Consolidated candidate list (owner picks 9)

Legend: **Brief state** = what the source planning doc says today.
**To be propose-ready** = the smallest gap before an OpenSpec Propose.

### A. Mobile / full-stack quality (owner scenario — highest fit)

| Candidate change | Skill(s) | Associated brief(s) | Brief state | To be propose-ready |
|---|---|---|---|---|
| `establish-shared-quality-context-and-standards-pack` | `standards-pack` + context policy | `standards-driven-quality-skills.md`, `react-native-expo-quality-skills.md` | program brief; shared files partially present | one formal slice → Explore/Propose |
| `add-typescript-quality-overlay` | `typescript-javascript-review` | `standards-driven-quality-skills.md` | program brief (M3) | split slice + TS source refresh → Explore |
| `add-react-native-expo-quality-overlays` | `react-native-review` + `expo-review` + mobile standards | `react-native-expo-quality-skills.md` | **owner-approved; Explore-ready** | Explore only (bind repo/SDK/device/MASVS) |
| `add-java-spring-quality-overlay` | `java-spring-review` | `standards-driven-quality-skills.md` | program brief (M2) | split slice → Explore (after backend confirmed) |
| `add-terraform-static-quality-overlay` | `terraform-review` | `standards-driven-quality-skills.md` | program brief (M4) | split slice → Explore (static/local) |
| `add-react-web-quality-overlay` | `react-web-review` | `standards-driven-quality-skills.md` | program brief (M3) | split slice → Explore (only if admin web) |

### B. SonarQube verifier skills (Q3)

| Candidate change | Skill(s) | Associated brief(s) | Brief state | To be propose-ready |
|---|---|---|---|---|
| `add-sonarqube-client-and-quality-gate` | `sonarqube-client` + `sonarqube-quality-gate` | none | **no brief** | design brief from jra research → Explore → Propose |
| `add-sonarqube-issues-and-coverage` | `sonarqube-issues` + `sonarqube-coverage` | none | **no brief** | design brief from jra research |
| `add-sonarqube-scan-and-project-config` | `sonarqube-scan` + `sonarqube-project-config` | none | **no brief** | design brief from jra research |

### C. Utility / SDD global skills (read-only, low risk)

| Candidate change | Skill(s) | Associated brief(s) | Brief state | To be propose-ready |
|---|---|---|---|---|
| `add-repository-status-skill` | `repository-status` | `ideas/catch-all.md` | idea only | shape a small brief → Explore/Propose |
| `add-git-health-skill` | `git-health` | `ideas/catch-all.md` | idea only | shape a small brief → Explore/Propose |
| `deliver-research-and-planning-base-skills` | `research-topic-workflow`, `design-brief-from-research`, `sdd-requirements-to-plan` | `archived/base-skills-research-and-planning.md` | files present; formal delivery incomplete | reconcile local files → Explore/Propose |
| `deliver-implementation-quality-base` | `base-code-review`, `base-verification-loop` | `archived/base-implementation-quality.md` | files present; formal delivery incomplete | reconcile → Explore/Propose |
| `deliver-sdd-milestone-slice-delivery` | `sdd-milestone-slice-delivery` | `sdd-milestone-slice-delivery-skill.md` | implementation-ready draft | owner accept scope → Propose |
| `deliver-sdd-project-bootstrap` | `sdd-project-bootstrap` | `sdd-project-bootstrap-skill.md` | implementation-ready draft | owner accept scope → Propose |

### D. Harness/framework briefs (separate track — not "global skills")

| Candidate change | Associated brief | Brief state | Note |
|---|---|---|---|
| `ship-sdd` design-brief goal trigger | `ship-sdd-design-brief-goal-trigger.md` | Explore/Propose-ready | SDD shorthand, not a reusable app skill |
| owner-approved Explore→Propose transition | `explore-to-propose-owner-approval.md` | Propose-ready | harness governance |
| reduce implementer–reviewer fix loops | `reduce-implementer-reviewer-fix-loops.md` | Propose-ready | harness governance |

---

## 5. Notes / recommended ordering

- Dependency order for the mobile path: **standards-pack → TypeScript overlay →
  RN/Expo overlay**, then conditional **java-spring / terraform / react-web**
  only when the matching stack is confirmed (the mobile app already pins Expo/RN/TS,
  so TS + RN/Expo are the clear first two mobile slices).
- **SonarQube** is independent of the quality overlays and can start in parallel;
  begin with `sonarqube-client` + `sonarqube-quality-gate`.
- The read-only utility skills (`repository-status`, `git-health`) are the
  lowest-risk "filler" completions if a shortfall remains in the 9.
- Preflight each run for **active-delta overlap** on `standards-pack`,
  `context-management`, and `base-code-review` before Sync (roadmap-revision
  §2 warning — the #183 overlap stall).




