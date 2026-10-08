#!/usr/bin/env python3
"""Claude Code PreToolUse hook: ask before production writes and destructive commands.

Backstop for the `permissions.ask` rules in settings.json. Those match command
text by pattern; this hook also catches what patterns cannot: the
ALLOW_PRODUCTION=yes gate, psql to a non-local host, git push to a deploy
branch, and listed commands hidden inside `sh -c`. It only ever answers "ask"
or stays silent, and stays silent on any error so a bug never blocks a session.
"""

import json
import os
import re
import shlex
import subprocess
import sys

PROTECTED_BRANCHES = {"master", "main", "stage"}
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", ""}
SHELLS = {"sh", "bash", "zsh"}

AWS_WRITE_OP = re.compile(
    r"^(create|delete|put|update|modify|attach|detach|add|remove|register|deregister|"
    r"run|start|stop|reboot|restore|terminate|execute|set|upload|tag|untag|enable|"
    r"disable|reset|change|import|invoke|send|publish|copy|associate|disassociate|"
    r"replace|revoke|authorize|cancel|purge|rotate|apply|deploy)(-|$)"
)
AWS_S3_WRITES = {"cp", "mv", "rm", "sync", "mb", "rb"}
AWS_SECRET_READS = {
    ("ssm", "get-parameter"),
    ("ssm", "get-parameters"),
    ("ssm", "get-parameters-by-path"),
}
AWS_OPTIONS_WITH_VALUE = {"--profile", "--region", "--output", "--endpoint-url", "--query", "--color", "--ca-bundle", "--cli-read-timeout", "--cli-connect-timeout"}

INFRA_SCRIPT = re.compile(
    r"^(deploy.*|delete.*|upload-parameters|download-parameters|connectToTask)\.sh$"
)


def ask(reasons):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": "guard: " + "; ".join(reasons),
        }
    }))


def segments(command):
    """Split a command line into simple commands (token lists) on ; && || | and newlines."""
    lexer = shlex.shlex(command, posix=True, punctuation_chars=";&|\n")
    lexer.whitespace = " \t\r"
    lexer.whitespace_split = True
    lexer.commenters = ""
    current, out = [], []
    for token in lexer:
        if token and set(token) <= set(";&|\n"):
            if current:
                out.append(current)
            current = []
        else:
            current.append(token)
    if current:
        out.append(current)
    return out


def strip_prefix(tokens):
    """Drop leading VAR=value assignments and wrappers like env, sudo, time, nohup."""
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", t):
            i += 1
        elif t in ("env", "sudo", "time", "nohup", "command", "exec", "export"):
            i += 1
        else:
            break
    return tokens[i:]


def current_branch(cwd):
    try:
        out = subprocess.run(
            ["git", "-C", cwd or ".", "symbolic-ref", "--short", "HEAD"],
            capture_output=True, text=True, timeout=2,
        )
        return out.stdout.strip() if out.returncode == 0 else ""
    except Exception:
        return ""


def check_git(args, cwd):
    # Global options come before the subcommand; -C also changes the repo.
    while args and args[0].startswith("-"):
        if args[0] in ("-C", "-c") and len(args) > 1:
            if args[0] == "-C":
                cwd = os.path.join(cwd or ".", os.path.expanduser(args[1]))
            args = args[2:]
        else:
            args = args[1:]
    if not args:
        return []
    sub, rest = args[0], args[1:]
    if sub == "push":
        if any(a in ("--force", "-f", "--force-with-lease", "--mirror", "--delete", "-d") or a.startswith("--force") or a.startswith("+") for a in rest):
            return ["force or delete push"]
        positional = [a for a in rest if not a.startswith("-")]
        refspecs = positional[1:]
        if not refspecs:
            if current_branch(cwd) in PROTECTED_BRANCHES:
                return ["push to a deploy branch (" + current_branch(cwd) + ")"]
            return []
        for spec in refspecs:
            dest = spec.split(":")[-1].replace("refs/heads/", "")
            if dest in PROTECTED_BRANCHES:
                return ["push to a deploy branch (" + dest + ")"]
            if dest == "HEAD" and current_branch(cwd) in PROTECTED_BRANCHES:
                return ["push to a deploy branch (" + current_branch(cwd) + ")"]
        return []
    if sub == "reset" and "--hard" in rest:
        return ["git reset --hard"]
    if sub == "clean":
        return ["git clean"]
    if sub == "branch" and "-D" in rest:
        return ["git branch -D"]
    return []


def check_aws(args):
    i = 0
    while i < len(args) and args[i].startswith("-"):
        i += 2 if args[i] in AWS_OPTIONS_WITH_VALUE and "=" not in args[i] else 1
    if i + 1 >= len(args):
        return []
    service, op, rest = args[i], args[i + 1], args[i + 2:]
    if service == "configure" and op == "set":
        return ["aws configure set"]
    if service == "s3":
        return ["aws s3 " + op] if op in AWS_S3_WRITES else []
    if service == "secretsmanager" and op == "get-secret-value":
        return ["reads a production secret"]
    if (service, op) in AWS_SECRET_READS and "--with-decryption" in rest:
        return ["reads a decrypted secret"]
    if AWS_WRITE_OP.match(op):
        return ["aws " + service + " " + op]
    return []


