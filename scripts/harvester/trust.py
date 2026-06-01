from collections import Counter, defaultdict

from .utils import age_days, parse_datetime


ATS_PRIORS = {
    "greenhouse": 0.70,
    "lever": 0.70,
    "ashby": 0.70,
    "smartrecruiters": 0.60,
    "jsearch": 0.50,
}


def company_scores(existing_jobs: list[dict], incoming_jobs: list[dict]) -> dict[str, dict]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for job in [*existing_jobs, *incoming_jobs]:
        key = job.get("canonical_company_key")
        if key:
            grouped[key].append(job)

    result = {}
    for key, jobs in grouped.items():
        closed = [job for job in jobs if job.get("is_active") is False]
        active = [job for job in jobs if job.get("is_active") is not False]
        closed_under_45 = [job for job in closed if _observed_days(job) is not None and _observed_days(job) <= 45]
        stale_closed = [job for job in closed if _observed_days(job) is not None and _observed_days(job) >= 75]
        source_provider = (jobs[0].get("source_provider") or "").lower()
        prior = ATS_PRIORS.get(source_provider, 0.55)

        if len(closed) < 3:
            score = prior
            flags = ["limited_history"]
        else:
            fill_rate = len(closed_under_45) / max(1, len(closed))
            stale_rate = len(stale_closed) / max(1, len(closed))
            repost_rate = _repost_rate(jobs)
            score = 0.30 + fill_rate * 0.45 - stale_rate * 0.25 - repost_rate * 0.20
            flags = []
            if fill_rate < 0.25:
                flags.append("low_fill_rate")
            if stale_rate > 0.35:
                flags.append("stale_closure_pattern")
            if repost_rate > 0.30:
                flags.append("reposting_pattern")

        score = max(0.05, min(0.95, round(score, 2)))
        result[key] = {
            "trust_score": score,
            "trust_flags": flags,
            "observation_count": len(closed),
            "signals": {
                "active_count": len(active),
                "closed_count": len(closed),
                "closed_under_45_count": len(closed_under_45),
                "stale_closed_count": len(stale_closed),
                "repost_rate": round(_repost_rate(jobs), 2),
                "prior": prior,
            },
        }
    return result


def listing_score(job: dict, history: dict, company_score: float) -> tuple[int, list[str]]:
    raw = 1.0
    flags: list[str] = []
    posted_age = age_days(job.get("posted_at") or job.get("first_seen_at"))
    edited_age = age_days(job.get("last_edited_at"))
    never_edited = not job.get("last_edited_at") or job.get("last_edited_at") == job.get("posted_at")

    if posted_age is not None and never_edited:
        if posted_age > 90:
            raw -= 0.50
            flags.append("stale_90d_no_edits")
        elif posted_age > 45:
            raw -= 0.30
            flags.append("stale_45d_no_edits")

    same_title_count = history.get("same_title_at_company_count", 0)
    if same_title_count >= 6:
        raw -= 0.40
        flags.append("reposted_6plus_times")
    elif same_title_count >= 3:
        raw -= 0.20
        flags.append("reposted_3plus_times")

    if history.get("description_hash_reuse_count", 0) >= 5:
        raw -= 0.30
        flags.append("template_description")

    if history.get("company_post_volume_30d", 0) > 100 and history.get("same_title_company_volume", 0) > 20:
        raw -= 0.20
        flags.append("high_volume_template_role")

    title = (job.get("title") or "").lower()
    tokens = [token for token in title.split() if len(token) > 2]
    has_specificity = any(word in title for word in [
        "staff", "senior", "junior", "principal", "lead", "ii", "iii", "iv",
        "intern", "manager", "director", "payments", "platform", "frontend",
        "backend", "data", "security", "growth",
    ])
    if len(tokens) <= 3 and not has_specificity:
        raw -= 0.10
        flags.append("generic_title")

    raw = max(0.0, min(1.0, raw))
    blended = raw * 0.60 + company_score * 0.40
    capped = min(blended, company_score + 0.15)
    final = max(0.0, min(1.0, capped))

    if company_score < 0.45:
        flags.append("low_company_trust")
    elif company_score > 0.75:
        flags.append("strong_company_history")
    if edited_age is not None and edited_age <= 14:
        flags.append("recently_edited")

    return round(final * 100), flags


def build_history(rows: list[dict]) -> dict:
    same_title = Counter()
    desc_hash = Counter()
    company_volume = Counter()

    for row in rows:
        key = _title_key(row)
        if key:
            same_title[key] += 1
        if row.get("description_hash"):
            desc_hash[row["description_hash"]] += 1
        if row.get("canonical_company_key") and _age_under(row.get("first_seen_at"), 30):
            company_volume[row["canonical_company_key"]] += 1

    return {
        "same_title": same_title,
        "desc_hash": desc_hash,
        "company_volume": company_volume,
    }


def job_history(job: dict, history: dict) -> dict:
    key = _title_key(job)
    return {
        "same_title_at_company_count": history["same_title"].get(key, 0),
        "same_title_company_volume": history["same_title"].get(key, 0),
        "description_hash_reuse_count": history["desc_hash"].get(job.get("description_hash"), 0),
        "company_post_volume_30d": history["company_volume"].get(job.get("canonical_company_key"), 0),
    }


def _title_key(job: dict) -> str:
    company = (job.get("canonical_company_key") or "").strip().lower()
    title = (job.get("title") or "").strip().lower()
    return f"{company}|{title}" if company and title else ""


def _age_under(value, days: int) -> bool:
    current_age = age_days(value)
    return current_age is not None and current_age <= days


def _observed_days(job: dict):
    start = parse_datetime(job.get("first_seen_at") or job.get("posted_at"))
    end = parse_datetime(job.get("last_seen_at"))
    if not start or not end:
        return None
    from datetime import datetime
    return max(0, (datetime.fromisoformat(end) - datetime.fromisoformat(start)).days)


def _repost_rate(jobs: list[dict]) -> float:
    if not jobs:
        return 0.0
    counts = Counter(_title_key(job) for job in jobs if _title_key(job))
    reposted = sum(1 for count in counts.values() if count >= 2)
    return reposted / max(1, len(counts))
