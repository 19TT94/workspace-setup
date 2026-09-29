---
name: feature-planning
description: >-
  Triages features and drafts concise tickets (Story/Task/Bug/Spike) for any
  project. Use for planning, epics, stories, bugs, spikes. Say "full drafts"
  for ticket Summary and Description copy boxes. CLI uses sentinel copy boxes;
  IDE and GUI use a text fence. Customize project key and templates in
  reference.md.
disable-model-invocation: true
---

# Feature planning and tickets

Go from idea → actionable tickets. **Do not** implement code unless asked.

Configure defaults in [reference.md](reference.md) (project key, site URL,
issue-type preferences). Projects may add a local area map; this global skill
stays product-agnostic.

## Output principles

- **Short by default** — only what the user needs to decide or file tickets.
- **One fact, one place** — see section boundaries below; never repeat the same detail in two sections.
- **Omit empty sections** — no `## Questions` if none; no path dump unless paths matter.

## Output mode (important)

| Mode | When | What the user sees |
|------|------|-------------------|
| **Concise** (default) | Normal `@feature-planning` | Triage line + Next + optional Questions + ticket table + footer. No full descriptions. |
| **Full** | User says `full drafts`, `copy-paste`, `expand`, or `all tickets` | One copy box per ticket section. CLI: a sentinel box per section; clipboard only when a section is named. IDE and GUI: one `text` fence per section. See [reference.md](reference.md). |

Never paste filled examples from `reference.md` or duplicate template section headings in concise mode.

## Section boundaries (concise)

| Section | Put here | Never put here |
|---------|----------|----------------|
| **Triage** | Type, size (S/M/L), surfaces (compact) | Next step, risks, tickets, paths, agent effort |
| **Next** | One-sentence recommended action; optional `(risk: …)` if critical | Ticket summaries, open questions, file paths |
| **Questions** | Max **2** blocking unknowns | Anything already in Next or Tickets |
| **Tickets** | Type, summary, **Deps** only (`—`, `#1`, `after #1`) | Agent effort, file paths, surfaces, rationale |
| **Footer** | Agent effort + `full draft` pointer | Triage recap, ticket detail |

## Workflow (concise)

1. **Clarify** — Ask at most **2** questions if blocked; skip if the request is clear enough to triage.
2. **Triage** — Type, size, surfaces (one line).
3. **Next** — One sentence; fold in the top risk only if it changes the recommendation.
4. **Map** — Mention repo paths in chat only when non-obvious; do not add a separate **Map** heading in concise output.
5. **Propose tickets** — Count by size (below). Summary line format per issue type.
6. **Footer** — Agent effort range + which ticket to expand for `full draft`.
7. **Tracker** — Create via MCP/CLI only if available; else stop at the index unless **full** mode.

### Ticket count (concise mode)

| Size | Propose |
|------|---------|
| **S** | 1 ticket (summary + type). |
| **M** | 2–3 tickets: summary + type + deps only. |
| **L** | 1 **Spike** or **Epic** line + child summaries (no bodies). Say which child to expand first in footer. |

For unknown scope → **Spike** only, not a pile of Tasks.

### Agent effort estimates

Reflects the agent's implementation pass only — human review, PR, QA, and deploy still run on normal timelines.

| Size | Agent passes | Wall-clock |
|------|---------------|-----------|
| **S** | Single pass, minimal iteration | ~10–20 min |
| **M** | 1–2 passes (implement, then a fix-up pass after review feedback) | ~30–90 min |
| **L** | Multi-session — several passes with checkpoints; consider splitting into sub-tickets | ~2–4+ hrs (spike-only until scoped → single pass, ~15–30 min) |
| **Spike** (per ticket) | Single investigation pass | ~15–30 min |

Adjust upward for cross-package work or unfamiliar/legacy code; adjust downward for trivial/mechanical changes. **Footer only** — never in ticket Notes.

### Summaries by issue type

