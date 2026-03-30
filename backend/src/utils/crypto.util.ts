import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export function getEncryptionKey(): Buffer {
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
export function encryptKtp(text: string): string {
  const KEY = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard GCM IV size
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a payload formatted as iv:encryptedData:authTag
 * Strictly checks the authentication tag to ensure integrity.
 */
export function decryptKtp(encryptedPayload: string): string | null {
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null; // Silent failure on corrupted data/tampering per GCM standard
  }
}

/**
 * Normalizes input and generates a deterministic SHA-256 hash.
 * This is used ONLY for strict equality lookups and deduplication without revealing the cleartext KTP.
 */
export function hashKtp(text: string): string {
  // Normalize: Trim, remove all whitespace, and uppercase
  const normalized = text.replace(/\s+/g, '').trim().toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
