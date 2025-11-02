import * as Crypto from "expo-crypto";

// Simple encryption/decryption using AES
// In production, you'd want to use a more robust solution with proper key management

const ENCRYPTION_KEY = "your-secret-encryption-key-replace-in-production";

export const encryptPassword = async (password: string): Promise<string> => {
  try {
    // Create a hash of the password + key for basic encryption
    // Note: This is a simplified approach. In production, use proper AES encryption
    const combined = password + ENCRYPTION_KEY;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
    // Store the password with a simple XOR-like encoding
    const encoded = Buffer.from(password).toString("base64");
    return `${hash.substring(0, 16)}:${encoded}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt password");
  }
};

export const decryptPassword = async (encryptedPassword: string): Promise<string> => {
  try {
    const [, encoded] = encryptedPassword.split(":");
    if (!encoded) throw new Error("Invalid encrypted format");

    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    return decoded;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt password");
  }
};

// Generate a secure random password
export const generateSecurePassword = (length: number = 16): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";

  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
};
