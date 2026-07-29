import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "stackwave.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
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
    conn.commit()
    conn.close()


def save_contact_submission(name, email, service, message):
    conn = get_connection()
    conn.execute(
        "INSERT INTO contact_submissions (name, email, service, message) VALUES (?, ?, ?, ?)",
        (name, email, service, message),
    )
    conn.commit()
    conn.close()


def save_project_inquiry(company_name, website_url, primary_goal, notes, uploaded_files):
    conn = get_connection()
    conn.execute(
        "INSERT INTO project_inquiries (company_name, website_url, primary_goal, notes, uploaded_files) "
        "VALUES (?, ?, ?, ?, ?)",
        (company_name, website_url, primary_goal, notes, uploaded_files),
    )
    conn.commit()
    conn.close()
