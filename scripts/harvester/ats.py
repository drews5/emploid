import os
from typing import Any

import httpx

from .utils import infer_remote_type, parse_datetime


USER_AGENT = os.getenv("HARVESTER_USER_AGENT", "EmploidJobHarvester/1.0")


def _client() -> httpx.Client:
    return httpx.Client(
        timeout=30,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        },
        follow_redirects=True,
    )


def fetch_greenhouse(slug: str) -> list[dict[str, Any]]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
    with _client() as client:
      response = client.get(url, params={"content": "true"})
      response.raise_for_status()
      payload = response.json()

    jobs = []
    for job in payload.get("jobs", []):
        location = (job.get("location") or {}).get("name") if isinstance(job.get("location"), dict) else job.get("location")
        departments = job.get("departments") or []
        jobs.append({
            "source_provider": "greenhouse",
            "source_job_id": str(job.get("id")),
            "company_slug": slug,
            "company_name": slug.replace("-", " ").title(),
            "title": job.get("title"),
            "location": location,
            "remote_type": infer_remote_type(location, job.get("title")),
            "department": departments[0].get("name") if departments and isinstance(departments[0], dict) else None,
            "employment_type": None,
            "description_html": job.get("content") or "",
            "apply_url": job.get("absolute_url") or f"https://boards.greenhouse.io/{slug}/jobs/{job.get('id')}",
            "source_url": f"https://boards.greenhouse.io/{slug}/jobs/{job.get('id')}",
            "posted_at": parse_datetime(job.get("updated_at")),
            "last_edited_at": parse_datetime(job.get("updated_at")),
            "raw": job,
        })
    return jobs


def fetch_lever(slug: str) -> list[dict[str, Any]]:
    url = f"https://api.lever.co/v0/postings/{slug}"
    with _client() as client:
        response = client.get(url, params={"mode": "json"})
        response.raise_for_status()
        payload = response.json()

    jobs = []
    for job in payload if isinstance(payload, list) else []:
        categories = job.get("categories") or {}
        location = categories.get("location")
        jobs.append({
            "source_provider": "lever",
            "source_job_id": str(job.get("id")),
            "company_slug": slug,
            "company_name": slug.replace("-", " ").title(),
            "title": job.get("text"),
            "location": location,
            "remote_type": infer_remote_type(location, job.get("text"), job.get("descriptionPlain")),
            "department": categories.get("team"),
            "employment_type": categories.get("commitment"),
            "description_html": job.get("description") or job.get("descriptionPlain") or "",
            "apply_url": job.get("hostedUrl") or job.get("applyUrl"),
            "source_url": job.get("hostedUrl") or job.get("applyUrl"),
            "posted_at": parse_datetime(job.get("createdAt")),
            "last_edited_at": parse_datetime(job.get("updatedAt") or job.get("createdAt")),
            "raw": job,
        })
    return jobs


def fetch_ashby(slug: str) -> list[dict[str, Any]]:
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
    with _client() as client:
        response = client.get(url, params={"includeCompensation": "true"})
        response.raise_for_status()
        payload = response.json()

    jobs = []
    for job in payload.get("jobs", []):
        location = job.get("locationName")
        jobs.append({
            "source_provider": "ashby",
            "source_job_id": str(job.get("id")),
            "company_slug": slug,
            "company_name": slug.replace("-", " ").title(),
            "title": job.get("title"),
            "location": location,
            "remote_type": infer_remote_type(location, job.get("title"), job.get("descriptionHtml")),
            "department": job.get("departmentName"),
            "employment_type": job.get("employmentType"),
            "description_html": job.get("descriptionHtml") or "",
            "apply_url": job.get("jobUrl"),
            "source_url": job.get("jobUrl"),
            "posted_at": parse_datetime(job.get("publishedDate")),
            "last_edited_at": parse_datetime(job.get("updatedAt") or job.get("publishedDate")),
            "raw": job,
        })
    return jobs


def fetch_smartrecruiters(slug: str) -> list[dict[str, Any]]:
    url = f"https://api.smartrecruiters.com/v1/companies/{slug}/postings"
    with _client() as client:
        response = client.get(url)
        response.raise_for_status()
        payload = response.json()

    jobs = []
    for job in payload.get("content", []):
        location_obj = job.get("location") or {}
        location = location_obj.get("city") or location_obj.get("region") or location_obj.get("country")
        ref = job.get("ref") or job.get("id")
        source_url = job.get("ref") or job.get("applyUrl") or f"https://jobs.smartrecruiters.com/{slug}/{job.get('id')}"
        jobs.append({
            "source_provider": "smartrecruiters",
            "source_job_id": str(job.get("id") or ref),
            "company_slug": slug.lower(),
            "company_name": slug.replace("-", " ").title(),
            "title": job.get("name"),
            "location": location,
            "remote_type": infer_remote_type(location, job.get("name")),
            "department": (job.get("department") or {}).get("label") if isinstance(job.get("department"), dict) else None,
            "employment_type": (job.get("typeOfEmployment") or {}).get("label") if isinstance(job.get("typeOfEmployment"), dict) else None,
            "description_html": job.get("jobAd", {}).get("sections", {}).get("jobDescription", {}).get("text", "") if isinstance(job.get("jobAd"), dict) else "",
            "apply_url": job.get("applyUrl") or source_url,
            "source_url": source_url,
            "posted_at": parse_datetime(job.get("releasedDate")),
            "last_edited_at": parse_datetime(job.get("updatedDate") or job.get("releasedDate")),
            "raw": job,
        })
    return jobs


FETCHERS = {
    "greenhouse": fetch_greenhouse,
    "lever": fetch_lever,
    "ashby": fetch_ashby,
    "smartrecruiters": fetch_smartrecruiters,
}
