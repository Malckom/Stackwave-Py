import os
import sqlite3
from contextlib import closing

DB_PATH = os.path.join(os.path.dirname(__file__), "stackwave.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_columns(conn, table, columns):
    """Add any missing columns so an existing production database upgrades in place."""
    existing = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
    for name, ddl in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")


def init_db():
    with closing(get_connection()) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                service TEXT,
                message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS project_inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name TEXT,
                website_url TEXT,
                primary_goal TEXT,
                notes TEXT,
                uploaded_files TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Added with the package pre-selection + spam protection work.
        _ensure_columns(conn, "contact_submissions", {
            "package": "TEXT",    # package the visitor picked on /pricing (human-readable name)
            "addons": "TEXT",     # comma-separated add-on names
            "ip_hash": "TEXT",    # salted hash, used only for rate limiting (never the raw IP)
        })
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_contact_ip_time "
            "ON contact_submissions (ip_hash, created_at)"
        )
        conn.commit()


def save_contact_submission(name, email, service, message, package="", addons="", ip_hash=""):
    with closing(get_connection()) as conn:
        conn.execute(
            "INSERT INTO contact_submissions (name, email, service, message, package, addons, ip_hash) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (name, email, service, message, package, addons, ip_hash),
        )
        conn.commit()


def count_recent_contact_submissions(ip_hash, minutes=60):
    if not ip_hash:
        return 0
    with closing(get_connection()) as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS n FROM contact_submissions "
            "WHERE ip_hash = ? AND created_at >= datetime('now', ?)",
            (ip_hash, f"-{int(minutes)} minutes"),
        ).fetchone()
        return row["n"]


def save_project_inquiry(company_name, website_url, primary_goal, notes, uploaded_files):
    with closing(get_connection()) as conn:
        conn.execute(
            "INSERT INTO project_inquiries (company_name, website_url, primary_goal, notes, uploaded_files) "
            "VALUES (?, ?, ?, ?, ?)",
            (company_name, website_url, primary_goal, notes, uploaded_files),
        )
        conn.commit()
