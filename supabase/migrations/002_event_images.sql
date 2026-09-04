-- =====================================================
-- LEGAL CHORDS — Migration 002: Featured Event Images
-- 1. Creates a public storage bucket for event images
-- 2. Adds posterImage field to the events site_content
-- =====================================================

-- 1. Create public storage bucket (5MB max, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies
-- Public read: anyone can view event images
CREATE POLICY "Public read event images"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'event-images');

CREATE POLICY "Public read event images auth"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'event-images');

-- Authenticated (admin) can upload images
CREATE POLICY "Admin upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Admin update event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-images');

CREATE POLICY "Admin delete event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-images');

-- 3. Add posterImage + full section fields to the events content seed
UPDATE site_content
SET content = content || '{"posterImage": "", "heading": "Legal Chords Summit 2026 — The Next Generation of Justice", "typePill": "Summit", "formatPill": "Hybrid"}'
WHERE section_key = 'events';