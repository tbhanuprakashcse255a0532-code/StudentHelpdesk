import mysql.connector
import json
import sys
import os
import re
from dotenv import load_dotenv

load_dotenv()


class HelpdeskAI:
    def __init__(self, host, user, password, database):
        self.conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
        self.cursor = self.conn.cursor(dictionary=True)

    def close(self):
    # Close the database cursor
        self.cursor.close()

    # Close the database connection
        self.conn.close()


def norm(self, text):
    # Convert text to lowercase and replace multiple spaces
    # with a single space, then remove leading/trailing spaces
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def clean(self, text):
    # Convert text to lowercase and remove all characters
    # except letters, numbers, and spaces
    return re.sub(r"[^a-z0-9\s]", "", (text or "").lower()).strip()


def has_any(self, text, words):
    # Check whether any of the given words exist in the text
    return any(w in text for w in words)


def wants_count(self, text):
    # Check if the user is asking for a count or total
    return self.has_any(text, ["how many", "count", "number", "total"])


def wants_latest(self, text):
    # Check if the user is asking for the latest/recent event
    return self.has_any(text, [
        "latest", "recent", "newest", "last added",
        "new", "ongoing", "current", "upcoming"
    ])


def wants_list(self, text):
    # Check if the user wants a list or names of events
    return self.has_any(text, [
        "list", "show", "display", "available", "all",
        "names", "with their names", "event names",
        "give names", "what are the", "tell me the"
    ])


def fetch_one(self, query, params=()):
    # Execute a SQL query and return a single row
    self.cursor.execute(query, params)
    return self.cursor.fetchone()


def fetch_all(self, query, params=()):
    # Execute a SQL query and return all matching rows
    self.cursor.execute(query, params)
    return self.cursor.fetchall()


def total_events(self):
    # Count the total number of events in the events table
    row = self.fetch_one(
        "SELECT COUNT(*) AS total FROM events"
    )

    # Return the count if a row exists, otherwise return 0
    return row["total"] if row else 0


def count_type(self, event_type):
    # Count events that match the specified event type
    # LOWER() makes the comparison case-insensitive
    row = self.fetch_one(
        "SELECT COUNT(*) AS total FROM events "
        "WHERE LOWER(type)=LOWER(%s)",
        (event_type,)
    )

    # Return the count if a row exists, otherwise return 0
    return row["total"] if row else 0


def latest_event(self):
    # Get the most recently added event
    # Higher ID values are treated as newer records
    return self.fetch_one(
        "SELECT * FROM events ORDER BY id DESC LIMIT 1"
    )


