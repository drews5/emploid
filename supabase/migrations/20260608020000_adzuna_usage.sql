CREATE TABLE IF NOT EXISTS public.adzuna_usage (
  usage_date date PRIMARY KEY,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.adzuna_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Adzuna usage is service-role only" ON public.adzuna_usage;
CREATE POLICY "Adzuna usage is service-role only"
  ON public.adzuna_usage FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
