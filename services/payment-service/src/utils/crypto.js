const crypto = require("crypto");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = crypto.scryptSync(env.security.bankEncryptionSecret, "payment-bank-salt", 32);

/**
 * Encrypts a plain-text routing string using authenticated AES-256-GCM
 */
function encryptSensitiveString(plainText) {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a cryptographically locked ciphertext block back into its plain-text representation
 */
function decryptSensitiveString(cipherText) {
  if (!cipherText) return cipherText;
  try {
    const [ivHex, authTagHex, encryptedHex] = cipherText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    throw new ApiError(500, "Cryptographic failure: Unable to decode sensitive data payloads safely.");
  }
}

module.exports = { encryptSensitiveString, decryptSensitiveString };
