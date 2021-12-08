# Cloud Storage Proxy

## Summary

This program enables you to store encrypted files with your cloud storage service that otherwise does not offer encryption.
In a sense it turns your unencrypted cloud storage service into an **end-to-end encrypted** service.

It does so by encrypting local files from a specified directory on your desktop computer and sending them to your (also local) directory that is being synchronized with your cloud storage service.

Likewise, it picks the files from that cloud storage directory, decrypts them, and writes them back to their original location.

Cloud Storage Proxy itself **does not connect** to the internet.
Everything is happening **locally** on your desktop computer.
Your cloud storage service only gets to work with **encrypted data**.

Cloud Storage Proxy uses _symmetric encryption_.
This means it uses the same key for encrypting and decrypting.

## Motivation

Cloud storage is extremely practical for various reasons.
However, using an unencrypted service exposes your data to your storage provider and all kinds of attackers.

Your cloud storage provider may promise you to not read your data, not give it to third parties, and only scan your data "to generate previews for the web interface."
In other words, your data's security is at your storage provider's mercy.
You have to trust them to protect your data and not snoop on it.

But how can you trust a for-profit business that is offering a service free of charge?
Remember, if the product is free, YOU are the product.

How can you trust a business that will gladly surrender your data to any three-letter-agency that asks for it?
After all, cloud storage centralizes lots of people's data to be conveniently probed by said agencies and other players of the mass-surveillance game.

The **most trustworthy** systems are systems that **don't require trust**.
By encrypting your data before uploading it to your cloud storage your data becomes worthless to anybody but you.
**No exception!**

Got nothing to hide?
Doesn't matter!

> What others don't need to know, they don't get to know.

Protect yourself **and the people you communicate with** by using more encryption products.

Make encryption the default.

## Installation

### Node.js

Cloud Storage Proxy is written in JavaScript which computers cannot run by default.
In order to enable your computer to run this program, Node.js must be installed first.
Cloud Storage Proxy was tested with Node.js version `16.8.0`.

https://nodejs.org/


### Download Cloud Storage Proxy

Download the source code either from the repository's _Releases_ page or directly from the code page.
Once downloaded, unzip it to a location of your choice.

Alternatively, you can of course use git to clone this repository to your local computer.

### Installing dependencies

Cloud Storage Proxy has some few dependencies that need to be downloaded before your can start.
Open a command line tool and navigate to the program's directory.

Run `npm install` to install these dependencies.
The `npm` command is available after you installed Node.js.

```shell
CloudStorageProxy> npm install
```

Installation complete.

## Usage

Cloud Storage Proxy is started from the command line using Node.js.
The program's entry point is `main.js`.

To get a list of available commands use the 'help' command.

```shell
CloudStorageProxy> node main -h
```

### Generate key

You need an encryption key for en- and decryption.
An empty key file `key.json` is provided with the rest of the program.
In the beginning, it should look like this:

```json
{
  "key": ""
}
```

Generate a new key with the following command.

```shell
node main -k
```

If a `key.json` file exists and has an empty `key` field, the command will write the new key to that file.
If no `key.json` file exists, a new one with a new key will be generated.

Alternatively, you can specify your own key if it is 32 bytes long and hex encoded.

If you need multiple keys, generate a key, rename `key.json` and generate another key.
Repeat as many times as you like.

#### Protect your keys

Your keys are the heart of your data security because anybody in possession of them is able to decrypt your data.

You might want to consider storing your keys in a **password manager** and only write them to the key files when needed.
Be mindful with more sophisticated text editors though.
Some can remember a file's change history.
This could potentially expose your keys to actors with access to your computer even though the current key files are empty.

A more practical and possibly safer approach to protect your keys is to move your key files to an **external storage device** that you can disconnect after usage.

After all, perfect security is very difficult to achieve because of the multitude of potential attack vectors.
Even your antivirus software could pose a threat if it scans all disk writes and possibly sends "suspicious" data home "for analysis."
You just have to _trust_ it that it doesn't.

Assess the threats you want to protect your data from and choose your countermeasures accordingly.

### Encrypt