def psql_host(args):
    """Return the target host, '' for local, or None when it can't be seen (variables)."""
    host = ""
    i = 0
    while i < len(args):
        a = args[i]
        if "$" in a or "`" in a:
            return None
        if a in ("-h", "--host") and i + 1 < len(args):
            host = args[i + 1]
            i += 2
            continue
        if a.startswith("--host="):
            host = a.split("=", 1)[1]
        elif re.match(r"^postgres(ql)?://", a):
            m = re.match(r"^postgres(?:ql)?://(?:[^@/]*@)?(\[[^\]]*\]|[^:/?]*)", a)
            host = m.group(1).strip("[]") if m else ""
        elif "host=" in a:
            m = re.search(r"host=([^\s]+)", a)
            host = m.group(1) if m else host
        i += 1
    return host


def check_tokens(tokens, cwd, depth=0):
    reasons = []
    if any(re.match(r"^ALLOW_PRODUCTION=['\"]?yes", t) for t in tokens):
        reasons.append("production run (ALLOW_PRODUCTION=yes)")
    tokens = strip_prefix(tokens)
    if not tokens:
        return reasons
    prog = os.path.basename(tokens[0])
    args = tokens[1:]

    # Shell wrappers: check the inner script, and scripts run via `bash x.sh`.
    if prog in SHELLS:
        for j, a in enumerate(args):
            if re.match(r"^-[a-z]*c[a-z]*$", a) and j + 1 < len(args) and depth < 3:
                reasons += check_command(args[j + 1], cwd, depth + 1)
                break
        else:
            script = next((a for a in args if not a.startswith("-")), "")
            if INFRA_SCRIPT.match(os.path.basename(script)):
                reasons.append("infrastructure script " + os.path.basename(script))
        return reasons

    joined = " ".join(tokens)
    if INFRA_SCRIPT.match(prog):
        reasons.append("infrastructure script " + prog)
    if re.search(r"(^|\s)flask db(\s|$)", joined) or "alembic" in tokens:
        reasons.append("database migration")

    if prog == "git":
        reasons += check_git(args, cwd)
    elif prog == "gh" and args[:2] == ["pr", "merge"]:
        reasons.append("gh pr merge (may deploy)")
    elif prog == "aws":
        reasons += check_aws(args)
    elif prog == "terraform":
        sub = [a for a in args if not a.startswith("-")]
        if sub[:1] in (["apply"], ["destroy"], ["import"], ["taint"]) or sub[:2] in (["state", "rm"], ["state", "mv"]):
            reasons.append("terraform " + " ".join(sub[:2] if sub[0] == "state" else sub[:1]))
    elif prog == "psql":
        host = psql_host(args)
        if host is None:
            reasons.append("psql to a host that can't be seen")
        elif host not in LOCAL_HOSTS and not host.startswith("/"):
            reasons.append("psql to " + host)
    elif prog == "supabase":
        if args[:2] in (["db", "push"], ["db", "reset"], ["migration", "repair"], ["functions", "deploy"], ["functions", "delete"], ["projects", "delete"]) or args[:1] == ["secrets"]:
            reasons.append("supabase " + " ".join(args[:2]))
    elif prog == "netlify":
        if (args[:1] == ["deploy"] and "--prod" in args) or args[:1] in (["env:set"], ["env:unset"], ["sites:delete"], ["api"]):
            reasons.append("netlify " + args[0])
    elif prog == "rm":
        if any(re.match(r"^-[a-zA-Z]*[rRf]", a) or a in ("--recursive", "--force") for a in args):
            reasons.append("rm with -r/-f")
    elif prog == "find":
        if "-delete" in args:
            reasons.append("find -delete")
        for j, a in enumerate(args):
            if a in ("-exec", "-execdir", "-ok", "-okdir"):
                reasons += check_tokens(args[j + 1:], cwd, depth + 1)
    elif prog == "xargs":
        inner = args
        while inner and inner[0].startswith("-"):
            inner = inner[2:] if inner[0] in ("-I", "-n", "-P", "-L", "-s", "-d", "-E") else inner[1:]
        reasons += check_tokens(inner, cwd, depth + 1)
    elif prog in ("docker", "docker-compose"):
        if args[:2] in (["system", "prune"], ["volume", "rm"], ["volume", "prune"]):
            reasons.append("docker " + " ".join(args[:2]))
        elif any("prod" in a for a in args if a.endswith((".yml", ".yaml"))):
            reasons.append("production docker compose file")
    return reasons


def check_command(command, cwd, depth=0):
    reasons = []
    try:
        parts = segments(command)
    except ValueError:
        # Unbalanced quotes: fall back to whitespace splitting.
        parts = [command.split()]
    for tokens in parts:
        # Follow `cd` so a later `git push` is checked in the repo it runs in.
        if tokens and tokens[0] == "cd":
            target = os.path.expanduser(tokens[1]) if len(tokens) > 1 else os.path.expanduser("~")
            cwd = os.path.join(cwd or ".", target)
            continue
        reasons += check_tokens(tokens, cwd, depth)
    return reasons


def main():
    try:
        data = json.load(sys.stdin)
        if data.get("tool_name") != "Bash":
            return
        command = data.get("tool_input", {}).get("command", "")
        reasons = check_command(command, data.get("cwd") or os.getcwd())
        if reasons:
            ask(list(dict.fromkeys(reasons)))
    except Exception:
        return


if __name__ == "__main__":
    main()
