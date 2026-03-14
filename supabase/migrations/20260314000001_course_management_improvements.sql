-- ============================================
-- Course Management Improvements Migration
-- ============================================

-- Add new columns to video_courses
ALTER TABLE video_courses
  ADD COLUMN IF NOT EXISTS acronym text,
  ADD COLUMN IF NOT EXISTS sales_url text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'Meus Cursos',
  ADD COLUMN IF NOT EXISTS layout_preference text DEFAULT 'simple_list',
  ADD COLUMN IF NOT EXISTS show_in_storefront boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderate_comments boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_text text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Migrate is_active to status
UPDATE video_courses SET status = 'published' WHERE is_active = true;
UPDATE video_courses SET status = 'draft' WHERE is_active = false OR is_active IS NULL;

-- Create storage bucket for course covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-covers', 'course-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read, only authenticated users can upload
CREATE POLICY "Public read course covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-covers');

CREATE POLICY "Authenticated upload course covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-covers'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated update course covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-covers'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated delete course covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-covers'
    AND auth.role() = 'authenticated'
  );
