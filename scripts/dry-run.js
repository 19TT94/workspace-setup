const PREFIX = '[dry-run]';

let enabled = false;

function setDryRun(value) {
    enabled = Boolean(value);
}

function isDryRun() {
    return enabled;
}

function log(message) {
    console.log(`${PREFIX} ${message}`);
}

function promptMessage(message) {
    return enabled ? `${PREFIX} (preview) ${message}` : message;
}

function banner() {
    if (!enabled) {
        return;
    }

    console.log('');
    console.log('============================================================');
    console.log('  DRY RUN — preview only. Nothing will be installed.');
    console.log('============================================================');
    console.log('');
    console.log('  Prompts still run so you can walk through the flow.');
    console.log('  Planned actions are logged as "Would ..." below.');
    console.log('');
}

function finish() {
    if (!enabled) {
        return;
    }

    console.log('');
    console.log(`${PREFIX} Dry run complete — no files, packages, or settings were changed.`);
    console.log('');
}

module.exports = {
    setDryRun,
    isDryRun,
    log,
    promptMessage,
    banner,
    finish,
    PREFIX
};
