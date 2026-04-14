#!/bin/bash
# run_scrapes.sh - Execute scrapers and pipe output to ingestion pipeline
#
# Usage: ./run_scrapes.sh
# Recommended: run via cron daily, e.g.:
#   0 6 * * * /path/to/run_scrapes.sh >> /var/log/emploid-scrape.log 2>&1

set -euo pipefail
cd "$(dirname "$0")"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting daily scrape run"

# Ensure Python dependencies are installed
pip3 install -q -r requirements.txt 2>/dev/null || true

# ── Greenhouse boards ──────────────────────────────────
# Add company board tokens here to scrape from Greenhouse
GREENHOUSE_BOARDS=(
  "dropbox"
  "retool"
  "linear"
  "vercel"
  "airbnb"
  "stripe"
)

for board in "${GREENHOUSE_BOARDS[@]}"; do
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Scraping Greenhouse board: $board"
  python3 scrapers/greenhouse.py "$board" "" | python3 ingest.py || {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR: Failed on board $board"
  }
  sleep 2  # Rate limiting between boards
done

# ── Add more scraper types here ────────────────────────
# python3 scrapers/lever.py "company-slug" "" | python3 ingest.py
# python3 scrapers/ashby.py "company-id" "" | python3 ingest.py

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Scraping complete. Triggering ghost score batch calculation..."

# ── Trigger batch ghost score recalculation ────────────
# Score all newly ingested jobs that don't have a ghost score yet
API_BASE="${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:3000}"
INTERNAL_KEY="${INTERNAL_API_KEY:-}"

if [ -n "$INTERNAL_KEY" ]; then
  curl -s -X POST "${API_BASE}/api/ghost-score/batch" \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${INTERNAL_KEY}" \
    -d '{}' || {
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] WARN: Ghost score batch call failed"
  }
  echo ""
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Ghost score batch calculation triggered"
else
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] WARN: INTERNAL_API_KEY not set, skipping ghost score calculation"
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Finished scrape run"
