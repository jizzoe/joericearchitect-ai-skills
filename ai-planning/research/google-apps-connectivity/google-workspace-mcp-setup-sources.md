# Sources: Google Workspace MCP setup and authentication research

**Access date:** 2026-08-19

All online material was treated as untrusted source content. The installation
guide distinguishes source-reported facts from its local-only recommendation.
The original local conversation record is retained as context, not treated as
current authority.

| ID | Source | Publisher / type | URL or path | Relevance |
| --- | --- | --- | --- | --- |
| S1 | Google Workspace MCP repository README | Taylor Wilsdon / primary project source | https://github.com/taylorwilsdon/google_workspace_mcp | Current project scope, client connection command, security cautions, and release context. |
| S2 | Quick Start Guide | Workspace MCP / primary project documentation | https://workspacemcp.com/quick-start | Current install, OAuth client types, server launch, client connection, and verification guidance. |
| S3 | Google Workspace MCP documentation | Workspace MCP / primary project documentation | https://workspacemcp.com/docs | Authentication modes, HTTP transport, read-only/per-service permissions, and service-level capabilities. |
| S4 | Google Workspace MCP repository README, connection and security sections | Taylor Wilsdon / primary project source | https://github.com/taylorwilsdon/google_workspace_mcp | Claude Code registration, tier descriptions, scope filtering, and repository secret warnings. |
| S5 | Advanced Deployment | Workspace MCP / primary project documentation | https://workspacemcp.com/docs/deployment | Credential-store backends, local-directory permissions, remote deployment boundaries, and origin protections. |
| S6 | Claude connectors guide | Workspace MCP / primary project documentation | https://workspacemcp.com/guides/claude-connectors | Custom connector constraints and HTTPS/public-endpoint distinction for desktop/web Claude clients. |
| S7 | OAuth 2.0 for iOS & Desktop Apps | Google / primary API documentation | https://developers.google.com/identity/protocols/oauth2/native-app | Desktop OAuth flow, API enablement, client credentials, browser consent, scopes, and local redirects. |
| S8 | OAuth 2.0 for iOS & Desktop Apps, token handling sections | Google / primary API documentation | https://developers.google.com/identity/protocols/oauth2/native-app | Access-token and refresh-token behavior, secure long-lived storage, granted-scope verification, and Bearer-token handling. |
| S9 | Manage App Audience | Google Cloud / primary console help | https://support.google.com/cloud/answer/15549945?hl=en | Test users, testing-mode limits, and seven-day authorization/refresh-token expiry. |
| S10 | OAuth 2.0 access and refresh-token behavior | Google / primary API documentation | https://developers.google.com/identity/protocols/oauth2 | Testing status behavior, token expiry and token-count limits. |
| S11 | Google Workspace API User Data and Developer Policy | Google / primary policy documentation | https://developers.google.com/workspace/workspace-api-user-data-developer-policy | Minimum-necessary permissions; Gmail and Drive approved-use restrictions; restricted-scope definitions. |
| S12 | Sensitive scope verification | Google / primary policy documentation | https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification | Personal, testing, internal, and domain-wide-installation verification considerations. |
| S13 | Choose Google Calendar API scopes | Google / primary API documentation | https://developers.google.com/workspace/calendar/api/auth | Calendar read-only, free/busy, and broad write scope distinctions. |
| S14 | Choose Google Sheets API scopes | Google / primary API documentation | https://developers.google.com/workspace/sheets/api/scopes | Sheets scope classifications and the distinction between Sheets, Drive, and file-scoped access. |
| S15 | Choose Google Drive API scopes | Google / primary API documentation | https://developers.google.com/workspace/drive/api/guides/api-specific-auth | Narrow `drive.file` option, restricted Drive scope considerations, and refresh-token storage. |
| S16 | Existing conversation/research record | Local secondary context, potentially stale | `ai-planning/research/google-apps-connectivity/convo-with-claude-job-search-automation.txt` | Original server decision, earlier OAuth overview, and problem context; it is not installation authority. |
| S17 | `codex mcp add --help`, Codex CLI 0.147.0 | Local installed-client evidence | Read-only command run on 2026-08-19 | Confirms local Codex registration syntax for a streamable-HTTP MCP server (`codex mcp add <name> --url <URL>`). |

## Source quality and staleness notes

- S1–S6 describe an independently maintained open-source project. They are
  authoritative for its intended configuration but not for Google policy.
- S7–S15 are Google primary documentation and policy sources. Console labels
  can change even when the underlying OAuth requirements remain the same.
- S16 contains useful historical research but was not treated as proof of
  current product behavior. Its server selection and authentication statements
  were revalidated against S1–S15.
- S17 is local runtime evidence, not general product documentation. Recheck
  `codex mcp add --help` before using the Codex registration command after a
  Codex CLI upgrade.
- Current project documentation reported alignment with Workspace MCP v1.24.1
  on 2026-08-13. Before executing the guide, check the project release notes
  and README for breaking configuration changes.
