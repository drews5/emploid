"""
run_scrapes.py - Cross-platform scraper runner (Windows/Mac/Linux)
Equivalent to run_scrapes.sh but written in Python.

Usage: python run_scrapes.py
"""

import subprocess
import sys
import os
import time
from datetime import datetime, timezone

# Greenhouse board tokens to scrape
GREENHOUSE_BOARDS = [
    "dropbox",
    "retool",
    "linear",
    "vercel",
    "airbnb",
    "stripe",
]

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))


def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}", file=sys.stderr)


def run_scraper(scraper_cmd: list[str]):
    """Run a scraper and pipe its output to ingest.py."""
    try:
        scraper = subprocess.Popen(
            scraper_cmd,
            stdout=subprocess.PIPE,
            stderr=sys.stderr,
            cwd=SCRIPTS_DIR,
        )
        ingest = subprocess.Popen(
            [sys.executable, "ingest.py"],
            stdin=scraper.stdout,
            stdout=sys.stderr,
            stderr=sys.stderr,
            cwd=SCRIPTS_DIR,
        )
        scraper.stdout.close()
        ingest.wait()
        scraper.wait()
    except Exception as e:
        log(f"ERROR: Scraper pipeline failed: {e}")


def trigger_ghost_score_batch():
    """Call the batch ghost score endpoint to score all unscored jobs."""
    try:
        import requests
    except ImportError:
        log("WARN: requests not installed, skipping ghost score batch")
        return

    api_base = os.environ.get("API_BASE_URL", "http://localhost:3000")
    api_key = os.environ.get("INTERNAL_API_KEY", "")

    if not api_key:
        log("WARN: INTERNAL_API_KEY not set, skipping ghost score calculation")
        return

    try:
        resp = requests.post(
            f"{api_base}/api/ghost-score/batch",
            json={},
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
            },
            timeout=120,
        )
        if resp.ok:
            data = resp.json()
            log(f"Ghost scores updated: {data.get('scored', 0)} scored, {data.get('errors', 0)} errors")
        else:
            log(f"WARN: Ghost score batch returned {resp.status_code}: {resp.text}")
    except Exception as e:
        log(f"WARN: Ghost score batch call failed: {e}")


def main():
    log("Starting daily scrape run")

    # Install dependencies
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-q", "-r",
         os.path.join(SCRIPTS_DIR, "requirements.txt")],
        capture_output=True,
    )

    # Run Greenhouse scrapers
    for board in GREENHOUSE_BOARDS:
        log(f"Scraping Greenhouse board: {board}")
        run_scraper([
            sys.executable, os.path.join(SCRIPTS_DIR, "scrapers", "greenhouse.py"),
            board, ""
        ])
        time.sleep(2)  # Rate limiting between boards

    log("Scraping complete. Triggering ghost score batch calculation...")
    trigger_ghost_score_batch()

    log("Finished scrape run")


if __name__ == "__main__":
    main()
