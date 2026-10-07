---
name: pr-prepare
description: >-
  Prepares a branch for pull request: run project checks, draft a PR title/body
  from the default or repo template, ask before creating anything, then hand off
  a copy-ready payload and, only where it adds context, comment the PR. Use
  whenever the user asks to create or open a PR, prepare for merge, write a PR
  message, or run a pre-PR checklist. CLI copies the body to the clipboard; IDE
  and GUI show a copy box.
---

# Prepare pull request

Generic global skill. Prefer a **repo** template when present; otherwise use the
bundled default. Customize ticket key / testing checkboxes in the shared
template installed at `~/.config/agent-templates/pull_request_template.md`.

## Template resolution

1. If the repo has `.github/pull_request_template.md` (or `.github/PULL_REQUEST_TEMPLATE.md` / a file under `.github/PULL_REQUEST_TEMPLATE/`), use that.
2. Else use the shared default at `~/.config/agent-templates/pull_request_template.md`. If that file is missing, fall back to the structure in “Required output” below.

Draft the title and body from that template. Checklist notes (tests, lint, review) go **above** the payload, never inside it.

## Required output

| Surface | Handoff |
|---------|---------|
| **CLI** (Claude CLI, Cursor CLI) | Sentinel lines around the payload, then clipboard |
| **IDE** | One `text` fence. The editor copy control is the handoff |
| **GUI** | One `text` fence. The user selects and copies |

**Spacing:** two blank lines after every `#` / `##` heading; two blank lines
between title, link, checkbox group, change bullets, Root Cause, and Testing.
Include every checkbox from the template. Check only what this PR did.
Keep Testing boxes from the chosen template (extend only if the project’s
template already defines more). When test scenarios were approved for this
work, list them under the boxes as plain `-` lines, one scenario each.

### CLI

Do not wrap the payload in a fence. Bound it with sentinel lines. Checklist
notes stay above the start line. Nothing after the end line is part of the
payload.

~~~~
========== COPY BOX ==========
# PROJ-XXX [short description]


View [PROJ-XXX](link_to_ticket)


- [x] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation
- [ ] Test coverage
- [ ] Hotfix
- [ ] Refactor


- (Bugfix) Short change summary…


## Root Cause / Context


- **What caused the issue:** …
- **Why the previous implementation failed:** …
- **Why this solution works:** …


## Testing


- [ ] …every Testing box from the chosen template…
========== END COPY BOX ==========
~~~~

Copy only the lines between the sentinels. Leave both sentinel lines out.
Confirm briefly that it was copied.

```bash
cat <<'EOF' | pbcopy
…lines between the sentinels…
EOF
```

On Linux use `xclip -selection clipboard` or `wl-copy` instead of `pbcopy`.
On Windows use `clip` or an equivalent clipboard command when available.

### IDE and GUI

One `text` fence so blank lines stay visible. Do not use a `markdown` fence.
Skip `pbcopy` unless a shell is available and the user asked for the clipboard.

~~~~
```text
# PROJ-XXX [short description]


View [PROJ-XXX](link_to_ticket)


- [x] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation
- [ ] Test coverage
- [ ] Hotfix
- [ ] Refactor


- (Bugfix) Short change summary…


## Root Cause / Context


- **What caused the issue:** …
- **Why the previous implementation failed:** …
- **Why this solution works:** …


## Testing


- [ ] …every Testing box from the chosen template…
```
~~~~

## Pre-PR checklist

1. **Scope** — `git status` / `git diff --stat` against the PR base. Note packages or areas touched.
2. **Checks** — run the project’s usual pre-merge commands for those areas (from README, `package.json` scripts, Makefile, etc.). Prefer targeted tests over full suites when the project documents that pattern.
3. **Tests** — if test scenarios were approved for this work, confirm each one has a test and that it passes. Flag any scenario without a test above the payload; do not drop it silently.
4. **Review** — run the `code-review` skill (Claude: the built-in `/code-review`); both apply the project's `.cursor/review/` guides. Fix clear issues before drafting the PR body.
5. **Migrations / data** — if the change includes schema or irreversible steps, note upgrade/downgrade or rollback in the PR body.

## Open PR

- Target the repo’s default integration branch (`main` / `master` / `stage`, etc.)
- Title: match the template pattern (e.g. `PROJ-XXX [short description]`) when the project uses ticket keys; otherwise a short imperative summary
- CLI: paste from the clipboard. IDE or GUI: paste from the copy box

## Ask before you create

Pasting is always safe. Publishing is not. **Stop by default.**

Before any write — creating a branch, staging, committing, pushing, or
opening a PR — assemble one packet and ask:

