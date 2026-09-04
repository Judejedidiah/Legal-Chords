-- =====================================================
-- LEGAL CHORDS — Supabase Database Schema
-- Run this in the Supabase SQL Editor to create tables
-- =====================================================

-- 1. MEMBERSHIP APPLICATIONS
CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firstname TEXT NOT NULL,
  middlename TEXT,
  lastname TEXT NOT NULL,
  email TEXT NOT NULL,
  country_code TEXT DEFAULT '+234',
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  institution TEXT,
  location TEXT,
  interests TEXT[] DEFAULT '{}',
  involvement TEXT,
  source TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SITE CONTENT (CMS for editable sections)
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_label TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_created ON memberships(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(section_key);

-- 5. ROW LEVEL SECURITY
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (authenticated users with admin role)
-- For simplicity, we'll use a single admin email check via JWT claim
-- You can also use a separate admin_users table for multiple admins

-- Allow anonymous inserts (form submissions)
CREATE POLICY "Allow anonymous inserts on memberships"
  ON memberships FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on newsletter"
  ON newsletter_subscribers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users full access (admin)
CREATE POLICY "Admin full access on memberships"
  ON memberships FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access on newsletter"
  ON newsletter_subscribers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public read access for site_content (so the website can load it)
CREATE POLICY "Public read access on site_content"
  ON site_content FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can update site_content (admin)
CREATE POLICY "Admin full access on site_content"
  ON site_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. SEED DEFAULT SITE CONTENT
INSERT INTO site_content (section_key, section_label, content) VALUES
('hero', 'Hero Section', '{
  "badge": "Youth-Led • Nigeria • Est. 2026",
  "headline": "LEGAL KNOWLEDGE<br>SHOULD NOT BE<br>A PRIVILEGE.",
  "subtitle": "Making the law easier to understand, access, and apply. Legal Chords is a youth-focused legal awareness platform making legal education practical, accessible and relevant to everyday life."
}'),
('about', 'About Section', '{
  "heading": "Law Should Be Understandable.",
  "paragraphs": [
    "Legal Chords exists to bridge the gap between people and legal knowledge. We are a youth-focused legal awareness and education platform committed to making legal knowledge simple, practical and accessible.",
    "Through digital education, conversations, webinars, events and community initiatives, we help young people understand their rights, responsibilities and the legal systems that affect their everyday lives.",
    "We are not a law firm. We are a movement of young people, professionals and educators using education, innovation and collaboration to make the law a tool for empowerment — not intimidation."
  ]
}'),
('mission', 'Mission', '{
  "heading": "Make legal knowledge accessible, understandable and practical for everyone.",
  "body": "We exist to simplify the law and bring it into everyday conversations, classrooms and communities — so that no one is excluded because the language is too dense or the system too distant."
}'),
('vision', 'Vision', '{
  "heading": "A society where people understand the law well enough to know their rights, fulfill their responsibilities and make informed decisions.",
  "body": "A Nigeria — and a generation — that leads with knowledge, participates with confidence and shapes the future with clarity."
}'),
('events', 'Featured Event', '{
  "tag": "Upcoming",
  "day": "14",
  "month": "NOV",
  "title": "Legal Chords Summit 2026",
  "subtitle": "Law, Innovation, Youth",
  "description": "A flagship gathering of young leaders, lawyers, technologists and policymakers shaping the future of law, civic engagement and innovation in Nigeria and across Africa.",
  "date": "Saturday, 14 November 2026",
  "time": "10:00 AM — 4:00 PM (WAT)",
  "format": "Hybrid (Lagos + Online)",
  "speakers": "20+ legal, civic & tech leaders"
}')
ON CONFLICT (section_key) DO NOTHING;
