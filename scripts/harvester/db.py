import json
import os
import uuid
from typing import Any
from urllib.parse import quote

import requests
from appwrite.query import Query

from .utils import slugify, utcnow_iso


ENDPOINT = (os.getenv("APPWRITE_ENDPOINT") or "").rstrip("/")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID") or ""
API_KEY = os.getenv("APPWRITE_API_KEY") or ""
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID") or "emploid"


def _require_config() -> None:
    if not ENDPOINT or not PROJECT_ID or not API_KEY:
        raise RuntimeError("APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY are required")


def _url(collection: str, document_id: str | None = None) -> str:
    base = f"{ENDPOINT}/databases/{quote(DATABASE_ID)}/collections/{quote(collection)}/documents"
    return f"{base}/{quote(document_id)}" if document_id else base


def _request(method: str, collection: str, document_id: str | None = None, *, queries=None, body=None) -> dict[str, Any]:
    _require_config()
    params = [("queries[]", query) for query in queries or []]
    response = requests.request(
        method,
        _url(collection, document_id),
        headers={
            "X-Appwrite-Project": PROJECT_ID,
            "X-Appwrite-Key": API_KEY,
            "Content-Type": "application/json",
        },
        params=params,
        json=body,
        timeout=60,
    )
    if response.status_code >= 400:
        message = response.json().get("message", response.text)
        raise RuntimeError(f"Appwrite {response.status_code}: {message}")
    return response.json() if response.content else {}


def _decode(collection: str, row: dict[str, Any]) -> dict[str, Any]:
    result = dict(row)
    result["id"] = row.get("$id")
    result.setdefault("created_at", row.get("$createdAt"))
    result.setdefault("updated_at", row.get("$updatedAt"))
    json_fields = {
        "companies": ("trust_flags", "trust_signals"),
        "jobs": ("ghost_factors", "trust_flags"),
    }
    for field in json_fields.get(collection, ()):
        if isinstance(result.get(field), str):
            try:
                result[field] = json.loads(result[field])
            except json.JSONDecodeError:
                pass
    return result


def _fit_json(value: Any, maximum: int) -> str | None:
    if value is None:
        return None
    encoded = json.dumps(value, separators=(",", ":"))
    if len(encoded) <= maximum:
        return encoded
    return "[]" if isinstance(value, list) else "{}"


def _clean(collection: str, payload: dict[str, Any]) -> dict[str, Any]:
    result = {key: value for key, value in payload.items() if value is not None and key != "id"}
    if collection == "jobs":
        limits = {
            "title": 500, "company_id": 36, "location": 500, "remote_type": 32,
            "description": 7000, "source": 100, "source_url": 2048, "apply_url": 2048,
            "experience_level": 50, "job_type": 50, "ghost_label": 50,
            "source_provider": 100, "source_job_id": 500, "external_source": 128,
            "description_hash": 255, "canonical_company_key": 255,
        }
        for field, maximum in limits.items():
            if isinstance(result.get(field), str):
                result[field] = result[field][:maximum]
        if "ghost_factors" in result:
            result["ghost_factors"] = _fit_json(result["ghost_factors"], 750)
        if "trust_flags" in result:
            result["trust_flags"] = _fit_json(result["trust_flags"], 750)
    elif collection == "companies":
        if "trust_flags" in result:
            result["trust_flags"] = _fit_json(result["trust_flags"], 1500)
        if "trust_signals" in result:
            result["trust_signals"] = _fit_json(result["trust_signals"], 3000)
    return result


def _list(collection: str, queries: list[str]) -> list[dict[str, Any]]:
    response = _request("GET", collection, queries=queries)
    return [_decode(collection, row) for row in response.get("documents", [])]


def _list_all(collection: str, filters: list[str], limit: int) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for start in range(0, limit, 100):
        page_size = min(100, limit - start)
        chunk = _list(collection, [*filters, Query.limit(page_size), Query.offset(start)])
        rows.extend(chunk)
        if len(chunk) < page_size:
            break
    return rows


def _create(collection: str, payload: dict[str, Any], document_id: str | None = None) -> dict[str, Any]:
    row_id = document_id or str(uuid.uuid4())
    response = _request("POST", collection, body={"documentId": row_id, "data": _clean(collection, payload)})
    return _decode(collection, response)


