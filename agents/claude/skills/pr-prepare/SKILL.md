---
name: pr-prepare
description: >-
  Prepares a branch for pull request: run project checks, draft a PR title/body
  from the default or repo template, and hand off a copy-ready payload. Use when
  the user is about to open a PR, asks to prepare for merge, wants a PR message,
  or wants a pre-PR checklist. CLI copies the body to the clipboard; IDE and GUI
  show a copy box.
disable-model-invocation: true
---

# Prepare pull request

Generic global skill. Prefer a **repo** template when present; otherwise use the
bundled default. Customize ticket key / testing checkboxes in
[pull_request_template.md](pull_request_template.md) (or the shared seed at
`agents/templates/pull_request_template.md` in workspace-setup).

## Template resolution

1. If the repo has `.github/pull_request_template.md` (or `.github/PULL_REQUEST_TEMPLATE.md` / a file under `.github/PULL_REQUEST_TEMPLATE/`), use that.
2. Else use this skill’s [pull_request_template.md](pull_request_template.md) (installed at `~/.claude/skills/pr-prepare/pull_request_template.md`).

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
template already defines more).

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
3. **Review** — Cursor: Source Control → Agent Review (or `/agent-review`). Claude: invoke a project code-review skill if one exists. Fix clear issues before drafting the PR body.
4. **Migrations / data** — if the change includes schema or irreversible steps, note upgrade/downgrade or rollback in the PR body.

## Open PR

- Target the repo’s default integration branch (`main` / `master` / `stage`, etc.)
- Title: match the template pattern (e.g. `PROJ-XXX [short description]`) when the project uses ticket keys; otherwise a short imperative summary
- CLI: paste from the clipboard. IDE or GUI: paste from the copy box

## Do not

- Commit secrets or `.env` files
- Skip the clipboard copy when running in a CLI
- Put `========== COPY BOX ==========` or `========== END COPY BOX ==========` on the clipboard
- Wrap the CLI payload in a fence
- Use a `markdown` fence for the IDE or GUI copy box (always `text`)
- Pack headings flush against the next line (always **two** blank lines after `#` / `##`)
- Drop checkbox lines from the template