def latest_type(self, event_type):
    # Get the most recently added event of a specific type
    # The type comparison is case-insensitive
    return self.fetch_one(
        "SELECT * FROM events "
        "WHERE LOWER(type)=LOWER(%s) "
        "ORDER BY id DESC LIMIT 1",
        (event_type,)
    )

    def list_all_events(self):
        return self.fetch_all("SELECT * FROM events ORDER BY id DESC")

    def list_type(self, event_type):
        return self.fetch_all(
            "SELECT * FROM events WHERE LOWER(type)=LOWER(%s) ORDER BY id DESC",
            (event_type,)
        )

    def format_event(self, e):
        if not e:
            return "No event found."

        lines = []
        if e.get("name"):
            lines.append(f"📌 {e['name']}")
        if e.get("type"):
            lines.append(f"🏷️ Type: {e['type']}")
        if e.get("info"):
            lines.append(f"ℹ️ Info: {e['info']}")
        if e.get("date"):
            lines.append(f"📅 Date: {e['date']}")
        if e.get("venue"):
            lines.append(f"📍 Venue: {e['venue']}")
        if e.get("duration"):
            lines.append(f"⏳ Duration: {e['duration']}")
        if e.get("time"):
            lines.append(f"🕒 Time: {e['time']}")
        if e.get("fee"):
            lines.append(f"💰 Fee: {e['fee']}")
        if e.get("last_date"):
            lines.append(f"📝 Last Date: {e['last_date']}")
        if e.get("mode"):
            lines.append(f"💻 Mode: {e['mode']}")
        if e.get("amount"):
            lines.append(f"🎓 Amount: {e['amount']}")
        if e.get("eligibility"):
            lines.append(f"✅ Eligibility: {e['eligibility']}")
        if e.get("registration_link"):
            lines.append(f"🔗 Registration Link: {e['registration_link']}")
        return "\n".join(lines)

    def format_event_list(self, rows, heading="Available events"):
        if not rows:
            return f"No {heading.lower()} found."

        lines = [f"{heading}:"]
        for e in rows:
            name = e.get("name") or "Unnamed"
            etype = e.get("type") or "Unknown"
            date = e.get("date") or "No date"
            lines.append(f"• {name} - {etype} - {date}")
        return "\n".join(lines)

    def find_event_by_name(self, message):
        msg = self.clean(message)
        rows = self.list_all_events()

        for e in rows:
            name = self.clean(e.get("name", ""))
            if name and name in msg:
                return e

        words = [w for w in msg.split() if len(w) > 3]
        for e in rows:
            blob = " ".join([
                self.clean(e.get("name", "")),
                self.clean(e.get("info", "")),
                self.clean(e.get("venue", "")),
                self.clean(e.get("type", ""))
            ])
            if any(word in blob for word in words):
                return e
        return None

    def search_qa(self, message):
        try:
            rows = self.fetch_all("SELECT * FROM qa ORDER BY id DESC")
        except Exception:
            return None

        msg = self.clean(message)

        for row in rows:
            q = self.clean(row.get("question", ""))
            if q and q in msg:
                return row.get("answer")

        words = [w for w in msg.split() if len(w) > 3]
        for row in rows:
            q = self.clean(row.get("question", ""))
            a = self.clean(row.get("answer", ""))
            if any(word in q or word in a for word in words):
                return row.get("answer")
        return None

    def search_pdfs(self, message):
        try:
            rows = self.fetch_all("""
                SELECT file_name, file_path, extracted_text
                FROM pdf_documents
                WHERE extracted_text IS NOT NULL AND extracted_text != ''
                ORDER BY id DESC
            """)
        except Exception:
            return None

        msg = self.clean(message)
        words = [w for w in msg.split() if len(w) > 3]

        for row in rows:
            text = self.clean(row.get("extracted_text", ""))
            if msg and msg in text:
                return {
                    "reply": "I found related information in an uploaded PDF/document.",
                    "pdfPath": row.get("file_path", "") or "",
                    "pdfTitle": row.get("file_name", "") or "Document"
                }

        for row in rows:
            text = self.clean(row.get("extracted_text", ""))
            if any(word in text for word in words):
                return {
                    "reply": "I found related information in an uploaded PDF/document.",
                    "pdfPath": row.get("file_path", "") or "",
                    "pdfTitle": row.get("file_name", "") or "Document"
                }
        return None

    def reply(self, message, student_id=None):
        msg = self.norm(message)

        # greetings
        if msg in ["hi", "hello", "hey", "hii", "helo", "good morning", "good evening"]:
            return {
                "reply": "Hello 👋 I am your MGIT Student Helpdesk Assistant.\nHow can I help you today?",
                "pdfPath": "",
                "pdfTitle": ""
            }

        if "your name" in msg or "who are you" in msg:
            return {
                "reply": "I am your MGIT Student Helpdesk AI 🤖. I can help with events, workshops, scholarships, sports, notices, Q&A and PDFs.",
                "pdfPath": "",
                "pdfTitle": ""
            }

        # all events count
        if self.wants_count(msg) and self.has_any(msg, ["events", "event"]) and not self.has_any(
            msg, ["tech fest", "techfest", "workshop", "workshops", "sports", "sport", "scholarship", "scholarships", "placement", "placements", "exam", "exams"]
        ):
            total = self.total_events()
            return {
                "reply": f"There are currently {total} total events available.",
                "pdfPath": "",
                "pdfTitle": ""
            }

        # list all events
        if (
            self.has_any(msg, ["events", "event"])
            and self.wants_list(msg)
            and not self.has_any(msg, ["tech fest", "techfest", "workshop", "workshops", "sports", "sport", "scholarship", "scholarships", "placement", "placements", "exam", "exams"])
        ) or msg in ["events", "event", "list all events", "show all events", "event names", "events with their names"]:
            rows = self.list_all_events()
            return {
                "reply": self.format_event_list(rows, "Available events"),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # latest generic event
        if self.wants_latest(msg) and self.has_any(msg, ["event", "events"]):
            e = self.latest_event()
            return {
                "reply": "Here is the latest event:\n\n" + self.format_event(e),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # tech fest
        if self.has_any(msg, ["tech fest", "techfest", "tech event", "tech events"]):
            if self.wants_count(msg):
                count = self.count_type("Tech Fest")
                return {
                    "reply": f"There are {count} Tech Fest event(s) currently available.",
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            if self.wants_latest(msg):
                e = self.latest_type("Tech Fest")
                return {
                    "reply": "Latest Tech Fest event:\n\n" + self.format_event(e),
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            rows = self.list_type("Tech Fest")
            return {
                "reply": self.format_event_list(rows, "Tech Fest events"),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # workshops
        if self.has_any(msg, ["workshop", "workshops"]):
            if self.wants_count(msg):
                count = self.count_type("Workshops")
                return {
                    "reply": f"There are {count} Workshop event(s) currently available.",
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            if self.wants_latest(msg):
                e = self.latest_type("Workshops")
                return {
                    "reply": "Latest Workshop:\n\n" + self.format_event(e),
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            rows = self.list_type("Workshops")
            return {
                "reply": self.format_event_list(rows, "Available workshops"),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # sports
        if self.has_any(msg, ["sport", "sports"]):
            if self.wants_count(msg):
                count = self.count_type("Sports")
                return {
                    "reply": f"There are {count} Sports event(s) currently available.",
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            if self.wants_latest(msg):
                e = self.latest_type("Sports")
                return {
                    "reply": "Latest Sports event:\n\n" + self.format_event(e),
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            rows = self.list_type("Sports")
            return {
                "reply": self.format_event_list(rows, "Available sports events"),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # scholarship
        if self.has_any(msg, ["scholarship", "scholarships"]):
            if self.wants_count(msg):
                count = self.count_type("Scholarship")
                return {
                    "reply": f"There are {count} Scholarship item(s) currently available.",
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            if self.wants_latest(msg):
                e = self.latest_type("Scholarship")
                return {
                    "reply": "Latest Scholarship:\n\n" + self.format_event(e),
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            rows = self.list_type("Scholarship")
            return {
                "reply": self.format_event_list(rows, "Available scholarships"),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # exams
        if self.has_any(msg, ["exam", "exams"]):
            if self.wants_count(msg):
                count = self.count_type("Exams")
                return {
                    "reply": f"There are {count} Exam item(s) currently available.",
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            if self.wants_latest(msg):
                e = self.latest_type("Exams")
                return {
                    "reply": "Latest Exam update:\n\n" + self.format_event(e),
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            rows = self.list_type("Exams")
            return {
                "reply": self.format_event_list(rows, "Available exams"),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # placements
        if self.has_any(msg, ["placement", "placements"]):
            if self.wants_count(msg):
                count = self.count_type("Placements")
                return {
                    "reply": f"There are {count} Placement item(s) currently available.",
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            if self.wants_latest(msg):
                e = self.latest_type("Placements")
                return {
                    "reply": "Latest Placement update:\n\n" + self.format_event(e),
                    "pdfPath": "",
                    "pdfTitle": ""
                }
            rows = self.list_type("Placements")
            return {
                "reply": self.format_event_list(rows, "Available placements"),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # specific event name
        e = self.find_event_by_name(msg)
        if e:
            return {
                "reply": self.format_event(e),
                "pdfPath": "",
                "pdfTitle": ""
            }

        # QA
        qa = self.search_qa(msg)
        if qa:
            return {
                "reply": qa,
                "pdfPath": "",
                "pdfTitle": ""
            }

        # PDFs
        pdf = self.search_pdfs(msg)
        if pdf:
            return pdf

        return {
            "reply": "Sorry, I could not find an exact answer. Please try asking about events, workshops, scholarships, sports, notices or PDFs.",
            "pdfPath": "",
            "pdfTitle": ""
        }


if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else ""
    student_id_raw = sys.argv[2] if len(sys.argv) > 2 else ""
    student_id = int(student_id_raw) if str(student_id_raw).isdigit() else None

    ai = HelpdeskAI(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "s_helpdesk")
    )

    try:
        result = ai.reply(message, student_id)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "reply": f"Python error: {str(e)}",
            "pdfPath": "",
            "pdfTitle": ""
        }))
    finally:
        ai.close()