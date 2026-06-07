import argparse
import os
import sys
import time
from pathlib import Path

import yaml

from . import ats, ats_discovery, db, jsearch, trust
from .utils import (
    canonical_company_key,
    description_hash,
    html_to_text,
    map_source,
    parse_datetime,
)


ROOT = Path(__file__).resolve().parent


def load_yaml(name: str):
    with open(ROOT / name, "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def normalize(raw: dict) -> dict:
    description_text = html_to_text(raw.get("description_html"))
    provider = raw.get("source_provider") or "unknown"
    source_job_id = raw.get("source_job_id")
    company_name = raw.get("company_name") or raw.get("company_slug") or "Unknown Company"
    apply_url = raw.get("apply_url") or raw.get("source_url")

    return {
        **raw,
        "source_provider": provider,
        "source_job_id": str(source_job_id) if source_job_id is not None else None,
        "company_name": company_name,
        "source": map_source(provider, raw.get("external_source")),
        "description_text": description_text,
        "description_hash": description_hash(description_text),
        "canonical_company_key": canonical_company_key(company_name, apply_url, raw.get("company_slug")),
        "posted_at": parse_datetime(raw.get("posted_at")),
        "last_edited_at": parse_datetime(raw.get("last_edited_at")),
    }


def crawl_ats(companies: dict, only_provider: str | None = None) -> tuple[list[dict], dict[tuple[str, str], set[str]]]:
    rows = []
    seen_by_company: dict[tuple[str, str], set[str]] = {}

    for provider, slugs in companies.items():
        if only_provider and provider != only_provider:
            continue
        fetcher = ats.FETCHERS.get(provider)
        if not fetcher:
            print(f"[ATS] No fetcher for provider {provider}")
            continue

        for slug in slugs or []:
            try:
                provider_rows = fetcher(str(slug))
                print(f"[ATS] {provider}/{slug}: {len(provider_rows)} jobs")
                normalized = [normalize(row) for row in provider_rows if row.get("title")]
                rows.extend(normalized)
                seen_by_company[(provider, str(slug).lower())] = {
                    row["source_job_id"] for row in normalized if row.get("source_job_id")
                }
            except Exception as exc:
                print(f"[ATS] {provider}/{slug} failed: {exc}", file=sys.stderr)
            time.sleep(0.4)

    return rows, seen_by_company


def expand_ats_boards(companies: dict, only_provider: str | None = None) -> dict:
    providers = [
        provider
        for provider in companies
        if not only_provider or provider == only_provider
    ]
    if not providers:
        return companies

    try:
        db_sources = db.fetch_discovery_sources()
        page_limit = int(os.getenv("ATS_DISCOVERY_PAGE_LIMIT", "120"))
        discovery_sources = ats_discovery.fetch_discovery_sources(db_sources, page_limit)
        expanded = ats_discovery.discover_board_slugs(
            providers=providers,
            seed_boards=companies,
            discovery_sources=discovery_sources,
        )
        for provider in providers:
            before = len(companies.get(provider, []) or [])
            after = len(expanded.get(provider, []) or [])
            if after > before:
                print(f"[DISCOVERY] {provider}: {before} seeded boards, {after} discovered boards")
        return {**companies, **expanded}
    except Exception as exc:
        print(f"[DISCOVERY] failed, using configured boards only: {exc}", file=sys.stderr)
        return companies


def run(include_jsearch: bool = False, only_provider: str | None = None) -> dict:
    stats = {"seen": 0, "new": 0, "updated": 0, "deactivated": 0, "errors": 0, "notes": ""}
    run_source = only_provider or ("all+jsearch" if include_jsearch else "all")
    run_id = db.create_crawl_run(run_source)

    companies = expand_ats_boards(load_yaml("companies.yaml"), only_provider)
    query_config = load_yaml("queries.yaml")
    raw_jobs, seen_by_company = crawl_ats(companies, only_provider)

    if include_jsearch and (not only_provider or only_provider == "jsearch"):
        try:
            raw_jobs.extend(normalize(row) for row in jsearch.fetch_jsearch(query_config.get("jsearch", [])) if row.get("title"))
        except Exception as exc:
            stats["errors"] += 1
            print(f"[JSEARCH] failed: {exc}", file=sys.stderr)

    stats["seen"] = len(raw_jobs)
    existing = db.fetch_existing_jobs()
    history = trust.build_history([*existing, *raw_jobs])
    company_score_map = trust.company_scores(existing, raw_jobs)

    for job in raw_jobs:
        score_data = company_score_map.get(job.get("canonical_company_key"), {"trust_score": 0.60})
        company_score = float(score_data.get("trust_score") or 0.60)
        ghost_score, flags = trust.listing_score(job, trust.job_history(job, history), company_score)
        job["ghost_score"] = ghost_score
        job["trust_flags"] = flags
        job["company_trust_score"] = company_score

        try:
            company = db.resolve_company(job, company_score_map)
            result = db.upsert_job(job, company)
            stats[result] += 1
        except Exception as exc:
            stats["errors"] += 1
            print(f"[UPSERT] {job.get('title')} failed: {exc}", file=sys.stderr)

    # Deactivate ATS jobs that disappeared from the provider response.
    for (provider, slug), seen_ids in seen_by_company.items():
        matching = next((job for job in raw_jobs if job.get("source_provider") == provider and (job.get("company_slug") or "").lower() == slug), None)
        if not matching:
            continue
        try:
            company = db.resolve_company(matching, company_score_map)
            stats["deactivated"] += db.deactivate_missing_ats(provider, company["id"], seen_ids)
        except Exception as exc:
            stats["errors"] += 1
            print(f"[DEACTIVATE] {provider}/{slug} failed: {exc}", file=sys.stderr)

    if include_jsearch:
        try:
            stats["deactivated"] += db.expire_old_jsearch()
        except Exception as exc:
            stats["errors"] += 1
            print(f"[JSEARCH_EXPIRE] failed: {exc}", file=sys.stderr)

    db.finish_crawl_run(run_id, stats)
    print(f"[DONE] seen={stats['seen']} new={stats['new']} updated={stats['updated']} deactivated={stats['deactivated']} errors={stats['errors']}")
    return stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Harvest ATS/JSearch jobs into Supabase and score trust inline.")
    parser.add_argument("--include-jsearch", action="store_true", help="Run configured JSearch queries. Use sparingly on low API quotas.")
    parser.add_argument("--provider", help="Only crawl one provider, e.g. greenhouse or jsearch.")
    args = parser.parse_args()
    run(include_jsearch=args.include_jsearch, only_provider=args.provider)
