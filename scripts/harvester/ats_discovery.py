import os
import re
from collections.abc import Iterable
from typing import Any
from urllib.parse import parse_qs, urljoin, urlparse

import httpx
import yaml

from .utils import slugify


DEFAULT_TIMEOUT = 15
USER_AGENT = os.getenv("HARVESTER_USER_AGENT", "JobspectorJobHarvester/1.0")

PROVIDER_PATTERNS = {
    "greenhouse": [
        re.compile(r"https?://boards(?:-api)?\.greenhouse\.io/(?:v1/)?boards/([a-z0-9][a-z0-9_-]*)", re.I),
        re.compile(r"https?://job-boards\.greenhouse\.io/([a-z0-9][a-z0-9_-]*)", re.I),
        re.compile(r"greenhouse\.io/(?:embed/)?job_board\?[^\"'\s<>]*\bfor=([a-z0-9][a-z0-9_-]*)", re.I),
    ],
    "lever": [
        re.compile(r"https?://jobs\.lever\.co/([a-z0-9][a-z0-9_-]*)", re.I),
        re.compile(r"https?://api\.lever\.co/v0/postings/([a-z0-9][a-z0-9_-]*)", re.I),
    ],
    "ashby": [
        re.compile(r"https?://jobs\.ashbyhq\.com/([a-z0-9][a-z0-9_-]*)", re.I),
        re.compile(r"https?://api\.ashbyhq\.com/posting-api/job-board/([a-z0-9][a-z0-9_-]*)", re.I),
    ],
    "smartrecruiters": [
        re.compile(r"https?://api\.smartrecruiters\.com/v1/companies/([a-z0-9][a-z0-9_-]*)/postings", re.I),
        re.compile(r"https?://jobs\.smartrecruiters\.com/([a-z0-9][a-z0-9_-]*)", re.I),
    ],
}


def discover_board_slugs(
    *,
    providers: Iterable[str],
    seed_boards: dict[str, list[str]],
    discovery_sources: list[dict[str, Any]] | None = None,
    limit: int | None = None,
) -> dict[str, list[str]]:
    if not _env_bool("ATS_DISCOVERY_ENABLED", True):
        return _dedupe(seed_boards)

    allowed = set(providers)
    boards = {provider: list(seed_boards.get(provider, [])) for provider in allowed}
    sources = discovery_sources or []
    limit = limit or _env_int("ATS_DISCOVERY_LIMIT", 350)

    for source in sources[:limit]:
        for provider, slug in _extract_from_source(source).items():
            if provider in allowed:
                boards.setdefault(provider, []).extend(slug)

    for url in _catalog_urls():
        for provider, slug in _fetch_catalog(url).items():
            if provider in allowed:
                boards.setdefault(provider, []).extend(slug)

    return _dedupe(boards)


