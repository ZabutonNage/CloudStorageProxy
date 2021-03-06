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


const config = require(`./config.json`);

const fallbackKeyFile = `key.json`;
const defaultKeyFile = config.defaultKeyFile || fallbackKeyFile;


if (operation === cmdOpts.encrypt || operation === cmdOpts.decrypt) {
    dencrypt(config, operation);
}
else if (operation === cmdOpts.generateKey) {
    tryGenerateKey(fallbackKeyFile);
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


function dencrypt(config, operation) {
    const potentialDirSet = config.directorySets[dirSetParamFromArgs()];
    const dirSets = Array.isArray(potentialDirSet)
        ? potentialDirSet.map(dset => config.directorySets[dset])
        : [potentialDirSet];

    require(`./dencryption`)().then(async den => {
        const keyInfoCache = new Map();

        for (const dirSet of dirSets) {
            const keyFiles = dirSet.hasOwnProperty(`keyFile`)
                ? getKeyFiles(dirSet.keyFile)
                : getKeyFiles(defaultKeyFile);

            const { keyFile, keyInfo } = findKeyInfo(keyFiles, keyInfoCache);

            if (!keyFile) {
                return console.log(`No key file found!`);
            }

            console.log(`Using key ${keyFile}`);

            if (operation === cmdOpts.encrypt) {
                await den.encryptAll(keyInfo.key, toAbsolutePath(dirSet.localSend), toAbsolutePath(dirSet.remote));
            } else {
                await den.decryptAll(keyInfo.key, toAbsolutePath(dirSet.remote), toAbsolutePath(dirSet.localReceive));
            }
        }

        function getKeyFiles(strOrArray) {
            if (Array.isArray(strOrArray)) return strOrArray;
            return strOrArray && typeof strOrArray === `string`
                ? [strOrArray]
                : undefined;
        }
        function findKeyInfo(keyFiles, keyInfoCache) {
            const cachedKeyFile = keyFiles.find(kf => keyInfoCache.has(kf));

            if (cachedKeyFile) return {
                keyFile: cachedKeyFile,
                keyInfo: keyInfoCache.get(cachedKeyFile),
            };

            const fs = require(`fs`);

            for (const keyFile of keyFiles) {
                if (fs.existsSync(keyFile)) {
                    const keyInfo = keyInfoFromDisk(keyFile);

                    if (den.verifyKey(keyInfo.key)) {
                        keyInfoCache.set(keyFile, keyInfo);
                        return { keyFile, keyInfo };
                    }
                    console.log(`Specified key in ${keyFile} is invalid.`);
                }
            }
            return {};
        }
    });
}

function tryGenerateKey(keyFile) {
    const keyInfo = keyInfoFromDiskOrEmpty(keyFile);

    if (keyInfo.key) {
        return console.log(`Key already specified. If you want to generate a new key, you must first empty the 'key' field in the file '${keyFile}' or specify a filename that doesn't exist yet.`);
    }
    if (!keyInfo.hasOwnProperty(`key`)) {
        return console.log(`'key' field not found. Key file '${keyFile}' must have a 'key' field with an empty string value { "key": "" }.`);
    }
    require(`./dencryption`)().then(den => {
        den.generateKey().then(key => {
            keyInfo.key = key;
            require(`fs`).writeFileSync(toAbsolutePath(keyFile), JSON.stringify(keyInfo, undefined, 2));
            console.log(`New secret key successfully written to '${keyFile}'.`);
        });
    });
}


function printHelp() {
    const padding = 24;

    console.log(formatCmd(cmdOpts.encrypt + ` [<directory-set>]`, padding, `Encrypt files. Optionally specify set of directories from config`));
    console.log(formatCmd(cmdOpts.decrypt + ` [<directory-set>]`, padding, `Decrypt files. Optionally specify set of directories from config`));
    console.log(formatCmd(cmdOpts.generateKey, padding, `Generate new secret key`));
    console.log(formatCmd(cmdOpts.version, padding, `Display version`));
    console.log(formatCmd(cmdOpts.help, padding, `Print this help`));

    function formatCmd(cmd, padding, msg) {
        return ` ` + cmd.padEnd(padding, ` `) + msg;
    }
}

function dirSetParamFromArgs() {
    return process.argv[3] || `DEFAULT`;
}

function keyInfoFromDisk(keyFile) {
    return require(toAbsolutePath(keyFile));
}

function keyInfoFromDiskOrEmpty(keyFile) {
    try {
        return keyInfoFromDisk(keyFile);
    }
    catch {
        return { key: `` };
    }
}

function toAbsolutePath(p) {
    const path = require(`path`);
    return path.isAbsolute(p)
        ? p
        : path.join(module.path, p);
}
