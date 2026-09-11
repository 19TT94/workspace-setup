const { execSync } = require('child_process');
const fs = require('fs');

function exec(command, options = {}) {
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

    try {
        fs.mkdirSync(dir, { recursive: true });
        return { code: 0 };
    } catch (error) {
        return { code: 1 };
    }
}

function cp(...args) {
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
    execCapture,
    mkdir,
    cp,
    rm,
    cd,
    ShellString
};
