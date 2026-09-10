import "dotenv/config";
import pool from "./db.js";
import { hashPassword } from "./hash-password.js";

try {
  const role = process.env.ACCOUNT_ROLE;
  const email = process.env.ACCOUNT_EMAIL;
  const password = process.env.ACCOUNT_PASSWORD;
  if (!["admin", "student"].includes(role) || !email || !password || password.length < 12) {
    throw new Error("Set ACCOUNT_ROLE (admin/student), ACCOUNT_EMAIL, and ACCOUNT_PASSWORD (12+ characters).");
  }
  const hash = await hashPassword(password);
  if (role === "admin") {
    await pool.query("INSERT INTO admins (email,password_hash) VALUES (?,?)", [email, hash]);
  } else {
    if (!process.env.ACCOUNT_BRANCH || !process.env.ACCOUNT_PIN) throw new Error("Student branch and PIN required");
    await pool.query("INSERT INTO students (name,email,password_hash,branch,pin_number) VALUES (?,?,?,?,?)",
      [process.env.ACCOUNT_NAME || "", email, hash, process.env.ACCOUNT_BRANCH, process.env.ACCOUNT_PIN]);
  }
  console.log("Account created:", role, email);
} finally { await pool.end(); }