| Field | Notes |
|-------|-------|
| Branch | `<type>/<short-description>` unless the project has its own convention |
| Commit message | Subject plus why |
| PR title / body | From the chosen template |
| Summary comment | Only when it adds context the PR body does not. Usually omitted |
| Inline comments | Only to flag code that needs explanation. Line anchors resolve later. Often none |

Present it in chat, ask once, apply edits, then proceed.

**Skip the pause only when the user already said to take it through** —
“open the PR”, “take it all the way”, “ship it”, “just create it”. Unambiguous
wording only. Anything hedged, or a request that came before the packet
existed, still stops and asks.

Approval covers one run and one scope. If more files are added or the approach
changes afterward, assemble a fresh packet and ask again — do not carry
approval forward across a scope change.

## Comment the PR

Comments are **optional, and the default is none**. The PR body already
explains what changed and why; a comment that restates it is noise. Docs-only
and other self-explanatory PRs normally get no comments at all.

Post comments only when one of these holds:

- **Summary comment** — there is context a reviewer needs that the PR body
  does not provide.
- **Inline comments** — a specific piece of code needs explanation that the
  diff cannot give on its own.

If neither holds, skip this section and say so in one line.

**One call posts both.** The review body is the summary comment (leave it
`""` when there is none); the `comments` array is the inline set:

```bash
gh api "repos/$REPO/pulls/$PR/reviews" --method POST --input - <<'JSON'
{
  "body": "## Summary\n\nWhat changed and why…",
  "event": "COMMENT",
  "comments": [
    {
      "path": "scripts/install.js",
      "line": 118,
      "side": "RIGHT",
      "body": "Why this branch, and what was rejected."
    }
  ]
}
JSON
```

`event: "COMMENT"` posts without approving. Never use `APPROVE` — an agent
approving its own work is not a review.

Post **one** review object per PR. Do not create a second review to add
comments you forgot; edit the first with `PUT` on the same review id, or put
the addition in the summary body. A trail of self-reviews makes the PR
harder to read, not easier.

### When an inline comment earns its place

Flag code where a reviewer would otherwise have to dig:

- **Non-obvious why** — the constraint that forced the choice, and what you
  rejected
- **Depends on code outside the diff** — a caller, config, or sibling module
  that this diff does not show
- **Sharp edges** — behavior that is safe only under a condition
- **Rollback / migration** — how to undo it, what has to happen in order
- **Intentional omissions** — what you chose not to change, and why

Do **not** comment on what the diff already shows plainly, formatting, or
anything you would answer with “yes, that’s right”. Those train reviewers to
skim.

Aim for **five inline comments or fewer**. Past that, PRs get skimmed. Fold
the remainder into the summary body instead of posting them.

### Anchors resolve after push

An inline comment needs a `line` that exists in the PR diff. That line
number does not exist until the branch is pushed, because the diff *is* the
push. Sequence it:

1. Draft the comment **content** before pushing (part of the packet)
2. Push, open the PR
3. Read the diff back — `gh pr diff $PR`
4. Resolve each comment to a real line in that output
5. Post

**Resolve `line` by counting new-file lines, not by counting diff lines.**
`@@ -2,92 +2,12 @@` means the hunk’s first line is line 2 of the new file.
From there, count forward, and apply these rules:

- A `+` or ` ` (context) line **advances** the new-file counter.
- A `-` (deleted) line **does not**. It is absent from the new file.
- `\ No newline at end of file` **does not** advance it either. This marker
  follows the last line of a file that lacks a trailing newline, so counting
  it shifts every subsequent anchor by one.

When a file ends without a newline, the marker is easy to misread as a line
and every comment below it lands on the wrong row. Verify the resolved
number against the real file — `grep -n` on the working copy is a cheap
cross-check.

`side` is `RIGHT` for a line in the new file, `LEFT` for a line in the old.
A deleted line anchors on `LEFT` at its original number.

**If a comment has no anchorable line** — you are describing context outside
the diff — fold it into the summary body. Never silently drop it.

## Do not

- Open a PR, push, or post a comment before the user approves the packet
- Post a summary comment that restates the PR body, or any comment on a PR whose body and diff already explain it
- Treat approval for one scope as approval for a changed scope
- Self-approve: `event` is always `COMMENT`
- Post more than ~5 inline comments; fold the rest into the summary
- Drop a comment that could not be anchored — move it into the summary
- Commit secrets or `.env` files
- Skip the clipboard copy when running in a CLI
- Put `========== COPY BOX ==========` or `========== END COPY BOX ==========` on the clipboard
- Wrap the CLI payload in a fence
- Use a `markdown` fence for the IDE or GUI copy box (always `text`)
- Pack headings flush against the next line (always **two** blank lines after `#` / `##`)
- Drop checkbox lines from the template
