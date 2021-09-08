const operation = process.argv[2];

const cmdOpts = Object.freeze({
    encrypt: `-e`,
    decrypt: `-d`,
    generateKey: `-k`,
    version: `-v`,
    help: `-h`,
});

const cmdOptsVals = Array.from(Object.values(cmdOpts));


if (!cmdOptsVals.includes(operation)) {
    console.log(`Unknown option: ${operation}`);
    printHelp();
    return process.exit(1);
}


const keyFile = `key.json`;
const keyFileAbs = toAbsolutePath(keyFile);
const keyInfo = require(keyFileAbs);
const dirs = require(`./config.json`);


require(`./dencryption`)().then(den => {
    if (operation === cmdOpts.encrypt) {
        if (!den.verifyKey(keyInfo.key)) {
            return console.log(`Specified key in ${keyFile} is invalid.`);
        }
        const dirCfg = dirs[dirCfgParamFromArgs()];
        den.encryptAll(keyInfo.key, toAbsolutePath(dirCfg.localSend), toAbsolutePath(dirCfg.remote));
    }
    else if (operation === cmdOpts.decrypt) {
        if (!den.verifyKey(keyInfo.key)) {
            return console.log(`Specified key in ${keyFile} is invalid.`);
        }
        const dirCfg = dirs[dirCfgParamFromArgs()];
        den.decryptAll(keyInfo.key, toAbsolutePath(dirCfg.remote), toAbsolutePath(dirCfg.localReceive));
    }
    else if (operation === cmdOpts.generateKey) {
        tryGenerateKey(keyInfo);
    }
    else if (operation === cmdOpts.help) {
        printHelp();
    }
    else if (operation === cmdOpts.version) {
        console.log(require(`./package.json`).version);
    }
    else {
        console.log(`This message should never be displayed. Apparently '${operation}' was forgotten to implement.`);
        printHelp();
    }


    function tryGenerateKey(keyInfo) {
        if (keyInfo.key) {
            return console.log(`Key already specified. If you want to generate a new key, you must first empty the 'key' field in the file '${keyFile}'.`);
        }
        if (!keyInfo.hasOwnProperty(`key`)) {
            return console.log(`'key' field not found. Key file '${keyFile}' must have a 'key' field with an empty string value { "key": "" }.`);
        }
        den.generateKey().then(key => {
            keyInfo.key = key;
            require(`fs`).writeFileSync(keyFileAbs, JSON.stringify(keyInfo, undefined, 2));
            console.log(`New secret key successfully written to '${keyFile}'.`);
        });
    }
});


function printHelp() {
    console.log(formatCmd(cmdOpts.encrypt + ` [<path-set>]`, 19, `Encrypt files. Optionally specify set of directories from config`));
    console.log(formatCmd(cmdOpts.decrypt + ` [<path-set>]`, 19, `Decrypt files. Optionally specify set of directories from config`));
    console.log(formatCmd(cmdOpts.generateKey, 19, `Generate new secret key`));
    console.log(formatCmd(cmdOpts.version, 19, `Display version`));
    console.log(formatCmd(cmdOpts.help, 19, `Print this help`));

    function formatCmd(cmd, padding, msg) {
        return ` ` + cmd.padEnd(padding, ` `) + msg;
    }
}

function dirCfgParamFromArgs() {
    return process.argv[3] || `DEFAULT`;
}

function toAbsolutePath(p) {
    const path = require(`path`);
    return path.isAbsolute(p)
        ? p
        : path.join(module.path, p);
}
