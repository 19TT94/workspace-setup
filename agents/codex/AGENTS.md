# Global Codex instructions

These preferences apply to every repository unless overridden by a project-level `AGENTS.md`.

## Working style

- Read project context before making changes
- Prefer small, focused diffs that solve the stated problem
- Match existing naming, structure, conventions, and tooling in the repo
- Write self-documenting code; add comments only for non-obvious logic
- Run relevant tests or syntax checks when available

## Tests first

Use TDD when the work warrants it (new behavior, bug fixes, logic changes; not docs, config, or trivial edits):

1. Write the test scenarios in plain language (one line each, or given/when/then) and wait for approval.
2. Write the approved tests and confirm they fail.
3. Implement until they pass.

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
