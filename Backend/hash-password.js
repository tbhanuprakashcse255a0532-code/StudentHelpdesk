import crypto from "node:crypto";
import { promisify } from "node:util";

const argon2 = promisify(crypto.argon2);

const ARGON2_OPTIONS = {
  memory: 65536,
  passes: 3,
  parallelism: 4,
  tagLength: 32
};

function encodeBase64(value) {
  return value.toString("base64").replace(/=+$/, "");
}

export async function hashPassword(password) {

  // Validate password
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password is required");
  }

  // Generate random nonce
  const nonce = crypto.randomBytes(16);

  // Generate Argon2 password hash
  const tag = await argon2("argon2id", {
    message: Buffer.from(password),
    nonce,
    ...ARGON2_OPTIONS
  });

  // Convert values to Base64
  const encodedNonce = encodeBase64(nonce);
  const encodedTag = encodeBase64(tag);

  // Return Argon2 formatted password hash
  return `$argon2id$v=19$m=65536,t=3,p=4$${encodedNonce}$${encodedTag}`;
}