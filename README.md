# Stackwave Developers — Flask App

Your portfolio site, rebuilt as a real Python (Flask) web app. Same design and pages
as before, but now with a working backend:

- **Contact form** actually saves submissions to a database (SQLite) instead of just a JS animation.
- **Onboarding flow** (Step 1 → Review) carries your answers across pages using a real
  server-side session, saves everything (plus uploaded files) to the database on final submit.

## Project structure

```
stackwave-flask/
├── app.py                # Routes + form handling
├── db.py                 # SQLite helper (creates tables, saves submissions)
├── requirements.txt
├── Procfile              # For gunicorn on Render/Railway/Heroku-style hosts
├── templates/
│   ├── base.html          # Shared nav + footer + flash messages
│   ├── index.html
│   ├── services.html
│   ├── web-development.html
│   ├── portfolio.html
│   ├── roadmap.html
│   ├── case-study-nexus.html
│   ├── case-study-jetwide.html
│   ├── case-study-group-joining-safaris.html
│   ├── case-study-spidow.html
│   ├── contact.html
│   ├── onboarding-step1.html
│   └── onboarding-review.html
├── static/
│   ├── css/styles.css     # Same compiled Tailwind stylesheet as before
│   └── assets/logo.png
└── uploads/                # Files submitted through the onboarding review form land here
```

## Running it locally

You'll need Python 3.10+ installed.

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000** in your browser. The SQLite database
(`stackwave.db`) and `uploads/` folder are created automatically on first run.

## Important: this is no longer a GitHub Pages site

GitHub Pages only serves static files — it cannot run Python. Since this app now has a
real backend (form handling, a database, file uploads), it needs to run on a host that
executes Python. A few good free/cheap options:

- **[Render](https://render.com)** — connect your GitHub repo, pick "Web Service",
  it auto-detects the `Procfile` and `requirements.txt`. Free tier available.
- **[Railway](https://railway.app)** — similar one-click GitHub deploy.
- **[PythonAnywhere](https://www.pythonanywhere.com)** — good free tier, slightly more manual setup.

For any of these:
1. Push this project to a GitHub repo (a new one, or replace the old static one).
2. Connect the repo on your chosen host.
3. Set the `SECRET_KEY` environment variable to a random string (used to secure sessions/flash messages).
4. Deploy — the host will run `gunicorn app:app` per the `Procfile`.

**Note on the database:** SQLite writes to a local file, which works fine for
getting started, but most of these free hosts wipe the filesystem on redeploy. If you
want form submissions to persist long-term, ask me to swap in a hosted Postgres database
(Render and Railway both offer a free one) — it's a small change since the SQL is minimal.

## What changed from the static version

- Shared nav and footer now live in one place (`templates/base.html`) instead of being
  copy-pasted across 12 files — editing them once updates every page.
- The contact form and onboarding flow now actually store what people submit, instead of
  only simulating success in JavaScript.
- Routes use clean paths (e.g. `/case-studies/jetwide`) instead of `.html` filenames.

## Editing site content (no code needed)

Most of the site is driven by JSON files in `content/`. Edit, save, and the live site picks the change up
automatically (no restart needed; a typo in the JSON keeps the last good version live and logs the error).

| File | What it controls |
| --- | --- |
| `content/site.json` | Email, phone, WhatsApp number, TikTok/Instagram links, office address, business reg. no., legal "last updated" date |
| `content/pricing.json` | Packages, tiers, add-ons and pricing notes (pricing page, contact form pre-selection, media kit) |
| `content/projects.json` | Portfolio cards, homepage "Latest Projects" (`featured_home`), and generated case studies |
| `content/services.json` | The SEO Mastery, Digital Strategy and Performance First service pages |

- **Social links:** TikTok and Instagram icons only appear once `tiktok_url` / `instagram_url` are filled in `site.json`.
- **Case studies:** add a `case_study` block to a project in `projects.json` and its page `/case-studies/<slug>` is created and linked automatically. Add real numbers under `results` (`[{"value": "...", "label": "..."}]`) when you have them; the section appears only if there are results.
- **Real screenshots:** drop `static/assets/screens/<project-slug>.webp` (or .jpg/.png) and that project's browser-frame thumbnail uses it instead of the logo.
- **Media kit:** after changing pricing/projects, run `pip install reportlab && python scripts/build_media_kit.py` to regenerate `static/downloads/Stackwave-Developers-Media-Kit.pdf`.

## Deployment notes

- Set a `SECRET_KEY` environment variable in production (the app logs a warning if it is missing). It signs sessions and form tokens.
- Set `SESSION_COOKIE_SECURE=1` in production so the session cookie is only sent over HTTPS.
- `static/css/styles.css` is compiled Tailwind and its config is not in this repo, so new styles go in `static/css/site.css`.
- The `contact_submissions` table gained `package`, `addons` and `ip_hash` columns. They are added automatically on startup; existing rows are untouched.
