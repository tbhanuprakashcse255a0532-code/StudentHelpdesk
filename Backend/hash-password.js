import crypto from "node:crypto";
import { promisify } from "node:util";

export async function hashPassword(password) {
  if (typeof password !== "string" || !password) throw new Error("Password is required");
  const nonce = crypto.randomBytes(16);
  const tag = await promisify(crypto.argon2)("argon2id", {
    message: Buffer.from(password), nonce, memory: 65536, passes: 3, parallelism: 4, tagLength: 32
  });
  const b64 = value => value.toString("base64").replace(/=+$/, "");
  return '$argon2id$v=19$m=65536,t=3,p=4$' + b64(nonce) + '$' + b64(tag);
}

