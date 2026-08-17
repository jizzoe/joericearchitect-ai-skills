## Strict-review correction 5

The strict isolated review of commit `ce92c6f` found that generic lifecycle
completion and ordered-queue advancement could bypass receipt-coupled cleanup.

The controller now requires at least one registered resource and a terminal
completed or already-completed receipt for every resource before cleanup can
complete, a fully completed controller can report completion, or a queue can
advance. Focused tests cover both refusal paths and the valid terminal path. A
fresh strict review remains required for the new head.
