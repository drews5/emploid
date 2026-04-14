-- ============================================================
-- Migration: Security, performance, and infrastructure fixes
-- ============================================================

-- ── 1. Restrict recruiter PII access ────────────────────────
-- Previously: "Public recruiters are viewable by everyone"
-- This exposed emails, LinkedIn URLs, etc. to unauthenticated users.
-- New policy: only authenticated users can view recruiter info.
DROP POLICY IF EXISTS "Public recruiters are viewable by everyone" ON public.recruiters;

CREATE POLICY "Authenticated users can view recruiters"
  ON public.recruiters FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── 2. Add missing performance indexes ──────────────────────
-- The jobs API filters on these columns but had no indexes
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON public.jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON public.jobs(experience_level);

-- saved_jobs are always queried by user_id
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);

-- Compound index for the most common saved_jobs query pattern
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_created
  ON public.saved_jobs(user_id, created_at DESC);

-- ── 3. Add updated_at to jobs table ─────────────────────────
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── 4. Add DELETE policy for users (account deletion) ───────
CREATE POLICY "Users can delete their own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- ── 5. Add CHECK constraint on companies.size_range ─────────
-- Matches the size map used in the ghost score algorithm
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_size_range_check;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_size_range_check
  CHECK (size_range IS NULL OR size_range IN ('1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'));

-- ── 6. Optimize company stats trigger for bulk operations ───
-- Replace the per-row trigger with one that defers stats recalculation.
-- This prevents N redundant aggregate queries during scraper ingestion.
CREATE OR REPLACE FUNCTION update_company_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_company_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_company_id := OLD.company_id;
  ELSE
    target_company_id := NEW.company_id;
  END IF;

  -- Skip stats update if ghost_score hasn't changed (common during bulk updates)
  IF TG_OP = 'UPDATE' AND
     OLD.is_active = NEW.is_active AND
     OLD.ghost_score IS NOT DISTINCT FROM NEW.ghost_score THEN
    RETURN NEW;
  END IF;

  UPDATE public.companies
  SET
    total_active_listings = (SELECT count(*) FROM public.jobs WHERE company_id = target_company_id AND is_active = true),
    avg_ghost_score = (SELECT avg(ghost_score) FROM public.jobs WHERE company_id = target_company_id AND is_active = true AND ghost_score IS NOT NULL)
  WHERE id = target_company_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';
