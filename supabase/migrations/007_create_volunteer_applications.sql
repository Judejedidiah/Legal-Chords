-- =====================================================
-- LEGAL CHORDS — Volunteer Applications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  q1_firstname TEXT,
  q1_lastname TEXT,
  q3 TEXT,
  q4_dob TEXT,
  q5 TEXT,
  q5_other TEXT,
  q6_email TEXT NOT NULL,
  q7_phone TEXT,
  q8 TEXT,
  q9 TEXT,
  q10 TEXT,
  q11 TEXT,
  q11_other TEXT,
  q12 TEXT,
  q12_other TEXT,
  q13 TEXT,
  q14 TEXT,
  q15 TEXT,
  q16 JSONB DEFAULT '[]',
  q16_other TEXT,
  q17 TEXT,
  q18 TEXT,
  q19 TEXT,
  q20 TEXT,
  q21 JSONB DEFAULT '[]',
  q21_other TEXT,
  q22 TEXT,
  q23 TEXT,
  q24 TEXT,
  q25 TEXT,
  q26 TEXT,
  q27 TEXT,
  q28 TEXT,
  q29_name TEXT,
  q29_contact TEXT,
  q29_relation TEXT,
  q30_name TEXT,
  q30_contact TEXT,
  q30_relation TEXT,
  q31 TEXT,
  q32 TEXT,
  q33 TEXT,
  q34 TEXT,
  q35 TEXT,
  q36 TEXT,
  q37 TEXT,
  q38 TEXT,
  q38_other TEXT,
  q39 TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_applications_email ON volunteer_applications(q6_email);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_created ON volunteer_applications(created_at DESC);

ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts on volunteer_applications" ON volunteer_applications;
CREATE POLICY "Allow anonymous inserts on volunteer_applications"
  ON volunteer_applications FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on volunteer_applications" ON volunteer_applications;
CREATE POLICY "Admin full access on volunteer_applications"
  ON volunteer_applications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
