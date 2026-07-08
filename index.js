#!/usr/bin/env node

/**
 * Module dependencies.
 */

const path = require('path');
const program = require('commander');
const { prompt } = require('inquirer');
const shell = require('./scripts/shell');

// install scripts
const { install_config, install_agents, install_devtools, install_apps } = require('./scripts/install');
const { write_figlet } = require('./scripts/figlet');
const { isWindows, getInstallChoices, getCompletionMessage } = require('./scripts/platform');
const { setDryRun, isDryRun, log, promptMessage, banner, finish } = require('./scripts/dry-run');

// run setup program
program
    .version('1.0.0', '-v, --version')
    .option('-a, --all', 'install everything supported on this platform')
    .option('-t, --devtools', 'install devtools only')
    .option('-d, --dry-run', 'preview prompts and actions without installing or changing files')
    .parse(process.argv);

async function runInstall(selection) {
    switch (selection) {
        case 'all':
            await install_config();
            await install_devtools();
            if (!isWindows) {
                await install_apps();
            }
            if (isWindows) {
                await install_agents();
            }
            break;
        case 'no-config':
            await install_devtools();
            if (!isWindows) {
                await install_apps();
            }
            break;
        case 'devtools-and-config':
            await install_config();
            await install_devtools();
            break;
        case 'devtools':
            await install_devtools();
            break;
        case 'apps':
            await install_apps();
            break;
        case 'agents':
            await install_agents();
            break;
        default:
            console.log('No install option selected.');
    }
}

(async () => {
    await write_figlet("TT's Workspace Setup");

    const opts = program.opts();
    setDryRun(opts.dryRun);
    banner();

    let selection = null;

    if (opts.all) {
        selection = 'all';
    } else if (opts.devtools) {
        selection = 'devtools';
    } else {
        selection = await choose_install();
    }

    await runInstall(selection);

    if (isDryRun()) {
        finish();
    } else {
        console.log("\n Complete! \n");
    }

    await keep();
})();

async function choose_install() {
    const choices = getInstallChoices();
    const previewChoices = choices.map((choice) => ({
        ...choice,
        name: choice.name.replace(/^Install /, 'Preview install ')
    }));

    const response = await prompt([
        {
            type: 'list',
            name: 'selection',
            message: isDryRun() ? promptMessage('What do you want to preview?') : 'What do you want to do?',
            choices: isDryRun() ? previewChoices : choices
        }
    ]);

    return response.selection;
}

async function keep() {
    const response = await prompt([
        {
            type: 'expand',
            message: promptMessage('Do you want to DELETE workspace-setup?'),
            name: 'selection',
            choices: isDryRun()
                ? [
                    {
                        key: 'Y',
                        name: 'Preview delete (no changes)',
                        value: 'delete'
                    },
                    {
                        key: 'n',
                        name: 'Keep',
                        value: 'keep'
                    }
                ]
                : [
                    {
                        key: 'Y',
                        name: 'Delete',
                        value: 'delete'
                    },
                    {
                        key: 'n',
                        name: 'Keep',
                        value: 'keep'
                    }
                ]
        }
    ]);

    if (response.selection === 'delete') {
        const repoDir = path.basename(process.cwd());
        if (isDryRun()) {
            log(`Would delete ${repoDir} from parent directory`);
            console.log(getCompletionMessage());
            return;
        }
        shell.cd('..');
        shell.rm('-rf', repoDir);
    } else {
        console.log(getCompletionMessage());
    }
}
