import csv
import datetime
import functools
import hashlib
import hmac
import io
import json
import logging
import os
import re
import secrets
import time
from urllib.parse import quote, urlparse

from flask import (
    Flask, Response, abort, flash, redirect, render_template, request,
    send_from_directory, session, url_for,
)
from werkzeug.utils import secure_filename

import content
import db

DEFAULT_SECRET = "dev-secret-key-change-in-production"

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", DEFAULT_SECRET)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    # Set SESSION_COOKIE_SECURE=1 in production (HTTPS). Left off by default so local http:// works.
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE") == "1",
)
if app.secret_key == DEFAULT_SECRET:
    logging.warning("SECRET_KEY is not set: sessions and form tokens are signed with the public "
                    "development key. Set a SECRET_KEY environment variable in production.")

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB, matches the UI copy

with app.app_context():
    db.init_db()

# Options shown in the contact form's "Service needed" select (single source of truth).
CONTACT_SERVICES = [
    "Web Development", "Product Design (UI/UX)", "SEO Optimization", "SaaS Development",
    "Enterprise Software", "Growth Marketing", "AI Integration",
]
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MAX_SUBMISSIONS_PER_HOUR = 5
MEDIA_KIT_FILE = "Stackwave-Developers-Media-Kit.pdf"


# ---------- Helpers ----------

def get_csrf_token():
    if "csrf" not in session:
        session["csrf"] = secrets.token_urlsafe(32)
    return session["csrf"]


def csrf_is_valid():
    expected = session.get("csrf", "")
    sent = request.form.get("csrf_token", "")
    return bool(expected) and hmac.compare_digest(sent, expected)


def ip_fingerprint():
    """Salted hash of the client IP. Used only for rate limiting; the raw IP is never stored."""
    ip = request.remote_addr or ""
    if not ip:
        return ""
    return hmac.new(app.secret_key.encode(), ip.encode(), hashlib.sha256).hexdigest()[:32]


def static_exists(rel_path):
    return os.path.isfile(os.path.join(app.static_folder, rel_path))


def screenshot_for(slug):
    """Return a screenshot path if you've dropped one in static/assets/screens/<slug>.(webp|jpg|png)."""
    for ext in ("webp", "jpg", "jpeg", "png"):
        rel = f"assets/screens/{slug}.{ext}"
        if static_exists(rel):
            return rel
    return None


def get_projects():
    projects = []
    for p in content.load("projects"):
        p = dict(p)
        if p.get("legacy_endpoint"):
            p["case_study_url"] = url_for(p["legacy_endpoint"])
        elif p.get("case_study"):
            p["case_study_url"] = url_for("case_study", slug=p["slug"])
        else:
            p["case_study_url"] = None
        p["domain"] = urlparse(p["url"]).netloc.removeprefix("www.") if p.get("url") else None
        p["screenshot"] = screenshot_for(p["slug"])
        projects.append(p)
    return projects


def get_project(slug):
    return next((p for p in get_projects() if p["slug"] == slug), None)


def get_services():
    return content.load("services")


def get_service(slug):
    return next((s for s in get_services() if s["slug"] == slug), None)


def resolve_selection(package_slug, addon_slugs):
    """Turn query-string slugs into trusted package/add-on records (unknown slugs are ignored)."""
    pricing = content.load("pricing")
    package = next((p for p in pricing["packages"] if p["slug"] == package_slug), None)
    wanted = [a.strip() for a in (addon_slugs or "").split(",") if a.strip()]
    addons = [a for a in pricing["addons"] if a["slug"] in wanted]
    return package, addons


@app.context_processor
def inject_globals():
    site = content.load("site")
    wa_text = quote(site.get("whatsapp_message", ""))
    whatsapp_url = f"https://wa.me/{site['whatsapp_number']}?text={wa_text}" if site.get("whatsapp_number") else ""
    return {
        "site": site,
        "nav_services": get_services(),
        "whatsapp_url": whatsapp_url,
        "csrf_token": get_csrf_token,
        "screenshot_for": screenshot_for,
        "current_year": datetime.date.today().year,
    }


@app.template_filter("nairobi_time")
def nairobi_time(value):
    """created_at is stored in UTC; show it in East Africa Time (UTC+3)."""
    try:
        dt = datetime.datetime.strptime(value, "%Y-%m-%d %H:%M:%S") + datetime.timedelta(hours=3)
        return dt.strftime("%d %b %Y, %H:%M")
    except (TypeError, ValueError):
        return value or ""


@app.after_request
def security_headers(resp):
    if request.path.startswith("/admin"):
        resp.headers["X-Robots-Tag"] = "noindex, nofollow"
        resp.headers["Cache-Control"] = "no-store"
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    return resp


# ---------- Marketing pages ----------

@app.route("/")
def home():
    featured = [p for p in get_projects() if p.get("featured_home")]
    return render_template("index.html", current_page="home", featured_projects=featured)


@app.route("/services")
def services():
    return render_template("services.html", current_page="services")


