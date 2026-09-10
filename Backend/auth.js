import crypto from "crypto";
import { promisify } from "node:util";
import pool from "./db.js";

const COOKIE_NAME = "helpdesk_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

const readCookies = (header = "") => Object.fromEntries(
  header.split(";").map((part) => part.trim().split("=")).filter(([key]) => key)
    .map(([key, value]) => [key, decodeURIComponent(value || "")])
);

export async function initializeAuthSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash CHAR(64) PRIMARY KEY,
      user_id INT NOT NULL,
      role ENUM('admin', 'student') NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_auth_sessions_expiry (expires_at)
    )
  `);
  await pool.query("DELETE FROM auth_sessions WHERE expires_at <= NOW()");
}

export async function verifyPassword(hash, password) {
  if (typeof hash !== "string" || typeof password !== "string" || !password) return false;
  const match = /^\$(argon2id|argon2i|argon2d)\$v=19\$([^$]+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/.exec(hash);
  if (!match) return false;
  const parameters = Object.fromEntries(match[2].split(",").map((entry) => entry.split("=")));
  const memory = Number(parameters.m), passes = Number(parameters.t), parallelism = Number(parameters.p);
  if (![memory, passes, parallelism].every(Number.isSafeInteger) || parallelism < 1 || parallelism > 16 || passes < 1 || passes > 20 || memory < 8 * parallelism || memory > 262144) return false;
  const nonce = Buffer.from(match[3], "base64");
  const expected = Buffer.from(match[4], "base64");
  if (nonce.length < 8 || expected.length < 4 || expected.length > 128) return false;
  if (typeof crypto.argon2 !== "function") throw new Error("Password verification requires Node.js with built-in Argon2 support");
  const actual = await promisify(crypto.argon2)(match[1], {
    message: Buffer.from(password, "utf8"), nonce,
    parallelism, memory, passes, tagLength: expected.length
  });
  return crypto.timingSafeEqual(actual, expected);
}

export async function createSession(res, userId, role) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    "INSERT INTO auth_sessions (token_hash, user_id, role, expires_at) VALUES (?, ?, ?, ?)",
    [tokenHash(token), userId, role, expiresAt]
  );
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${secure}`
  );
}

export async function destroySession(req, res) {
  const token = readCookies(req.headers.cookie)[COOKIE_NAME];
  if (token) await pool.query("DELETE FROM auth_sessions WHERE token_hash = ?", [tokenHash(token)]);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

export async function authenticate(req, _res, next) {
  try {
    const token = readCookies(req.headers.cookie)[COOKIE_NAME];
    if (!token) return next();
    const [rows] = await pool.query(
      "SELECT user_id, role FROM auth_sessions WHERE token_hash = ? AND expires_at > NOW()",
      [tokenHash(token)]
    );
    if (rows[0]) req.auth = { id: rows[0].user_id, role: rows[0].role };
    next();
  } catch (error) {
    next(error);
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.auth) return res.status(401).json({ success: false, message: "Authentication required" });
  if (!roles.includes(req.auth.role)) return res.status(403).json({ success: false, message: "Access denied" });
  next();
};
