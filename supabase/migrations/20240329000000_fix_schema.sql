-- Fix 1: Add generated search_vector column (the jobs route queries this but it didn't exist)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;

-- Replace the old functional index with one on the new column
DROP INDEX IF EXISTS idx_jobs_search;
CREATE INDEX idx_jobs_search ON public.jobs USING GIN (search_vector);

-- Fix 2: Add missing INSERT RLS policy for users table (signup was silently failing)
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Fix 3: Add unique index on source_url for better deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_url_unique
  ON public.jobs (source_url)
  WHERE source_url IS NOT NULL AND source_url != '';

-- Fix 4: Store the ghost score label so the frontend doesn't have to recompute it
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ghost_label text
  CHECK (ghost_label IN ('Verified', 'Uncertain', 'Likely Ghost'));

-- Fix 5: Fix the company stats trigger to handle DELETE properly
-- (OLD trigger references NEW on DELETE which is null)
CREATE OR REPLACE FUNCTION update_company_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_company_id uuid;
BEGIN
  -- On DELETE, NEW is null, so use OLD
  IF TG_OP = 'DELETE' THEN
    target_company_id := OLD.company_id;
  ELSE
    target_company_id := NEW.company_id;
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
