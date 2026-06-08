import hashlib
import re
import unicodedata
from datetime import datetime, timezone
from html import unescape
from urllib.parse import urlparse


LEGAL_SUFFIXES = {
    "inc", "incorporated", "llc", "l.l.c", "corp", "corporation", "co",
    "company", "ltd", "limited", "plc", "gmbh", "sa", "ag",
}


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_datetime(value):
    if not value:
        return None
    if isinstance(value, (int, float)):
        # JSearch and some ATSs may expose milliseconds.
        if value > 10_000_000_000:
            value = value / 1000
        return datetime.fromtimestamp(value, tz=timezone.utc).isoformat()
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(timezone.utc).isoformat()
    except ValueError:
        return None


def age_days(value):
    parsed = parse_datetime(value)
    if not parsed:
        return None
    dt = datetime.fromisoformat(parsed)
    return max(0, (datetime.now(timezone.utc) - dt).days)


def slugify(value: str) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = text.replace("&", " and ")
    text = text.encode("ascii", "ignore").decode("ascii").lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-") or "unknown"


def normalize_company_name(name: str) -> str:
    text = unicodedata.normalize("NFKD", str(name or ""))
    text = text.encode("ascii", "ignore").decode("ascii").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    parts = [part for part in text.split() if part not in LEGAL_SUFFIXES]
    return " ".join(parts).strip()


def canonical_company_key(company_name: str, apply_url: str | None = None, company_slug: str | None = None) -> str:
    domain = extract_domain(apply_url)
    if domain and not is_ats_or_aggregator_domain(domain):
        return domain
    normalized = normalize_company_name(company_name) or normalize_company_name(company_slug or "")
    return slugify(normalized)


def extract_domain(url: str | None) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url).hostname or ""
        return host.lower().removeprefix("www.")
    except Exception:
        return ""


def is_ats_or_aggregator_domain(domain: str) -> bool:
    return bool(re.search(
        r"(^|\.)("
        r"greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|smartrecruiters\.com|myworkdayjobs\.com|"
        r"linkedin\.com|indeed\.com|glassdoor\.com|ziprecruiter\.com|google\.com|adzuna\.com"
        r")$",
        domain or "",
        re.I,
    ))


def html_to_text(value: str | None) -> str:
    text = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", str(value or ""), flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", unescape(text)).strip()


def description_hash(description_text: str | None) -> str | None:
    text = re.sub(r"\s+", " ", str(description_text or "").strip().lower())
    if not text:
        return None
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def infer_remote_type(*values: str | None) -> str:
    text = " ".join(str(value or "") for value in values).lower()
    if "remote" in text or "work from home" in text:
        return "remote"
    if "hybrid" in text:
        return "hybrid"
    return "onsite"


def map_source(provider: str, publisher: str | None = None) -> str:
    text = f"{provider} {publisher or ''}".lower()
    if "linkedin" in text:
        return "linkedin"
    if "indeed" in text:
        return "indeed"
    if "glassdoor" in text:
        return "glassdoor"
    if "ziprecruiter" in text:
        return "ziprecruiter"
    return "company_direct"
