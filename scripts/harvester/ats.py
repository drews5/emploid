import os
import re
from typing import Any
from urllib.parse import urlparse

import httpx

from .utils import infer_remote_type, parse_datetime, slugify


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
    page_size = _env_int("LEVER_PAGE_SIZE", 100)
    max_pages = _env_int("LEVER_MAX_PAGES", 30)
    payload = []
    with _client() as client:
        for page in range(max_pages):
            response = client.get(url, params={"mode": "json", "limit": page_size, "skip": page * page_size})
            response.raise_for_status()
            chunk = response.json()
            if not isinstance(chunk, list) or not chunk:
                break
            payload.extend(chunk)
            if len(chunk) < page_size:
                break

    jobs = []
    for job in payload:
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
    page_size = _env_int("SMARTRECRUITERS_PAGE_SIZE", 100)
    max_pages = _env_int("SMARTRECRUITERS_MAX_PAGES", 30)
    payloads = []
    with _client() as client:
        offset = 0
        for _page in range(max_pages):
            response = client.get(url, params={"limit": page_size, "offset": offset})
            response.raise_for_status()
            payload = response.json()
            content = payload.get("content", [])
            payloads.extend(content)

            if not content:
                break
            total = _coerce_int(payload.get("totalFound") or payload.get("total"))
            offset += len(content)
            if len(content) < page_size or (total is not None and offset >= total):
                break

    jobs = []
    for job in payloads:
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


def fetch_workday(config: str) -> list[dict[str, Any]]:
    company_name, search_url = _parse_workday_config(config)
    page_size = _env_int("WORKDAY_PAGE_SIZE", 100)
    max_jobs = _env_int("WORKDAY_MAX_JOBS_PER_BOARD", 500)
    max_pages = max(1, (max_jobs + page_size - 1) // page_size)
    postings: list[dict[str, Any]] = []

    with _client() as client:
        for page in range(max_pages):
            offset = page * page_size
            response = client.post(
                search_url,
                json={
                    "appliedFacets": {},
                    "limit": page_size,
                    "offset": offset,
                    "searchText": "",
                },
            )
            response.raise_for_status()
            payload = response.json()
            chunk = payload.get("jobPostings") or payload.get("jobs") or []
            postings.extend(chunk)
            total = _coerce_int(payload.get("total") or payload.get("totalFound"))
            if not chunk or len(chunk) < page_size or len(postings) >= max_jobs or (total is not None and len(postings) >= total):
                break

    endpoint = _workday_endpoint_parts(search_url)
    company_slug = slugify(company_name)
    jobs = []
    for posting in postings[:max_jobs]:
        title = posting.get("title")
        external_path = posting.get("externalPath") or posting.get("jobPostingUrl")
        source_url = _workday_public_url(endpoint, external_path) or search_url
        source_job_id = _workday_job_id(posting, external_path)
        location = posting.get("locationsText") or posting.get("location")
        description = posting.get("jobDescription") or posting.get("description") or ""
        jobs.append({
            "source_provider": "workday",
            "source_job_id": source_job_id,
            "company_slug": company_slug,
            "company_name": company_name,
            "title": title,
            "location": location,
            "remote_type": infer_remote_type(location, title, description),
            "department": None,
            "employment_type": None,
            "description_html": description,
            "apply_url": source_url,
            "source_url": source_url,
            "posted_at": _parse_workday_posted_on(posting.get("postedOn")),
            "last_edited_at": None,
            "raw": posting,
        })
    return jobs


FETCHERS = {
    "greenhouse": fetch_greenhouse,
    "lever": fetch_lever,
    "ashby": fetch_ashby,
    "smartrecruiters": fetch_smartrecruiters,
    "workday": fetch_workday,
}


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if not value:
        return default
    try:
        return max(1, int(value))
    except ValueError:
        return default


def _coerce_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _parse_workday_config(config: str) -> tuple[str, str]:
    if "|" in config:
        name, url = config.split("|", 1)
    else:
        url = config
        parsed = urlparse(url)
        name = (parsed.hostname or "workday").split(".")[0]
    return name.strip(), url.strip()


def _workday_endpoint_parts(search_url: str) -> dict[str, str | None]:
    parsed = urlparse(search_url)
    parts = [part for part in parsed.path.split("/") if part]
    tenant = parts[2] if len(parts) >= 5 and parts[0] == "wday" and parts[1] == "cxs" else None
    site = parts[3] if len(parts) >= 5 and parts[0] == "wday" and parts[1] == "cxs" else None
    return {"host": parsed.netloc, "tenant": tenant, "site": site}


def _workday_public_url(endpoint: dict[str, str | None], external_path: str | None) -> str | None:
    if not endpoint.get("host") or not endpoint.get("site") or not external_path:
        return None
    if external_path.startswith("http"):
        return external_path
    path = external_path if external_path.startswith("/") else f"/{external_path}"
    return f"https://{endpoint['host']}/en-US/{endpoint['site']}{path}"


def _workday_job_id(posting: dict[str, Any], external_path: str | None) -> str:
    bullet_fields = posting.get("bulletFields") or []
    if bullet_fields:
        return str(bullet_fields[0])
    return str(posting.get("id") or posting.get("jobId") or external_path or posting.get("title"))


def _parse_workday_posted_on(value: str | None) -> str | None:
    if not value:
        return None
    from datetime import datetime, timedelta, timezone

    text = str(value).strip().lower()
    now = datetime.now(timezone.utc)
    if "today" in text:
        return now.isoformat()
    if "yesterday" in text:
        return (now - timedelta(days=1)).isoformat()
    match = re.search(r"(\d+)", text)
    if match and "day" in text:
        return (now - timedelta(days=int(match.group(1)))).isoformat()
    return parse_datetime(value)
