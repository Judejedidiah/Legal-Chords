-- =====================================================
-- LEGAL CHORDS — Migration 005: Newsletter Upsert Policy
-- The public homepage subscribes via UPSERT
-- (INSERT ... ON CONFLICT (email) DO UPDATE) as the
-- "anon" role. Migration 001 granted anon INSERT only;
-- the ON CONFLICT branch performs an UPDATE, which anon
-- had no policy for, so returning subscribers errored.
-- This adds an equally-scoped anon UPDATE policy.
-- =====================================================

CREATE POLICY "Allow anonymous update on newsletter"
  ON newsletter_subscribers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);



  