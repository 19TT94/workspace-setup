const fs = require('fs');
const path = require('path');
const shell = require('../shell');
const { homePath } = require('../platform');
const { isDryRun, log, PREFIX } = require('../dry-run');

function commandExists(command) {
    return shell.execProbe(command).code === 0;
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

// A Compose binary installed outside Docker Desktop only works as
// `docker compose` once its directory is listed in cliPluginsExtraDirs.
function addDockerCliPluginDir(pluginDir) {
    const configPath = homePath('.docker', 'config.json');
    let config = {};

    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.log(`Could not parse ${configPath}; add "${pluginDir}" to cliPluginsExtraDirs by hand.`);
            return;
        }
    }

    const dirs = Array.isArray(config.cliPluginsExtraDirs) ? config.cliPluginsExtraDirs : [];
    if (dirs.includes(pluginDir)) {
        return;
    }

    if (isDryRun()) {
        log(`Would add ${pluginDir} to cliPluginsExtraDirs in ${configPath} (blocked by dry run)`);
        return;
    }

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    config.cliPluginsExtraDirs = [...dirs, pluginDir];
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
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
    addDockerCliPluginDir,
    commandExists,
    installIfMissing,
    logInstallSummary
};
