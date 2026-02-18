"use server";

/**
 * AES-256-GCM encryption for API keys stored in the database.
 * Uses Node.js built-in crypto module.
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("API_KEY_ENCRYPTION_SECRET must be set in .env");
  }
  // Try base64 first (preferred), fall back to utf-8
  const buf = Buffer.from(secret, "base64");
  if (buf.length >= 32) {
    return buf.subarray(0, 32);
  }
  // Fall back to raw UTF-8 bytes
  const utf8Buf = Buffer.from(secret, "utf-8");
  if (utf8Buf.length < 32) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET must decode to at least 32 bytes"
    );
  }
  return utf8Buf.subarray(0, 32);
}

/**
 * Encrypt a plaintext string. Returns a hex-encoded string: iv:ciphertext:authTag
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}

/**
 * Decrypt a string produced by encrypt().
 */
export async function decrypt(encryptedString: string): Promise<string> {
  const key = getEncryptionKey();
  const [ivHex, cipherHex, authTagHex] = encryptedString.split(":");

  if (!ivHex || !cipherHex || !authTagHex) {
    throw new Error("Invalid encrypted string format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
