-- Provider payloads duplicate job descriptions and metadata already stored in
-- normalized columns. Keeping them nearly doubles the jobs table size.
ALTER TABLE public.jobs DROP COLUMN IF EXISTS raw;
