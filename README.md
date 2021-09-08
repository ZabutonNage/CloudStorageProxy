# Cloud Storage Proxy

## Summary

This program enables you to store encrypted files with your cloud storage service that otherwise does not offer encryption.
In a sense it turns your unencrypted cloud storage service into an **end-to-end encrypted** service.

It does so by encrypting local files from a specified directory on your desktop computer and sending them to your directory that is being synchronized with your cloud storage service.

Likewise, it picks the files from your cloud storage directory, decrypts them, and writes them back to their original location.

Cloud Storage Proxy itself **does not connect** to the internet.
Everything is happening **locally** on your desktop computer.
Your cloud storage service only gets to work with **encrypted data**.

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
The program's main entry point is `main.js`.

To get a list of available commands use the 'help' command.

```shell
CloudStorageProxy> node main -h
```

### Generate key

Your key is read from the `key.json` file.
In the beginning, the file does not contain a key and should look like this:

```json
{
  "key": ""
}
```

Generate a new key with the following command.

```shell
node main -k
```

Alternatively, you can specify your own key if it is 32 bytes long and hex encoded.

#### Protect your key

Your key is the heart of your data security because anybody in possession of it is able to decrypt your data.

You might want to consider storing the key in a **password manager** and only write it into the key file when needed.  
Beware more sophisticated text editors, though, that remember a file's change history.
This could potentially expose your key even though the current file does not contain it.

Another thinkable way to protect your key is to move the key file to an **external storage device** that you can disconnect after usage.

After all, perfect security is very difficult to achieve because of the multitude of potential attack vectors.
Even your antivirus software could pose a threat if it scans all disk writes and possibly sends "suspicious" data home "for analysis."
You just have to _trust_ it that it doesn't.

Assess the threats you want to protect your data from and choose your countermeasures accordingly.

### Encrypt

_Note that you have to configure your directories first before you can start encrypting or decrypting.
See further below for details._

To encrypt your data in `localSend` and send it to `remote` run the following command.

```shell
node main -e
```

Your folder structure will not be reflected in `remote`.
Filenames will be hashed.

### Decrypt

To decrypt everything in `remote` and return it to `localReceive` run the following command.

```shell
node main -d
```

Folder structure and file stats, such as creation date and last modified date, will be restored.
Files that already exist in `localReceive` will be overwritten without warning.
Make sure you don't have any changes that you want to preserve.

### Configuring directories

Before you can start encrypting you need to specify the directory where Cloud Storage Proxy shall write the encrypted data to and the proxy directory that contains the unencrypted data.

Open the `config.json` file with a text editor.

You should see the following text.

```json
{
  "DEFAULT": {
    "localSend": "",
    "localReceive": "",
    "remote": ""
  }
}
```

#### Fields

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

While it is perfectly valid to specify relative paths, these will yield different results depending on the location you invoke `node main` from.
Absolute paths provide a more predictable behaviour and are therefore recommended.

#### Example

An example `config.json`:

```json
{
  "DEFAULT": {
    "localSend": "D:/MyData/CloudDrive-Proxy",
    "localReceive": "D:/MyData/CloudDrive-Proxy",
    "remote": "D:/Programs/CloudDrive/Confidential"
  }
}
```

## Crypto Audits

Reviews for cryptographic soundness are more than welcome.
Please help make this program as secure as can be.
