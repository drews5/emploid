import hashlib
import json
import sys

from harvester.db import resolve_company, upsert_job
from harvester.utils import slugify


def ingest() -> None:
    """Read normalized job JSON from stdin and upsert it into Appwrite."""
    print("[INGEST] Listening on stdin for normalized jobs...", file=sys.stderr)
    stats = {"new": 0, "updated": 0, "unchanged": 0, "skipped": 0, "errors": 0}

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            source = json.loads(line)
            company_name = str(source.get("company") or "").strip()
            title = str(source.get("title") or "").strip()
            apply_url = source.get("apply_url") or source.get("source_url")
            if not company_name or not title or not apply_url:
                stats["skipped"] += 1
                continue

            company_slug = slugify(company_name)
            company = resolve_company({
                "company_name": company_name,
                "company_slug": company_slug,
                "canonical_company_key": company_slug,
            })
            description = str(source.get("description") or "")
            source_url = source.get("source_url") or apply_url
            normalized = {
                "title": title,
                "company_name": company_name,
                "company_slug": company_slug,
                "canonical_company_key": company_slug,
                "location": source.get("location"),
                "remote_type": source.get("remote_type"),
                "description_html": description,
                "source": source.get("source") or "company_direct",
                "source_provider": source.get("source_provider") or "legacy_ingest",
                "source_job_id": source.get("source_job_id") or hashlib.sha256(source_url.encode()).hexdigest()[:32],
                "source_url": source_url,
                "apply_url": apply_url,
                "employment_type": source.get("job_type"),
                "posted_at": source.get("posted_at"),
                "description_hash": hashlib.sha256(description.encode()).hexdigest()[:16] if description else None,
                "ghost_score": source.get("ghost_score"),
                "trust_flags": [],
                "company_trust_score": company.get("trust_score"),
            }
            outcome = upsert_job(normalized, company)
            stats[outcome] = stats.get(outcome, 0) + 1
            print(f"[INGEST] {outcome.title()}: {title} @ {company_name}", file=sys.stderr)
        except json.JSONDecodeError as exc:
            print(f"[INGEST] Invalid JSON: {exc}", file=sys.stderr)
            stats["errors"] += 1
        except Exception as exc:
            print(f"[INGEST] ERROR: {exc}", file=sys.stderr)
            stats["errors"] += 1

    print(f"[INGEST] Done: {stats}", file=sys.stderr)


if __name__ == "__main__":
    ingest()
