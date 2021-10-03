# vNext


## Breaking

- Directory sets are no longer defined in the config root but in their own namespace `directorySets`.
- Data encrypted with prior versions can no longer be decrypted because it is not compressed. Before upgrading, decrypt all your data with the previous version, upgrade, and then re-encrypt it with this version.

## Features

- Key files can be specified in `config.json` through new fields `keyFile` and `defaultKeyFile`. Each directory set may specify its own key file.
- Data is compressed before encryption.
- Directory set batches. Configure multiple directory sets to run with a single command.


# 0.1.1

## Improvements

- Introduce named sets of encryption targets and origins in config
- Relative paths are resolved relative to `main.js`


# 0.1.0

## Features

- Encrypt local files in proxy folder and send them to remote folder
- Decrypt remote files and restore them in proxy folder
- Generate new keys
- Command Line Interface
