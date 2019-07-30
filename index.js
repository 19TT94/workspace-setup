#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const inquirer = require('inquirer');
const { prompt } = require('inquirer');
const shell = require('shelljs');
const fs = require("fs");
const ora = require('ora');
const spinner = ora('spinning');

// install scripts
const { install_config, install_devtools, install_apps } = require('./scripts/install');
const { write_figlet } = require('./scripts/figlet');

// run setup program
program
    .version('1.0.0', '-v, --version')
    .option('-a, --all', 'add everything')
    .option('-t, --devtools', 'tools only')
    .parse(process.argv);

// async function to wait for response from user
(async () => {
    await write_figlet("TT's Workspace Setup");

    let response = null;
    setTimeout(async () => {

        response = await choose_install();

        if (response === 'install everthing.') {
            await install_config();
            await install_devtools();
            await install_apps();
        }

        if (response === 'install everything except the configuration files (.bash_profile, .nvm ...).') {
            await install_devtools();
            await install_apps();
        }

        if (response === 'install devtools and configuration files (no extra apps).') {
            await install_config();
            await install_devtools();
        }

        if (response === 'install devtools only (node, npm, nvm, ember, vue, ...).') {
            await install_devtools();
        }

        if (response === 'install apps only (slack, atom, vscode, sequel-pro ...).') {
            await install_apps();
        }

        console.log("\n Complete!");

    }, 1000);
})()

async function choose_install() {
    const response = await prompt([
        {
            type: 'list',
            name: 'selection',
            message: 'What do you want to do?',
            choices: [
                'install everthing.',
                'install everything except the configuration files (.bash_profile, .nvm ...).',
                'install devtools and configuration files (no extra apps).',
                'install devtools only (node, npm, nvm, ember, vue, ...).',
                'install apps only (slack, atom, vscode, sequel-pro ...).'
            ]
        }
    ]);

    return response.selection;
}
