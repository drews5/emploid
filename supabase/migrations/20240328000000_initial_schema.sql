-- Create tables
CREATE TABLE public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  industry text,
  size_range text,
  employee_count integer,
  founded_year integer,
  hq_location text,
  website text,
  careers_page_url text,
  glassdoor_rating decimal(2,1),
  glassdoor_url text,
  avg_ghost_score decimal(4,1),
  total_active_listings integer DEFAULT 0,
  hiring_velocity_90d integer DEFAULT 0,
  last_layoff_date date,
  last_layoff_count integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  location text,
  remote_type text CHECK (remote_type IN ('remote', 'hybrid', 'onsite')),
  salary_min integer,
  salary_max integer,
  salary_is_estimate boolean DEFAULT false,
  description text,
  source text CHECK (source IN ('linkedin', 'indeed', 'handshake', 'glassdoor', 'ziprecruiter', 'company_direct')),
  source_url text,
  apply_url text NOT NULL,
  experience_level text CHECK (experience_level IN ('intern', 'entry', 'mid', 'senior', 'executive')),
  job_type text CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  ghost_score integer CHECK (ghost_score BETWEEN 0 AND 100),
  ghost_factors jsonb,
  posted_at timestamptz,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  repost_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes for jobs
CREATE INDEX idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX idx_jobs_ghost_score ON public.jobs(ghost_score);
CREATE INDEX idx_jobs_source ON public.jobs(source);
CREATE INDEX idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX idx_jobs_posted_at ON public.jobs(posted_at DESC);
-- Requires pg_trgm for full-text index
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_jobs_search ON public.jobs USING GIN (to_tsvector('english', title || ' ' || coalesce(description, '')));
CREATE INDEX idx_companies_search ON public.companies USING GIN (to_tsvector('english', name || ' ' || coalesce(industry, '')));

CREATE TABLE public.recruiters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  linkedin_url text,
  email text,
  source text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.job_recruiters (
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  recruiter_id uuid REFERENCES public.recruiters(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, recruiter_id)
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  is_pro boolean DEFAULT false,
  stripe_customer_id text,
  preferred_titles text[],
  preferred_locations text[],
  preferred_salary_min integer,
  experience_level text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.saved_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  status text DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interview', 'offer', 'rejected')),
  notes text,
  applied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

CREATE TABLE public.job_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  location text,
  filters jsonb,
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public companies are viewable by everyone" ON public.companies FOR SELECT USING (true);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true);

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public recruiters are viewable by everyone" ON public.recruiters FOR SELECT USING (true);

ALTER TABLE public.job_recruiters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public job_recruiters are viewable by everyone" ON public.job_recruiters FOR SELECT USING (true);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their saved jobs" ON public.saved_jobs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their job alerts" ON public.job_alerts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_company_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stats only if the total score changed, active states changed, or new job added
  UPDATE public.companies
  SET 
    total_active_listings = (SELECT count(*) FROM public.jobs WHERE company_id = NEW.company_id AND is_active = true),
    avg_ghost_score = (SELECT avg(ghost_score) FROM public.jobs WHERE company_id = NEW.company_id AND is_active = true AND ghost_score IS NOT NULL)
  WHERE id = NEW.company_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_stats_trg AFTER INSERT OR UPDATE OR DELETE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_company_stats();