def _update(collection: str, document_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = _request("PATCH", collection, document_id, body={"data": _clean(collection, payload)})
    return _decode(collection, response)


def create_crawl_run(source: str) -> str | None:
    try:
        return _create("crawl_runs", {"source": source, "started_at": utcnow_iso()})["id"]
    except Exception as exc:
        print(f"[DB] Could not create crawl run: {exc}")
    return None


def finish_crawl_run(run_id: str | None, stats: dict[str, Any]) -> None:
    if not run_id:
        return
    payload = {
        "finished_at": utcnow_iso(),
        "jobs_seen": stats.get("seen", 0),
        "jobs_new": stats.get("new", 0),
        "jobs_updated": stats.get("updated", 0),
        "jobs_deactivated": stats.get("deactivated", 0),
        "errors": stats.get("errors", 0),
        "notes": stats.get("notes", ""),
    }
    try:
        _update("crawl_runs", run_id, payload)
    except Exception as exc:
        print(f"[DB] Could not finish crawl run {run_id}: {exc}")


def fetch_existing_jobs(provider: str | None = None, limit: int = 30000) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    filters = [Query.equal("source_provider", provider)] if provider else []
    return _list_all("jobs", filters, limit)


def fetch_discovery_sources(limit: int = 1500) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    try:
        sources.extend(_list_all("companies", [], limit))
    except Exception as exc:
        print(f"[DISCOVERY] could not read companies: {exc}")
    try:
        sources.extend(_list_all("jobs", [Query.equal("is_active", True)], limit))
    except Exception as exc:
        print(f"[DISCOVERY] could not read jobs: {exc}")
    return sources


def resolve_company(job: dict[str, Any], company_scores: dict[str, dict] | None = None) -> dict[str, Any]:
    name = (job.get("company_name") or job.get("company_slug") or "Unknown Company").strip()
    slug = slugify(job.get("company_slug") or name)
    score_data = (company_scores or {}).get(job.get("canonical_company_key") or "", {})
    payload = {
        "name": name,
        "slug": slug,
        "canonical_key": job.get("canonical_company_key"),
        "last_crawled_at": utcnow_iso(),
    }
    if score_data:
        payload.update({
            "trust_score": score_data.get("trust_score"),
            "trust_flags": score_data.get("trust_flags", []),
            "trust_signals": score_data.get("signals", {}),
            "observation_count": score_data.get("observation_count", 0),
        })

    existing = _list("companies", [Query.equal("slug", slug), Query.limit(1)])
    if existing:
        return _update("companies", existing[0]["id"], payload)
    return _create("companies", payload)


def upsert_job(job: dict[str, Any], company: dict[str, Any], existing: dict[str, Any] | None = None) -> str:
    if not existing and job.get("source_provider") and job.get("source_job_id"):
        rows = _list("jobs", [
            Query.equal("source_provider", job["source_provider"]),
            Query.equal("source_job_id", job["source_job_id"]),
            Query.limit(1),
        ])
        existing = rows[0] if rows else None

    if not existing and job.get("source_url"):
        rows = _list("jobs", [Query.equal("source_url", job["source_url"][:2048]), Query.limit(1)])
        existing = rows[0] if rows else None

    payload = _job_payload(job, company)
    if existing:
        if job.get("source_provider") != "jsearch" and _job_unchanged(existing, payload):
            return "unchanged"
        _update("jobs", existing["id"], payload)
        return "updated"

    payload["first_seen_at"] = utcnow_iso()
    _create("jobs", payload)
    return "new"


def deactivate_missing_ats(provider: str, company_id: str, seen_source_job_ids: set[str]) -> int:
    rows = _list_all("jobs", [
        Query.equal("source_provider", provider), Query.equal("company_id", company_id),
        Query.equal("is_active", True),
    ], 1000)
    stale = [row for row in rows if row.get("source_job_id") and row["source_job_id"] not in seen_source_job_ids]
    for row in stale:
        _update("jobs", row["id"], {"is_active": False})
    return len(stale)


def expire_old_jsearch(days: int = 21) -> int:
    from .utils import age_days

    rows = _list_all("jobs", [Query.equal("source_provider", "jsearch"), Query.equal("is_active", True)], 1000)
    stale = [row for row in rows if (age_days(row.get("last_seen_at")) or 0) > days]
    for row in stale:
        _update("jobs", row["id"], {"is_active": False})
    return len(stale)


def _job_payload(job: dict[str, Any], company: dict[str, Any]) -> dict[str, Any]:
    title = (job.get("title") or "").strip()
    if not title:
        raise ValueError("job title is required")
    apply_url = job.get("apply_url") or job.get("source_url")
    if not apply_url:
        raise ValueError(f"apply_url is required for {title}")
    return {
        "company_id": company["id"], "title": title, "location": job.get("location"),
        "remote_type": _remote_type(job.get("remote_type")),
        "description": job.get("description_html") or job.get("description_text") or "",
        "source": job.get("source"), "source_provider": job.get("source_provider"),
        "source_job_id": job.get("source_job_id"), "external_source": job.get("external_source"),
        "source_url": job.get("source_url") or apply_url, "apply_url": apply_url,
        "job_type": _job_type(job.get("employment_type")), "posted_at": job.get("posted_at"),
        "last_edited_at": job.get("last_edited_at"), "last_seen_at": utcnow_iso(), "is_active": True,
        "description_hash": job.get("description_hash"), "ghost_score": job.get("ghost_score"),
        "ghost_factors": {"flags": job.get("trust_flags", []), "company_trust_score": job.get("company_trust_score")},
        "ghost_label": _ghost_label(job.get("ghost_score")), "trust_flags": job.get("trust_flags", []),
        "company_trust_score": job.get("company_trust_score"),
        "canonical_company_key": job.get("canonical_company_key"),
    }


def _job_unchanged(existing: dict[str, Any], payload: dict[str, Any]) -> bool:
    fields = ("company_id", "title", "location", "remote_type", "source", "source_provider", "source_job_id", "source_url", "apply_url", "job_type", "description_hash", "ghost_score", "company_trust_score", "canonical_company_key", "trust_flags")
    return existing.get("is_active") is True and all(existing.get(field) == payload.get(field) for field in fields)


def _remote_type(value: str | None) -> str:
    value = (value or "").lower()
    return value if value in {"remote", "hybrid", "onsite"} else "onsite"


def _job_type(value: str | None) -> str | None:
    text = (value or "").lower()
    if "part" in text: return "part-time"
    if "contract" in text or "temporary" in text: return "contract"
    if "intern" in text: return "internship"
    if "full" in text: return "full-time"
    return None


def _ghost_label(score: int | None) -> str | None:
    if score is None: return None
    if score >= 80: return "Verified"
    if score >= 50: return "Uncertain"
    return "Likely Ghost"
