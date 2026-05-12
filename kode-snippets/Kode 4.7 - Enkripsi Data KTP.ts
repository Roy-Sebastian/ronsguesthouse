// Kode 4.7 - Potongan Kode Enkripsi Data KTP
// File: backend/src/utils/crypto.util.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Mengenkripsi nomor KTP menggunakan AES-256-GCM.
 * Format output: iv:encryptedData:authTag
 */
export function encryptKtp(text: string): string {
  const KEY = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Ukuran IV standar GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Membuat hash SHA-256 dari nomor KTP yang dinormalisasi.
 * Digunakan untuk pencarian tanpa membuka enkripsi.
 */
export function hashKtp(text: string): string {
  const normalized = text.replace(/\s+/g, '').trim().toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
