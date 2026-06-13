import os
from typing import Any

from supabase import create_client

from .utils import slugify, utcnow_iso


_client = None


def client():
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required")
        _client = create_client(url, key)
    return _client


def create_crawl_run(source: str) -> int | None:
    try:
        response = client().table("crawl_runs").insert({"source": source}).execute()
        if response.data:
            return response.data[0]["id"]
    except Exception as exc:
        print(f"[DB] Could not create crawl run: {exc}")
    return None


def finish_crawl_run(run_id: int | None, stats: dict[str, Any]) -> None:
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
        client().table("crawl_runs").update(payload, returning="minimal").eq("id", run_id).execute()
    except Exception as exc:
        print(f"[DB] Could not finish crawl run {run_id}: {exc}")


def fetch_existing_jobs(provider: str | None = None, limit: int = 30000) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    page_size = 1000
    for start in range(0, limit, page_size):
        query = client().table("jobs").select(
            "id,title,company_id,location,remote_type,source,source_provider,source_job_id,source_url,apply_url,job_type,description_hash,canonical_company_key,posted_at,first_seen_at,last_seen_at,is_active,ghost_score,company_trust_score,trust_flags"
        )
        if provider:
            query = query.eq("source_provider", provider)
        response = query.range(start, start + page_size - 1).execute()
        chunk = response.data or []
        rows.extend(chunk)
        if len(chunk) < page_size:
            break
    return rows


def fetch_discovery_sources(limit: int = 1500) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    try:
        companies = (
            client()
            .table("companies")
            .select("name,slug,website,careers_page_url")
            .limit(limit)
            .execute()
        )
        sources.extend(companies.data or [])
    except Exception as exc:
        print(f"[DISCOVERY] could not read companies: {exc}")

    try:
        jobs = (
            client()
            .table("jobs")
            .select("source_url,apply_url,source_provider")
            .eq("is_active", True)
            .limit(limit)
            .execute()
        )
        sources.extend(jobs.data or [])
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

    existing = client().table("companies").select("id").eq("slug", slug).limit(1).execute()
    if existing.data:
        company_id = existing.data[0]["id"]
        client().table("companies").update(payload, returning="minimal").eq("id", company_id).execute()
        return {"id": company_id, **payload}

    inserted = client().table("companies").insert(payload).execute()
    if not inserted.data:
        raise RuntimeError(f"Could not insert company {name}")
    return inserted.data[0]


def upsert_job(job: dict[str, Any], company: dict[str, Any], existing: dict[str, Any] | None = None) -> str:
    if not existing and job.get("source_provider") and job.get("source_job_id"):
        response = (
            client()
            .table("jobs")
            .select("id")
            .eq("source_provider", job["source_provider"])
            .eq("source_job_id", job["source_job_id"])
            .limit(1)
            .execute()
        )
        if response.data:
            existing = response.data[0]

    if not existing and job.get("source_url"):
        response = client().table("jobs").select("id").eq("source_url", job["source_url"]).limit(1).execute()
        if response.data:
            existing = response.data[0]

    payload = _job_payload(job, company)
    if existing:
        if job.get("source_provider") != "jsearch" and _job_unchanged(existing, payload):
            return "unchanged"
        client().table("jobs").update(payload, returning="minimal").eq("id", existing["id"]).execute()
        return "updated"

    payload["first_seen_at"] = utcnow_iso()
    client().table("jobs").insert(payload, returning="minimal").execute()
    return "new"


def deactivate_missing_ats(provider: str, company_id: str, seen_source_job_ids: set[str]) -> int:
    response = (
        client()
        .table("jobs")
        .select("id,source_job_id")
        .eq("source_provider", provider)
        .eq("company_id", company_id)
        .eq("is_active", True)
        .execute()
    )
    to_deactivate = [
        row["id"]
        for row in response.data or []
        if row.get("source_job_id") and row["source_job_id"] not in seen_source_job_ids
    ]
    if not to_deactivate:
        return 0
    for start in range(0, len(to_deactivate), 200):
        client().table("jobs").update(
            {"is_active": False, "updated_at": utcnow_iso()}, returning="minimal"
        ).in_("id", to_deactivate[start:start + 200]).execute()
    return len(to_deactivate)


def expire_old_jsearch(days: int = 21) -> int:
    # PostgREST date arithmetic is awkward through the Python client; keep this
    # conservative by fetching active JSearch rows and expiring old sightings.
    from .utils import age_days

    response = (
        client()
        .table("jobs")
        .select("id,last_seen_at")
        .eq("source_provider", "jsearch")
        .eq("is_active", True)
        .limit(1000)
        .execute()
    )
    old_ids = [row["id"] for row in response.data or [] if (age_days(row.get("last_seen_at")) or 0) > days]
    for start in range(0, len(old_ids), 200):
        client().table("jobs").update(
            {"is_active": False, "updated_at": utcnow_iso()}, returning="minimal"
        ).in_("id", old_ids[start:start + 200]).execute()
    return len(old_ids)


def _job_payload(job: dict[str, Any], company: dict[str, Any]) -> dict[str, Any]:
    title = (job.get("title") or "").strip()
    if not title:
        raise ValueError("job title is required")
    apply_url = job.get("apply_url") or job.get("source_url")
    if not apply_url:
        raise ValueError(f"apply_url is required for {title}")

    return {
        "company_id": company["id"],
        "title": title,
        "location": job.get("location"),
        "remote_type": _remote_type(job.get("remote_type")),
        "description": job.get("description_html") or job.get("description_text") or "",
        "source": job.get("source"),
        "source_provider": job.get("source_provider"),
        "source_job_id": job.get("source_job_id"),
        "external_source": job.get("external_source"),
        "source_url": job.get("source_url") or apply_url,
        "apply_url": apply_url,
        "job_type": _job_type(job.get("employment_type")),
        "posted_at": job.get("posted_at"),
        "last_edited_at": job.get("last_edited_at"),
        "last_seen_at": utcnow_iso(),
        "is_active": True,
        "description_hash": job.get("description_hash"),
        "ghost_score": job.get("ghost_score"),
        "ghost_factors": {"flags": job.get("trust_flags", []), "company_trust_score": job.get("company_trust_score")},
        "ghost_label": _ghost_label(job.get("ghost_score")),
        "trust_flags": job.get("trust_flags", []),
        "company_trust_score": job.get("company_trust_score"),
        "canonical_company_key": job.get("canonical_company_key"),
    }


def _job_unchanged(existing: dict[str, Any], payload: dict[str, Any]) -> bool:
    fields = (
        "company_id",
        "title",
        "location",
        "remote_type",
        "source",
        "source_provider",
        "source_job_id",
        "source_url",
        "apply_url",
        "job_type",
        "description_hash",
        "ghost_score",
        "company_trust_score",
        "canonical_company_key",
        "trust_flags",
    )
    return existing.get("is_active") is True and all(existing.get(field) == payload.get(field) for field in fields)


def _remote_type(value: str | None) -> str:
    value = (value or "").lower()
    if value in {"remote", "hybrid", "onsite"}:
        return value
    return "onsite"


def _job_type(value: str | None) -> str | None:
    text = (value or "").lower()
    if "part" in text:
        return "part-time"
    if "contract" in text or "temporary" in text:
        return "contract"
    if "intern" in text:
        return "internship"
    if "full" in text:
        return "full-time"
    return None


def _ghost_label(score: int | None) -> str | None:
    if score is None:
        return None
    if score >= 80:
        return "Verified"
    if score >= 50:
        return "Uncertain"
    return "Likely Ghost"
