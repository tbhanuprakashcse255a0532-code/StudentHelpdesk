import "dotenv/config";
import { hashPassword } from "./hash-password.js";
import pool from "./db.js";

async function columnExists(table, column) {
  const [rows] = await pool.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?",
    [process.env.DB_NAME, table, column]
  );
  return rows.length > 0;
}

async function migrateTable(table) {
  if (!(await columnExists(table, "password_hash"))) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN password_hash VARCHAR(255) NULL AFTER password`);
  }
  await pool.query(`ALTER TABLE \`${table}\` MODIFY password VARCHAR(255) NULL`);
  const [users] = await pool.query(
    `SELECT id, password FROM \`${table}\` WHERE password_hash IS NULL AND password IS NOT NULL AND password != ''`
  );
  for (const user of users) {
    const hash = await hashPassword(user.password);
    await pool.query(`UPDATE \`${table}\` SET password_hash = ?, password = NULL WHERE id = ?`, [hash, user.id]);
  }
  console.log(`${table}: migrated ${users.length} password(s)`);
}

try {
  await migrateTable("admins");
  await migrateTable("students");
  const [constraints] = await pool.query(
    "SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = 'event_registrations' AND index_name = 'uq_event_student'",
    [process.env.DB_NAME]
  );
  if (constraints.length === 0) {
    await pool.query("ALTER TABLE event_registrations ADD CONSTRAINT uq_event_student UNIQUE (event_id, student_id)");
  }
  console.log("Password migration complete. Plain-text password values were cleared.");
} finally {
  await pool.end();
}
