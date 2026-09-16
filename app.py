import os
from werkzeug.utils import secure_filename
from flask import Flask, render_template, request, redirect, url_for, flash, session

import db

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB, matches the UI copy

with app.app_context():
    db.init_db()


# ---------- Marketing pages ----------

@app.route("/")
def home():
    return render_template("index.html", current_page="home")


@app.route("/services")
def services():
    return render_template("services.html", current_page="services")


@app.route("/services/web-development")
def web_development():
    return render_template("web-development.html", current_page="services")


@app.route("/pricing")
def pricing():
    return render_template("pricing.html", current_page="pricing")


@app.route("/portfolio")
def portfolio():
    return render_template("portfolio.html", current_page="portfolio")


@app.route("/roadmap")
def roadmap():
    return render_template("roadmap.html", current_page="portfolio")


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


# ---------- Contact (real backend: saves to SQLite) ----------

@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        service = request.form.get("service", "").strip()
        message = request.form.get("message", "").strip()

        if not name or not email or not message:
            flash("Please fill in your name, email, and message.", "error")
            return redirect(url_for("contact"))

        db.save_contact_submission(name, email, service, message)
        flash("Thanks! Your inquiry has been sent — we'll be in touch soon.", "success")
        return redirect(url_for("contact"))

    return render_template("contact.html", current_page="contact")


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
        flash("Your project inquiry has been submitted. We'll be in touch shortly!", "success")
        return redirect(url_for("home"))

    return render_template("onboarding-review.html", current_page=None, onboarding_data=onboarding_data)


if __name__ == "__main__":
    app.run(debug=True)
