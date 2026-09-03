// Crypto utilities for web
// Adapted from mobile app's crypto.ts

// Encryption key (same as mobile app)
const ENCRYPTION_KEY = '12345678901234567890123456789012';

/**
 * Converts string to Uint8Array using TextEncoder (UTF-8)
 */
function stringToBytes(str: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

/**
 * Converts Uint8Array to string using TextDecoder (UTF-8)
 */
function bytesToString(bytes: Uint8Array): string {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
}

/**
 * Converts base64 to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    // Remove padding and whitespace
    base64 = base64.replace(/[=\s]/g, '');

    const length = base64.length;
    const bufferLength = Math.floor((length * 3) / 4);
    const bytes = new Uint8Array(bufferLength);

    let p = 0;
    for (let i = 0; i < length; i += 4) {
        const a = chars.indexOf(base64[i] || 'A');
        const b = chars.indexOf(base64[i + 1] || 'A');
        const c = i + 2 < length ? chars.indexOf(base64[i + 2]) : 0;
        const d = i + 3 < length ? chars.indexOf(base64[i + 3]) : 0;

        if (p < bufferLength) bytes[p++] = (a << 2) | (b >> 4);
        if (p < bufferLength) bytes[p++] = ((b & 15) << 4) | (c >> 2);
        if (p < bufferLength) bytes[p++] = ((c & 3) << 6) | d;
    }

    return bytes;
}

/**
 * XOR encryption/decryption with bytes
 */
function xorEncryptBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        result[i] = data[i] ^ key[i % key.length];
    }
    return result;
}

/**
 * Decrypts text encrypted with the mobile app's encrypt function
 * @param encryptedText - Encrypted text in format iv:base64
 * @returns Decrypted text
 */
export async function decrypt(encryptedText: string): Promise<string> {
    try {
        const parts = encryptedText.split(':');
        if (parts.length < 2) {
            throw new Error('Invalid encrypted format');
        }

        const iv = parts[0];
        const encryptedBase64 = parts.slice(1).join(':');

        // Create combined key
        const keyBytes = stringToBytes(ENCRYPTION_KEY + iv);

        // Decode base64
        const encryptedBytes = base64ToBytes(encryptedBase64);

        // XOR decrypt (symmetric)
        const decryptedBytes = xorEncryptBytes(encryptedBytes, keyBytes);

        // Convert back to string
        return bytesToString(decryptedBytes);
    } catch (error) {
        console.error('Error decrypting:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Hashes a string using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
