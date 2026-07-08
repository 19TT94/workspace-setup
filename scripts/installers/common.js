const shell = require('../shell');
const { isDryRun, log, PREFIX } = require('../dry-run');

function commandExists(command) {
    return shell.exec(command, { silent: true }).code === 0;
}

async function installIfMissing({ label, isInstalled, install, installed, exist, command }) {
    if (isInstalled()) {
        exist.push(label);
        if (isDryRun()) {
            log(`${label}: already installed`);
        }
        return;
    }

    if (isDryRun()) {
        log(command || `Would install ${label}`);
        installed.push(label);
        return;
    }

    await Promise.resolve(install());
    installed.push(label);
}

function logInstallSummary(installed, exist) {
    if (isDryRun()) {
        console.log(`${PREFIX} Summary (preview only):`);
        console.log('  Already installed (no action needed):');
        console.log(exist.length ? exist.map((item) => `    - ${item}`).join('\n') : '    (none)');
        console.log('  Would install:');
        console.log(installed.length ? installed.map((item) => `    - ${item}`).join('\n') : '    (none)');
        return;
    }

    console.log('already installed');
    console.log(exist);
    console.log('installed');
    console.log(installed);
}

module.exports = {
    commandExists,
    installIfMissing,
    logInstallSummary
};
