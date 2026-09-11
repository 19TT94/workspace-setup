# Cursor project configuration

This folder configures Cursor for the **Workspace Setup** repo (dotfiles, devtools, and AI agent starter installer). It is **not** installed to anyone’s home directory — it only governs agents working on this repo.

| Path | Purpose |
|------|---------|
| [`BUGBOT.md`](BUGBOT.md) | Review rules for **Agent Review** and **Bugbot** on GitHub |
| [`rules/workspace-setup.mdc`](rules/workspace-setup.mdc) | Agent rules: installer vs seed separation, platform parity, dry-run testing |
| [`skills/audit-local-config/`](skills/audit-local-config/SKILL.md) | Agent skill: diff locally installed config/agent files vs repo seeds, decide what to pull back |
| [`skills/code-review/`](skills/code-review/SKILL.md) | Agent skill: review a branch/PR against installer + seed conventions |
| [`skills/pr-prepare/`](skills/pr-prepare/SKILL.md) | Agent skill: syntax checks + dry run checklist before opening a PR |

Do not confuse this with `agents/cursor/` — that folder holds the seed rules that the installer copies to `~/.cursor/rules/` on a target machine.

## Quick commands

```bash
npm install
npm run dry-run      # walk every prompt, change nothing
node --check scripts/foo.js               # syntax check an edited script
node scripts/audit-seeds.js               # audit installed home files vs seeds
```

## Notes

- Testing must always use `--dry-run`; a real `npm start` overwrites shell config and can delete this repo when prompted.
- Seed content lives in `agents/` and `tools/`; the copy map, menus, and install steps live in `scripts/`.