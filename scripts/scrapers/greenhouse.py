import sys
import time
import requests
from typing import List, Dict, Any
from base import BaseScraper


class GreenhouseScraper(BaseScraper):
    """
    Scrapes job listings from Greenhouse's public JSON API.
    Each company on Greenhouse has a board_token (their slug).
    API docs: https://developers.greenhouse.io/job-board.html
    """

    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    def __init__(self):
        super().__init__("company_direct")

    def scrape(self, board_token: str, location: str) -> List[Dict[str, Any]]:
        """Fetch all jobs from a Greenhouse board and optionally filter by location."""
        print(f"[GREENHOUSE] Fetching jobs from board: {board_token}", file=sys.stderr)

        try:
            resp = requests.get(
                f"{self.BASE_URL}/{board_token}/jobs",
                params={"content": "true"},
                timeout=15
            )
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"[GREENHOUSE] HTTP error for board '{board_token}': {e}", file=sys.stderr)
            return []

        data = resp.json()
        jobs_raw = data.get("jobs", [])
        print(f"[GREENHOUSE] Found {len(jobs_raw)} total listings on {board_token}", file=sys.stderr)

        results = []
        for raw in jobs_raw:
            parsed = self.parse_listing(raw, board_token)
            if not parsed:
                continue

            # Optional location filter
            if location and location.lower() not in (parsed.get("location") or "").lower():
                continue

            results.append(parsed)

        print(f"[GREENHOUSE] {len(results)} jobs matched location filter '{location}'", file=sys.stderr)
        return results

    def parse_listing(self, raw: Any, board_token: str = "") -> Dict[str, Any]:
        """Parse a single Greenhouse job object into our normalized format."""
        if not isinstance(raw, dict):
            return {}

        job_id = raw.get("id", "")
        title = raw.get("title", "")
        location_obj = raw.get("location", {})
        location_name = location_obj.get("name", "") if isinstance(location_obj, dict) else str(location_obj)

        # Determine remote type from location string
        remote_type = "onsite"
        loc_lower = location_name.lower()
        if "remote" in loc_lower:
            remote_type = "remote"
        elif "hybrid" in loc_lower:
            remote_type = "hybrid"

        # Extract description text (Greenhouse returns HTML)
        content = raw.get("content", "")

        # Board token is typically the company name/slug
        company_name = board_token.replace("-", " ").title()

        # Get the company metadata if available
        meta = raw.get("metadata", [])
        
        updated_at = raw.get("updated_at", "")
        
        return {
            "title": title,
            "company": company_name,
            "location": location_name,
            "remote_type": remote_type,
            "description": content,
            "source_url": f"https://boards.greenhouse.io/{board_token}/jobs/{job_id}",
            "apply_url": raw.get("absolute_url", f"https://boards.greenhouse.io/{board_token}/jobs/{job_id}"),
            "posted_at": updated_at or time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }


# ── CLI entry point ──────────────────────────────────────
# Usage: python greenhouse.py <board_token> [location_filter]
# Example: python greenhouse.py dropbox "San Francisco"
# Pipe output to ingest.py: python greenhouse.py dropbox "" | python ingest.py

if __name__ == "__main__":
    board_token = sys.argv[1] if len(sys.argv) > 1 else "dropbox"
    location = sys.argv[2] if len(sys.argv) > 2 else ""

    scraper = GreenhouseScraper()
    scraper.run(board_token, location)
