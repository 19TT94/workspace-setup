#!/usr/bin/env bash
# Tests for agents/claude/hooks/guard.py, the Claude Code PreToolUse check
# that asks before production writes and destructive commands.
# Usage: bash tests/guard.test.sh

set -u

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GUARD="$REPO_ROOT/agents/claude/hooks/guard.py"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Repos on a protected and an unprotected branch, for git push checks.
for b in master feat; do
    git init -q -b "$b" "$TMP/repo-$b"
done

pass=0
fail=0

# decide <cwd> <json-tool-input> -> prints "ask" or "silent"
decide_raw() {
    local out
    out="$(printf '%s' "$2" | (cd "$1" && python3 "$GUARD") 2>/dev/null)"
    if [ $? -ne 0 ]; then
        echo "error"
    elif printf '%s' "$out" | grep -q '"permissionDecision": *"ask"'; then
        echo "ask"
    elif [ -z "$out" ]; then
        echo "silent"
    else
        echo "other: $out"
    fi
}
bash_input() {
    python3 -c 'import json,sys; print(json.dumps({"tool_name":"Bash","tool_input":{"command":sys.argv[1]},"cwd":sys.argv[2],"hook_event_name":"PreToolUse"}))' "$1" "$2"
}
decide() { decide_raw "${2:-$TMP}" "$(bash_input "$1" "${2:-$TMP}")"; }

expect() {
    local want="$1" cmd="$2" cwd="${3:-$TMP}" got
    got="$(decide "$cmd" "$cwd")"
    if [ "$got" = "$want" ]; then
        pass=$((pass + 1))
    else
        fail=$((fail + 1))
        echo "FAIL: expected $want, got $got: $cmd"
    fi
}

reason_has() {
    local text="$1" cmd="$2"
    if printf '%s' "$(bash_input "$cmd" "$TMP")" | python3 "$GUARD" | grep -qi "$text"; then
        pass=$((pass + 1))
    else
        fail=$((fail + 1))
        echo "FAIL: reason lacks '$text': $cmd"
    fi
}

# 1. Production gate
expect ask 'ALLOW_PRODUCTION=yes ./infrastructure/ecs/deployECS.sh frm'
reason_has production 'ALLOW_PRODUCTION=yes ./infrastructure/ecs/deployECS.sh frm'

# 2. Exported production gate
expect ask 'export ALLOW_PRODUCTION=yes && ./deployECS.sh frm'

# 3. psql to a remote host asks; local does not
expect ask 'psql -h hero-prod.abc123.us-west-2.rds.amazonaws.com -U app hero'
expect ask 'psql postgresql://app@hero-prod.abc123.us-west-2.rds.amazonaws.com:5432/hero'
expect silent 'psql'
expect silent 'psql -h localhost -U postgres'
expect silent 'psql postgres://postgres@127.0.0.1:5432/hero'

# 4. psql with a host hidden in a variable
expect ask 'psql "$DATABASE_URL"'

# 5. Listed commands hidden in a shell wrapper
expect ask 'sh -c "aws cloudformation delete-stack --stack-name hero-frm"'
expect ask "bash -lc 'cd manifold && terraform apply'"

# 6. git push to protected branches
expect ask 'git push' "$TMP/repo-master"
expect ask 'git push origin HEAD:master' "$TMP/repo-feat"
expect ask 'git push origin stage' "$TMP/repo-feat"
expect silent 'git push origin feat/new-thing' "$TMP/repo-feat"
expect silent 'git push -u origin feat/new-thing' "$TMP/repo-feat"

# 7. Migrations
expect ask 'flask db upgrade'
expect ask 'docker compose exec api flask db upgrade'
expect ask 'alembic upgrade head'

# 8. Secret reads
expect ask 'aws ssm get-parameter --name /production/db/password --with-decryption'
expect ask 'aws secretsmanager get-secret-value --secret-id hero/prod'

# 9. Everyday and read-only commands stay silent
expect silent 'aws cloudformation describe-stacks --stack-name hero-frm'
expect silent 'aws ssm get-parameter --name /production/pipeline/ApiGitHubBranch'
expect silent 'npm test'
expect silent 'ls -la'
expect silent 'git status'
expect silent 'rm notes.txt'

# Rest of the ask list (spot checks per group)
expect ask 'aws ecs update-service --cluster hero --service api --force-new-deployment'
expect ask 'aws ecs execute-command --cluster hero --task abc --interactive --command sh'
expect ask 'aws s3 sync ./build s3://hero-client'
expect ask 'aws --profile admin iam attach-role-policy --role-name x --policy-arn y'
expect ask 'aws configure set region us-east-1'
expect ask 'terraform -chdir=manifold destroy'
expect ask 'terraform state rm aws_instance.x'
expect ask './infrastructure/config/upload-parameters.sh stage'
expect ask 'bash infrastructure/services/connectToTask.sh frm api'
expect ask 'supabase db push'
expect ask 'supabase functions deploy notify'
expect ask 'netlify deploy --prod --dir dist'
expect ask 'netlify env:set API_KEY x'
expect ask 'gh pr merge 42 --squash'
expect ask 'rm -rf node_modules'
expect ask 'rm -r build'
expect ask 'git push --force origin feat/x' "$TMP/repo-feat"
expect ask 'git reset --hard origin/master'
expect ask 'git clean -fdx'
expect ask 'git branch -D old'
expect ask 'docker system prune -af'
expect ask 'docker compose -f docker-compose.prod.yml up -d'

# Review fixes: multi-line scripts, git global options, cd before push,
# recursive deletes through other programs.
expect ask $'cd infrastructure\nterraform apply'
expect ask "git -C $TMP/repo-feat push origin master"
expect ask "git -C $TMP/repo-master push"
expect ask "cd $TMP/repo-master && git push" "$TMP/repo-feat"
expect silent "cd $TMP/repo-feat && git push" "$TMP/repo-master"
expect ask 'find . -name build -exec rm -rf {} +'
expect ask 'find . -name "*.pyc" -delete'
expect ask 'ls | xargs rm -rf'
expect silent 'find . -name "*.py"'
expect silent 'cat infrastructure/ecs/deployECS.sh'

# 10. Non-Bash tools and garbage input stay silent and never fail
got="$(decide_raw "$TMP" '{"tool_name":"Read","tool_input":{"file_path":"/etc/hosts"}}')"
if [ "$got" = "silent" ]; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL: non-Bash tool: $got"; fi
got="$(decide_raw "$TMP" 'not json at all')"
if [ "$got" = "silent" ]; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL: garbage input: $got"; fi
got="$(decide "psql -h 'unterminated")"
if [ "$got" = "ask" ] || [ "$got" = "silent" ]; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL: unparsable command: $got"; fi

echo "guard: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
