// Tests for scripts/merge-config.js: merging guard settings into existing
// agent config files without clobbering them. Run: node --test tests/

const test = require('node:test');
const assert = require('node:assert');
const { mergeJson, ensureTomlKeys, allowDenyOverlaps, parseTomlFragment } = require('../scripts/merge-config');

const fragment = {
    permissions: {
        defaultMode: 'bypassPermissions',
        ask: ['Bash(terraform apply *)', 'Bash(gh pr merge *)']
    },
    hooks: {
        PreToolUse: [
            { matcher: 'Bash', hooks: [{ type: 'command', command: '~/.claude/hooks/guard.py' }] }
        ]
    }
};

// 11. Existing keys are kept; guard entries are added without duplicates.
test('keeps existing settings and adds guard entries', () => {
    const existing = { theme: 'dark', permissions: { ask: ['Bash(gh pr merge *)'], allow: ['Bash(npm test)'] } };
    const merged = mergeJson(existing, fragment);
    assert.strictEqual(merged.theme, 'dark');
    assert.deepStrictEqual(merged.permissions.allow, ['Bash(npm test)']);
    assert.deepStrictEqual(merged.permissions.ask, ['Bash(gh pr merge *)', 'Bash(terraform apply *)']);
    assert.strictEqual(merged.permissions.defaultMode, 'bypassPermissions');
    assert.strictEqual(merged.hooks.PreToolUse.length, 1);
});

test('does not mutate the input objects', () => {
    const existing = { permissions: { ask: [] } };
    mergeJson(existing, fragment);
    assert.deepStrictEqual(existing, { permissions: { ask: [] } });
});

test('keeps an existing defaultMode the user chose', () => {
    const merged = mergeJson({ permissions: { defaultMode: 'acceptEdits' } }, fragment);
    assert.strictEqual(merged.permissions.defaultMode, 'acceptEdits');
});

// 12. Running the merge again changes nothing.
test('is idempotent', () => {
    const once = mergeJson({ theme: 'dark' }, fragment);
    const twice = mergeJson(once, fragment);
    assert.deepStrictEqual(twice, once);
});

test('adds a hook next to a different existing hook', () => {
    const existing = {
        hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: '~/bin/mine.sh' }] }] }
    };
    const merged = mergeJson(existing, fragment);
    const commands = merged.hooks.PreToolUse.flatMap((entry) => entry.hooks.map((h) => h.command));
    assert.deepStrictEqual(commands, ['~/bin/mine.sh', '~/.claude/hooks/guard.py']);
});

// 13. Cursor: allow list untouched, deny added, overlaps reported.
test('reports allow entries that a deny entry overrides', () => {
    const merged = mergeJson(
        { permissions: { allow: ['Shell(rm)', 'Shell(ls)'] } },
        { permissions: { deny: ['Shell(rm:-r*)', 'Shell(terraform:apply*)'] } }
    );
    assert.deepStrictEqual(merged.permissions.allow, ['Shell(rm)', 'Shell(ls)']);
    assert.deepStrictEqual(allowDenyOverlaps(merged.permissions), ['Shell(rm)']);
});

// 14. Codex config.toml: add missing keys, never change existing values.
test('adds missing top-level TOML keys before the first table', () => {
    const text = 'notify = ["x"]\n\n[plugins."a"]\nenabled = true\n';
    const result = ensureTomlKeys(text, { approval_policy: 'on-request', sandbox_mode: 'danger-full-access' });
    assert.strictEqual(
        result.text,
        'notify = ["x"]\napproval_policy = "on-request"\nsandbox_mode = "danger-full-access"\n\n[plugins."a"]\nenabled = true\n'
    );
    assert.deepStrictEqual(result.warnings, []);
});

test('leaves a differing TOML value alone and warns', () => {
    const text = 'approval_policy = "never"\n';
    const result = ensureTomlKeys(text, { approval_policy: 'on-request' });
    assert.strictEqual(result.text, text);
    assert.strictEqual(result.warnings.length, 1);
    assert.match(result.warnings[0], /approval_policy/);
});

test('is a no-op when TOML keys already match', () => {
    const text = 'approval_policy = "on-request"\n';
    const result = ensureTomlKeys(text, { approval_policy: 'on-request' });
    assert.strictEqual(result.text, text);
    assert.deepStrictEqual(result.warnings, []);
});

test('ignores same-named keys inside tables', () => {
    const text = '[profiles.ci]\napproval_policy = "never"\n';
    const result = ensureTomlKeys(text, { approval_policy: 'on-request' });
    assert.strictEqual(result.text, 'approval_policy = "on-request"\n[profiles.ci]\napproval_policy = "never"\n');
});

// Review fixes.
test('treats single-quoted or commented TOML values as equal', () => {
    for (const text of ["approval_policy = 'on-request'\n", 'approval_policy = "on-request" # guard\n']) {
        const result = ensureTomlKeys(text, { approval_policy: 'on-request' });
        assert.strictEqual(result.text, text);
        assert.deepStrictEqual(result.warnings, []);
    }
});

test('parses key = "value" lines from a TOML fragment, ignoring comments', () => {
    assert.deepStrictEqual(
        parseTomlFragment('# note\napproval_policy = "on-request"\nsandbox_mode = "danger-full-access"\n'),
        { approval_policy: 'on-request', sandbox_mode: 'danger-full-access' }
    );
});

test('does not add a hook already registered under another path form', () => {
    const home = require('os').homedir();
    const existing = {
        hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: `${home}/.claude/hooks/guard.py` }] }] }
    };
    assert.strictEqual(mergeJson(existing, fragment).hooks.PreToolUse.length, 1);
});
