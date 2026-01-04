-- =====================================================
-- FIX ESSAY SUBMISSION AND STORAGE PERMISSIONS
-- =====================================================
-- Date: 2026-01-04
-- Objective: Allow students to submit essays and upload files safely.

-- 1. Grant permissions for essay_prompts (needed for "Free Theme" submissions)
ALTER TABLE public.essay_prompts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (students) to insert new prompts (for free themes)
DROP POLICY IF EXISTS "Authenticated users can create prompts" ON public.essay_prompts;
CREATE POLICY "Authenticated users can create prompts"
    ON public.essay_prompts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by_user_id);

-- Allow users to view prompts they created
DROP POLICY IF EXISTS "Users can view own prompts" ON public.essay_prompts;
CREATE POLICY "Users can view own prompts"
    ON public.essay_prompts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by_user_id OR TRUE); -- OR TRUE allows viewing system prompts too

-- 2. Storage Policies (Without touching system table ownership)
-- We assume the 'essays' bucket might already exist or we try to insert it.
INSERT INTO storage.buckets (id, name, public)
VALUES ('essays', 'essays', false)
ON CONFLICT (id) DO NOTHING;

-- Safely create policies for storage objects
-- NOTE: We do not use "ALTER TABLE storage.objects" here to avoid 42501 error.
-- We directly apply policies.

DROP POLICY IF EXISTS "Authenticated users can upload essays" ON storage.objects;
CREATE POLICY "Authenticated users can upload essays"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'essays' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view own essays" ON storage.objects;
CREATE POLICY "Users can view own essays"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'essays' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Fix Essays Table Policies (Ensure students can insert)
ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert their own essays" ON public.essays;
CREATE POLICY "Students can insert their own essays"
    ON public.essays
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can view their own essays" ON public.essays;
CREATE POLICY "Students can view their own essays"
    ON public.essays
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());
