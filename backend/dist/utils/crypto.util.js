"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEncryptionKey = getEncryptionKey;
exports.encryptKtp = encryptKtp;
exports.decryptKtp = decryptKtp;
exports.hashKtp = hashKtp;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
function getEncryptionKey() {
    const base64Key = process.env.KTP_ENCRYPTION_KEY;
    if (!base64Key) {
        throw new Error('KTP_ENCRYPTION_KEY is missing from environment variables');
    }
    const keyBuffer = Buffer.from(base64Key, 'base64');
    if (keyBuffer.length !== 32) {
        throw new Error('KTP_ENCRYPTION_KEY must be exactly 32 bytes (256-bit) when decoded from base64');
    }
    return keyBuffer;
}
/**
 * Encrypts a string using AES-256-GCM
 * Returns payload formatted as: iv:encryptedData:authTag
 */
function encryptKtp(text) {
    const KEY = getEncryptionKey();
    const iv = crypto_1.default.randomBytes(12); // Standard GCM IV size
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}
/**
 * Decrypts a payload formatted as iv:encryptedData:authTag
 * Strictly checks the authentication tag to ensure integrity.
 */
function decryptKtp(encryptedPayload) {
    try {
        const parts = encryptedPayload.split(':');
        if (parts.length !== 3)
            return null;
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const authTag = Buffer.from(parts[2], 'hex');
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        return null; // Silent failure on corrupted data/tampering per GCM standard
    }
}
/**
 * Normalizes input and generates a deterministic SHA-256 hash.
 * This is used ONLY for strict equality lookups and deduplication without revealing the cleartext KTP.
 */
function hashKtp(text) {
    // Normalize: Trim, remove all whitespace, and uppercase
    const normalized = text.replace(/\s+/g, '').trim().toUpperCase();
    return crypto_1.default.createHash('sha256').update(normalized).digest('hex');
}