| Type | Summary field |
|------|----------------|
| Story | `As a … I want … so that …` |
| Task / Bug | Short imperative outcome or symptom |
| Spike | Question as summary, or first line of description (team preference) |

Templates for **full** mode: [reference.md](reference.md). Ticket key prefix from that file (default `PROJ`). PR titles per [pr-prepare](../pr-prepare/SKILL.md).

## Concise output format (default)

```markdown
## Triage
Feature · **M** · API + UI (`orders` API / `OrdersList` page)

**Next:** Confirm export columns and row cap, then API Task + client Story.

## Questions
- Max rows / async export?

## Tickets
| # | Type | Summary | Deps |
|---|------|---------|------|
| 1 | Task | Add API endpoint for order export by date range | — |
| 2 | Story | As a manager, I want to download orders as CSV… | #1 |

_Agent effort: ~30–90 min · `full draft` for #1 or #2._
```

Omit **Questions** when none. Footer is always the **last line**.

## Full output format

Use when the user asks for full drafts. Each tracker section gets its own copy box. Leave the section heading outside the box.

| Surface | Handoff |
|---------|---------|
| **CLI** (Claude CLI, Cursor CLI) | One sentinel box per section. Copy to the clipboard only when the user names a section |
| **IDE** | One `text` fence per section. The editor copy control is the handoff |
| **GUI** | One `text` fence per section. The user selects and copies |

Section order comes from [reference.md](reference.md). Skip **Out of Scope**. Use `-` bullets, not checkboxes. Leave a blank line between paragraphs inside a box.

- Task: Description (the unheaded intro), then Scope of Work, Acceptance Criteria, Technical Notes, Testing Notes
- Story, Bug, Spike: each headed section, in template order

Per ticket: chat heading `### PROJ-??? — [summary line] (Type)`, then Summary, then one box per section. After the last ticket, the **Agent effort** footer.

Max **3** tickets unless the user asks for more.

### CLI

Print one sentinel box per section, with no fence. The section name is on the sentinel, not inside the box. Copy a section only when the user names it (`copy summary`, `copy acceptance criteria`).

~~~~
### PROJ-??? — Add API endpoint for order export by date range (Task)

========== COPY BOX: JIRA SUMMARY ==========
Add API endpoint for order export by date range
========== END COPY BOX ==========

========== COPY BOX: DESCRIPTION ==========
Add an API endpoint so managers can export orders filtered by date range.

The endpoint should:

- Accept account id and date range (start/end) in the request
- Return rows using the account timezone for date boundaries
========== END COPY BOX ==========
~~~~

```bash
cat <<'EOF' | pbcopy
…the named section only…
EOF
```

On Linux use `xclip -selection clipboard` or `wl-copy`. On Windows use `clip` when available. Confirm briefly which section was copied.

### IDE and GUI

One `text` fence per section. Do not use a `markdown` fence. The label above the fence is the section name. Do not put that name, or a `##` line, inside the fence.

## Do not

- Repeat the same detail in Triage, Next, Questions, Tickets, or footer
- Add a **Risks** or **Map** heading in concise mode (fold critical risk into Next)
- Put agent effort, paths, or surfaces in ticket **Deps** / Notes
- Propose 5+ tickets in concise mode — cap at Spike + 3 follow-ups or Epic + child list
- Commit, open PRs, or guess Story Points / Components
- File a **Bug** without repro — use **Spike** first
- Output full ticket descriptions in concise mode
- Use checkboxes (`[]`, `- [ ]`) in full-draft body blocks — use `-` bullets instead
- Include **Out of Scope** in full drafts
- Put `========== COPY BOX` or `========== END COPY BOX` lines on the clipboard
- Put a section heading inside a copy box
- Wrap a CLI box in a fence
- Use a `markdown` fence for an IDE or GUI copy box (always `text`)
- Merge ticket sections into one payload
- Copy every section to the clipboard at once

## Additional resources

- Templates + placeholders: [reference.md](reference.md)
- Sample triages: [examples.md](examples.md)
