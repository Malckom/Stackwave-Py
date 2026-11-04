"""Regenerate static/downloads/Stackwave-Developers-Media-Kit.pdf from content/*.json.

Run from the project root after editing pricing, projects or contact details:
    pip install reportlab
    python scripts/build_media_kit.py
"""
import json
import os
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Frame, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "static", "downloads", "Stackwave-Developers-Media-Kit.pdf")
LOGO = os.path.join(ROOT, "static", "assets", "logo.png")


def load(name):
    with open(os.path.join(ROOT, "content", f"{name}.json"), encoding="utf-8") as f:
        return json.load(f)


site, pricing, projects, services = load("site"), load("pricing"), load("projects"), load("services")

NAVY, BLUE, MINT = colors.HexColor("#101415"), colors.HexColor("#2e5bff"), colors.HexColor("#00b89f")
INK, MUTED, RULE, TINT = colors.HexColor("#1b2230"), colors.HexColor("#5b6475"), colors.HexColor("#d9deea"), colors.HexColor("#f2f5ff")
W, H = A4
M = 20 * mm

H1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=INK, spaceAfter=6)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=INK, spaceBefore=10, spaceAfter=4)
BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=14.5, textColor=INK, alignment=TA_LEFT)
SMALL = ParagraphStyle("small", parent=BODY, fontSize=8.5, leading=12, textColor=MUTED)
CELL = ParagraphStyle("cell", parent=BODY, fontSize=9, leading=12.5)
CELLB = ParagraphStyle("cellb", parent=CELL, fontName="Helvetica-Bold")
EYEBROW = ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=MINT, spaceAfter=4)


def p(text, style=BODY):
    return Paragraph(escape(text), style)


def cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, W, H, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#14203f"))
    canvas.circle(W * 0.9, H * 0.88, 120 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#0f2f33"))
    canvas.circle(W * 0.05, H * 0.08, 90 * mm, stroke=0, fill=1)
    canvas.drawImage(LOGO, M, H - 52 * mm, width=18 * mm, height=18 * mm * 394 / 469, mask="auto")
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 38)
    canvas.drawString(M, H * 0.52, "Media Kit")
    canvas.setFont("Helvetica-Bold", 15)
    canvas.setFillColor(colors.HexColor("#b8c3ff"))
    canvas.drawString(M, H * 0.52 - 12 * mm, site["name"])
    canvas.setFont("Helvetica", 11)
    canvas.setFillColor(colors.HexColor("#c4c5d9"))
    for i, line in enumerate(["Custom-coded websites and web platforms", "for Kenyan businesses and tour operators."]):
        canvas.drawString(M, H * 0.52 - 22 * mm - i * 6 * mm, line)
    canvas.setFillColor(BLUE)
    canvas.rect(M, H * 0.52 - 34 * mm, 24 * mm, 1.6 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#26fedc"))
    canvas.rect(M + 24 * mm, H * 0.52 - 34 * mm, 24 * mm, 1.6 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#c4c5d9"))
    canvas.setFont("Helvetica", 9.5)
    canvas.drawString(M, 24 * mm, f"{site['email']}   |   {site['phone_display']}   |   stackwavedevs.co.ke")
    canvas.setFont("Helvetica", 8.5)
    canvas.drawString(M, 18 * mm, f"{', '.join(site['office_lines'])}   |   Business registration {site['business_reg_no']}")
    canvas.restoreState()


def inner(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, H - 10 * mm, W, 10 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(M, H - 6.4 * mm, "STACKWAVE DEVELOPERS  |  MEDIA KIT")
    canvas.setStrokeColor(RULE)
    canvas.line(M, 14 * mm, W - M, 14 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(M, 9.5 * mm, f"{site['email']}  |  {site['phone_display']}  |  stackwavedevs.co.ke")
    canvas.drawRightString(W - M, 9.5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def table(rows, widths, header=True):
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    style = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
             ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
             ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4)]
    if header:
        style += [("BACKGROUND", (0, 0), (-1, 0), TINT)]
    t.setStyle(TableStyle(style))
    return t


def package_price(pkg):
    return pkg["price"] if pkg["price"] else "From " + pkg["tiers"][0]["price"].split("–")[0]


def build():
    doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=22 * mm, bottomMargin=22 * mm,
                          title="Stackwave Developers Media Kit", author=site["name"])
    full = Frame(0, 0, W, H, id="cover")
    body = Frame(M, 22 * mm, W - 2 * M, H - 44 * mm, id="body", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="cover", frames=[full], onPage=cover),
                          PageTemplate(id="inner", frames=[body], onPage=inner)])
    from reportlab.platypus import NextPageTemplate
    s = [NextPageTemplate("inner"), PageBreak()]

    # About + services
    s += [p("ABOUT US", EYEBROW), p("A Nairobi web studio that builds things from scratch", H1),
          p(f"{site['name']} designs and builds custom-coded websites and web platforms for Kenyan businesses and tour operators. "
            "Every project is hand-built rather than assembled from a drag-and-drop template, with local payment options "
            "such as M-Pesa Daraja and Paystack built in where they are needed.")
          , Spacer(1, 4),
          p("We work with Node.js and Express, Python and Flask, and React, and we know the tour and travel industry first-hand.", BODY),
          Spacer(1, 8), p("What we do", H2)]
    rows = [[p("Web Design & Architecture", CELLB), p("Custom-coded sites and platforms, from five-page business sites to booking engines and dashboards.", CELL)]]
    for sv in services:
        rows.append([p(sv["card_title"], CELLB), p(sv["card_text"], CELL)])
    s += [table(rows, [48 * mm, W - 2 * M - 48 * mm], header=False), Spacer(1, 10)]

    # Work
    s += [p("SELECTED WORK", EYEBROW), p("Sites and platforms we've built", H1)]
    status = {"live": "Live", "refurbishing": "Being refurbished", "in-build": "In build", "coming-soon": "Details coming soon"}
    rows = [[p("Project", CELLB), p("Type", CELLB), p("Status", CELLB), p("Website", CELLB)]]
    for pr in projects:
        url = (pr["url"] or "").replace("https://", "").replace("http://", "").rstrip("/")
        rows.append([p(pr["name"], CELLB), p(pr.get("type") or pr["category"], CELL), p(status.get(pr["status"], pr["status"]), CELL), p(url or "n/a", CELL)])
    s += [table(rows, [52 * mm, 38 * mm, 34 * mm, W - 2 * M - 124 * mm]), PageBreak()]

    # Pricing
    s += [p("PACKAGES & PRICING", EYEBROW), p("Transparent starting prices", H1),
          p(pricing["currency_note"] + ". These are starting prices; your final quote depends on page count, features, content readiness and integrations. To request a quote, email " + site["email"] + " or call " + site["phone_display"] + ".", SMALL),
          Spacer(1, 8)]
    rows = [[p("Package", CELLB), p("Starting price", CELLB), p("Timeline", CELLB), p("What's included", CELLB)]]
    for pk in pricing["packages"]:
        rows.append([p(pk["name"], CELLB), p(package_price(pk), CELL), p(pk["timeline"], CELL), p("; ".join(pk["features"][:3]), CELL)])
    s += [table(rows, [38 * mm, 34 * mm, 24 * mm, W - 2 * M - 96 * mm]), Spacer(1, 6), p("Add-on services", H2)]
    rows = [[p("Service", CELLB), p("Price", CELLB)]] + [[p(a["name"] + " (" + a["detail"] + ")", CELL), p(a["price"], CELL)] for a in pricing["addons"]]
    s += [table(rows, [W - 2 * M - 50 * mm, 50 * mm]), Spacer(1, 10), p("Notes", H2)]
    s += [p("•  " + n, SMALL) for n in pricing["notes"]]
    doc.build(s)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    build()