def fetch_discovery_sources(company_sources: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    sources = list(company_sources)
    page_urls = _candidate_page_urls(company_sources)

    with _client() as client:
        for url in page_urls[:limit]:
            try:
                response = client.get(url)
                if response.status_code >= 400 or "text/html" not in response.headers.get("content-type", ""):
                    continue
                sources.append({"url": str(response.url), "html": response.text[:250_000]})
            except Exception as exc:
                print(f"[DISCOVERY] could not fetch {url}: {exc}")

    return sources


def _extract_from_source(source: dict[str, Any]) -> dict[str, list[str]]:
    text = "\n".join(str(source.get(key) or "") for key in ("url", "website", "careers_page_url", "source_url", "apply_url", "html"))
    found: dict[str, list[str]] = {}

    for provider, patterns in PROVIDER_PATTERNS.items():
        for pattern in patterns:
            for match in pattern.findall(text):
                slug = _clean_slug(match)
                if slug:
                    found.setdefault(provider, []).append(slug)

    for url in re.findall(r"https?://[^\s\"'<>]+", text):
        provider, slug = _parse_ats_url(url)
        if provider and slug:
            found.setdefault(provider, []).append(slug)

    return found


def _parse_ats_url(url: str) -> tuple[str | None, str | None]:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    path_parts = [part for part in parsed.path.split("/") if part]
    query = parse_qs(parsed.query)

    if host in {"boards.greenhouse.io", "job-boards.greenhouse.io"} and path_parts:
        return "greenhouse", _clean_slug(path_parts[0])
    if host == "boards-api.greenhouse.io" and len(path_parts) >= 3 and path_parts[-2] == "boards":
        return "greenhouse", _clean_slug(path_parts[-1])
    if host.endswith("greenhouse.io") and query.get("for"):
        return "greenhouse", _clean_slug(query["for"][0])
    if host == "jobs.lever.co" and path_parts:
        return "lever", _clean_slug(path_parts[0])
    if host == "api.lever.co" and len(path_parts) >= 3 and path_parts[-2] == "postings":
        return "lever", _clean_slug(path_parts[-1])
    if host == "jobs.ashbyhq.com" and path_parts:
        return "ashby", _clean_slug(path_parts[0])
    if host == "api.ashbyhq.com" and path_parts:
        return "ashby", _clean_slug(path_parts[-1])
    if host == "api.smartrecruiters.com" and len(path_parts) >= 3 and path_parts[-3] == "companies":
        return "smartrecruiters", _clean_slug(path_parts[-2])
    if host == "jobs.smartrecruiters.com" and path_parts:
        return "smartrecruiters", _clean_slug(path_parts[0])
    return None, None


def _candidate_page_urls(sources: list[dict[str, Any]]) -> list[str]:
    urls: list[str] = []
    for source in sources:
        for key in ("careers_page_url", "website", "source_url", "apply_url"):
            url = _normalize_url(source.get(key))
            if not url:
                continue
            urls.append(url)
            if key == "website":
                urls.append(urljoin(url.rstrip("/") + "/", "careers"))
                urls.append(urljoin(url.rstrip("/") + "/", "jobs"))
    return _unique(urls)


def _fetch_catalog(url: str) -> dict[str, list[str]]:
    try:
        with _client() as client:
            response = client.get(url)
            response.raise_for_status()
            body = response.text
    except Exception as exc:
        print(f"[DISCOVERY] catalog failed {url}: {exc}")
        return {}

    try:
        parsed = yaml.safe_load(body)
    except Exception:
        parsed = None

    if isinstance(parsed, dict):
        return {
            provider: [_clean_slug(str(slug)) for slug in slugs or [] if _clean_slug(str(slug))]
            for provider, slugs in parsed.items()
            if isinstance(slugs, list)
        }

    return _extract_from_source({"url": url, "html": body})


def _client() -> httpx.Client:
    return httpx.Client(
        timeout=DEFAULT_TIMEOUT,
        follow_redirects=True,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/json,text/plain"},
    )


def _catalog_urls() -> list[str]:
    value = os.getenv("ATS_BOARD_CATALOG_URLS", "")
    return [part.strip() for part in value.split(",") if part.strip()]


def _clean_slug(value: str | None) -> str | None:
    if not value:
        return None
    slug = str(value).strip().strip("/?#&\"'<>").split("/")[0]
    slug = re.sub(r"[^a-zA-Z0-9_-]", "", slug)
    return slug if slug and slug.lower() not in {"jobs", "careers", "job"} else None


def _normalize_url(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    if not text.startswith(("http://", "https://")):
        text = f"https://{text}"
    return text


def _dedupe(boards: dict[str, list[str]]) -> dict[str, list[str]]:
    deduped: dict[str, list[str]] = {}
    for provider, slugs in boards.items():
        seen = set()
        deduped[provider] = []
        for slug in slugs or []:
            clean = _clean_slug(str(slug))
            key = clean.lower() if clean else ""
            if clean and key not in seen:
                seen.add(key)
                deduped[provider].append(clean)
    return deduped


def _unique(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        key = slugify(value)
        if key not in seen:
            seen.add(key)
            output.append(value)
    return output


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if not value:
        return default
    try:
        return int(value)
    except ValueError:
        return default
