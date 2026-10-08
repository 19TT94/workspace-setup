---
name: handoff
description: >-
  Compresses the current session into a short handoff note so another agent or
  a fresh session can continue the work, and stashes it with pstash. Use when
  the user says "hand off", wants to move work to another agent, or is about
  to end a session mid-task. Optional argument: what the next session should
  focus on.
disable-model-invocation: true
---

# Handoff

Adapted from Matt Pocock's `handoff` skill
(https://github.com/mattpocock/skills, MIT).

Write a note a fresh agent can act on without this conversation. If the user
named a focus for the next session, shape the note around it.

## Contents

Keep it short; reference artifacts by path or URL instead of repeating them
(specs, tickets, PRs, commits, diffs, OPINIONS.md).

```markdown
# Handoff: <task in a few words>

**Repo / branch:** <path>, <branch> (PR #<n> if any)
**Goal:** <one or two sentences>

## Done
- <what is finished and verified>

## In progress / next
- <the exact next step first>

## Decisions
- <decision> — <why> (only ones not already recorded elsewhere)

## Open questions
- <anything waiting on the user>

## Watch out for
- <gotchas, failing checks, things that looked right but weren't>

## Suggested skills
- <e.g. diagnose, grill, pr-prepare>
```

## Save it

1. Redact secrets and personal data.
2. Stash it so the next session can pick it up with `pstash pop`:
   `printf '%s' "<note>" | pstash -` (run from the repo, so it's tagged).
   If `pstash` isn't installed, write it to `$TMPDIR/handoff-<task>.md`
   instead, never into the repo.
3. Tell the user where it went and how to resume (`pstash pop`, then paste it
   into the next agent).
