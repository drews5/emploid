import os
import time
from typing import Any

import httpx

from .utils import infer_remote_type, parse_datetime


JSEARCH_HOST = "jsearch.p.rapidapi.com"


def fetch_jsearch(query_matrix: list[dict[str, str]]) -> list[dict[str, Any]]:
    api_key = os.getenv("RAPIDAPI_KEY", "").strip()
    if not api_key:
        print("[JSEARCH] RAPIDAPI_KEY not set; skipping JSearch crawl")
        return []

    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": JSEARCH_HOST,
    }
    rows: list[dict[str, Any]] = []

    with httpx.Client(timeout=30, headers=headers) as client:
        for item in query_matrix:
            title = item.get("title", "").strip()
            location = item.get("location", "").strip()
            if not title:
                continue

            search_query = f"{title} in {location}" if location else title
            response = client.get(
                f"https://{JSEARCH_HOST}/search",
                params={
                    "query": search_query,
                    "page": "1",
                    "num_pages": "1",
                    "date_posted": "week",
                },
            )
            response.raise_for_status()
            payload = response.json()
            data = payload.get("data", [])
            print(f"[JSEARCH] {search_query}: {len(data)} jobs")

            for job in data:
                rows.append(_normalize_jsearch_job(job))

            time.sleep(0.6)

    return rows


def _normalize_jsearch_job(job: dict[str, Any]) -> dict[str, Any]:
    publisher = job.get("job_publisher") or "jsearch"
    location = ", ".join(str(part) for part in [
        job.get("job_city"),
        job.get("job_state"),
        job.get("job_country"),
    ] if part) or job.get("job_location")

    return {
        "source_provider": "jsearch",
        "source_job_id": str(job.get("job_id")),
        "external_source": publisher,
        "company_slug": None,
        "company_name": job.get("employer_name"),
        "title": job.get("job_title"),
        "location": location,
        "remote_type": "remote" if job.get("job_is_remote") else infer_remote_type(location, job.get("job_title"), job.get("job_description")),
        "department": None,
        "employment_type": job.get("job_employment_type"),
        "description_html": job.get("job_description") or "",
        "apply_url": job.get("job_apply_link") or job.get("job_google_link"),
        "source_url": job.get("job_apply_link") or job.get("job_google_link"),
        "posted_at": parse_datetime(job.get("job_posted_at_datetime_utc")),
        "last_edited_at": None,
        "raw": job,
    }
