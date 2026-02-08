/**
 * Shared cryptography utilities for encrypting/decrypting sensitive credentials
 * Uses AES-GCM encryption with the CREDENTIALS_ENCRYPTION_KEY environment variable
 */

const ENCRYPTION_PREFIX = "enc:";

/**
 * Encrypt a plaintext value using AES-GCM
 * Returns a base64-encoded encrypted string prefixed with "enc:"
 */
export async function encryptCredential(plaintext: string): Promise<string> {
  if (!plaintext || plaintext.trim() === "") {
    return plaintext;
  }

  const encryptionKey = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY");
  if (!encryptionKey) {
    console.warn("CREDENTIALS_ENCRYPTION_KEY not set, storing unencrypted");
    return plaintext;
  }

  try {
    // Derive a key from the encryption key string
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(encryptionKey),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(plaintext)
    );

    // Combine salt + iv + ciphertext and encode as base64
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    const base64 = btoa(String.fromCharCode(...combined));
    return ENCRYPTION_PREFIX + base64;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt credential");
  }
}

/**
 * Decrypt an encrypted value
 * Returns the original plaintext, or the input if not encrypted
 */
export async function decryptCredential(encryptedText: string): Promise<string> {
  if (!encryptedText || encryptedText.trim() === "") {
    return encryptedText;
  }

  // If not encrypted (no prefix), return as-is for backwards compatibility
  if (!encryptedText.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedText;
  }

  const encryptionKey = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY");
  if (!encryptionKey) {
    console.error("CREDENTIALS_ENCRYPTION_KEY not set, cannot decrypt");
    return "";
  }

  try {
    const base64 = encryptedText.slice(ENCRYPTION_PREFIX.length);
    const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    // Derive the same key
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(encryptionKey),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith(ENCRYPTION_PREFIX) || false;
}

/**
 * Decrypt multiple credential fields from a config object
 */
export async function decryptConfigCredentials(
  config: Record<string, any> | null,
  fieldsToDecrypt: string[]
): Promise<Record<string, any>> {
  if (!config) return {};

  const result: Record<string, any> = { ...config };

  for (const field of fieldsToDecrypt) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = await decryptCredential(result[field]);
    }
  }

  return result;
}
