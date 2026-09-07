-- =====================================================
-- LEGAL CHORDS — Migration 003: Legal Dictionary Terms
-- Run this in the Supabase SQL Editor after 001 and 002.
-- =====================================================

-- 1. LEGAL TERMS TABLE (powers the public dictionary)
CREATE TABLE IF NOT EXISTS legal_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  plain_language_summary TEXT NOT NULL,
  category TEXT NOT NULL,
  related_terms TEXT[] DEFAULT '{}',
  citations TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  last_reviewed DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_legal_terms_term ON legal_terms(term);
CREATE INDEX IF NOT EXISTS idx_legal_terms_category ON legal_terms(category);

-- 3. ROW LEVEL SECURITY
ALTER TABLE legal_terms ENABLE ROW LEVEL SECURITY;

-- Public read access (the public dictionary on the website)
CREATE POLICY "Public read access on legal_terms"
  ON legal_terms FOR SELECT
  TO anon
  USING (true);

-- Authenticated users (admin) full access for the CMS
CREATE POLICY "Admin full access on legal_terms"
  ON legal_terms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);