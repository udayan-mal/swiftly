import nacl from 'tweetnacl';
import * as util from 'tweetnacl-util';

// 1. Generate KeyPair (Public + Secret)
export const generateKeyPair = () => {
    return nacl.box.keyPair();
};

// 2. Encode to Base64 (for transmission)
export const encodeKey = (key) => {
    return util.encodeBase64(key);
};

// 3. Decode from Base64
export const decodeKey = (keyString) => {
    return util.decodeBase64(keyString);
};

// 4. Compute Shared Secret (ECDH)
export const computeSharedSecret = (theirPublicKeyBase64, mySecretKey) => {
    const theirPublicKey = util.decodeBase64(theirPublicKeyBase64);
    // nacl.box.before computes the shared secret (precomputed key)
    return nacl.box.before(theirPublicKey, mySecretKey);
};

// 5. Encrypt Chunk
// Returns object: { encrypted: Base64String, nonce: Base64String }
export const encryptChunk = (chunkBase64, sharedSecret) => {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = util.decodeBase64(chunkBase64);

    const encryptedBox = nacl.secretbox(messageUint8, nonce, sharedSecret);

    return {
        encrypted: util.encodeBase64(encryptedBox),
        nonce: util.encodeBase64(nonce)
    };
};

// 6. Decrypt Chunk
// Returns: Base64String (original chunk) or null if failed
export const decryptChunk = (encryptedBase64, nonceBase64, sharedSecret) => {
    try {
        const box = util.decodeBase64(encryptedBase64);
        const nonce = util.decodeBase64(nonceBase64);

        const decrypted = nacl.secretbox.open(box, nonce, sharedSecret);

        if (!decrypted) return null;
        return util.encodeBase64(decrypted);
    } catch (e) {
        console.error('Decryption failed', e);
        return null;
    }
};
