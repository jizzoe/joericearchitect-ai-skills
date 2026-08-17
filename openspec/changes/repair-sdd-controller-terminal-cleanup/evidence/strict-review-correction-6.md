## Strict-review correction 6

The strict isolated review of commit `770527f` found two recovery-record gaps.

The cleanup planner now routes an exactly registered absent resource through
execution so it writes an `already-completed` receipt. A second fresh-inspection
mismatch now writes a blocked receipt before cleanup pauses. Focused tests cover
both recovery outcomes. A fresh strict review remains required for the new head.
