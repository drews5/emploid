import argparse
import os
import signal
import sys
import time
from datetime import datetime, timezone

from .main import run


DEFAULT_INTERVAL_SECONDS = 6 * 60 * 60
_shutdown_requested = False


def _env_bool(name: str, default: bool = False) -> bool:
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


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _handle_shutdown(_signum, _frame) -> None:
    global _shutdown_requested
    _shutdown_requested = True


def _sleep_until_next_run(interval_seconds: int) -> None:
    deadline = time.monotonic() + interval_seconds
    while not _shutdown_requested and time.monotonic() < deadline:
        time.sleep(min(5, max(0, deadline - time.monotonic())))


def run_worker(
    *,
    interval_seconds: int,
    include_jsearch: bool,
    provider: str | None,
    run_on_start: bool,
    once: bool,
) -> int:
    signal.signal(signal.SIGINT, _handle_shutdown)
    signal.signal(signal.SIGTERM, _handle_shutdown)

    if interval_seconds <= 0:
        raise ValueError("interval_seconds must be greater than 0")

    should_run = run_on_start or once
    print(
        f"[WORKER] started at {_timestamp()} interval={interval_seconds}s "
        f"include_jsearch={include_jsearch} provider={provider or 'all'}"
    )

    while not _shutdown_requested:
        if should_run:
            started = time.monotonic()
            try:
                stats = run(include_jsearch=include_jsearch, only_provider=provider)
                elapsed = round(time.monotonic() - started, 2)
                print(f"[WORKER] harvest finished in {elapsed}s stats={stats}")
            except Exception as exc:
                print(f"[WORKER] harvest failed: {exc}", file=sys.stderr)
                if once:
                    return 1

        if once:
            return 0

        should_run = True
        _sleep_until_next_run(interval_seconds)

    print(f"[WORKER] shutdown requested at {_timestamp()}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Emploid job harvester as a worker process.")
    parser.add_argument("--once", action="store_true", help="Run one harvest and exit.")
    parser.add_argument("--interval-seconds", type=int, default=_env_int("HARVEST_INTERVAL_SECONDS", DEFAULT_INTERVAL_SECONDS))
    parser.add_argument("--include-jsearch", action="store_true", default=_env_bool("HARVEST_INCLUDE_JSEARCH", False))
    parser.add_argument("--provider", default=os.getenv("HARVEST_PROVIDER") or None, help="Only crawl one provider, e.g. greenhouse or jsearch.")
    parser.add_argument("--no-run-on-start", action="store_true", help="Wait one interval before the first harvest.")
    args = parser.parse_args()

    return run_worker(
        interval_seconds=args.interval_seconds,
        include_jsearch=args.include_jsearch,
        provider=args.provider,
        run_on_start=not args.no_run_on_start,
        once=args.once,
    )


if __name__ == "__main__":
    raise SystemExit(main())
