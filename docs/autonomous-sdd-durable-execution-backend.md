# Autonomous SDD durable execution backend

Plain-English guide to the local, durable execution backend that the autonomous
SDD reliability control plane is building.

## Why this exists

The autonomous SDD reliability control plane is the part of this project that
can safely drive an SDD change from start to finish on its own — proposing,
implementing, reviewing, verifying, and closing out one change at a time, and
stopping with a clear reason when something needs a human.

For that to be trustworthy, the system needs a dependable "memory" that survives
crashes and cannot be confused by where you happen to be running from. That
memory is the **durable execution backend**. This document explains what it is
responsible for, in everyday language.

## What the backend is responsible for

Each item below is a specific, small responsibility.

### Local storage

Where the backend keeps its data. It uses the local filesystem on a single
machine — plain files on disk in one stable place — not a cloud database or a
network service. The data survives a crash because it is written to disk, not
held only in memory.

### Authoritative history

The single, trusted, permanent record of everything that has happened in a run.
This is the source of truth. If any other file or view disagrees with it, the
history wins. It is append-only: events are recorded in order and never
rewritten.

### Projection

A convenient, derived view of the current state, rebuilt from the history
whenever it is needed. Think of it like a cached summary that can be thrown away
and regenerated at any time, because the real data lives in the authoritative
history. A projection is a fast way to look at the truth — it is not the truth
itself.

### Ownership

The idea that exactly one process "owns" the right to change things at a time. A
run is tied to a specific owner (an identity plus a generation number), so the
system always knows who is allowed to write.

### One coarse claim

A single, simple lock for the whole repository. "Coarse" means it is not
fine-grained — not per-file or per-step — but one big lock that says "this run
is the only one allowed to make changes here right now." It prevents two runs
from mutating the same repository at the same time.

### Takeover

The explicit, human-triggered procedure for handing control to a new owner when
the current owner is gone or stale (for example, a process crashed and never
came back). A person deliberately says "hand control to a new owner," the
ownership generation increments, and the old owner is permanently rejected from
writing afterward.

### Discovery

The ability to find out which runs exist and where their state lives, without
guessing. Instead of relying on "whatever directory I happen to be in," the
system locates runs by the repository's identity and the backend's known storage
location.

### Legacy inventory

Recognizing and safely listing old, pre-existing state from earlier versions of
the system. The key rule: if that old state is ambiguous, leave it alone rather
than guessing or accidentally corrupting it.

## In one breath

> The backend keeps its data in local files, maintains one permanent
> unchangeable record of each run, rebuilds convenient views from that record,
> tracks who is allowed to write, uses a single repository-wide lock, supports
> an explicit human-initiated handoff of control, reliably locates runs and
> their state, and recognizes — without disturbing — leftover state from older
> versions.

## What it deliberately does not do

This backend is intentionally small. It does not run background services
(daemons), message queues, distributed workers across multiple machines,
general-purpose timers, arbitrary workflow graphs, or a full workflow engine
such as Temporal. It also does not replace the existing real lifecycle owner: it
is published and proven in a read-only, shadow capacity until a later
qualification step.

## Read more

- Design brief: `ai-planning/design-briefs/autonomous-sdd-reliability-control-plane/m2-s2-local-durable-execution-backend.md`
- Roadmap: `ai-planning/plans/autonomous-sdd-reliability-control-plane-roadmap.md`
- Workflow: `docs/sdd-workflow.md`
