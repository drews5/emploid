-- Store all harvested listings in the existing app-facing tables, with
-- source/history fields needed for trust scoring.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source_provider text,
  ADD COLUMN IF NOT EXISTS source_job_id text,
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS description_hash text,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw jsonb,
  ADD COLUMN IF NOT EXISTS trust_flags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS company_trust_score numeric(3,2),
  ADD COLUMN IF NOT EXISTS canonical_company_key text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS trust_score numeric(3,2) DEFAULT 0.60,
  ADD COLUMN IF NOT EXISTS trust_flags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trust_signals jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS observation_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_crawled_at timestamptz,
  ADD COLUMN IF NOT EXISTS canonical_key text;

CREATE INDEX IF NOT EXISTS idx_jobs_source_provider ON public.jobs(source_provider);
CREATE INDEX IF NOT EXISTS idx_jobs_source_job ON public.jobs(source_provider, source_job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_description_hash ON public.jobs(description_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_company_key ON public.jobs(canonical_company_key);
CREATE INDEX IF NOT EXISTS idx_companies_canonical_key ON public.companies(canonical_key);
CREATE INDEX IF NOT EXISTS idx_companies_trust_score ON public.companies(trust_score DESC);

CREATE TABLE IF NOT EXISTS public.crawl_runs (
  id bigserial PRIMARY KEY,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  source text,
  jobs_seen integer DEFAULT 0,
  jobs_new integer DEFAULT 0,
  jobs_updated integer DEFAULT 0,
  jobs_deactivated integer DEFAULT 0,
  errors integer DEFAULT 0,
  notes text
);

ALTER TABLE public.crawl_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Crawl runs are service-role only" ON public.crawl_runs;
CREATE POLICY "Crawl runs are service-role only"
  ON public.crawl_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.jsearch_usage (
  usage_date date PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.jsearch_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "JSearch usage is service-role only" ON public.jsearch_usage;
CREATE POLICY "JSearch usage is service-role only"
  ON public.jsearch_usage FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
