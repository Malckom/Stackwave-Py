"""Create fast WebP versions of the website screenshots in static/assets/screens/.

The site prefers .webp over .png/.jpg automatically, so after running this you can delete the originals.
Run from the project root whenever you add or replace a screenshot:
    pip install pillow
    python scripts/optimize_screens.py
"""
import glob
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOLDER = os.path.join(ROOT, "static", "assets", "screens")
MAX_WIDTH = 1600   # wide enough for the large preview on a retina laptop, small enough to stay fast
QUALITY = 80

for src in sorted(glob.glob(os.path.join(FOLDER, "*.png")) + glob.glob(os.path.join(FOLDER, "*.jpg")) + glob.glob(os.path.join(FOLDER, "*.jpeg"))):
    dest = os.path.splitext(src)[0] + ".webp"
    im = Image.open(src).convert("RGB")
    if im.width > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
    im.save(dest, "WEBP", quality=QUALITY, method=6)
    print(f"{os.path.basename(src):32} {os.path.getsize(src) // 1024:>5} KB  ->  {os.path.basename(dest):34} {os.path.getsize(dest) // 1024:>4} KB")
