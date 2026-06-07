import json
import os
from collections import Counter

from supabase import create_client


def load_env_file():
    values = {}
    if not os.path.exists(".env.local"):
        return values
    with open(".env.local", encoding="utf-8") as handle:
        for line in handle:
            if "=" in line and not line.lstrip().startswith("#"):
                key, value = line.rstrip("\n").split("=", 1)
                values[key] = value
    return values


ENV = {**load_env_file(), **os.environ}
SUPABASE_URL = ENV.get("SUPABASE_URL") or ENV.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = ENV.get("SUPABASE_SERVICE_KEY") or ENV.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_KEY are required")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)


def size_range(employees: int | None) -> str | None:
    if employees is None:
        return None
    if employees <= 50:
        return "1-50"
    if employees <= 200:
        return "51-200"
    if employees <= 500:
        return "201-500"
    if employees <= 1000:
        return "501-1000"
    if employees <= 5000:
        return "1001-5000"
    return "5000+"


COMPANY_PROFILES = {
    "airbnb": {
        "name": "Airbnb",
        "industry": "Travel technology",
        "employee_count": 7300,
        "founded_year": 2007,
        "hq_location": "San Francisco, CA",
        "website": "https://www.airbnb.com",
        "careers_page_url": "https://careers.airbnb.com",
    },
    "anthropic": {
        "name": "Anthropic",
        "industry": "Artificial intelligence",
        "employee_count": 1200,
        "founded_year": 2021,
        "hq_location": "San Francisco, CA",
        "website": "https://www.anthropic.com",
        "careers_page_url": "https://www.anthropic.com/careers",
    },
    "dropbox": {
        "name": "Dropbox",
        "industry": "Cloud storage and collaboration software",
        "employee_count": 2200,
        "founded_year": 2007,
        "hq_location": "San Francisco, CA",
        "website": "https://www.dropbox.com",
        "careers_page_url": "https://jobs.dropbox.com",
    },
    "linear": {
        "name": "Linear",
        "industry": "Software development tools",
        "employee_count": 150,
        "founded_year": 2019,
        "hq_location": "San Francisco, CA",
        "website": "https://linear.app",
        "careers_page_url": "https://linear.app/careers",
    },
    "notion": {
        "name": "Notion",
        "industry": "Productivity software",
        "employee_count": 1000,
        "founded_year": 2016,
        "hq_location": "San Francisco, CA",
        "website": "https://www.notion.com",
        "careers_page_url": "https://www.notion.com/careers",
    },
    "ramp": {
        "name": "Ramp",
        "industry": "Financial technology",
        "employee_count": 1000,
        "founded_year": 2019,
        "hq_location": "New York, NY",
        "website": "https://ramp.com",
        "careers_page_url": "https://ramp.com/careers",
    },
    "robinhood": {
        "name": "Robinhood",
        "industry": "Financial technology",
        "employee_count": 2300,
        "founded_year": 2013,
        "hq_location": "Menlo Park, CA",
        "website": "https://robinhood.com",
        "careers_page_url": "https://careers.robinhood.com",
    },
    "stripe": {
        "name": "Stripe",
        "industry": "Financial technology",
        "employee_count": 7000,
        "founded_year": 2010,
        "hq_location": "South San Francisco, CA and Dublin, Ireland",
        "website": "https://stripe.com",
        "careers_page_url": "https://stripe.com/jobs",
    },
    "vercel": {
        "name": "Vercel",
        "industry": "Cloud application platform",
        "employee_count": 700,
        "founded_year": 2015,
        "hq_location": "San Francisco, CA",
        "website": "https://vercel.com",
        "careers_page_url": "https://vercel.com/careers",
    },
    "visa": {
        "name": "Visa",
        "industry": "Payments technology",
        "employee_count": 31600,
        "founded_year": 1958,
        "hq_location": "San Francisco, CA",
        "website": "https://usa.visa.com",
        "careers_page_url": "https://usa.visa.com/careers.html",
    },
}


TOP_EMPLOYERS = [
    ("walmart", "Walmart", "Retail", 2100000, 1962, "Bentonville, AR", "https://www.walmart.com", "https://careers.walmart.com"),
    ("amazon", "Amazon", "Internet retail and cloud computing", 1546000, 1994, "Seattle, WA", "https://www.amazon.com", "https://www.amazon.jobs"),
    ("fedex", "FedEx", "Logistics", 510000, 1971, "Memphis, TN", "https://www.fedex.com", "https://careers.fedex.com"),
    ("ups", "UPS", "Logistics", 490000, 1907, "Atlanta, GA", "https://www.ups.com", "https://www.jobs-ups.com"),
    ("home-depot", "The Home Depot", "Home improvement retail", 463100, 1978, "Atlanta, GA", "https://www.homedepot.com", "https://careers.homedepot.com"),
    ("target", "Target", "Retail", 440000, 1902, "Minneapolis, MN", "https://www.target.com", "https://corporate.target.com/careers"),
    ("kroger", "Kroger", "Grocery retail", 414000, 1883, "Cincinnati, OH", "https://www.kroger.com", "https://www.thekrogerco.com/careers"),
    ("unitedhealth-group", "UnitedHealth Group", "Healthcare", 400000, 1977, "Minnetonka, MN", "https://www.unitedhealthgroup.com", "https://www.unitedhealthgroup.com/careers.html"),
    ("berkshire-hathaway", "Berkshire Hathaway", "Conglomerate", 396500, 1839, "Omaha, NE", "https://www.berkshirehathaway.com", "https://www.berkshirehathaway.com/subs/sublinks.html"),
    ("cvs-health", "CVS Health", "Healthcare and pharmacy retail", 300000, 1963, "Woonsocket, RI", "https://www.cvshealth.com", "https://jobs.cvshealth.com"),
    ("starbucks", "Starbucks", "Restaurants", 381000, 1971, "Seattle, WA", "https://www.starbucks.com", "https://www.starbucks.com/careers"),
    ("mcdonalds", "McDonald's", "Restaurants", 150000, 1940, "Chicago, IL", "https://www.mcdonalds.com", "https://careers.mcdonalds.com"),
]


