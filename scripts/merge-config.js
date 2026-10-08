// Merge seeded agent settings into config files the user already has, instead
// of overwriting them: ~/.claude/settings.json and ~/.cursor/cli-config.json
// (JSON) and ~/.codex/config.toml (top-level keys only).

const os = require('os');

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Compare hook commands by the path they run, so ~/x, $HOME/x and /Users/me/x match.
function hookCommands(entry) {
    return (entry.hooks || []).map((hook) => String(hook.command)
        .replace(/^~(?=\/)/, os.homedir())
        .replace(/^\$HOME(?=\/)/, os.homedir())
        .replace(/^"\$HOME"(?=\/)/, os.homedir()));
}

// Arrays are unioned (existing order first). Hook entries are deduplicated by
// their commands. Scalars the user already set win, so a chosen defaultMode or
// theme is never replaced.
function mergeJson(existing, fragment, key = '') {
    if (Array.isArray(existing) && Array.isArray(fragment)) {
        if (key === 'PreToolUse' || key === 'PostToolUse') {
            const seen = new Set(existing.flatMap(hookCommands));
            const added = fragment.filter((entry) => !hookCommands(entry).some((cmd) => seen.has(cmd)));
            return [...existing.map((e) => structuredClone(e)), ...added.map((e) => structuredClone(e))];
        }
        return [...existing, ...fragment.filter((item) => !existing.includes(item))];
    }
    if (isPlainObject(existing) && isPlainObject(fragment)) {
        const merged = structuredClone(existing);
        for (const [k, value] of Object.entries(fragment)) {
            merged[k] = k in existing ? mergeJson(existing[k], value, k) : structuredClone(value);
        }
        return merged;
    }
    return existing === undefined ? structuredClone(fragment) : existing;
}

// Cursor: deny wins over allow, so an allow entry for the same command base as
// a deny entry no longer auto-runs everything it used to. Report those.
function allowDenyOverlaps(permissions) {
    const base = (entry) => entry.replace(/^(\w+)\(([^:)]*).*$/, '$1($2)');
    const denied = new Set((permissions.deny || []).map(base));
    return (permissions.allow || []).filter((entry) => denied.has(base(entry)));
}

// The string value of a `key = "value"` / `key = 'value'` line, without a
// trailing comment.
function tomlValue(line) {
    const raw = line.slice(line.indexOf('=') + 1).trim();
    const quoted = raw.match(/^"([^"]*)"|^'([^']*)'/);
    return quoted ? (quoted[1] ?? quoted[2]) : raw.replace(/\s+#.*$/, '');
}

// Seed fragments for TOML files are plain `key = "value"` lines.
function parseTomlFragment(text) {
    const entries = {};
    for (const line of text.split('\n')) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"([^"]*)"\s*$/);
        if (match) {
            entries[match[1]] = match[2];
        }
    }
    return entries;
}

// Add `key = "value"` lines for missing top-level keys, before the first
// [table]. Existing values are never changed; a differing one is reported.
function ensureTomlKeys(text, entries) {
    const lines = text.split('\n');
    const firstTable = lines.findIndex((line) => /^\s*\[/.test(line));
    const topLevel = firstTable === -1 ? lines : lines.slice(0, firstTable);
    const warnings = [];
    const toAdd = [];

    for (const [key, value] of Object.entries(entries)) {
        const line = topLevel.find((l) => new RegExp(`^\\s*${key}\\s*=`).test(l));
        if (!line) {
            toAdd.push(`${key} = ${JSON.stringify(value)}`);
        } else if (tomlValue(line) !== value) {
            warnings.push(`${key} is already set (${line.trim()}); left unchanged, guard expects ${key} = ${JSON.stringify(value)}`);
        }
    }

    if (toAdd.length === 0) {
        return { text, warnings };
    }
    if (firstTable === -1) {
        const body = text.endsWith('\n') || text === '' ? text : `${text}\n`;
        return { text: `${body}${toAdd.join('\n')}\n`, warnings };
    }
    // Insert after the last non-blank top-level line, keeping the blank line
    // before the first table.
    let insertAt = firstTable;
    while (insertAt > 0 && lines[insertAt - 1].trim() === '') {
        insertAt--;
    }
    lines.splice(insertAt, 0, ...toAdd);
    return { text: lines.join('\n'), warnings };
}

module.exports = {
    mergeJson,
    allowDenyOverlaps,
    ensureTomlKeys,
    parseTomlFragment
};
