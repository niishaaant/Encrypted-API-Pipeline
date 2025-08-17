const express = require('express');
const forge = require('node-forge');

const app = express();
app.use(express.json());

const rsa = forge.pki.rsa;
const keyPair = rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
const privateKey = keyPair.privateKey;
const publicKey = keyPair.publicKey;

const keyId = '2025-08-17';
const privateKeys = {
    [keyId]: privateKey
};

app.get('/public-key', (req, res) => {
    res.json({ keyId, publicKey: forge.pki.publicKeyToPem(publicKey) });
});

app.post('/secure', (req, res) => {
    const { keyId, encryptedKey, iv, payload, tag } = req.body;

    try {
        const privateKey = privateKeys[keyId];
        if (!privateKey) {
            return res.status(400).send('Invalid keyId');
        }

        const aesKey = privateKey.decrypt(forge.util.decode64(encryptedKey), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        });

        const decipher = forge.cipher.createDecipher('AES-GCM', aesKey);
        decipher.start({ iv: forge.util.decode64(iv) });
        decipher.update(forge.util.createBuffer(forge.util.decode64(payload)));
        const result = decipher.finish(forge.util.decode64(tag));

        if (!result) {
            return res.status(400).send('Decryption failed');
        }

        const decryptedPayload = JSON.parse(decipher.output.toString());
        console.log('Decrypted payload:', decryptedPayload);

        const responsePayload = { message: 'Hello from the integration service!', originalPayload: decryptedPayload };
        const responseIv = forge.random.getBytesSync(12);
        const cipher = forge.cipher.createCipher('AES-GCM', aesKey);
        cipher.start({ iv: responseIv });
        cipher.update(forge.util.createBuffer(JSON.stringify(responsePayload), 'utf8'));
        cipher.finish();
        const responseTag = forge.util.encode64(cipher.tag.getBytes());

        res.json({
            iv: forge.util.encode64(responseIv),
            payload: forge.util.encode64(cipher.output.getBytes()),
            tag: responseTag
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

app.get('/secure', (req, res) => {
    const { keyId, encryptedKey, iv } = req.query;

    try {
        const privateKey = privateKeys[keyId];
        if (!privateKey) {
            return res.status(400).send('Invalid keyId');
        }

        const aesKey = privateKey.decrypt(forge.util.decode64(encryptedKey), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        });

        const responsePayload = { message: 'This is a secure GET response' };
        const responseIv = forge.random.getBytesSync(12);
        const cipher = forge.cipher.createCipher('AES-GCM', aesKey);
        cipher.start({ iv: responseIv });
        cipher.update(forge.util.createBuffer(JSON.stringify(responsePayload), 'utf8'));
        cipher.finish();
        const responseTag = forge.util.encode64(cipher.tag.getBytes());

        res.json({
            iv: forge.util.encode64(responseIv),
            payload: forge.util.encode64(cipher.output.getBytes()),
            tag: responseTag
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

const port = 3002;
app.listen(port, () => {
    console.log(`Integration service listening at http://localhost:${port}`);
});
