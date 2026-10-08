#!/usr/bin/env bash
# Tests for tools/pstash. Runs against a temporary prompts file and a fake
# clipboard/editor, so the real ~/.config/shell/prompts.md and clipboard are
# never touched. Usage: bash tests/pstash.test.sh

set -u

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PSTASH="$REPO_ROOT/tools/pstash"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

export PROMPTS_FILE="$TMP/prompts.md"
export PSTASH_CLIP="cat > '$TMP/clip'"
export EDITOR="$TMP/fake-editor"
cat > "$EDITOR" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$1" >> "$EDITOR_LOG"
[ -n "${EDITOR_TEXT+x}" ] && printf '%s' "$EDITOR_TEXT" > "$1"
exit 0
EOF
chmod +x "$EDITOR"
export EDITOR_LOG="$TMP/editor.log"

mkdir -p "$TMP/demo-repo" "$TMP/plain-dir"
git -C "$TMP/demo-repo" init -q

pass=0
fail=0
check() {
    if eval "$2"; then
        pass=$((pass + 1))
    else
        fail=$((fail + 1))
        echo "FAIL: $1"
    fi
}
reset() {
    rm -f "$PROMPTS_FILE" "$TMP/clip" "$EDITOR_LOG"
    unset EDITOR_TEXT
}
run() { (cd "$TMP/demo-repo" && "$PSTASH" "$@" 2>&1); }
# "number last-word" of list line $1, and the last word of every list line.
row() { printf '%s\n' "$out" | sed -n "${1}p" | awk '{print $1, $NF}'; }
last_words() { run list | awk '{print $NF}' | tr '\n' ' '; }

# 1. First stash creates the file and tags the entry with the repo and time.
reset
run "fix login" >/dev/null
check "1 creates prompts file" '[ -f "$PROMPTS_FILE" ]'
check "1 stores the prompt" 'grep -qx "fix login" "$PROMPTS_FILE"'
check "1 tags the repo" 'grep -q "demo-repo" "$PROMPTS_FILE"'
check "1 tags the time" 'grep -Eq "[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}" "$PROMPTS_FILE"'

# 2. List is newest first and numbered.
reset
run "a" >/dev/null
run "b" >/dev/null
out="$(run list)"
check "2 newest is #1" '[ "$(row 1)" = "1 b" ]'
check "2 oldest is #2" '[ "$(row 2)" = "2 a" ]'

# 3. Outside a git repo the entry is tagged with the folder name.
reset
(cd "$TMP/plain-dir" && "$PSTASH" "outside" >/dev/null)
check "3 tags the folder" 'grep -q "plain-dir" "$PROMPTS_FILE"'

# 4. Multi-line prompt from the editor: list shows the first line, pop returns all.
reset
EDITOR_TEXT=$'line one\nline two\nline three\n' run >/dev/null
out="$(run list)"
check "4 list shows first line" 'printf "%s" "$out" | grep -q "line one"'
check "4 list hides later lines" '! printf "%s" "$out" | grep -q "line three"'
run pop >/dev/null
check "4 pop returns every line" '[ "$(cat "$TMP/clip")" = "$(printf "line one\nline two\nline three")" ]'

# 5. Empty editor buffer stashes nothing.
reset
out="$(EDITOR_TEXT=$'   \n\n' run)"
check "5 says nothing stashed" 'printf "%s" "$out" | grep -qi "nothing stashed"'
check "5 no entry written" '[ "$(run list)" = "No stashed prompts" ]'

# 6. pop copies the newest, prints it, and removes it.
reset
run "first" >/dev/null
run "second" >/dev/null
out="$(run pop)"
check "6 copies newest" '[ "$(cat "$TMP/clip")" = "second" ]'
check "6 prints it" 'printf "%s" "$out" | grep -qx "second"'
check "6 removes it" '[ "$(run list | wc -l | tr -d " ")" = "1" ] && run list | grep -q "first"'

# 7. pop 2 takes the second entry and keeps the rest in order.
reset
for p in one two three; do run "$p" >/dev/null; done
run pop 2 >/dev/null
check "7 copies #2" '[ "$(cat "$TMP/clip")" = "two" ]'
check "7 order kept" '[ "$(last_words)" = "three one " ]'

# 8. peek copies without removing.
reset
run "keep a" >/dev/null
run "keep b" >/dev/null
run peek 2 >/dev/null
check "8 copies #2" '[ "$(cat "$TMP/clip")" = "keep a" ]'
check "8 keeps both" '[ "$(run list | wc -l | tr -d " ")" = "2" ]'

# 9. Empty stash or a missing number: message, no copy, file unchanged.
reset
out="$(run pop)"
check "9 empty pop says so" 'printf "%s" "$out" | grep -qi "no stashed prompts"'
check "9 empty pop copies nothing" '[ ! -e "$TMP/clip" ]'
run "only" >/dev/null
cp "$PROMPTS_FILE" "$TMP/before"
out="$(run pop 9)"
check "9 missing number says so" 'printf "%s" "$out" | grep -qi "no prompt #9"'
check "9 missing number copies nothing" '[ ! -e "$TMP/clip" ]'
check "9 file unchanged" 'cmp -s "$PROMPTS_FILE" "$TMP/before"'

# 10. Markdown inside a prompt is never mistaken for an entry boundary.
reset
md=$'## Heading in my prompt\n```bash\nnpm test\n```\n# another heading'
EDITOR_TEXT="$md" run >/dev/null
run "after" >/dev/null
check "10 two entries" '[ "$(run list | wc -l | tr -d " ")" = "2" ]'
run pop 2 >/dev/null
check "10 markdown kept intact" '[ "$(cat "$TMP/clip")" = "$md" ]'

# 11. Empty list.
reset
check "11 empty list message" '[ "$(run list)" = "No stashed prompts" ]'

# 12. edit opens the prompts file in the editor.
reset
run "x" >/dev/null
run edit >/dev/null
check "12 editor opened prompts file" 'grep -qx "$PROMPTS_FILE" "$EDITOR_LOG"'

# 13. help and unknown flags print usage (plain words are a prompt to stash).
reset
check "13 help prints usage" 'run help | grep -q "pstash pop"'
check "13 unknown flag prints usage" 'run --frobnicate | grep -q "pstash pop"'

# 14. A prompt that starts with a dash (markdown bullet) is stashed, not usage.
reset
run "- add retry to webhook" >/dev/null
check "14 dash prompt stashed" 'grep -qx -- "- add retry to webhook" "$PROMPTS_FILE"'
run -- "--literal flag text" >/dev/null
check "14 -- stashes the rest verbatim" 'grep -qx -- "--literal flag text" "$PROMPTS_FILE"'

# 15. Aborting the editor (non-zero exit) stashes nothing, says so, leaves no temp file.
reset
export TMPDIR="$TMP/tmpdir"; mkdir -p "$TMPDIR"
cat > "$TMP/abort-editor" <<'EOS'
#!/usr/bin/env bash
printf 'half-written idea' > "$1"
exit 1
EOS
chmod +x "$TMP/abort-editor"
out="$(EDITOR="$TMP/abort-editor" run)"
check "15 abort says nothing stashed" 'printf "%s" "$out" | grep -qi "nothing stashed"'
check "15 abort writes no entry" '[ "$(run list)" = "No stashed prompts" ]'
check "15 abort leaves no temp file" '[ -z "$(ls -A "$TMPDIR")" ]'
unset TMPDIR

echo "pstash: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
