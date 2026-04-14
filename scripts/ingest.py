import sys
import json
import os
import re
import unicodedata
from datetime import datetime, timezone
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL", "http://localhost:54321")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")
if not key:
    print("[INGEST] FATAL: SUPABASE_SERVICE_KEY is not set.", file=sys.stderr)
    sys.exit(1)

supabase: Client = create_client(url, key)


def slugify(text: str) -> str:
    """Generate a URL-safe slug from arbitrary text.
    Handles unicode, special chars, ampersands, apostrophes, etc."""
    # Normalize unicode characters
    text = unicodedata.normalize("NFKD", text)
    # Replace common special patterns
    text = text.replace("&", "and")
    text = text.replace("'", "")
    text = text.replace("'", "")
    # Convert to ASCII, lowercase
    text = text.encode("ascii", "ignore").decode("ascii").lower()
    # Replace any non-alphanumeric chars with hyphens
    text = re.sub(r"[^a-z0-9]+", "-", text)
    # Strip leading/trailing hyphens and collapse multiples
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "unknown"


# Fields that the scraper is allowed to set/overwrite.
# This prevents nulling out existing data when the scraper omits a field.
ALLOWED_UPDATE_FIELDS = {
    "title", "location", "remote_type", "salary_min", "salary_max",
    "salary_is_estimate", "description", "source", "source_url",
    "apply_url", "experience_level", "job_type", "posted_at",
    "last_seen_at", "is_active",
}


def ingest():
    """Read normalized job JSON from stdin (one per line) and upsert into Supabase."""
    print("[INGEST] Listening on stdin for normalized jobs...", file=sys.stderr)
    inserted = 0
    updated = 0
    skipped = 0
    errors = 0

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            job_data = json.loads(line)

            # ── 1. Upsert company ──────────────────────────
            c_name = job_data.get("company")
            if not c_name:
                print(f"[INGEST] WARN: Skipping job with no company name", file=sys.stderr)
                skipped += 1
                continue

            c_slug = slugify(c_name)

            comp_resp = (
                supabase.table("companies")
                .upsert({"name": c_name, "slug": c_slug}, on_conflict="slug")
                .execute()
            )

            comp_id = None
            if comp_resp.data and len(comp_resp.data) > 0:
                comp_id = comp_resp.data[0]["id"]
            else:
                comp_query = (
                    supabase.table("companies")
                    .select("id")
                    .eq("slug", c_slug)
                    .execute()
                )
                if comp_query.data:
                    comp_id = comp_query.data[0]["id"]

            if not comp_id:
                print(f"[INGEST] ERROR: Failed to resolve company ID for '{c_name}'", file=sys.stderr)
                errors += 1
                continue

            # ── 2. Prepare job record ──────────────────────
            job_data["company_id"] = comp_id
            # Remove derived field used only for company resolution
            job_data.pop("company", None)

            # ── 3. Validate required fields ────────────────
            if not job_data.get("title"):
                print(f"[INGEST] WARN: Skipping job with no title at {c_name}", file=sys.stderr)
                skipped += 1
                continue

            if not job_data.get("apply_url"):
                print(f"[INGEST] WARN: Skipping job with no apply_url: {job_data.get('title')}", file=sys.stderr)
                skipped += 1
                continue

            # ── 4. Dedup: prefer source_url, fallback to title+company+location+source
            existing = None
            source_url = job_data.get("source_url", "").strip()

            if source_url:
                match_resp = (
                    supabase.table("jobs")
                    .select("id, repost_count, source_url")
                    .eq("source_url", source_url)
                    .execute()
                )
                if match_resp.data:
                    existing = match_resp.data[0]

            if not existing:
                # More specific dedup: include source to avoid cross-board false positives
                dedup_query = (
                    supabase.table("jobs")
                    .select("id, repost_count")
                    .eq("company_id", comp_id)
                    .eq("title", job_data.get("title", ""))
                    .eq("source", job_data.get("source", ""))
                )
                loc = job_data.get("location", "")
                if loc:
                    dedup_query = dedup_query.eq("location", loc)

                match_resp = dedup_query.execute()
                if match_resp.data:
                    existing = match_resp.data[0]

            now_iso = datetime.now(timezone.utc).isoformat()

            if existing:
                # Only update fields that are actually present and non-empty
                safe_update = {"last_seen_at": now_iso}
                for field in ALLOWED_UPDATE_FIELDS:
                    if field in job_data and job_data[field] is not None and job_data[field] != "":
                        safe_update[field] = job_data[field]

                supabase.table("jobs").update(safe_update).eq("id", existing["id"]).execute()
                updated += 1
                print(f"[INGEST] Updated: {job_data.get('title')} @ {c_name}", file=sys.stderr)
            else:
                # Insert new job
                job_data["first_seen_at"] = now_iso
                job_data["last_seen_at"] = now_iso
                new_job = supabase.table("jobs").insert(job_data).execute()
                inserted += 1
                print(f"[INGEST] Inserted: {job_data.get('title')} @ {c_name}", file=sys.stderr)

        except json.JSONDecodeError as e:
            print(f"[INGEST] ERROR: Invalid JSON: {e}", file=sys.stderr)
            errors += 1
        except Exception as e:
            print(f"[INGEST] ERROR: {e}", file=sys.stderr)
            errors += 1

    print(
        f"[INGEST] Done. Inserted: {inserted}, Updated: {updated}, Skipped: {skipped}, Errors: {errors}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    ingest()
