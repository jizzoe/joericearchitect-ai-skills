# Google Workspace MCP: setup and authentication research

**Status:** research and operator guide, not an approved production deployment

**Research date:** 2026-08-19

**Scope:** Google APIs and authentication for a local installation of
[`taylorwilsdon/google_workspace_mcp`](https://github.com/taylorwilsdon/google_workspace_mcp), initially used from a compatible local MCP client—Claude Code or Codex—to access Gmail, Calendar, Drive, and Sheets. It revalidates the earlier exploratory notes in
[`convo-with-claude-job-search-automation.txt`](convo-with-claude-job-search-automation.txt).

## Executive recommendation

Start with a **single-user, local-only, read-only** server. Use a dedicated
Google Cloud project and a **Desktop OAuth client**, run Workspace MCP over
local streamable HTTP, and register only its `http://localhost:8000/mcp`
endpoint with the chosen MCP client. Keep the OAuth configuration and the
server's token store outside this repository.

Use this initial permission set:

```text
gmail:readonly calendar:readonly drive:readonly sheets:readonly
```

It supports reading/searching Gmail, listing Calendar events, finding Drive
files, and reading Sheets. It deliberately cannot send mail, change calendars,
modify files, or edit spreadsheets. The server's documented `--permissions`
mode both narrows requested scopes and hides tools for unselected services
([S4]).

Do **not** initially use a shared/public server, a service-account key, domain-
wide delegation, `--tool-tier complete`, or write permissions. Those are
separate design and security decisions.

## How the Google pieces fit together

| Component | What it does | Security implication |
| --- | --- | --- |
| Google Cloud project | Owns enabled APIs, consent configuration, OAuth client, quota, and audit boundary. | Use a dedicated project rather than an unrelated application project. |
| Enabled APIs | Allow calls to Gmail, Calendar, Drive, Sheets, and any later services. | Enable only services used by the selected tool permissions. |
| OAuth client | Identifies this local MCP installation to Google. | A Desktop client is appropriate for a local CLI/server; it is not an authentication bypass. |
| Consent and scopes | The signed-in person grants the particular data access requested. | Scopes are the primary least-privilege control. Added scopes may require fresh consent. |
| Access token | Short-lived bearer credential used on API calls. | Must never be put in source control, logs, prompts, or shell history. |
| Refresh token | Lets the server obtain later access tokens without another browser sign-in. | Treat it as a high-value secret; losing or revoking it requires consent again. |
| Workspace MCP credential store | Persists the refresh-token material for the local server. | The documented default is permission-protected local JSON, not a repository asset. Set an explicit, private directory. |

Google's desktop OAuth flow opens the system browser, has the person sign in to
Google, and returns an authorization code that is exchanged for access and
refresh tokens. Google passwords are entered only at Google; they are never
given to Workspace MCP. The client must also handle denied scopes rather than
assuming every requested scope was granted ([S7], [S8]).

### Authentication choices

| Choice | Use it when | Recommendation |
| --- | --- | --- |
| User-delegated OAuth | A person is using their own Gmail/Calendar/Drive data. | **Use for the first local installation.** |
| OAuth 2.1 multi-user HTTP | A remote or shared server needs a separate user identity for each client. | Defer. It needs HTTPS, a web OAuth client, a public callback design, and a deliberate credential-store choice. |
| Service account | The service accesses data it owns itself. | Not suitable for personal Gmail/Calendar. |
| Service account with Workspace domain-wide delegation | A Workspace administrator intentionally authorizes impersonation of domain users. | Do not use for this setup. It can grant broad access across the domain. |

The project supports all of these modes, but its own documentation says OAuth
2.1 requires streamable HTTP and describes service-account domain-wide
delegation as an advanced capability ([S3], [S4]).

## Step-by-step: local MCP-client installation

These instructions are for a macOS workstation, one Google account, and a
server reachable only at `localhost`. They apply to both Claude Code and Codex.
They intentionally do not create repository configuration, a tracked `.env`
file, or a background service.

### 1. Install the local runtime

Workspace MCP documents Python 3.10+ and `uv`; `uvx` downloads and runs the
server without cloning its repository ([S2]). On macOS with Homebrew:

```bash
brew install uv
uvx workspace-mcp --help
```

The second command confirms the package can start. It should not be given
OAuth values yet.

### 2. Create a dedicated Google Cloud project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project such as `workspace-mcp-personal-local`. Do not reuse a
   production application project.
3. In **APIs & Services → Library**, enable only the APIs planned for the
   initial permission set:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API
4. Do not enable Google Chat, Apps Script, Forms, Contacts, Slides, or Docs
   until a defined workflow requires them.

Google requires each called API to be enabled in the Cloud project ([S7]).

### 3. Configure the Google OAuth audience and scopes

1. In **Google Auth platform** (or the current **APIs & Services → OAuth
   consent screen** entry), configure app branding and audience.
2. For one personal Gmail account, choose **External** and leave the app in
   **Testing** initially. Add the exact Google account as a test user.
3. Add only the scope families required for the four initial services. Do not
   pre-authorize future write scopes.
4. Create an **OAuth client ID** of type **Desktop application**. Give it a
   descriptive name, such as `Workspace MCP – Joe local Mac`.
5. Download or reveal the client ID and client secret values. Do not download
   them into this repository, commit them, paste them into chat, or put them in
   `~/.zshrc`.

The exact console labels change periodically; Google’s current desktop-app
guide remains the authoritative reference for enabling APIs and creating the
client ([S7]). A desktop client does not require manually managed redirect URIs
for this standard local flow; hosted HTTP deployments need a **Web
application** client with an exact HTTPS callback URL ([S2]).

**Important testing limitation:** an External app in Testing permits only its
listed test users, and refresh tokens expire seven days after consent. This is
acceptable for a short local trial, but it is not frictionless long-running
automation. Do not publish the app or seek verification merely to remove this
limit until the intended scopes, data flow, privacy policy, and operating model
have been reviewed ([S9], [S10]).

### 4. Store configuration outside the repository

The client ID identifies the OAuth app. A native/desktop client cannot keep a
client secret confidential in the same sense as a server-side web client, but
the downloaded configuration and the later refresh token should still be
handled as sensitive local configuration. The **refresh token** is the
credential that can continue to access the authorized Google data ([S8]).

Recommended macOS storage:

1. Open **Keychain Access** and select the login keychain.
2. Create two password items with these names:
   - `workspace-mcp.google.client-id`
   - `workspace-mcp.google.client-secret`
3. Set the account field to your macOS username. Store the matching OAuth
   client value in each item.
4. Do not save either value in a repository `.env`, shell profile, terminal
   history, ticket, prompt, or test fixture.

Create private directories for refresh-token state and logs:

```bash
mkdir -p "$HOME/Library/Application Support/workspace-mcp/credentials"
mkdir -p "$HOME/Library/Logs/workspace-mcp"
chmod 700 "$HOME/Library/Application Support/workspace-mcp"
chmod 700 "$HOME/Library/Application Support/workspace-mcp/credentials"
chmod 700 "$HOME/Library/Logs/workspace-mcp"
```

Workspace MCP documents `local_directory` as its default credential store and
states that its JSON credential files and directory are permission-protected;
an explicit directory prevents accidental fallback to `./.credentials` in the
current working directory ([S5]). Do not rely on claims that every local token
file is encrypted: the project’s detailed deployment documentation describes
the local-directory backend as plaintext JSON protected by filesystem
permissions ([S5]).

### 5. Create a non-repository launch script

Create a private bin directory, then create `~/bin/run-workspace-mcp-local`
with the following content. Make the script executable with
`chmod 700 ~/bin/run-workspace-mcp-local`. The script retrieves values at
launch rather than persisting them in shell configuration.

```bash
mkdir -p "$HOME/bin"
chmod 700 "$HOME/bin"
```

```zsh
#!/bin/zsh
set -euo pipefail

export GOOGLE_OAUTH_CLIENT_ID="$(security find-generic-password \
  -a "$USER" -s 'workspace-mcp.google.client-id' -w)"
export GOOGLE_OAUTH_CLIENT_SECRET="$(security find-generic-password \
  -a "$USER" -s 'workspace-mcp.google.client-secret' -w)"

# Google allows a loopback HTTP callback for this *local-only* OAuth flow.
# Never set this when exposing the server through a public endpoint.
export OAUTHLIB_INSECURE_TRANSPORT=1
export WORKSPACE_MCP_CREDENTIALS_DIR="$HOME/Library/Application Support/workspace-mcp/credentials"
export WORKSPACE_MCP_LOG_DIR="$HOME/Library/Logs/workspace-mcp"

exec uvx workspace-mcp \
  --transport streamable-http \
  --permissions gmail:readonly calendar:readonly drive:readonly sheets:readonly
```

The project recommends streamable HTTP for modern MCP clients and supports
per-service permission filtering ([S3], [S4]). The `security ... -w` calls are
inside command substitutions, so they supply environment variables to the
server but do not print values to the terminal. Do not run that command with
shell tracing (`set -x`).

Run the script in a dedicated Terminal window and leave that window open while
using the server:

```bash
~/bin/run-workspace-mcp-local
```

The local endpoint should be `http://localhost:8000/mcp`. Do not forward this
port through a tunnel or bind/publish it to another machine as part of this
initial setup.

### 6. Register the local endpoint with your MCP client

In a second terminal, register the endpoint with the client you use. This
configures only the MCP URL; the OAuth client values remain in the server
process/Keychain, not in either client's configuration.

**Claude Code:**

```bash
claude mcp add --transport http workspace-mcp http://localhost:8000/mcp
claude mcp list
```

**Codex:**

```bash
codex mcp add workspace-mcp --url http://localhost:8000/mcp
codex mcp list
```

Workspace MCP documents the Claude Code command ([S3]); the equivalent Codex
command was verified against the locally installed Codex CLI ([S17]). Start a
new session in the chosen client after registration so it discovers the server.
Both clients can point to the same running local endpoint. For this local
single-user mode, do not configure an additional bearer token or invoke the
client's MCP OAuth login: the Workspace MCP server performs the Google OAuth
flow and keeps the resulting Google credential in its configured local store.

### 7. Perform a least-privilege live test

The first tool use should trigger the Google browser consent flow. Sign in only
to the intended Google account and inspect the scopes shown by Google before
accepting. A safe initial prompt is:

```text
Use workspace-mcp to list the calendars I can access. Read-only only: do not
create, modify, delete, send, draft, label, download, or share anything.
```

Then test one Gmail search, for example `is:unread newer_than:7d`, and one
known spreadsheet or Drive lookup. Confirm that write tools are absent or
rejected. Never paste tool output containing sensitive mail, calendar, or Drive
content into an issue, PR, chat log, or this repository.

### 8. Add capability only through a deliberate permission change

Stop the server, change only the needed service permission in the launch
script, restart it, and review the fresh Google consent screen. Examples:

| Need | Narrowest project permission level to consider | Still requires a user/workflow approval policy |
| --- | --- | --- |
| Create but do not send email drafts | `gmail:drafts` | Yes |
| Send mail | `gmail:send` | Yes; sending is an external side effect. |
| Create or change calendar events | `calendar:full` | Yes; events can notify attendees. |
| Update a tracker spreadsheet | `sheets:full` | Yes; identify the intended spreadsheet and post-write verification. |
| General Drive writing | `drive:full` | Yes; broad Drive access has elevated risk. |

Do not add `--tool-tier complete` as a shortcut. The project describes the
tiers as cumulative and reserves `complete` for its full API surface ([S2],
[S4]). Google also requires an app to request only permissions critical to its
current features, not permissions that may be useful later ([S11]).

## Operations, recovery, and revocation

### Normal operations

- Keep the server local. Use one Google account per local credential store.
- Keep the server terminal separate from other work so output can be reviewed
  without copying secrets or personal data.
- Review `~/Library/Logs/workspace-mcp` for error metadata, but do not upload
  a log until sensitive values and user data have been checked.
- Recheck permission levels whenever a workflow changes; the server’s tool
  surface and Google scopes should match the current job.

### Token refresh and reauthentication

Access tokens are short-lived; refresh tokens permit the server to obtain new
ones. If the refresh token is missing, revoked, expired, or invalid, repeat
browser consent. Google also documents a per-account/per-client refresh-token
limit; creating new local installations carelessly can invalidate the oldest
token ([S8], [S10]).

For an External Testing app, schedule a reauthentication before the seven-day
limit. Treat a move to **In production** as a governance decision: sensitive
and restricted scopes can trigger verification and policy obligations,
especially for Gmail and broad Drive access ([S10], [S11], [S12]).

### Revoke access cleanly

To stop this integration:

1. Remove the Workspace MCP app’s access in the Google account’s third-party
   access/security controls (this revokes the refresh token).
2. Stop the local server.
3. Delete only the exact configured credential directory:
   `~/Library/Application Support/workspace-mcp/credentials`.
4. Delete the two named Keychain items.
5. Remove the MCP registration with the matching client CLI after confirming
   the server name is `workspace-mcp`: `claude mcp remove workspace-mcp` for
   Claude Code or `codex mcp remove workspace-mcp` for Codex.

This is recoverable in the sense that a later fresh setup can be authorized;
it deliberately requires interactive consent again.

## What this guide does not authorize

- Publishing an OAuth app, completing Google verification, or adding a privacy
  policy.
- Exposing the MCP server remotely, opening a firewall port, adding a reverse
  proxy, or configuring a public HTTPS URL.
- Enabling OAuth 2.1 multi-user mode, remote credential storage, or external
  OAuth-provider mode.
- Creating service-account keys or Workspace domain-wide delegation.
- Enabling write/send permissions, running autonomous email/calendar actions,
  or placing secrets in a repository, prompt, or durable evidence.

## Verified findings, inferences, and open questions

### Verified facts

- Workspace MCP currently documents `uvx workspace-mcp`, streamable HTTP,
  tool tiers, service permissions, a local credential store, and Claude Code’s
  `claude mcp add --transport http ...` registration ([S1]–[S5]). The locally
  installed Codex CLI accepts the corresponding `codex mcp add <name> --url
  <streamable-http-url>` registration ([S17]).
- Google documents that desktop OAuth apps need enabled APIs and OAuth client
  credentials, with browser-based user consent and refresh tokens for
  continued access ([S7], [S8]).
- Gmail message access and broad Drive access are restricted-scope territory;
  Sheets and Calendar also have their own scope classifications and minimum-
  scope guidance ([S11]–[S14]).

### Inferences and recommendations

- A localhost-only, read-only, narrowly filtered setup is the best first
  security/usability tradeoff for one person. This is an inference from the
  documented permission model and local credential-store behavior, not a
  guarantee that arbitrary email or document content is safe to give an LLM.
- The earlier research’s decision to evaluate this project remains viable, but
  its package behavior, scope mapping, and OAuth policy claims must be
  rechecked before each production or autonomous expansion.

### Open questions before any production or autonomous use

1. Which exact read operations are needed first: Gmail search, Calendar
   availability, Drive search, and/or named-sheet reads?
2. Is the Google account personal, or part of a Workspace domain with an
   administrator who may restrict third-party OAuth apps?
3. Is reauthenticating every seven days acceptable during the prototype, or is
   a production OAuth/verification decision needed?
4. Which write actions, if any, need separate user confirmation and evidence
   before they are enabled?
5. Should a separate low-value test Google account and test spreadsheet be
   used before real email or calendar data is connected?

## Source map

The detailed source register, access dates, provenance, and relevance notes are
in [google-workspace-mcp-setup-sources.md](google-workspace-mcp-setup-sources.md).
