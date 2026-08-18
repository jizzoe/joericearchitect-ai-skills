# Enabling Autonomous Runs Safely

This guide enables the bounded autonomous workflow only when you deliberately
start one. It does not change ordinary Codex or Claude Code sessions: those
retain their normal manual-authorization behavior.

The independent reviewer is a separate process. It receives a sealed committed
review package and a disposable detached repository view. If the runtime cannot
prove the required boundary, it returns `unavailable` and the delivery pauses.
Do not replace that pause with self-review or a normal pull-request review.

An explicitly authorized degraded fallback is a different assurance class. It
still attempts a fresh separate review, but its parent-launch evidence and
reviewer executable identity are not authenticated by an OS-protected key or
capability. It is a best-effort quality signal and must never be described as
strict, isolated, read-only-enforced, or security-verified.

## One-Time Readiness

Install current Codex CLI and/or Claude Code normally and make sure Git and
OpenSpec are available to the repository. Do not put credentials, tokens,
account identifiers, or absolute machine paths in repository configuration.

### Codex

Codex needs no global reviewer setting. The adapter starts a separate
noninteractive `codex exec` process with an ephemeral session, ignored user
configuration, and a read-only sandbox. It capability-checks that executable at
the time of review.

On macOS, the CLI uses its platform sandbox. If a read-only sandbox cannot run
a required deterministic inspection on the installed host, the adapter records
an unavailable result. Resolve the local runtime constraint or use a supported
environment; do not weaken the sandbox.

### Claude Code on macOS

Claude Code's Bash sandbox uses macOS Seatbelt, so no separate sandbox package
is required. The autonomous adapter creates a temporary settings file for the
review process. It enables sandboxing, requires startup failure when it is not
available, disables unsandboxed retries, denies review-view writes and home
reads, denies sensitive environment variables, uses an empty network allowlist,
and removes mutation-capable tools. It does not edit `~/.claude/settings.json`
or the project's normal Claude settings.

### Claude Code on Linux or WSL2

Use Linux or WSL2, not WSL1. Install `bubblewrap` and `socat` with the
distribution package manager. On Ubuntu 24.04 or later, make sure the host
permits bubblewrap user namespaces; Claude Code's sandbox documentation gives
the required AppArmor profile. The optional Anthropic sandbox runtime provides
additional Unix-socket filtering. The adapter still performs its own runtime
capability check and pauses when the sandbox cannot start.

### Native Windows

Claude Code's OS sandbox is not available on native Windows. Run the Claude
reviewer in WSL2 or another supported isolated environment. A native-Windows
Claude adapter result is intentionally `unavailable`.

### Authorized degraded launcher recovery

After exact-package strict unavailability, a bounded `strict-first-degraded`
authorization may permit external launcher recovery. Codex uses an ephemeral
inner process with a requested read-only sandbox. Claude uses a fresh
nonpersistent process with only `Read`, `Glob`, and `Grep`; Bash, edit/write,
agents, web, and MCP tools are disabled. Both use an exact-head committed
archive or detached view, sealed package, credential scrubbing, a fixed logical
host protocol, expiration checks, and
structured findings.

When the detached-worktree strategy is selected, it additionally requires a
separate lifecycle authorization bound to the repository, base, head,
manifest, transition, parent-request digest, and expiration. The host selects
the disposable temporary root itself, reports only safe structured diagnostics,
and removes only a marker-proven owned view; an expired request may still clean
up that owned view but remains unavailable.

The parent runtime transport is separate from the inner reviewer. In Codex it
prepares the exact-head archive inside the sandbox, then issues only the fixed
host-owned reviewer invocation as a shell-tool request with escalated sandbox
permissions. When the active policy is interactive and
`approvals_reviewer = "auto_review"`, Auto-review evaluates that request
without handing it to the owner. This does not broaden the sandbox or elevate
the inner reviewer, and repository-controlled JavaScript is never executed
with parent authority. If the request is denied or the transport is unavailable,
the run records terminal unavailable evidence and stops; there is no
`host-debug`, copy/paste, approval-prompt, or owner-attestation fallback.

The first release deliberately accepts two limitations for this reduced-
assurance path: ordinary launcher evidence can be forged by a sufficiently
adversarial implementation process, and the requested executable is checked by
basename rather than pinned to a host-owned absolute path. A malicious program
named `codex` or `claude` could therefore impersonate the reviewer. Eliminating
those risks requires an external trusted launcher plus authenticated IPC or an
OS-protected key/capability and host-owned executable configuration. That
heavier setup is deferred; strict review is unaffected.

## Starting a Bounded Run

For `ship-sdd <change> prototype [duration]`, newly resolved requests use
`reviewPolicy: same-session-local`. The same implementation session may invoke
a bounded read-only review worker, but the result must be labeled
`local-review` and never described as independent, isolated, strict, or
production assurance. Objective findings continue through correction,
affected-check rerun, and fresh local review without a routine owner retrigger.
Material decisions, denied permission, unsafe operations, expiration, exhausted
signatures, and stale or conflicting durable state still stop the run.

### Codex

1. Start a Codex Goal with `/goal`.
2. Give it one bounded objective, exact queue/change selection, allowed local
   and external mutations, evidence gates, expiration, and stopping conditions.
3. Allow the independent-review skill only after current Apply evidence. The
   skill creates the separate read-only reviewer itself; do not run the
   implementation session as its reviewer.

### Claude Code

1. Start the bounded workflow in Claude Code's noninteractive mode (`--print`)
   through the repository's autonomous runner entrypoint.
2. Supply the same explicit bounded authorization and stopping conditions as a
   Codex Goal.
3. Let the independent-review adapter launch its own temporary-configured
   noninteractive reviewer. Do not enable `/sandbox` globally and do not copy
   the temporary settings into regular project settings.

## What the Reviewer May Do

The reviewer may read the detached committed view and run only configured,
deterministic review commands. It may not write the workspace or Git state,
mutate GitHub, read credentials, use authenticated network access, send
messages, deploy or release, or delegate a mutation.

An independent review does not grant authorization to merge, Sync, Archive,
close an issue, update a Project, or delete a branch. Those transitions still
need their separate current authorization, runtime permission, checkpoint, and
validation gates.

## Recovery

For `unavailable`, malformed, stale, or non-isolated evidence, keep the
implementation branch and evidence intact. Inspect the recorded unavailable
code and local capability prerequisites, correct only a safe runtime or
configuration problem, rerun affected checks, and create a fresh sealed package
for the current head. A changed head always requires a new independent review.
Within an active autonomous run, the runner performs those affected checks and
fresh review automatically for objective corrections. Do not reuse an old pass,
ask the owner to retrigger review, or silently broaden access.
