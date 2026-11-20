-- Admin login rate limiting (shared store via Postgres)
-- Works across instances; tracks by IP and by account (email)

CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id bigserial PRIMARY KEY,
  ip text NOT NULL,
  email text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_created ON public.admin_login_attempts (ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email_created ON public.admin_login_attempts (email, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_login_blocks (
  id bigserial PRIMARY KEY,
  key_type text NOT NULL CHECK (key_type IN ('ip', 'email')),
  key_value text NOT NULL,
  blocked_until timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_triggered_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_login_blocks_key ON public.admin_login_blocks (key_type, key_value);
CREATE INDEX IF NOT EXISTS idx_admin_login_blocks_blocked_until ON public.admin_login_blocks (blocked_until);

-- Function to clean old attempts (optional helper)
CREATE OR REPLACE FUNCTION public.cleanup_admin_login_attempts(older_than_interval interval DEFAULT interval '7 days')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.admin_login_attempts WHERE created_at < now() - older_than_interval;
  DELETE FROM public.admin_login_blocks WHERE blocked_until < now() - interval '1 day';
END;
$$;

-- Restrict access (service role only via functions)
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_blocks ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated; only service role bypasses RLS