@app.route("/services/web-development")
def web_development():
    return render_template("web-development.html", current_page="services")


@app.route("/services/<slug>")
def service_detail(slug):
    service = get_service(slug)
    if not service:
        abort(404)
    pricing = content.load("pricing")
    addon = next((a for a in pricing["addons"] if a["slug"] == service.get("related_addon")), None)
    others = [s for s in get_services() if s["slug"] != slug]
    faq_jsonld = json.dumps({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": f["q"],
                        "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in service["faqs"]],
    }).replace("</", "<\\/")
    return render_template("service-detail.html", current_page="services",
                           service=service, addon=addon, other_services=others, faq_jsonld=faq_jsonld)


@app.route("/pricing")
def pricing():
    return render_template("pricing.html", current_page="pricing", pricing=content.load("pricing"))


@app.route("/portfolio")
def portfolio():
    return render_template("portfolio.html", current_page="portfolio", projects=get_projects())


@app.route("/roadmap")
def roadmap():
    return render_template("roadmap.html", current_page="portfolio")


# Case studies with their own hand-built pages
@app.route("/case-studies/nexus")
def case_study_nexus():
    return render_template("case-study-nexus.html", current_page="portfolio")


@app.route("/case-studies/jetwide")
def case_study_jetwide():
    return render_template("case-study-jetwide.html", current_page="portfolio")


@app.route("/case-studies/group-joining-safaris")
def case_study_gjs():
    return render_template("case-study-group-joining-safaris.html", current_page="portfolio")


@app.route("/case-studies/spidow")
def case_study_spidow():
    return render_template("case-study-spidow.html", current_page="portfolio")


# Every other case study is generated from content/projects.json
@app.route("/case-studies/<slug>")
def case_study(slug):
    project = get_project(slug)
    if not project or not project.get("case_study"):
        abort(404)
    return render_template("case-study.html", current_page="portfolio", project=project, cs=project["case_study"])


# ---------- Legal ----------

@app.route("/terms")
def terms():
    return render_template("terms.html", current_page=None)


@app.route("/privacy")
def privacy():
    return render_template("privacy.html", current_page=None)


@app.route("/terms-and-conditions")
def terms_alias():
    return redirect(url_for("terms"), code=301)


@app.route("/privacy-policy")
def privacy_alias():
    return redirect(url_for("privacy"), code=301)


# ---------- Downloads ----------

@app.route("/media-kit")
def media_kit():
    return send_from_directory(
        os.path.join(app.static_folder, "downloads"), MEDIA_KIT_FILE,
        as_attachment=True, download_name=MEDIA_KIT_FILE, mimetype="application/pdf",
    )


# ---------- Contact (validated, CSRF-protected, saved to SQLite) ----------

def validate_contact(form):
    errors = {}
    if len(form["name"]) < 2:
        errors["name"] = "Enter your name (at least 2 characters)."
    elif len(form["name"]) > 100:
        errors["name"] = "Keep your name under 100 characters."
    if len(form["email"]) > 254 or not EMAIL_RE.match(form["email"]):
        errors["email"] = "Enter a valid email address, like name@example.com."
    if form["service"] not in CONTACT_SERVICES:
        errors["service"] = "Choose a service from the list."
    if len(form["message"]) < 10:
        errors["message"] = "Tell us a little more about your project (at least 10 characters)."
    elif len(form["message"]) > 5000:
        errors["message"] = "Keep your message under 5,000 characters."
    return errors


@app.route("/contact", methods=["GET", "POST"])
def contact():
    source = request.form if request.method == "POST" else request.args
    package, addons = resolve_selection(source.get("package", ""), source.get("addons", ""))

    default_service = CONTACT_SERVICES[0]
    if package:
        default_service = package["service"]
    elif source.get("service") in CONTACT_SERVICES:
        default_service = source.get("service")

    form = {"name": "", "email": "", "service": default_service, "message": ""}
    errors = {}

    if request.method == "POST":
        form = {
            "name": request.form.get("name", "").strip(),
            "email": request.form.get("email", "").strip(),
            "service": request.form.get("service", "").strip(),
            "message": request.form.get("message", "").strip(),
        }

        # Honeypot: real visitors never see or fill this field, bots usually do.
        if request.form.get("company_url", "").strip():
            flash({"title": "Message sent", "body": "Thanks for getting in touch."}, "success")
            return redirect(url_for("contact"))

        errors = validate_contact(form)
        if not csrf_is_valid():
            session.pop("csrf", None)
            flash({"title": "Session expired",
                   "body": "We couldn't verify the form. Check your details and send it again."}, "error")
        elif errors:
            flash({"title": "Check the highlighted fields",
                   "body": "Some details are missing or look incorrect."}, "error")
        elif db.count_recent_contact_submissions(ip_fingerprint()) >= MAX_SUBMISSIONS_PER_HOUR:
            flash({"title": "Too many messages",
                   "body": "Please wait a while before sending another, or message us on WhatsApp."}, "error")
        else:
            db.save_contact_submission(
                form["name"], form["email"], form["service"], form["message"],
                package=package["name"] if package else "",
                addons=", ".join(a["name"] for a in addons),
                ip_hash=ip_fingerprint(),
            )
            first_name = form["name"].split()[0]
            flash({"title": "Message sent",
                   "body": f"Thanks, {first_name}. We've received your inquiry and will reply by email."}, "success")
            return redirect(url_for("contact"))

    return render_template(
        "contact.html", current_page="contact", form=form, errors=errors,
        services=CONTACT_SERVICES, package=package, addons=addons,
    )


