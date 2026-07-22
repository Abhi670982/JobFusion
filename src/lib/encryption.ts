import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;



/**
 * Get encryption key from environment.
 * Generates a derived key using scrypt.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_KEY || "default-encryption-key-change-in-production";
  return crypto.scryptSync(key, "salt", KEY_LENGTH);
}

/**
 * Encrypt a plain text API key securely for database storage.
 * Uses AES-256-GCM.
 */
export function encryptApiKey(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getEncryptionKey();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  return salt.toString("hex") + iv.toString("hex") + encrypted + tag.toString("hex");
}

/**
 * Decrypt an encrypted API key back to plain text.
 * Used internally by the AI Provider abstraction right before API calls.
 * Throws an error if decryption fails (e.g. invalid key or tampered data).
 */
export function decryptApiKey(encryptedText: string): string {
  try {
    const ivStart = SALT_LENGTH * 2;
    const ivEnd = (SALT_LENGTH + IV_LENGTH) * 2;
    const tagStart = encryptedText.length - (TAG_LENGTH * 2);
    
    const iv = Buffer.from(encryptedText.slice(ivStart, ivEnd), "hex");
    const encrypted = encryptedText.slice(ivEnd, tagStart);
    const tag = Buffer.from(encryptedText.slice(tagStart), "hex");
    
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt API key:", error);
    throw new Error("Failed to decrypt API key. Data may be corrupted or encryption key changed.");
  }
}
