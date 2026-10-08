---
name: diagnose
description: >-
  Disciplined loop for hard bugs and performance regressions: build a check
  that reproduces the bug, shrink it, test ranked hypotheses, then fix with a
  regression test. Use when the user says "diagnose" or "debug this", or
  reports something broken, throwing, failing, or slow.
---

# Diagnose

Adapted from Matt Pocock's `diagnosing-bugs` skill
(https://github.com/mattpocock/skills, MIT). Work the phases in order; skip
one only with a stated reason.

**Redact secrets** in every command, output, or log you show: write
`<REDACTED>`, keep credentials in environment variables, and quote only the
lines that matter.

## 1. Build a check that goes red on this bug

This is most of the work. Before reading code to form a theory, get **one
command** that drives the real code path and fails on the user's exact
symptom. Try, roughly in order: a failing test, a `curl` against the dev
server, a CLI run diffed against known-good output, a headless browser
script, replaying a captured request or log, a small harness around the
failing function, a loop over many random inputs, or `git bisect run` between
a good and bad state.

Then tighten it: faster (narrow scope, skip unrelated setup), sharper (assert
the specific symptom, not "didn't crash"), and deterministic (pin time, seed
randomness). For flaky bugs, raise the reproduction rate (repeat, add load)
until it fails often enough to debug.

Done when the command has been run, its output shown, and it is red on this
bug, repeatable, fast, and runnable without a human. If you can't build one,
stop: list what you tried and ask for access, a captured artifact (logs, HAR,
recording), or permission for temporary instrumentation. Never instrument
production without explicit approval.

## 2. Reproduce and shrink

Confirm the check fails with the symptom the user described, not a nearby
one. Then cut inputs, steps, data, and config one at a time, re-running after
each, until every remaining piece is needed for the failure.

## 3. Rank hypotheses

Write **3–5 ranked hypotheses**, each with a prediction that could prove it
wrong ("if X is the cause, changing Y makes the bug disappear"). Show the list
to the user before testing; they often know which to rule out.

## 4. Instrument

Each probe tests one prediction; change one thing at a time. Prefer a
debugger, then targeted logs at the boundaries that separate hypotheses; never
"log everything". Tag debug logs with a unique prefix (e.g. `[DEBUG-a4f2]`)
so cleanup is one search. For performance, measure a baseline first (timing,
profiler, query plan), then narrow down.

## 5. Fix with a regression test

1. State the regression scenario in plain language and get agreement, per the
   tests-first rule.
2. Turn the shrunken repro into a failing test where the bug actually
   happens. If no test location can reproduce the real pattern, say so; that
   is a finding, not something to paper over.
3. Watch it fail, apply the smallest fix, watch it pass, then re-run the
   original check from phase 1.

Fix only this bug. Other problems found along the way are listed, not fixed.

## 6. Clean up

- [ ] The original check from phase 1 passes
- [ ] The regression test passes (or the missing test location is noted)
- [ ] All tagged debug logs are removed (search for the prefix)
- [ ] Throwaway scripts are deleted
- [ ] The confirmed cause is stated for the commit or PR message
