"""Email notifications for new inquiries.

Configured entirely through environment variables (set them in cPanel > Setup Python App):

    MAIL_PASSWORD   password of the mailbox that sends the alerts (required to switch emails on)
    MAIL_USERNAME   SMTP login, default bookings@stackwavedevs.co.ke
    MAIL_FROM       sender address, default = MAIL_USERNAME
    MAIL_TO         who receives the alerts (comma-separated), default bookings@stackwavedevs.co.ke
    MAIL_SERVER     SMTP host, default mail.stackwavedevs.co.ke
    MAIL_PORT       default 465
    MAIL_SECURITY   ssl (default) | starttls | none

Sending happens in a background thread, so a slow or broken mail server never delays or breaks
the visitor's form submission. The inquiry is always saved to the database first.
"""
import logging
import os
import re
import smtplib
import ssl
import threading
import time
from email.message import EmailMessage
from email.utils import formatdate, formataddr, make_msgid

log = logging.getLogger("stackwave.mail")

DEFAULT_ADDRESS = "bookings@stackwavedevs.co.ke"
_last_result = {"ok": None, "when": None, "error": ""}


def settings():
    username = os.environ.get("MAIL_USERNAME", DEFAULT_ADDRESS)
    return {
        "host": os.environ.get("MAIL_SERVER", "mail.stackwavedevs.co.ke"),
        "port": int(os.environ.get("MAIL_PORT", "465")),
        "security": os.environ.get("MAIL_SECURITY", "ssl").strip().lower(),
        "username": username,
        "password": os.environ.get("MAIL_PASSWORD", ""),
        "sender": os.environ.get("MAIL_FROM") or username,
        "to": [a.strip() for a in os.environ.get("MAIL_TO", DEFAULT_ADDRESS).split(",") if a.strip()],
    }


def is_configured():
    s = settings()
    # A password switches mail on. An explicit MAIL_SERVER with MAIL_SECURITY=none (local testing) also does.
    return bool(s["password"]) or (bool(os.environ.get("MAIL_SERVER")) and s["security"] == "none")


def status():
    s = settings()
    return {"configured": is_configured(), "to": ", ".join(s["to"]), "host": s["host"], "port": s["port"],
            "security": s["security"], "last": dict(_last_result)}


def _header(value, limit=150):
    """Single-line, control-character-free text for headers (blocks header injection)."""
    return re.sub(r"[\x00-\x1f\x7f]+", " ", str(value or "")).strip()[:limit]


def build_message(subject, body, reply_to=None):
    s = settings()
    msg = EmailMessage()
    msg["Subject"] = _header(subject)
    msg["From"] = formataddr(("Stackwave Website", s["sender"]))
    msg["To"] = ", ".join(s["to"])
    if reply_to and re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", reply_to):
        msg["Reply-To"] = _header(reply_to, 254)
    msg["Date"] = formatdate(localtime=False)
    msg["Message-ID"] = make_msgid(domain=s["sender"].split("@")[-1])
    msg.set_content(body)
    return msg


def send_now(subject, body, reply_to=None):
    """Send synchronously. Returns (ok, error_text). Used by the admin 'send test email' button."""
    s = settings()
    try:
        msg = build_message(subject, body, reply_to)
        if s["security"] == "ssl":
            server = smtplib.SMTP_SSL(s["host"], s["port"], timeout=15, context=ssl.create_default_context())
        else:
            server = smtplib.SMTP(s["host"], s["port"], timeout=15)
        with server:
            server.ehlo()
            if s["security"] == "starttls":
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
            if s["password"]:
                server.login(s["username"], s["password"])
            server.send_message(msg)
        result = (True, "")
    except Exception as exc:  # network, TLS, auth, anything: never let it propagate
        log.exception("Could not send notification email")
        result = (False, f"{type(exc).__name__}: {exc}"[:300])
    _last_result.update(ok=result[0], when=time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()), error=result[1])
    return result


def notify(subject, body, reply_to=None):
    """Fire-and-forget. Returns False (and logs) if email is not configured."""
    if not is_configured():
        log.info("Email notifications are off (MAIL_PASSWORD is not set); skipping alert.")
        return False
    threading.Thread(target=send_now, args=(subject, body, reply_to), daemon=True).start()
    return True
