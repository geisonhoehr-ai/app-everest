-- Create essays bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('essays', 'essays', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for storage
DROP POLICY IF EXISTS "Authenticated users can upload essays" ON storage.objects;
CREATE POLICY "Authenticated users can upload essays"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'essays' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view own essays" ON storage.objects;
CREATE POLICY "Users can view own essays"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'essays' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Staff can view all essays" ON storage.objects;
CREATE POLICY "Staff can view all essays"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'essays' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('administrator', 'teacher')));

-- Add file_url to essays table
ALTER TABLE public.essays ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Update enum to include 'submitted'
ALTER TYPE public.essay_status_enum ADD VALUE IF NOT EXISTS 'submitted';
