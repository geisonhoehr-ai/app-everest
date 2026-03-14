-- ============================================
-- Invite System Migration
-- ============================================

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  course_id uuid REFERENCES video_courses(id) ON DELETE SET NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  access_duration_days int,
  max_slots int,
  cover_image_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invite registrations
CREATE TABLE IF NOT EXISTS invite_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id uuid NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(invite_id, user_id)
);

-- RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_registrations ENABLE ROW LEVEL SECURITY;

-- Public can read active invites
CREATE POLICY "Public read active invites"
  ON invites FOR SELECT
  USING (status = 'active');

-- Authenticated can manage invites
CREATE POLICY "Authenticated manage invites"
  ON invites FOR ALL
  USING (auth.role() = 'authenticated');

-- Anyone can register for an invite
CREATE POLICY "Public register for invite"
  ON invite_registrations FOR INSERT
  WITH CHECK (true);

-- Authenticated can read registrations
CREATE POLICY "Authenticated read registrations"
  ON invite_registrations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invites_slug ON invites(slug);
CREATE INDEX IF NOT EXISTS idx_invite_registrations_invite ON invite_registrations(invite_id);
