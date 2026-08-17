## Strict-review correction 4

The strict isolated review of commit `9dce966` found that durable controller
registration correctly retained immutable ownership but did not supply the
cleanup planner with fresh mutable worktree eligibility state.

The controller now requires a fresh inspection before cleanup planning and
pauses when any recorded resource is ineligible, instead of treating an empty
action list as completion. The transition test covers an eligible worktree and
the ineligible refusal path. A fresh strict review remains required for the new
head.
