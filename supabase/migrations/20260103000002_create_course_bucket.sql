-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course_materials', 'course_materials', true, 52428800, '{"application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: storage.objects already has RLS enabled by default. 
-- We skip the ALTER TABLE command to avoid permission errors (42501).

-- Policy: Admin and Teacher can upload/delete/update
DROP POLICY IF EXISTS "Admins and Teachers can upload course materials" ON storage.objects;
CREATE POLICY "Admins and Teachers can upload course materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course_materials' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('administrator', 'teacher')
  )
);

DROP POLICY IF EXISTS "Admins and Teachers can update course materials" ON storage.objects;
CREATE POLICY "Admins and Teachers can update course materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course_materials' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('administrator', 'teacher')
  )
);

DROP POLICY IF EXISTS "Admins and Teachers can delete course materials" ON storage.objects;
CREATE POLICY "Admins and Teachers can delete course materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course_materials' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('administrator', 'teacher')
  )
);

-- Policy: Authenticated users can view (students need to download)
DROP POLICY IF EXISTS "Authenticated users can view course materials" ON storage.objects;
CREATE POLICY "Authenticated users can view course materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course_materials');
