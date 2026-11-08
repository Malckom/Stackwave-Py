"""Create small WebP copies of project logos for the homepage logo strip.

Run from the project root after adding or changing a logo:
    pip install pillow
    python scripts/make_logo_thumbs.py
"""
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "static", "assets", "logos", "thumbs")
MAX_H = 120  # displayed ~48px tall, so this is crisp on 2x screens without being heavy
os.makedirs(OUT, exist_ok=True)

with open(os.path.join(ROOT, "content", "projects.json"), encoding="utf-8") as f:
    projects = json.load(f)

for p in projects:
    if not p.get("logo"):
        continue
    src = os.path.join(ROOT, "static", p["logo"])
    im = Image.open(src).convert("RGBA")
    if im.height > MAX_H:  # never upscale small logos
        im = im.resize((round(im.width * MAX_H / im.height), MAX_H), Image.LANCZOS)
    dest = os.path.join(OUT, f"{p['slug']}.webp")
    im.save(dest, "WEBP", quality=88, method=6)
    print(f"{p['slug']:24} {im.size}  {os.path.getsize(dest) // 1024 or 1} KB")
