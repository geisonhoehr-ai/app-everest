-- Add column for teacher's corrected/scanned file
ALTER TABLE public.essays ADD COLUMN IF NOT EXISTS corrected_file_url TEXT;

-- Allow staff to view corrected files in storage
DROP POLICY IF EXISTS "Staff can view correction files" ON storage.objects;
CREATE POLICY "Staff can view correction files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'essays'
      AND (storage.foldername(name))[1] = 'corrections'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('teacher', 'administrator')
      )
    );

-- Allow staff to upload correction files
DROP POLICY IF EXISTS "Staff can upload correction files" ON storage.objects;
CREATE POLICY "Staff can upload correction files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'essays'
      AND (storage.foldername(name))[1] = 'corrections'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('teacher', 'administrator')
      )
    );

-- Allow staff to overwrite correction files
DROP POLICY IF EXISTS "Staff can update correction files" ON storage.objects;
CREATE POLICY "Staff can update correction files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'essays'
      AND (storage.foldername(name))[1] = 'corrections'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('teacher', 'administrator')
      )
    );

-- Allow students to view their own corrected files
DROP POLICY IF EXISTS "Students can view own correction files" ON storage.objects;
CREATE POLICY "Students can view own correction files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'essays'
      AND (storage.foldername(name))[1] = 'corrections'
      AND EXISTS (
        SELECT 1 FROM public.essays
        WHERE corrected_file_url = name
        AND student_id = auth.uid()
      )
    );
