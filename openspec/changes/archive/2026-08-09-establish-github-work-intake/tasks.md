## 1. Planning and GitHub State

- [x] 1.1 Create and link the M2-C1 issue and Project item.
  - Depends on: M1-C2
  - Evidence: issue #15 exists, parent roadmap #1 is linked, Project item exists, and status is `In Progress`.

- [x] 1.2 Run planning review for proposal, spec, design, tasks, security, recovery, portability, and evidence requirements.
  - Depends on: 1.1
  - Evidence: `openspec validate establish-github-work-intake --strict` passes and review findings are resolved or recorded.

## 2. Repository Intake Assets

- [x] 2.1 Add managed label definitions and apply them to the repository.
  - Depends on: 1.2
  - Evidence: managed type/scope labels exist with descriptions and no status labels are created.

- [x] 2.2 Add feature and bug issue forms plus issue-template configuration.
  - Depends on: 1.2
  - Evidence: `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`, and `config.yml` exist and require SDD intake fields.

- [x] 2.3 Add pull request template with SDD evidence prompts.
  - Depends on: 1.2
  - Evidence: `.github/pull_request_template.md` exists with linkage, validation, security, recovery, portability, and limitation prompts.

- [x] 2.4 Add non-secret GitHub integration configuration and portability fixture.
  - Depends on: 1.2
  - Evidence: `config/sdd-github.json` and an alternate-product fixture contain no secrets or mutable runtime IDs.

## 3. Project Intake Verification

- [x] 3.1 Verify or configure Project intake statuses.
  - Depends on: 2.1
  - Evidence: Project status options include `Backlog`, `Ready`, `In Progress`, `In Review`, and `Done`, or a human-pause report identifies missing owner-only configuration.

- [x] 3.2 Create or reuse disposable `[SDD test]` feature and bug intake issues.
  - Depends on: 2.2, 3.1
  - Evidence: disposable feature and bug issue URLs are recorded and contain no sensitive content.

- [x] 3.3 Add disposable issues to the Project, move them through intake statuses, close them, and retain evidence.
  - Depends on: 3.2
  - Evidence: each disposable issue has one Project item, reaches `Done`, closes, and remains available as audit evidence.

## 4. Verification and Delivery

- [x] 4.1 Run full local verification and review.
  - Depends on: 2.1, 2.2, 2.3, 2.4, 3.3
  - Evidence: OpenSpec strict validation, template parse checks, config checks, label/status checks, secret-pattern scan, portability review, and recovery review pass.

- [x] 4.2 Complete formal OpenSpec Verify for M2-C1.
  - Depends on: 4.1
  - Evidence: verification report maps tasks, requirements, scenarios, design decisions, security controls, recovery paths, portability claims, and known limitations to current evidence.

- [x] 4.3 Deliver, Sync, and Archive through separate authorized checkpoints.
  - Depends on: 4.2
  - Evidence: implementation PR closes issue #15 and reaches `Done`; Sync PR updates living specs; Archive PR preserves the completed change and active change list is empty.
