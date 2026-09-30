# Feature planning reference

Templates for **full draft** / copy-paste into Jira (or similar). Concise mode by default ([SKILL.md](SKILL.md)).

## Configure these defaults

Edit this file after install (it lands in your agent’s `skills/feature-planning/` directory) so ticket keys and links match your tracker.

| Setting | Value | Notes |
| ------- | ----- | ----- |
| Project key | `PROJ` | Replace with your Jira/Linear/GitHub project key |
| Browse URL prefix | `https://example.atlassian.net/browse/` | Used when linking tickets in PRs |
| Default issue type (user-facing) | Story | |
| Default issue type (tech-only) | Task | |
| Research / unknown scope | Spike | |

## Jira copy-paste formatting

When the user asks for a **full draft**, each section gets its own copy box. The heading stays outside the box. Handoff rules are in [SKILL.md](SKILL.md).

| Surface | Each section |
| ------- | ------------ |
| CLI | Its own sentinel box, named on the sentinel line. Clipboard only when the user names that section. |
| IDE / GUI | One `text` fence. The section name is the label above the fence. |

### Formatting rules

- CLI: no fence around a box. IDE and GUI: **`text` only**, never `markdown`
- Do not put the section heading inside the box
- Use `-` bullets (not `[]` or `- [ ]`)
- Use `` `backticks` `` for paths, env vars, and ticket keys
- Leave a blank line between paragraphs inside a box
- Sentinel lines stay outside the clipboard payload
- Chat-only: `### PROJ-??? — … (Type)` above the boxes

## Issue type guide

| Type | When to use |
| ---- | ----------- |
| **Epic** | Multi-sprint initiative; groups Stories |
| **Story** | User-visible value; has acceptance criteria |
| **Task** | Internal work (refactor, CI, dependency bump) |
| **Bug** | Broken behavior vs spec/production |
| **Spike** | Time-boxed investigation; outcome = decision or doc |

## Ticket templates

### Story

**Summary** (user story sentence; no project key prefix):

```text
As a [type of user], I want [goal] so that [benefit].
```

**Description** — one copy box per section below. Leave each heading out of its box.

```markdown
## Background / Context

Why this story exists and what problem it solves.

## Acceptance Criteria

Given/When/Then format preferred:

- Condition 1 is met
- Condition 2 is met
- Edge cases handled

## UX / Design Notes

Link to design specs. Any UI constraints or behavior details.

## Technical Notes (optional)

### APIs involved

- …

### Dependencies

- …

### Data considerations

- …

## Dependencies

**Blocks:**

- …

**Blocked by:**

- …
```

### Task

**Summary** (imperative, under ~80 chars; no project key prefix):

```text
Add API endpoint for order export by date range
```

**Description** — one copy box for the intro (no heading), then one copy box per section below.

```markdown
[One short paragraph: what to build and why.]

The [endpoint/feature] should:

- [Capability 1]
- [Capability 2]
- [Capability 3]

## Scope of Work

[Where it lives, entry points, dependencies, and boundaries of this ticket.]

## Acceptance Criteria

- [Testable outcome 1]
- [Testable outcome 2]

## Technical Notes

### Files/modules affected

- `path/to/file`

### Approach or implementation details

- [Pattern to follow, edge cases]

## Testing Notes

### How to verify the change

- [Local/dev steps]
- [Test command]

### QA steps if applicable

- [Staging / role-based checks]
```

### Bug

**Summary** (short, specific symptom; no project key prefix):

```text
Null due date incorrectly marks draft records overdue
```

**Description** — one copy box per section. Omit **Actual** / **Expected** if the Summary already states them clearly.

```markdown
## Actual behavior

Describe what is currently happening…

## Expected behavior

Describe what should happen instead…

## Steps to Reproduce

1. Go to …
2. Click …
3. Observe …

## Environment

**Browser / runtime:** …

**Device / OS:** …
```

### Spike

**Summary** — often the same text as **Question**:

```text
[Single question to answer]
```

**Description** — one copy box per section below.

```markdown
## Question

[Single question to answer]

## Time box

[Duration — e.g. ~15–30 min for a scoped agent investigation]

## Done when

- Written recommendation: [option A / option B / do nothing]
- PROJ-??? follow-up tickets listed (if any)
```

### Epic

```markdown
## Goal

[One paragraph]

## Success metrics

- …

## Child work (draft)

- PROJ-??? — …
- PROJ-??? — …
```

## Labels and components (optional)

Ask the user or leave unset. Prefer project conventions when known.

## Area map

This global skill has no product-specific path table. When paths matter:

- Infer from the repo layout, README, and recent changes
- Prefer a **project-local** feature-planning `reference.md` override for large codebases

## PR linkage

After implementation:

- Branch / PR title: `PROJ-123 Short description` (or the project’s convention)
- PR body: link the ticket per [pr-prepare](../pr-prepare/SKILL.md) and the default [pull_request_template.md](../../templates/pull_request_template.md), installed at `~/.config/agent-templates/pull_request_template.md`
- Prefer the repo’s `.github/pull_request_template.md` when present
