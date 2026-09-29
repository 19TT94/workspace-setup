const { execSync } = require('child_process');
const fs = require('fs');
const { isDryRun, log } = require('./dry-run');

/**
 * Dry run is default-deny. Every mutating helper in this module checks it, so a
 * call site that forgets its own isDryRun() guard logs a "Would ..." line
 * instead of touching the machine. Read-only helpers (execProbe, execCapture)
 * stay allowed so dry run can still report what is already installed.
 */
function blocked(description) {
    log(`Would ${description} (blocked by dry run)`);
    return { code: 0 };
}

function exec(command, options = {}) {
    if (isDryRun()) {
        return blocked(`run: ${command}`);
    }

    return run(command, options);
}

function run(command, options = {}) {
    const silent = options.silent ?? false;

    try {
        execSync(command, {
            stdio: silent ? 'pipe' : 'inherit',
            shell: true
        });
        return { code: 0 };
    } catch (error) {
        return { code: error.status ?? 1 };
    }
}

function execProbe(command) {
    return run(command, { silent: true });
}

function execCapture(command) {
    try {
        const stdout = execSync(command, {
            encoding: 'utf8',
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return { code: 0, stdout: stdout || '', stderr: '' };
    } catch (error) {
        return {
            code: error.status ?? 1,
            stdout: error.stdout ? error.stdout.toString() : '',
            stderr: error.stderr ? error.stderr.toString() : ''
        };
    }
}

function mkdir(...args) {
    const dir = args[0] === '-p' ? args[1] : args[0];

    if (isDryRun()) {
        return blocked(`create directory ${dir}`);
    }

    try {
        fs.mkdirSync(dir, { recursive: true });
        return { code: 0 };
    } catch (error) {
        return { code: 1 };
    }
}

function cp(...args) {
    const target = args[0] === '-r' ? args[2] : args[1];

    if (isDryRun()) {
        return blocked(`copy ${args[0] === '-r' ? args[1] : args[0]} -> ${target}`);
    }

    try {
        if (args[0] === '-r') {
            fs.cpSync(args[1], args[2], { recursive: true });
        } else {
            fs.copyFileSync(args[0], args[1]);
        }
        return { code: 0 };
    } catch (error) {
        return { code: 1 };
    }
}

function rm(...args) {
    const target = args[0] === '-rf' ? args[1] : args[0];

    if (isDryRun()) {
        return blocked(`remove ${target}`);
    }

    try {
        fs.rmSync(target, { recursive: true, force: true });
        return { code: 0 };
    } catch (error) {
        return { code: 1 };
    }
}

function cd(dir) {
    process.chdir(dir);
    return { code: 0 };
}

function ShellString(content) {
    return {
        toEnd(filePath) {
            if (isDryRun()) {
                return blocked(`append to ${filePath}`);
            }

            try {
                fs.appendFileSync(filePath, content, 'utf8');
                return { code: 0 };
            } catch (error) {
                return { code: 1 };
            }
        }
    };
}

module.exports = {
    exec,
    execProbe,
    execCapture,
    mkdir,
    cp,
    rm,
    cd,
    ShellString
};
