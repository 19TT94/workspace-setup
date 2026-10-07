---
name: code-review
description: >-
  Reviews the current changes (branch diff, uncommitted work, or a named PR,
  branch, or path) using the project's own review guides when it has them. Use
  when the user asks for a code review, PR review, pre-push review, or findings
  before opening a PR.
---

# Code review

One review entry point for every project. Project-specific rules live in
**review guides**, not in separate review skills, so this skill picks them up
by itself.

## 1. Scope

- Default: the current branch against its base (the PR base, else the repo's
  default branch) — `git diff <base>...HEAD` — plus uncommitted changes.
- If the user names a PR, branch, commit, or path, review that instead.
- List the changed files; they decide which guides apply.

## 2. Load the project's review guides

1. Find `.cursor/review/*.md` at the repo root, and in any submodule or
   package directory the diff touches.
2. Each guide has a `paths:` list of globs in its frontmatter, relative to the
   directory that holds `.cursor/`. Load a guide when any changed file matches;
   a guide without `paths` applies to every change.
3. Read the files a loaded guide points to (e.g. `.cursor/bugbot/*.md`,
   `.cursor/BUGBOT.md`, `.github/CODE_REVIEW.md`).
4. No guides at all: fall back to `.cursor/BUGBOT.md`, `.github/CODE_REVIEW.md`,
   `AGENTS.md` / `CLAUDE.md`, and `.cursor/rules/` when they exist.

Name the guides you applied in the summary, so a missing guide is visible.

## 3. Work alongside built-in reviewers

If the agent also has a built-in reviewer (for example `/review`), this
review complements it: lead with what the project's guides require, then
general bugs. Do not repeat findings a built-in review already reported in
this session.

## 4. Review

- Read the surrounding code before flagging anything. Report only issues you
  can tie to a line and a concrete failure or guide rule.
- Order: correctness bugs, then guide rules, then simplification.
- Run the cheap checks the guides list (lint, targeted tests, syntax checks)
  and report the results. Never run deploys, migrations, or installs.
- Review only — do not edit files unless the user asks.

## Output

```markdown
## Summary
[1–2 sentences] · Guides: `api.md`, `client.md`

## Findings

### Blocker
- `path:line` — issue — suggested fix

### Suggestion
- …

### Nit
- … (skip anything tooling already enforces)

## Checks
- [x] `yarn lint` — passed
```

Omit empty sections. No findings is a valid result — say so in one line.

## Review guide format

Projects add one guide per area under `.cursor/review/`:

```markdown
---
description: API review rules
paths:
  - api/**
---

# API review

Priority areas, project-specific checks, and the commands to run.
```

Guides are plain files, so they never show up as extra slash commands.
