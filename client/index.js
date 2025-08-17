const axios = require('axios');
const forge = require('node-forge');

const bffUrl = 'http://localhost:3001';

async function run() {
    try {
        // 1. Fetch public key
        const { data: { keyId, publicKey: publicKeyPem } } = await axios.get(`${bffUrl}/public-key`);
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

        // 2. Generate AES key and IV
        const aesKey = forge.random.getBytesSync(32);
        const iv = forge.random.getBytesSync(12);

        // 3. Encrypt payload with AES
        const payload = { message: 'This is a secret message' };
        const cipher = forge.cipher.createCipher('AES-GCM', aesKey);
        cipher.start({ iv });
        cipher.update(forge.util.createBuffer(JSON.stringify(payload), 'utf8'));
        cipher.finish();
        const encryptedPayload = forge.util.encode64(cipher.output.getBytes());
        const tag = forge.util.encode64(cipher.tag.getBytes());

        // 4. Encrypt AES key with RSA
        const encryptedKey = forge.util.encode64(publicKey.encrypt(aesKey, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        }));

        // 5. Send secure POST request
        console.log('--- Sending POST request ---');
        const { data: postResponse } = await axios.post(`${bffUrl}/secure`, {
            keyId,
            encryptedKey,
            iv: forge.util.encode64(iv),
            payload: encryptedPayload,
            tag
        });

        // 6. Decrypt POST response
        const postDecipher = forge.cipher.createDecipher('AES-GCM', aesKey);
        postDecipher.start({ iv: forge.util.decode64(postResponse.iv) });
        postDecipher.update(forge.util.createBuffer(forge.util.decode64(postResponse.payload)));
        const postResult = postDecipher.finish(forge.util.decode64(postResponse.tag));
        if (postResult) {
            const decryptedPostResponse = JSON.parse(postDecipher.output.toString());
            console.log('Decrypted POST response:', decryptedPostResponse);
        } else {
            console.log('POST response decryption failed.');
        }


        // 7. Send secure GET request
        console.log('\n--- Sending GET request ---');
        const { data: getResponse } = await axios.get(`${bffUrl}/secure`, {
            params: {
                keyId,
                encryptedKey,
                iv: forge.util.encode64(iv)
            }
        });

        // 8. Decrypt GET response
        const getDecipher = forge.cipher.createDecipher('AES-GCM', aesKey);
        getDecipher.start({ iv: forge.util.decode64(getResponse.iv) });
        getDecipher.update(forge.util.createBuffer(forge.util.decode64(getResponse.payload)));
        const getResult = getDecipher.finish(forge.util.decode64(getResponse.tag));
        if (getResult) {
            const decryptedGetResponse = JSON.parse(getDecipher.output.toString());
            console.log('Decrypted GET response:', decryptedGetResponse);
        } else {
            console.log('GET response decryption failed.');
        }

    } catch (error) {
        console.error('An error occurred:', error.response ? error.response.data : error.message);
    }
}

run();