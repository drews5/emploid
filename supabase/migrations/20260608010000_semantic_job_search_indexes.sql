CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_jobs_active_title_trgm
  ON public.jobs USING GIN (title gin_trgm_ops)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_jobs_active_location_trgm
  ON public.jobs USING GIN (location gin_trgm_ops)
  WHERE is_active = true AND location IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_active_company_key_trgm
  ON public.jobs USING GIN (canonical_company_key gin_trgm_ops)
  WHERE is_active = true AND canonical_company_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_active_relevance_window
  ON public.jobs (is_active, ghost_score DESC, created_at DESC);
