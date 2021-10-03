module.exports = init;


const fs = require(`fs`);
const path = require(`path`);
const { utimes } = require(`utimes`);
const zlib = require(`zlib`);


const algoVer = `001`;


async function init() {
    const { SodiumPlus, CryptographyKey } = require(`sodium-plus`);
    const sodium = await SodiumPlus.auto();

    return {
        encryptAll,
        decryptAll,
        generateKey,
        verifyKey,
    };


    async function encryptAll(keyHex, localBase, remoteBase) {
        const key = new CryptographyKey(await sodium.sodium_hex2bin(keyHex));

        await encryptFiles();


        async function encryptFiles(dirFromLocalBase = ``) {
            const dirFromLocalRoot = path.join(localBase, dirFromLocalBase);
            console.log(`Encrypting files in directory:`, dirFromLocalRoot);

            const dirEntries = fs.readdirSync(dirFromLocalRoot, { withFileTypes: true });

            for (const dirent of dirEntries.filter(dirent => dirent.isFile())) {
                const fileFromBase = path.join(dirFromLocalBase, dirent.name);

                console.log(`FILE:`, path.join(localBase, fileFromBase));
                await sendXChaCha({ localBase, remoteBase }, key, fileFromBase);
            }

            for (const dirent of dirEntries.filter(dirent => dirent.isDirectory())) {
                await encryptFiles(path.join(dirFromLocalBase, dirent.name));
            }
        }
    }

    async function decryptAll(keyHex, remoteBase, localBase) {
        const key = new CryptographyKey(await sodium.sodium_hex2bin(keyHex));
        const dirEntries = fs.readdirSync(remoteBase, { withFileTypes: true });

        for (const dirent of dirEntries) {
            if (!dirent.isFile()) {
                console.log(`ERROR - not a file:`, path.join(remoteBase, dirent.name));
                return;
            }

            console.log(`FILE:`, path.join(remoteBase, dirent.name));
            await receiveXChaCha({ remoteBase, localBase }, key, dirent.name);
        }
    }

    async function generateKey() {
        const key = await sodium.crypto_aead_xchacha20poly1305_ietf_keygen();
        return key.toString(`hex`);
    }

    function verifyKey(hexEncodedKey) {
        return new RegExp(`^[0-9a-f]{${sodium.CRYPTO_AEAD_CHACHA20POLY1305_IETF_KEYBYTES * 2}}$`, `i`).test(hexEncodedKey);
    }


    function sendXChaCha({ localBase, remoteBase }, key, fileFromBase) {
        return new Promise(async resolve => {
            const fullFilename = path.join(localBase, fileFromBase);

            const fileFromBaseBuf = Buffer.from(fileFromBase, `utf8`);
            const filenameLen = int16ToBuffer(fileFromBaseBuf.length);
            const filePlaintext = fs.readFileSync(fullFilename);
            const { birthtimeMs, atimeMs, mtimeMs } = fs.statSync(fullFilename);
            const statsBuf = Buffer.from(JSON.stringify({
                btime: Math.round(birthtimeMs),
                atime: Math.round(atimeMs),
                mtime: Math.round(mtimeMs),
            }), `utf8`);
            const statsLen = int16ToBuffer(statsBuf.length);

            const textToEncrypt = zlib.gzipSync(Buffer.concat([
                filenameLen,
                fileFromBaseBuf,
                statsLen,
                statsBuf,
                filePlaintext,
            ]));

            const nonce = await sodium.randombytes_buf(24);
            const { encKey, commitment } = await deriveKeys(key, nonce);

            const hashedFilename = await sodium.sodium_bin2hex(await sodium.crypto_generichash(fileFromBase));
            const remoteStream = fs.createWriteStream(path.join(remoteBase, hashedFilename));

            const aad = JSON.stringify({
                algoVer,
                nonce,
                hashedFilename,
            });

            const ciphertext = await sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(textToEncrypt, nonce, encKey, aad);

            remoteStream.write(algoVer);
            remoteStream.write(nonce);
            remoteStream.write(commitment);
            remoteStream.write(ciphertext);

            remoteStream.end(resolve);
        });
    }

    async function receiveXChaCha({ remoteBase, localBase }, key, remoteFile) {
        const content = fs.readFileSync(path.join(remoteBase, remoteFile));

        const ver = content.toString(`utf8`, 0, 3);

        if (ver !== algoVer) {
            console.log(`Invalid version in ${remoteFile}! Expected: ${algoVer} - Was: ${ver}`);
            return;
        }

        const nonce = content.slice(3, 27);
        const storedCommitment = content.slice(27, 59);
        const ciphertext = content.slice(59);

        const { encKey, commitment } = await deriveKeys(key, nonce);

        if (!await sodium.sodium_memcmp(storedCommitment, commitment)) {
            console.log(`ERROR - Invalid key commitment value in ${remoteFile}`);
            return;
        }

        const aad = JSON.stringify({
            algoVer: ver,
            nonce,
            hashedFilename: remoteFile,
        });

        try {
            let i = 0;
            const plaintext = zlib.gunzipSync(await sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(ciphertext, nonce, encKey, aad));
            const filenameLen = plaintext.readInt16LE(i);
            i += 2;
            const fileFromBase = plaintext.toString(`utf8`, i, i + filenameLen);
            i += filenameLen;
            const statsLen = plaintext.readInt16LE(i);
            i += 2;
            const stats = JSON.parse(plaintext.toString(`utf8`, i, i + statsLen));
            i += statsLen;
            const plainFileText = plaintext.slice(i);


            const fileFromRoot = path.join(localBase, fileFromBase);
            fs.mkdirSync(path.dirname(fileFromRoot), { recursive: true });
            fs.writeFileSync(fileFromRoot, plainFileText);
            utimes(fileFromRoot, stats);

            console.log(`Decrypted: ${fileFromRoot}`);
        } catch (e) {
            console.log(`ERROR - ${e.message}`);
        }
    }

    async function deriveKeys(key, nonce) {
        const encKey = new CryptographyKey(await sodium.crypto_generichash(
            Buffer.concat([Buffer.from([0x01]), nonce]),
            key
        ));
        const commitment = await sodium.crypto_generichash(
            Buffer.concat([Buffer.from([0x02]), nonce]),
            key
        );
        return { encKey, commitment };
    }
}


function int16ToBuffer(int) {
    const buf = Buffer.allocUnsafe(2);
    buf.writeInt16LE(int);
    return buf;
}
