-- ============================================
-- Granular Content Access Control
-- ============================================

CREATE TABLE IF NOT EXISTS class_content_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_class_content_access_class ON class_content_access(class_id);
CREATE INDEX IF NOT EXISTS idx_class_content_access_type ON class_content_access(class_id, content_type);

ALTER TABLE class_content_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage content access"
  ON class_content_access FOR ALL
  USING (auth.role() = 'authenticated');
