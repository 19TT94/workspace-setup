# Feature planning examples

Default agent output is **concise** when there are 2+ tickets; a single ticket is drafted in full (see [SKILL.md](SKILL.md)). Full ticket bodies live in [reference.md](reference.md).

---

## Concise — CSV export (M)

**Input:** Managers want to export orders to CSV from the list page, filtered by date range, using the account timezone.

**Output:**

```markdown
## Triage
Feature · **M** · API + UI (`orders` API / `OrdersList` page)

**Next:** Confirm column list and row cap, then API Task + client Story.

## Questions
- Max rows / async export for large accounts?
- Required CSV columns?

## Tickets
| # | Type | Summary | Deps |
|---|------|---------|------|
| 1 | Task | Add API endpoint for order export by date range | — |
| 2 | Story | As a manager, I want to download orders as CSV… | #1 |

_Agent effort: ~30–90 min · `full draft` for #1 or #2._
```

---

## Single ticket — null-date bug (S, API-only)

**Input:** Draft records with a null due date are incorrectly marked overdue by a nightly job.

**Output:**

```markdown
## Triage
Bug · **S** · API (`process_overdue`)

**Next:** Reproduce with a seeded draft record, fix the filter, add a test.

### PROJ-??? — Exclude draft records with null due date from overdue processing (Bug)

…one copy box each for Summary, Steps to Reproduce, and Environment
(Actual / Expected omitted: the Summary states them). See "Full output format".

_Agent effort: ~10–20 min._
```

One ticket, so there is no table and no `full draft` pointer: the draft *is* the output.

---

## Single ticket — vague input (L → Spike only)

**Input:** Make the editor and saves faster.

**Output:**

```markdown
## Triage
Unknown · **L** (unscoped) · TBD

**Next:** Spike to find the bottleneck; no implementation tickets yet.

## Questions
- Editor UI, API write path, or both?
- Large documents only, or all sizes?

### PROJ-??? — Which editor/save operations dominate latency for large documents? (Spike)

…one copy box each for Summary, Question, Time box, and Done when.

_Agent effort: ~15–30 min._
```
