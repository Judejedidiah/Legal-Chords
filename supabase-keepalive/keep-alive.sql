-- Isolated keep-alive table. Safe to drop with: drop table public."keep-alive";

CREATE TABLE IF NOT EXISTS public."keep-alive" (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);

INSERT INTO public."keep-alive" (created_at)
SELECT now()
WHERE NOT EXISTS (SELECT 1 FROM public."keep-alive");

ALTER TABLE public."keep-alive" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "keep-alive anon select" ON public."keep-alive";

CREATE POLICY "keep-alive anon select"
  ON public."keep-alive"
  FOR SELECT
  TO anon
  USING (true);
