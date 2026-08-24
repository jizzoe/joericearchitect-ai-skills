# M3-S1 handoff — plain-English explanation

Date: 2026-08-24

## The plain-English version

This project is broken into milestones (chapters in a long build plan).
Milestone 2 (M2) is done — the team finished building the "engine room" that
lets an AI agent work independently on software tasks, including a way to track
whether each job is running, finished, failed, or needs to be retried. All that
code is merged into `main`, tests pass (234 tests, zero failures), and the
rulebook that governs the work (the OpenSpec specs) is up to date.

Now it is time to start Milestone 3, Step 1 (M3-S1). The goal of this step is
to make **code review** trustworthy.

Right now the system has a "thin" review loop — a simple, lightweight check.
The problem is that reviews can be faked or sloppy: a process could claim
"everything looks good" without actually proving it. M3-S1 upgrades this to a
"strict" review.

The idea:

1. When a review happens, the **main process** (the "parent") sets up a sealed,
   unchangeable "package" that holds everything about the review — what code is
   being reviewed, who is doing it, and the starting and ending points.
2. A separate, **read-only** reviewer process is launched. It can look at the
   code but cannot change anything.
3. The main process watches that reviewer the whole time, recording what
   actually happened — independent of whatever the reviewer *claims* happened.
4. At the end, the review must produce **exactly one final result file** that
   follows strict rules about its format. This result is the **only** thing
   that counts as proof the review was done.
5. A written log of "what I did" or a claim of "I passed!" is **not** accepted
   as proof. Only that final, properly-formatted, properly-verified result file
   counts.

The final result file has to pass six checks: correct format, un-tampered
package (its "digest" matches), correct starting/ending commits, proof of
review assurance, proof of who the reviewer was, and a clear "finished" status.

Before coding can begin, there are two questions to answer (what existing
review work do we need to reconcile, and where exactly does each part of the
system start and stop). And the person in charge must explicitly say "go"
before implementation starts.

## Jargon explained

- **"parent-owned"** — "Parent" is the main/controlling process that sets up
  and oversees the review (the manager). "Owned" means it is the only thing
  allowed to create or change that particular thing. A "parent-owned terminal
  artifact" is a final result file that only the manager process is allowed to
  write, and that is the single source of truth.

- **"schema-valid"** — a "schema" is a formal rule describing the exact
  shape/structure data must have (which fields must exist, what types they
  are, what values are allowed). "Schema-valid" means the data conforms to
  those rules — like a form that must be filled out correctly before it is
  accepted.

- **"terminal"** — here it means "final / end-state." A "terminal" result is
  the last, finished result, not an intermediate draft. Once produced there is
  no more updating; the review is officially over.

- **"artifact"** — any file or piece of data produced as the output of a
  process (the finished product of the step: a result file, report, document).

- So **"schema-valid terminal artifact"** = a final output file that is
  correctly structured according to the rules, and marks the end of the review.

- **"host-captured"** — "host" is the underlying system/machine running things.
  "Host-captured" means the evidence is recorded by the system itself, not by
  the process being observed. The system cannot be lied to the way a
  self-reported log can. (Contrast with a "transcript" = a written log of what
  the reviewer claims it did.)

- **"read-only reviewer"** — a review process that can only *read* code; it has
  no permission to change anything. This keeps the review isolated and safe.

- **"terminalize exactly once"** — "terminalize" means produce the final,
  end-state result. "Exactly once" means it must happen one time and only one
  time — no duplicates, no conflicting versions — even if the review succeeds,
  fails, times out, or crashes.

- **"sealed immutable review package"** — "sealed" + "immutable" = locked and
  unchangeable once created. Once the manager sets up the review's container,
  nobody can tamper with it later.

- **"squash-merged"** — Git term: combining all the individual edits of a
  feature into one clean commit when merging into `main`.

- **"admission policy"** — rules deciding what work gets allowed in / accepted.

- **"v2 controller" / "contract-only/audit"** — the "controller" is a future,
  more automated version of the system. It is currently "not activated" —
  defined on paper (its "contract") but not actually running or doing real work
  yet. "Contract-only/audit" means it exists as a spec to be checked against,
  not as a live engine. M3-S1 deliberately does **not** turn it on.

- **"OpenSpec" / "specs" / "changes" / "Propose" / "Explore"** — the project's
  rulebook system: "specs" are formal written requirements, "changes" are
  proposals to alter them, "Propose" is the step of formally writing up a
  change, and "Explore" is the step of researching and recording decisions
  before proposing. "validate" checks the rulebook is consistent.