_Note that you have to configure your directories first before you can start encrypting or decrypting.
See [Configuring directories](#configuring-directories) for details._

To encrypt your data in [`localSend`](#localsend) and send it to [`remote`](#remote) run the following command.

```shell
node main -e
```

Your folder structure will not be reflected in [`remote`](#remote).
Filenames will be hashed.

### Decrypt

To decrypt everything in [`remote`](#remote) and return it to [`localReceive`](#localreceive) run the following command.

```shell
node main -d
```

Folder structure and file stats, such as creation date and last modified date, will be restored.
Files that already exist in [`localReceive`](#localreceive) will be overwritten without warning.
Make sure you don't have any changes that you want to preserve.

### Configuring directories

Before you can start encrypting you need to specify the directory where Cloud Storage Proxy shall write the encrypted data to and the proxy directory that contains the unencrypted data.

Open the `config.json` file with a text editor.

You should see the following text.

```json
{
  "defaultKeyFile": "key.json",
  "directorySets": {
    "DEFAULT": {
      "localSend": "",
      "localReceive": "",
      "remote": ""
    }
  }
}
```

#### Fields

##### defaultKeyFile

`defaultKeyFile` points to the key file that is used for all en- and decryption.
It can be overridden for each directory set by specifying a `keyFile` field in the relevant directory set.
Can also be an array of paths where the key file can potentially be found.
See [Example](#example).

##### directorySets

`directorySets` contains all _directory sets_ and _directory set batches_.

[_Directory sets_](#named-directory-sets) define data sources and destinations as well as an optional `keyFile` when you want to use a key different from the `defaultKeyFile` for this set.

[_Directory set batches_](#directory-set-batches) are lists of _directory sets_.
These are useful when you want to process multiple _directory sets_ at once.

##### localSend

`localSend` is the proxy directory where you keep your unencrypted data.
When encrypting, all data from this directory is encrypted and sent to the `remote` directory.

Unencrypted files in this directory are NOT deleted by Cloud Storage Proxy.
You have to do it yourself if you wish to do so.

##### localReceive

`localReceive` is the directory that receives the files from `remote` after decrypting.
It can be identical to `localSend`.
The original folder structure of `localSend` will be rebuilt here automatically.

Note that Cloud Storage Proxy does not check for already existing files and will overwrite those that do exist without asking.
Use a directory other than `localSend` if you are uncomfortable with Cloud Storage Proxy writing directly into your main data source directory.
This could be particularly useful in the beginning while you are familiarizing yourself with its usage.

##### remote

`remote` specifies the directory your encrypted data is written to and read from.
This would be your synchronized cloud storage directory.
But it can be really any directory, e.g. an external storage device.

This directory must exist prior to running Cloud Storage Proxy.

#### Path notation

Make sure to specify your directory paths with forward slashes (`/`) as path separators.
Windows uses backslashes (`\`).
If you copy-and-paste a Windows path, you must replace the backslashes with forward slashes before running Cloud Storage Proxy.

```
invalid: c:\some\windows\path
correct: c:/some/windows/path
```

#### Absolute vs relative paths

Absolute paths provide a more predictable behaviour and are therefore recommended.
Relative paths resolve relative to `main.js`.
Oftentimes this allows for shorter notation but will yield different results depending on where Cloud Storage Proxy is located in your file system.

#### Named directory sets

You may specify multiple sets of directories for your local and remote data.
In `config.json`, add another object in `directorySets` next to `DEFAULT` using the same structure.
Give it a descriptive name.
This name is referred to from the command line.
Set the paths as you require.

Suppose you added a set called `photos` (details omitted for focus):

```json
{
  "directorySets": {
    "DEFAULT": {...},
    "photos": {...}
  }
}
```

To _encrypt_ the data specified in the `photos` set, you would run:

```shell
node main -e photos
```

`DEFAULT` is a special value and does not need to be specified on the command line.
So to _decrypt_ your data using to the `DEFAULT` set, you run:

```shell
node main -d
```

##### Overriding the default key

Each directory set can have an additional `keyFile` field.
It takes either a single path to a key file or an array of paths to potential locations of a key file.
When defined, data of that directory set will be en- and decrypted with this key instead of `defaultKeyFile`.

This can be useful when you share a `remote` directory with somebody else.
All participants would use the same key in this scenario.
Make sure you generate a new key and share it over a secure communication channel, e.g. https://wormhole.app/

Specifying an array of potential paths to the key file can be useful when you store your key file on an external storage device.
The drive letter assigned to the external storage device may differ with every reconnection.
By specifying the path to the storage device multiple times but with different drive letters, you can avoid the need to update your config file whenever your device receives a different drive letter.
E.g. `keyFile: ["e:/key.json", "f:/key.json", "g:/key.json"]`.

Remember to **never** share the key to your private data.
Different purpose, different key.

See [Example](#example) for usage.

##### Directory set batches

Encryption and decryption commands always refer to exactly one entry in `directorySets`.
If you have several directory sets defined, there may be times when you want to process multiple sets at once.

Directory set batches are defined under `directorySets`, too.
They have a name, like regular directory sets, that is referred to from the command line.
The batched directory sets are listed in an array.

_Note that batches cannot reference other batches!_

Here, `all` is a directory set batch:

```json
{
  "directorySets": {
    "DEFAULT": {...},
    "photos": {...},
    "all": ["DEFAULT", "photos"]
  }
}
```

On the command line you invoke a batch by its name just like you would with individual directory sets.

```shell
node main -e all
```

#### Example

An example `config.json`:

```json
{
  "defaultKeyFile": "key.json",
  "directorySets": {
    "DEFAULT": {
      "localSend": "D:/MyData/CloudDrive-Proxy",
      "localReceive": "D:/MyData/CloudDrive-Proxy",
      "remote": "D:/Programs/CloudDrive/Confidential"
    },
    "docs": {
      "keyFile": "key2.json",
      "localSend": "D:/MyData/Documents/send",
      "localReceive": "D:/MyData/Documents/receive",
      "remote": "D:/Programs/CloudDrive/docs"
    },
    "multipleKeyLocations": {
      "keyFile": ["E:/key.json", "F:/key.json"],
      "localSend": "D:/MyData/Documents/send",
      "localReceive": "D:/MyData/Documents/receive",
      "remote": "D:/Programs/CloudDrive/multi"
    },
    "all": ["DEFAULT", "docs", "multipleKeyLocations"]
  }
}
```

## Crypto Audits

Reviews for cryptographic soundness are more than welcome.
Please help make this program as secure as can be.
