# Cursor starter files

These files install as global Cursor config:

| Seed | Target |
| --- | --- |
| `rules/` | `~/.cursor/rules/` |
| `README.md` | `~/.cursor/rules/README.md` |
| `skills/` | `~/.cursor/skills/` (plus the shared `agents/skills/`) |

Cursor also supports project-scoped rules and skills under `.cursor/` inside each repository. Copy or adapt these files there when you want team-shared config in version control.

## Shared files

Shared skills from `agents/skills/` install to `~/.cursor/skills/` alongside the Cursor-only ones. The shared PR template installs to `~/.config/agent-templates/pull_request_template.md`.

## Guard (production writes and destructive commands)

The installer merges a `permissions.deny` list into `~/.cursor/cli-config.json` (kept alongside your own allow list; deny wins). In the CLI, denied commands are blocked and you run them yourself.

The IDE has no ask list for **Run Everything**. To get the same protection there, use **Settings → Agents → Approvals & Execution → Auto-review** and paste this into its block instructions:

```text
Ask before: anything with ALLOW_PRODUCTION=yes; deploy*/delete*/upload-parameters/download-parameters/connectToTask scripts; AWS write operations and secret reads (ssm --with-decryption, secretsmanager); terraform apply/destroy/import/state; flask db or alembic; psql to any non-local host; supabase db push/reset, functions deploy/delete, secrets; netlify deploy --prod, env:set/unset, sites:delete; git push to master/main/stage, force pushes, gh pr merge; git reset --hard, git clean, git branch -D; rm -r/-f; docker system/volume prune or rm; production docker compose files.
```

Auto-review is a best-effort classifier, not a hard guarantee.
