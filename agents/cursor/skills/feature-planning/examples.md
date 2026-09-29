# Feature planning examples

Default agent output is **concise** (see [SKILL.md](SKILL.md)). Full ticket bodies live in [reference.md](reference.md).

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

## Concise — null-date bug (S, API-only)

**Input:** Draft records with a null due date are incorrectly marked overdue by a nightly job.

**Output:**

```markdown
## Triage
Bug · **S** · API (`process_overdue`)

**Next:** Reproduce with a seeded draft record, fix the filter, add a test.

## Tickets
| # | Type | Summary | Deps |
|---|------|---------|------|
| 1 | Bug | Exclude draft records with null due date from overdue processing | — |

_Agent effort: ~10–20 min · `full draft` for #1._
```

---

## Concise — vague input (L → Spike only)

**Input:** Make the editor and saves faster.

**Output:**

```markdown
## Triage
Unknown · **L** (unscoped) · TBD

**Next:** Spike to find the bottleneck; no implementation tickets yet.

## Questions
- Editor UI, API write path, or both?
- Large documents only, or all sizes?

## Tickets
| # | Type | Summary | Deps |
|---|------|---------|------|
| 1 | Spike | Which editor/save operations dominate latency for large documents? | — |

_Agent effort: ~15–30 min · `full draft` for #1._
```
