# Ad Hoc Follow-ups

## 2026-08-20 — Recover and plan Jira-linkage rules

**Status:** Deferred deliberately. Revisit before any Jira issue creation,
Jira-to-OpenSpec binding, or Jira-based autonomous delivery is proposed.

### Search result

A repository-wide search, including active and archived OpenSpec paths and Git
history, found no durable Jira project key, issue-linkage contract, tracker
configuration, connected Jira adapter, or implemented Jira integration.
`config/sdd-github.json`, the canonical SDD skills, runtime scripts, and
OpenSpec archive contain GitHub-specific tracking only.

### Planning evidence found

- `ai-planning/research/cross-assistant-ai-assets-best-practices.md` says an
  external issue-tracker API belongs behind an MCP server plus a skill.
- `ai-planning/research/sdlc-skills-repo-review.md` describes Atlassian
  integration as an optional pattern in a third-party reference repository.
- `ai-planning/research/builtin-ai-assets-claude-vs-codex.md` notes that
  partner skills can use Atlassian MCP connectors.
- `ai-planning/research/global-skill-master-inventory.md` treats
  GitHub/Atlassian integration as pattern-only reference material; the current
  canonical implementation remains GitHub-specific.
- `ai-planning/research/git-workflows/github-workflow-options.md` says the
  branch-name convention resembles a prior Jira scheme but is not authoritative
  GitHub linkage.
- `ai-planning/design-briefs/standards-driven-quality-skills.md` permits
  read-only public issue-tracker research; it does not define Jira mutation or
  linkage behavior.

### Required future decision

Recover the previously accepted Jira-linkage rules from their authoritative
source, then create a dedicated roadmap/design-brief slice that defines:

1. Jira as source of truth, mirror, or optional configured adapter;
2. required Jira fields, issue/epic links, and GitHub/OpenSpec/PR relationships;
3. configuration ownership, connector/authentication scopes, and secret
   handling;
4. idempotent create/reuse, reconciliation, and failure/paused behavior; and
5. which lifecycle phases may mutate Jira, under what explicit authorization,
   and what evidence closes the record.

Do not infer or create Jira records until that slice is accepted and an
authorized Jira connection is configured.
