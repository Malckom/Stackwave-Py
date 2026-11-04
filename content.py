"""Tiny JSON content loader.

Site content (services, projects, pricing, contact details) lives in /content/*.json.
Files are re-read automatically when they change on disk, so editing a JSON file and
saving it updates the live site without restarting the app. If a file is saved with a
syntax error, the last good version keeps being served and the error is logged.
"""
import json
import logging
import os

CONTENT_DIR = os.path.join(os.path.dirname(__file__), "content")
_cache = {}


def load(name):
    path = os.path.join(CONTENT_DIR, f"{name}.json")
    mtime = os.path.getmtime(path)
    cached = _cache.get(name)
    if cached and cached[0] == mtime:
        return cached[1]
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        logging.exception("content/%s.json has a syntax error", name)
        if cached:
            return cached[1]
        raise
    _cache[name] = (mtime, data)
    return data
