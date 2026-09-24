-- =====================================================
-- LEGAL CHORDS — Migration 006: Harden RLS + Newsletter RPC
-- Run this in the Supabase SQL Editor AFTER 001–005.
--
-- Security fixes:
--   1. All "Authenticated" (admin) policies are now scoped to
--      users whose JWT app_metadata has role = 'admin'. Before
--      this, ANY signed-in user had full read/write access to
--      memberships, newsletter, legal_terms and site_content.
--   2. Anonymous newsletter subscriptions now go through a
--      SECURITY DEFINER function that VALIDATES the email and
--      PRESERVES an unsubscribed state (formerly anon could
--      re-activate anyone with a blanket UPDATE policy).
--   3. anon INSERT/UPDATE on newsletter_subscribers is revoked;
--      storage upload/update/delete is admin-scoped.
--
-- Idempotent: safe to re-run.
-- =====================================================

-- -----------------------------------------------------
-- 1. Scoped admin policies (JWT app_metadata.role = 'admin')
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admin full access on memberships" ON memberships;
CREATE POLICY "Admin full access on memberships"
  ON memberships FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin full access on newsletter" ON newsletter_subscribers;
CREATE POLICY "Admin full access on newsletter"
  ON newsletter_subscribers FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin full access on legal_terms" ON legal_terms;
CREATE POLICY "Admin full access on legal_terms"
  ON legal_terms FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin full access on site_content" ON site_content;
CREATE POLICY "Admin full access on site_content"
  ON site_content FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public read of site_content stays (public site loads it).
DROP POLICY IF EXISTS "Public read access on site_content" ON site_content;
CREATE POLICY "Public read access on site_content"
  ON site_content FOR SELECT
  TO anon
  USING (true);

-- -----------------------------------------------------
-- 2. Newsletter subscriptions via a validated RPC only
-- -----------------------------------------------------

-- Revoke the old anon write paths (INSERT + blanket UPDATE).
DROP POLICY IF EXISTS "Allow anonymous inserts on newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow anonymous update on newsletter" ON newsletter_subscribers;

-- SECURITY DEFINER: runs as owner, bypasses RLS, validates the
-- email and preserves an explicit unsubscribe.
CREATE OR REPLACE FUNCTION public.subscribe_to_newsletter(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  clean_email TEXT := lower(btrim(p_email));
BEGIN
  IF clean_email = ''
     OR clean_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.newsletter_subscribers (email, status)
  VALUES (clean_email, 'active')
  ON CONFLICT (email) DO UPDATE
  SET status = CASE
    WHEN public.newsletter_subscribers.status = 'unsubscribed' THEN 'unsubscribed'
    ELSE 'active'
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.subscribe_to_newsletter(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_to_newsletter(TEXT) TO anon, authenticated;

-- -----------------------------------------------------
-- 3. Storage policies — scope writing to admins
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Admin upload event images" ON storage.objects;
CREATE POLICY "Admin upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin update event images" ON storage.objects;
CREATE POLICY "Admin update event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin delete event images" ON storage.objects;
CREATE POLICY "Admin delete event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Note: "Public read event images" / "Public read event images auth"
-- (from migration 002) remain unchanged — reads are public by design.