# ---------- Onboarding flow (2 steps, backed by session + SQLite) ----------

@app.route("/onboarding", methods=["GET", "POST"])
def onboarding():
    if request.method == "POST":
        session["onboarding_data"] = {
            "company_name": request.form.get("company_name", "").strip(),
            "website_url": request.form.get("website_url", "").strip(),
            "primary_goal": request.form.get("primary_goal", "").strip(),
        }
        return redirect(url_for("onboarding_review"))

    return render_template("onboarding-step1.html", current_page=None)


@app.route("/onboarding/review", methods=["GET", "POST"])
def onboarding_review():
    onboarding_data = session.get("onboarding_data", {})

    if request.method == "POST":
        notes = request.form.get("notes", "").strip()

        uploaded_names = []
        files = request.files.getlist("files")
        for f in files:
            if f and f.filename:
                filename = secure_filename(f.filename)
                f.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                uploaded_names.append(filename)

        db.save_project_inquiry(
            company_name=onboarding_data.get("company_name"),
            website_url=onboarding_data.get("website_url"),
            primary_goal=onboarding_data.get("primary_goal"),
            notes=notes,
            uploaded_files=", ".join(uploaded_names),
        )
        session.pop("onboarding_data", None)
        flash({"title": "Project inquiry sent",
               "body": "We've received your details and will be in touch shortly."}, "success")
        return redirect(url_for("home"))

    return render_template("onboarding-review.html", current_page=None, onboarding_data=onboarding_data)



# ---------- Admin: view inquiries (enabled only when ADMIN_PASSWORD is set) ----------

_admin_failures = {}  # ip fingerprint -> timestamps of recent failed logins (per process)
ADMIN_MAX_FAILURES = 5
ADMIN_LOCKOUT_SECONDS = 15 * 60


def admin_enabled():
    return bool(os.environ.get("ADMIN_PASSWORD"))


def admin_required(view):
    @functools.wraps(view)
    def wrapper(*args, **kwargs):
        if not admin_enabled():
            abort(404)  # the page simply does not exist until a password is configured
        if not session.get("is_admin"):
            return redirect(url_for("admin_login"))
        return view(*args, **kwargs)
    return wrapper


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if not admin_enabled():
        abort(404)
    error = None
    if request.method == "POST":
        key, now = ip_fingerprint(), time.time()
        recent = [t for t in _admin_failures.get(key, []) if now - t < ADMIN_LOCKOUT_SECONDS]
        if len(recent) >= ADMIN_MAX_FAILURES:
            error = "Too many failed attempts. Try again in 15 minutes."
        elif not csrf_is_valid():
            error = "Your session expired. Please try again."
        elif hmac.compare_digest(request.form.get("password", "").encode(),
                                 os.environ["ADMIN_PASSWORD"].encode()):
            _admin_failures.pop(key, None)
            session.clear()  # fresh session on login
            session["is_admin"] = True
            return redirect(url_for("admin"))
        else:
            recent.append(now)
            error = "Incorrect password."
        _admin_failures[key] = recent
    return render_template("admin-login.html", current_page=None, error=error)


@app.route("/admin/logout", methods=["POST"])
def admin_logout():
    if csrf_is_valid():
        session.pop("is_admin", None)
    return redirect(url_for("admin_login") if admin_enabled() else url_for("home"))


@app.route("/admin")
@admin_required
def admin():
    return render_template("admin.html", current_page=None, status=db.db_status(),
                           contacts=db.list_contact_submissions(), projects=db.list_project_inquiries())


def _csv_safe(value):
    """Stop spreadsheet apps from running a cell as a formula (CSV injection)."""
    text = "" if value is None else str(value)
    return "'" + text if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text


@app.route("/admin/export.csv")
@admin_required
def admin_export():
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "received (UTC)", "name", "email", "service", "package", "add-ons", "message"])
    for r in db.list_contact_submissions(limit=100000):
        writer.writerow([_csv_safe(x) for x in (r["id"], r["created_at"], r["name"], r["email"], r["service"],
                                                r["package"], r["addons"], r["message"])])
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=stackwave-inquiries.csv"})


# ---------- Errors ----------

@app.errorhandler(404)
def not_found(_e):
    return render_template("404.html", current_page=None), 404


if __name__ == "__main__":
    app.run(debug=True)
