# Pre-Apply Decision Record

Owner-approved on 2026-08-19 for change `distribute-shared-sdd-runtime`. This
record satisfies task 0.1 and is a planning prerequisite only; it is not
authorization to alter host configuration.

## Decision 1: Runtime root and launcher location

**Selected:** one documented logical root on every platform.

- POSIX: `~/.ai-skills/runtime/` for versioned runtimes and metadata,
  `~/.ai-skills/bin/ai-skills-runtime` for the launcher shim.
- Windows: `%USERPROFILE%\.ai-skills\runtime\` and
  `%USERPROFILE%\.ai-skills\bin\ai-skills-runtime.cmd`.

Layout:

```
~/.ai-skills/
├── bin/ai-skills-runtime
└── runtime/
    ├── installed.json          # append-only ordering history
    ├── active.json             # non-secret active runtime metadata
    ├── runtime-<digest12>/     # active
    └── runtime-<digest12>/     # one retained prior
```

**Rejected:** platform data directories
(`${XDG_DATA_HOME:-~/.local/share}/ai-skills-runtime`,
`%LOCALAPPDATA%\ai-skills-runtime`). They follow OS convention but require
per-platform root resolution in both installers, both fixtures, and every
diagnostic string, for no behavior the paired receipt does not already record.
A single logical root keeps Bash/PowerShell parity assertions and documentation
to one path form.

**Platform impact:** the root is derived from `$HOME` on POSIX and
`%USERPROFILE%` on Windows; no other platform variable is read. Installers fail
closed with a stable classification when the home variable is unset rather than
inventing a fallback root.

**Recovery path:** `ai-skills-runtime activate --previous` restores the
retained prior runtime offline. Removing `~/.ai-skills/` removes all runtime
state and no repository or skill state.

**Fixture obligations:** installer fixtures set an isolated home directory and
assert the resolved root, the retained-prior layout, and identical receipt
paths across Bash and PowerShell.

## Decision 2: Default PATH activation behavior

**Selected:** report-only. The installer never edits a shell startup file, the
Windows user PATH, or any ambient shell configuration. It reports the launcher
path, whether that path is already resolvable, and the exact line to add.

**Rejected:** opt-in reversible PATH registration
(`--register-path` / `--unregister-path`). It is more convenient but adds host
configuration mutation, per-platform marked-block rollback, and fixture
obligations that this change's fail-closed posture would then have to prove.
Decision 7 of `design.md` already states report-only as the default posture;
this record retains it rather than widening scope.

**Platform impact:** none written. Activation state is observed, not changed.

**Recovery path:** not applicable — no host configuration is modified. A user
who added the line manually removes it manually.

**Fixture obligations:** installer fixtures assert that no startup file or PATH
variable is written in either shell, and that activation state is reported for
both resolvable and unresolvable launcher paths.

## Decision 3: Packaging channel

**Confirmed:** the staged repository artifact, bootstrapped by
`gh release download <tag>` followed by `gh attestation verify`, as described
in Decision 5 of `design.md`.

**Rejected:** a published npm package or pinned `npx` launcher. npm supplies
cross-platform `bin` wrappers, but it adds registry publication and npm
prerequisites, and it does not by itself establish the selected `gh skill`
revision, the helper closure, the local-checkout development flow, or
release-integrity evidence. `gh` is already a hard prerequisite, so the
selected channel adds no new dependency.

**Platform impact:** identical on both platforms; both installers consume the
same release artifact or the same reviewed local checkout.

**Recovery path:** re-run the installer against the prior tag, or activate the
retained prior runtime offline.

**Fixture obligations:** installer fixtures cover local reviewed-checkout mode
and pinned-remote mode, and assert that no unpinned remote source is accepted.
