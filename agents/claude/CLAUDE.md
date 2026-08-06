# Global Claude Code instructions

These preferences apply to every project unless overridden by a repository `CLAUDE.md`.

- Read project context before making changes
- Prefer minimal diffs that solve the stated problem
- Match existing naming, structure, and tooling in the repo
- Run relevant tests or syntax checks when available

## GitHub issue access

When asked to implement or select a GitHub issue:

- Check its labels before making changes.
- Proceed when it has the `agent` label.
- Do not begin work on an issue labeled `no-agent` unless the user explicitly directs you to do so.
- If neither label is present, ask the user whether to proceed.
