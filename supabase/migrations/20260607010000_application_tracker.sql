CREATE TABLE IF NOT EXISTS public.application_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_job_id text NOT NULL,
  role text NOT NULL,
  company text NOT NULL,
  source text,
  stage text NOT NULL DEFAULT 'saved' CHECK (stage IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
  trust_score integer CHECK (trust_score BETWEEN 0 AND 100),
  salary text,
  location text,
  listing_url text,
  notes text,
  applied_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS application_tracker_user_external_job_idx
  ON public.application_tracker(user_id, external_job_id);

CREATE INDEX IF NOT EXISTS application_tracker_user_updated_idx
  ON public.application_tracker(user_id, updated_at DESC);

ALTER TABLE public.application_tracker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their tracker entries" ON public.application_tracker;
CREATE POLICY "Users can manage their tracker entries"
  ON public.application_tracker
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
