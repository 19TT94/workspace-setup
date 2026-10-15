# Global Claude Code instructions

These preferences apply to every project unless overridden by a repository `CLAUDE.md`.

## Working style

- Read project context before making changes
- Prefer small, focused diffs that solve the stated problem
- Match existing naming, structure, conventions, and tooling in the repo
- Write self-documenting code; add comments only for non-obvious logic
- Run relevant tests or syntax checks when available

## Tests first

Use TDD when the work warrants it (new behavior, bug fixes, logic changes; not docs, config, or trivial edits):

1. Draft the test scenarios in plain language (one line each, or given/when/then), then present them **one at a time** for approval, numbered ("Scenario 2 of 5"). Use your question tool when you have one (approve, approve and build now, drop; free text to change it); otherwise ask in plain text. A skipped or empty answer is not approval: ask again.
2. Build when the user says to ("build now", "build the approved ones", "build the last 3"): write those tests, confirm they fail, implement until they pass, then return to the next scenario. After the last scenario, build any approved ones still waiting.
3. Track approved scenarios as a checklist (your task list, when you have one) and check each off when its test passes.
4. When the work is done, offer the `quizme` skill so the user can check their understanding before review.

## Type safety

- After editing code, run the project's type checks (its type checker or compiler check, e.g. `tsc --noEmit`, pyright, `cargo check`, `go vet`) and fix errors in code you added or changed before reporting done.
- Don't fix pre-existing errors on your own. At the end, list them (files and counts) and ask how far to go: leave them, fix the ones in files you touched, or do a full pass.
- Never silence a type error (ignore comments, `any`-style escape hatches, unchecked casts) without a one-line reason.
- In languages where typing is optional, add type annotations to new or changed functions when the project uses them or has a type checker.

## Git and pull requests

- Never commit or push on your own. Commits, pushes, and PRs happen only through the `pr-prepare` skill, and only after the user says they want the work taken to a PR.
- When the user asks for a PR, run `pr-prepare` yourself; they should not have to invoke it. Shared PR template: `~/.config/agent-templates/pull_request_template.md`.

## Code review

- When reviewing code — with a built-in reviewer or the `code-review` skill — also apply the project's review guides: `.cursor/review/*.md` whose `paths` match the changed files.

## Opinions

- For judgment calls (design, trade-offs, dependencies, scope, error handling), read `~/.config/agent-templates/OPINIONS.md` and follow it unless the project or the user says otherwise.
- When the user makes a decision that sounds like a durable, general preference not already in it, mention it once at the end and offer to add it. Skip one-off task choices, anything sensitive, and contested takes.
- Add opinions in the workspace-setup repo (`agents/templates/OPINIONS.md`, via a PR), then install the file locally; don't only edit the installed copy.

## Communication

- Keep responses concise: one or two short paragraphs by default.
- Offer more detail as a follow-up rather than front-loading it.

## GitHub issue access

When asked to implement or select a GitHub issue:

- Check its labels before making changes.
- Proceed when it has the `agent` label.
- Do not begin work on an issue labeled `no-agent` unless the user explicitly directs you to do so.
- If neither label is present, ask the user whether to proceed.
