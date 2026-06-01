ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
