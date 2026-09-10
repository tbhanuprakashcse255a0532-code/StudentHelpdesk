import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { execFile } from "child_process";
import pool from "./db.js";
import {
  authenticate,
  createSession,
  destroySession,
  initializeAuthSchema,
  requireRole,
  verifyPassword
} from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

/* ---------------- FOLDERS ---------------- */
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/* ---------------- MULTER ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${base}${extension}`;
    cb(null, safeName);
  }
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, allowedMimeTypes.has(file.mimetype))
});

/* ---------------- MIDDLEWARE ---------------- */
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use("/uploads", express.static(uploadsDir));
app.use(authenticate);

const rateBuckets = new Map();
const rateLimit = ({ windowMs, max }) => (req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > max) return res.status(429).json({ message: "Too many requests. Try again later." });
  next();
};

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const chatLimit = rateLimit({ windowMs: 60 * 1000, max: 20 });

app.get("/", (req, res) => {
  res.send("Backend running");
});

/* =========================================================
   AUTH
========================================================= */

app.post("/api/admin/login", loginLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query("SELECT id, email, password_hash FROM admins WHERE email = ?", [email]);

    if (rows.length === 0 || !(await verifyPassword(rows[0].password_hash, password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials"
      });
    }

    await createSession(res, rows[0].id, "admin");
    res.json({
      success: true,
      user: {
        id: rows[0].id,
        role: "admin",
        email: rows[0].email
      }
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.post("/api/student/login", loginLimit, async (req, res) => {
  try {
    const { email, password, branch, pinNumber } = req.body;

    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, branch, pin_number FROM students WHERE email = ? AND branch = ? AND pin_number = ?",
      [email, branch, pinNumber]
    );

    if (rows.length === 0 || !(await verifyPassword(rows[0].password_hash, password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid student credentials"
      });
    }

    await createSession(res, rows[0].id, "student");
    res.json({
      success: true,
      user: {
        id: rows[0].id,
        role: "student",
        name: rows[0].name || "",
        email: rows[0].email,
        branch: rows[0].branch,
        pinNumber: rows[0].pin_number
      }
    });
  } catch (error) {
    console.error("STUDENT LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.get("/api/auth/me", async (req, res) => {
  if (!req.auth) return res.status(401).json({ success: false });
  const table = req.auth.role === "admin" ? "admins" : "students";
  const fields = req.auth.role === "admin" ? "id, email" : "id, name, email, branch, pin_number";
  const [rows] = await pool.query(`SELECT ${fields} FROM ${table} WHERE id = ?`, [req.auth.id]);
  if (!rows[0]) return res.status(401).json({ success: false });
  const user = { ...rows[0], role: req.auth.role };
  if (user.pin_number) { user.pinNumber = user.pin_number; delete user.pin_number; }
  res.json({ success: true, user });
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    await destroySession(req, res);
    res.json({ success: true });
  } catch (error) { next(error); }
});

/* =========================================================
   EVENTS
========================================================= */

app.get("/api/events", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.*,
        (
          SELECT pd.file_name
          FROM pdf_documents pd
          WHERE pd.section_type = 'event' AND pd.section_id = e.id
          ORDER BY pd.id DESC
          LIMIT 1
        ) AS file_name,
        (
          SELECT pd.file_path
          FROM pdf_documents pd
          WHERE pd.section_type = 'event' AND pd.section_id = e.id
          ORDER BY pd.id DESC
          LIMIT 1
        ) AS file_path
      FROM events e
      ORDER BY e.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("GET EVENTS ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* ADD EVENT */
app.post("/api/events", requireRole("admin"), upload.single("file"), async (req, res) => {
  try {
    const {
      type,
      name,
      info,
      date,
      venue,
      duration,
      time,
      fee,
      lastDate,
      mode,
      amount,
      eligibility,
      registrationLink
    } = req.body;

    let safeRegistrationLink = null;
    if (registrationLink) {
      try {
        const parsed = new URL(registrationLink);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("protocol");
        safeRegistrationLink = parsed.toString();
      } catch {
        return res.status(400).json({ success: false, message: "Registration link must be a valid HTTP(S) URL" });
      }
    }

    const [result] = await pool.query(
      `
      INSERT INTO events
      (
        type,
        name,
        info,
        date,
        venue,
        duration,
        time,
        fee,
        last_date,
        mode,
        amount,
        eligibility,
        registration_link
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        type || null,
        name || null,
        info || null,
        date || null,
        venue || null,
        duration || null,
        time || null,
        fee || null,
        lastDate || null,
        mode || null,
        amount || null,
        eligibility || null,
        safeRegistrationLink
      ]
    );

    const eventId = result.insertId;

    if (req.file) {
      await pool.query(
        `
        INSERT INTO pdf_documents
        (section_type, section_id, title, file_name, file_path, extracted_text, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "event",
          eventId,
          name || type || "Event Document",
          req.file.originalname,
          `uploads/${req.file.filename}`,
          "",
          req.auth.id
        ]
      );
    }

    res.json({
      success: true,
      message: "Event added successfully",
      eventId
    });
  } catch (error) {
    console.error("ADD EVENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.delete("/api/events/:id", requireRole("admin"), async (req, res) => {
  try {
    const eventId = req.params.id;

    const [pdfRows] = await pool.query(
      "SELECT file_path FROM pdf_documents WHERE section_type = 'event' AND section_id = ?",
      [eventId]
    );

    for (const row of pdfRows) {
      if (row.file_path) {
        const fullPath = path.join(process.cwd(), row.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    await pool.query(
      "DELETE FROM pdf_documents WHERE section_type = 'event' AND section_id = ?",
      [eventId]
    );

    await pool.query("DELETE FROM events WHERE id = ?", [eventId]);

    res.json({
      success: true,
      message: "Event deleted"
    });
  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/* =========================================================
   Q&A
========================================================= */

app.get("/api/qa", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        q.*,
        (
          SELECT pd.file_name
          FROM pdf_documents pd
          WHERE pd.section_type = 'qa' AND pd.section_id = q.id
          ORDER BY pd.id DESC
          LIMIT 1
        ) AS file_name,
        (
          SELECT pd.file_path
          FROM pdf_documents pd
          WHERE pd.section_type = 'qa' AND pd.section_id = q.id
          ORDER BY pd.id DESC
          LIMIT 1
        ) AS file_path
      FROM qa q
      ORDER BY q.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("GET QA ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/qa", requireRole("admin"), upload.single("file"), async (req, res) => {
  try {
    const { question, answer } = req.body;

    const [result] = await pool.query(
      "INSERT INTO qa (question, answer) VALUES (?, ?)",
      [question || null, answer || null]
    );

    if (req.file) {
      await pool.query(
        `
        INSERT INTO pdf_documents
        (section_type, section_id, title, file_name, file_path, extracted_text, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "qa",
          result.insertId,
          question || "Q&A Document",
          req.file.originalname,
          `uploads/${req.file.filename}`,
          "",
          req.auth.id
        ]
      );
    }

    res.json({
      success: true,
      message: "Q&A added"
    });
  } catch (error) {
    console.error("ADD QA ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.delete("/api/qa/:id", requireRole("admin"), async (req, res) => {
  try {
    const qaId = req.params.id;

    const [pdfRows] = await pool.query(
      "SELECT file_path FROM pdf_documents WHERE section_type = 'qa' AND section_id = ?",
      [qaId]
    );

    for (const row of pdfRows) {
      if (row.file_path) {
        const fullPath = path.join(process.cwd(), row.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    await pool.query(
      "DELETE FROM pdf_documents WHERE section_type = 'qa' AND section_id = ?",
      [qaId]
    );

    await pool.query("DELETE FROM qa WHERE id = ?", [qaId]);

    res.json({
      success: true,
      message: "Q&A deleted"
    });
  } catch (error) {
    console.error("DELETE QA ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/* =========================================================
   NOTICES
========================================================= */

app.get("/api/notices", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        n.*,
        (
          SELECT pd.file_name
          FROM pdf_documents pd
          WHERE pd.section_type = 'notice' AND pd.section_id = n.id
          ORDER BY pd.id DESC
          LIMIT 1
        ) AS file_name,
        (
          SELECT pd.file_path
          FROM pdf_documents pd
          WHERE pd.section_type = 'notice' AND pd.section_id = n.id
          ORDER BY pd.id DESC
          LIMIT 1
        ) AS file_path
      FROM notices n
      ORDER BY n.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("GET NOTICES ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/notices", requireRole("admin"), upload.single("file"), async (req, res) => {
  try {
    const { noticeText } = req.body;

    const [result] = await pool.query(
      "INSERT INTO notices (notice_text) VALUES (?)",
      [noticeText || null]
    );

    if (req.file) {
      await pool.query(
        `
        INSERT INTO pdf_documents
        (section_type, section_id, title, file_name, file_path, extracted_text, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          "notice",
          result.insertId,
          "Notice Document",
          req.file.originalname,
          `uploads/${req.file.filename}`,
          "",
          req.auth.id
        ]
      );
    }

    res.json({
      success: true,
      message: "Notice added"
    });
  } catch (error) {
    console.error("ADD NOTICE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.delete("/api/notices/:id", requireRole("admin"), async (req, res) => {
  try {
    const noticeId = req.params.id;

    const [pdfRows] = await pool.query(
      "SELECT file_path FROM pdf_documents WHERE section_type = 'notice' AND section_id = ?",
      [noticeId]
    );

    for (const row of pdfRows) {
      if (row.file_path) {
        const fullPath = path.join(process.cwd(), row.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    await pool.query(
      "DELETE FROM pdf_documents WHERE section_type = 'notice' AND section_id = ?",
      [noticeId]
    );

    await pool.query("DELETE FROM notices WHERE id = ?", [noticeId]);

    res.json({
      success: true,
      message: "Notice deleted"
    });
  } catch (error) {
    console.error("DELETE NOTICE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/* =========================================================
   EVENT REGISTRATIONS
========================================================= */

app.post("/api/register-event", requireRole("student"), async (req, res) => {
  try {
    const { eventId, studentName } = req.body;
    const studentId = req.auth.id;
    const [students] = await pool.query(
      "SELECT name, branch, pin_number FROM students WHERE id = ?",
      [studentId]
    );
    const [events] = await pool.query("SELECT type FROM events WHERE id = ?", [eventId]);
    if (!students[0] || !events[0]) {
      return res.status(404).json({ success: false, message: "Student or event not found" });
    }
    const branch = students[0].branch;
    const pinNumber = students[0].pin_number;
    const eventType = events[0].type;
    const verifiedName = (studentName || students[0].name || "").trim();
    if (!verifiedName || verifiedName.length > 255) {
      return res.status(400).json({ success: false, message: "A valid student name is required" });
    }

    const [exists] = await pool.query(
      "SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?",
      [eventId, studentId]
    );

    if (exists.length > 0) {
      return res.json({
        success: false,
        message: "Already registered for this event"
      });
    }

    await pool.query(
      `
      INSERT INTO event_registrations
      (event_id, student_id, student_name, branch, pin_number, event_type)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [eventId, studentId, verifiedName, branch, pinNumber, eventType]
    );

    res.json({
      success: true,
      message: "Registration successful"
    });
  } catch (error) {
    console.error("REGISTER EVENT ERROR:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Already registered for this event" });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

app.get("/api/event-registrations", requireRole("admin"), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        er.*,
        e.name AS event_name
      FROM event_registrations er
      LEFT JOIN events e ON er.event_id = e.id
      ORDER BY er.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("GET EVENT REGISTRATIONS ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* =========================================================
   CHATBOT
========================================================= */

app.post("/api/chat", requireRole("admin", "student"), chatLimit, (req, res) => {
  const { message } = req.body;
  const studentId = req.auth.role === "student" ? req.auth.id : "";

  if (typeof message !== "string" || !message.trim() || message.length > 1000) {
    return res.status(400).json({
      reply: "Please enter a message."
    });
  }

  execFile(
    process.platform === "win32" ? "py" : "python3",
    ["ai.py", message.trim(), String(studentId)],
    { cwd: process.cwd() },
    (error, stdout, stderr) => {
      console.log("===== CHAT DEBUG =====");
      console.log("MESSAGE:", message);
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);
      console.log("ERROR:", error);

      if (error) {
        return res.status(500).json({
          reply: "Server error ❌"
        });
      }

      try {
        const result = JSON.parse(stdout.trim());
        return res.json(result);
      } catch (parseError) {
        console.error("JSON PARSE ERROR:", parseError);
        return res.status(500).json({
          reply: "AI response error ❌"
        });
      }
    }
  );
});

app.use((error, _req, res, _next) => {
  console.error("REQUEST ERROR:", error);
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "File is too large" : "Invalid upload";
    return res.status(400).json({ success: false, message });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
});

await initializeAuthSchema();

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or set a different PORT.`);
    process.exitCode = 1;
    return;
  }

  console.error("SERVER STARTUP ERROR:", error);
  process.exitCode = 1;
});
