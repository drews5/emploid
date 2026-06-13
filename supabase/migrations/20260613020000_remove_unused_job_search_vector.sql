-- The application ranks against title/location columns and does not query the
-- generated full-description search vector. Removing it also removes the
-- largest unused jobs index and avoids recomputing it on every description edit.
DROP INDEX IF EXISTS public.idx_jobs_search;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS search_vector;
