-- ============================================
-- Class Module/Lesson Release Rules Migration
-- ============================================

-- Class module release rules
CREATE TABLE IF NOT EXISTS class_module_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES video_modules(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'free'
    CHECK (rule_type IN ('free', 'scheduled_date', 'days_after_enrollment', 'hidden', 'blocked', 'module_completed')),
  rule_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id, module_id)
);

-- Class lesson release rules
CREATE TABLE IF NOT EXISTS class_lesson_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'free'
    CHECK (rule_type IN ('free', 'scheduled_date', 'days_after_enrollment', 'hidden', 'blocked', 'module_completed')),
  rule_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(class_id, lesson_id)
);

-- Add columns to classes table
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS access_duration_days int,
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_class_module_rules_class ON class_module_rules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_lesson_rules_class ON class_lesson_rules(class_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_user_class ON student_classes(user_id, class_id);

-- RLS policies
ALTER TABLE class_module_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_lesson_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage module rules"
  ON class_module_rules FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated manage lesson rules"
  ON class_lesson_rules FOR ALL
  USING (auth.role() = 'authenticated');
