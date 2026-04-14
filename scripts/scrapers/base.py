import json
import time
import sys
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseScraper(ABC):
    def __init__(self, source_name: str):
        self.source_name = source_name
        self.delay = 2.0  # Rate limit

    @abstractmethod
    def scrape(self, query: str, location: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def parse_listing(self, html: str) -> Dict[str, Any]:
        pass

    def normalize_output(self, raw_job: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "title": raw_job.get("title", ""),
            "company": raw_job.get("company", ""),
            "location": raw_job.get("location", ""),
            "remote_type": raw_job.get("remote_type", "hybrid"),
            "salary_min": raw_job.get("salary_min"),
            "salary_max": raw_job.get("salary_max"),
            "description": raw_job.get("description", ""),
            "source": self.source_name,
            "source_url": raw_job.get("source_url", ""),
            "apply_url": raw_job.get("apply_url", ""),
            "posted_at": raw_job.get("posted_at")
        }

    def run(self, query: str, location: str):
        print(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO] Starting {self.source_name} scraper for '{query}' in '{location}'", file=sys.stderr)
        
        try:
            jobs = self.scrape(query, location)
            for j in jobs:
                normalized = self.normalize_output(j)
                print(json.dumps(normalized))
                time.sleep(self.delay)
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ')}] [ERROR] Scraper failed: {e}", file=sys.stderr)
            
        print(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ')}] [INFO] Finished {self.source_name} scraper", file=sys.stderr)