def fetch_active_jobs():
    rows = []
    start = 0
    page_size = 1000
    while True:
        chunk = (
            sb.table("jobs")
            .select("id,company_id,ghost_score,source_provider,is_active,posted_at,first_seen_at,last_seen_at")
            .eq("is_active", True)
            .range(start, start + page_size - 1)
            .execute()
            .data
            or []
        )
        rows.extend(chunk)
        if len(chunk) < page_size:
            return rows
        start += page_size


def compute_company_scores(active_jobs):
    by_company = {}
    for job in active_jobs:
        by_company.setdefault(job["company_id"], []).append(job)

    scores = {}
    for company_id, jobs in by_company.items():
        providers = Counter(job.get("source_provider") or "unknown" for job in jobs)
        avg_listing_score = sum(int(job.get("ghost_score") or 60) for job in jobs) / max(1, len(jobs))
        provider_bonus = 0.05 if any(provider in providers for provider in ["greenhouse", "lever", "ashby"]) else 0
        volume_penalty = 0.0
        if len(jobs) > 350:
            volume_penalty = 0.04
        elif len(jobs) > 150:
            volume_penalty = 0.02

        score = (avg_listing_score / 100) * 0.65 + 0.25 + provider_bonus - volume_penalty
        score = max(0.35, min(0.92, round(score, 2)))
        scores[company_id] = {
            "trust_score": score,
            "signals": {
                "active_job_count": len(jobs),
                "avg_listing_score": round(avg_listing_score, 1),
                "source_mix": dict(providers),
                "provider_bonus": provider_bonus,
                "volume_penalty": volume_penalty,
                "method": "listing_quality_plus_direct_ats_prior",
            },
            "flags": ["limited_closure_history"],
        }
    return scores


def upsert_company_profile(slug, profile, score_data=None, top_employer=False):
    payload = {
        "slug": slug,
        "canonical_key": slug,
        "name": profile["name"],
        "industry": profile["industry"],
        "employee_count": profile["employee_count"],
        "size_range": size_range(profile["employee_count"]),
        "founded_year": profile["founded_year"],
        "hq_location": profile["hq_location"],
        "website": profile["website"],
        "careers_page_url": profile["careers_page_url"],
    }

    if score_data:
        payload.update({
            "trust_score": score_data["trust_score"],
            "trust_flags": score_data["flags"],
            "trust_signals": score_data["signals"],
            "observation_count": 0,
        })
    elif top_employer:
        payload.update({
            "trust_score": 0.72,
            "trust_flags": ["top_us_employer", "limited_emploid_history"],
            "trust_signals": {
                "employee_count": profile["employee_count"],
                "method": "top_employer_scale_prior",
            },
            "observation_count": 0,
        })

    result = sb.table("companies").upsert(payload, on_conflict="slug").execute()
    if result.data:
        company_id = result.data[0]["id"]
        selected = sb.table("companies").select("id,slug,name,trust_score").eq("id", company_id).limit(1).execute()
        return selected.data[0] if selected.data else result.data[0]
    selected = sb.table("companies").select("id,slug,name,trust_score").eq("slug", slug).limit(1).execute()
    return selected.data[0] if selected.data else None


def main():
    active_jobs = fetch_active_jobs()
    scores = compute_company_scores(active_jobs)
    companies = sb.table("companies").select("id,slug,name").execute().data or []
    companies_by_slug = {row["slug"]: row for row in companies}

    updated = 0
    for slug, profile in COMPANY_PROFILES.items():
        company = companies_by_slug.get(slug)
        score_data = scores.get(company["id"]) if company else None
        updated_company = upsert_company_profile(slug, profile, score_data)
        updated += 1
        if updated_company and updated_company.get("id") in scores:
            sb.table("jobs").update({
                "company_trust_score": scores[updated_company["id"]]["trust_score"],
                "ghost_factors": {
                    "company_trust_score": scores[updated_company["id"]]["trust_score"],
                    "company_signals": scores[updated_company["id"]]["signals"],
                },
            }).eq("company_id", updated_company["id"]).execute()

    for item in TOP_EMPLOYERS:
        slug, name, industry, employees, founded, hq, website, careers = item
        upsert_company_profile(slug, {
            "name": name,
            "industry": industry,
            "employee_count": employees,
            "founded_year": founded,
            "hq_location": hq,
            "website": website,
            "careers_page_url": careers,
        }, top_employer=True)
        updated += 1

    print(json.dumps({
        "active_jobs": len(active_jobs),
        "companies_enriched": updated,
        "companies_with_job_scores": len(scores),
    }, indent=2))


if __name__ == "__main__":
    main()
