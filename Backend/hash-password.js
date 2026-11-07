import crypto from "node:crypto";
import { promisify } from "node:util";

const generateHash = promisify(crypto.argon2);

const toBase64 = (data) =>
  data.toString("base64").replace(/=+$/, "");

export async function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required");
  }

  const salt = crypto.randomBytes(16);

  const parameters = {
    message: Buffer.from(password),
    nonce: salt,
    memory: 65536,
    passes: 3,
    parallelism: 4,
    tagLength: 32
  };

  const hash = await generateHash("argon2id", parameters);

  const saltValue = toBase64(salt);
  const hashValue = toBase64(hash);

  const result = [
    "$argon2id$v=19$m=65536,t=3,p=4",
    saltValue,
    hashValue
  ].join("$");

  return result;
}