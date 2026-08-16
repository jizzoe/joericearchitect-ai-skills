# Strict review correction: sealed-shell inspection tools

- Attempt: 1 of 3 for `strict-artifact-delivery/missing-final-artifact`
- Review request: `71ba7a159b116ea2f9a3daff343ad3d2b5d25153b6c5ba6cdc8974f645c7c052`
- Reviewed head: `309f488aec5bf3d61d2189648e33b53997d278a9`
- Result: `review-launcher-codex-result-artifact-missing`; owned-view cleanup
  completed.

The strict process was confirmed read-only and network-disabled. Its transcript
showed that the neutral sealed shell did not resolve ordinary `sed`, `ls`, or
`git`; the archive intentionally has no Git metadata. The prior prompt did not
identify the available absolute read tools, so the reviewer did not complete a
valid final artifact.

The fixed prompt now directs Codex to use only zsh builtins or `/bin/cat`,
`/usr/bin/awk`, and `/usr/bin/perl`, states that Git metadata is unavailable,
and continues to prohibit mutations and transcript acceptance. A fresh exact-
head strict review is required after this objective correction.
