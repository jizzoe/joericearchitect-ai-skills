# Independent review correction: canonical preapproval targets

## Reviewed state

- Strict review record: `strict-5b95d03a-92b3-4894-a4b5-5d7743d9dcbb`
- Reviewed commit: `b2efc318499f47d2766b61e33dcade86c0fec637`
- Request manifest digest: `63c00c86ae22c66c340cbdbd8041d521d60a0bbc9f24853a38c82188f81cb227`
- Finding corrected: `independent-review/objective-fix/F1`

## Correction

Proposed preapproval targets now use action-specific canonical validators:

- `merge-pr` accepts only a positive integer `pr:<number>`;
- `archive-change` accepts only a lowercase hyphenated `change:<slug>`; and
- `delete-merged-topic-branch` accepts only a safe, concrete
  `branch:<git-branch-name>`.

The branch validator rejects whitespace, wildcards, control forms, traversal,
empty components, hidden components, and `.lock` endings.

## Regression evidence

The planning fixtures accept canonical examples for all three actions and
reject wildcard, whitespace, newline, wrong-prefix, traversal, and empty-path-
component lookalikes before writing a plan.
