#!/usr/bin/env bash
# Install or update the canonical AI skills and their exact matching shared
# runtime as one reviewed pair.
#
# This entrypoint owns only host path, process, and quoting mechanics. Source
# validation, gh invocation, runtime build, activation, retention, and the
# receipt belong to the Node utilities it calls, so Bash and PowerShell assert
# the same contract.
#
# It never edits a shell startup file and never changes PATH. The receipt
# reports whether the launcher is reachable and what to add if it is not.
set -euo pipefail

usage() {
  cat <<'EOF'
usage: install-ai-skills.sh (--local <checkout> | --remote <owner/repo> --pin <ref>)
                            [--agent claude] [--agent codex] [--force] [--dry-run]
                            [--allow-dirty-source]

  --local <checkout>      Install from a reviewed local checkout.
  --remote <owner/repo>   Install from a pinned remote source. Requires --pin.
  --pin <tag-or-commit>   Exact remote revision. Unpinned remote is refused.
  --agent <name>          Repeatable. Defaults to claude and codex.
  --force                 Explicit overwrite intent for existing installations.
  --dry-run               Report the paired receipt without changing anything.
  --allow-dirty-source    Documented development override for an unclean checkout.

Bootstrap: obtain this installer with `gh release download <tag>` followed by
`gh attestation verify` on the downloaded artifact. Piped remote execution is
not supported.
EOF
}

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
declare -a forwarded=()
source_mode=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --local)
      [ "$#" -ge 2 ] || { printf 'missing-value: --local\n' >&2; exit 2; }
      source_mode="local"
      forwarded+=("--local" "$2"); shift 2 ;;
    --remote|--pin|--agent)
      [ "$#" -ge 2 ] || { printf 'missing-value: %s\n' "$1" >&2; exit 2; }
      [ "$1" = "--remote" ] && source_mode="remote"
      forwarded+=("$1" "$2"); shift 2 ;;
    --force|--dry-run|--allow-dirty-source)
      forwarded+=("$1"); shift ;;
    *) printf 'unexpected-argument: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

if [ -z "${source_mode}" ]; then
  printf '{"schemaVersion":1,"tool":"install-ai-skills","ok":false,"phase":"preflight","code":"source-required"}\n'
  exit 2
fi

if ! command -v node >/dev/null 2>&1; then
  printf '{"schemaVersion":1,"tool":"install-ai-skills","ok":false,"phase":"preflight","code":"node-unavailable"}\n'
  exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "${node_major}" -lt 20 ]; then
  printf '{"schemaVersion":1,"tool":"install-ai-skills","ok":false,"phase":"preflight","code":"node-version-unsupported","detail":{"required":">=20","active":"%s"}}\n' \
    "$(node -p 'process.versions.node' 2>/dev/null || echo unknown)"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  printf '{"schemaVersion":1,"tool":"install-ai-skills","ok":false,"phase":"preflight","code":"gh-unavailable"}\n'
  exit 1
fi

workspace="$(mktemp -d "${TMPDIR:-/tmp}/ai-skills-install-XXXXXX")"
cleanup() { rm -rf "${workspace}"; }
trap cleanup EXIT

exec node "${repository_root}/scripts/runtime/install-runtime.mjs" \
  --workspace "${workspace}" \
  "${forwarded[@]}"
