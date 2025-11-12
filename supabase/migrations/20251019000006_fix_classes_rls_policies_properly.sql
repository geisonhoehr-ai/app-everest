-- =====================================================
-- FIX RLS POLICIES FOR CLASSES TABLE - PROPER VERSION
-- =====================================================
-- This migration properly configures RLS on the classes table.
--
-- The issue was that we need to ensure the policies work correctly
-- with the users table and auth system.

-- First, ensure RLS is enabled
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Administrators and teachers can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can update classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators can delete classes" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.classes;

-- CREATE PERMISSIVE POLICIES (use OR logic, more flexible)

-- Policy 1: SELECT - Anyone authenticated can view classes they have access to
-- IMPORTANT: Use (SELECT role FROM public.users WHERE id = auth.uid()) instead of JOIN
-- to avoid potential performance or timing issues with RLS
CREATE POLICY "Enable read access for authenticated users"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (
        -- Administrators and teachers can see all classes
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
        OR
        -- Students can see classes they are enrolled in
        EXISTS (
            SELECT 1 FROM public.student_classes
            WHERE student_classes.class_id = classes.id
            AND student_classes.user_id = auth.uid()
        )
        OR
        -- Everyone can see active classes (for browsing)
        status = 'active'
    );

-- Policy 2: INSERT - Only admins and teachers
CREATE POLICY "Enable insert for authenticated users"
    ON public.classes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    );

-- Policy 3: UPDATE - Only admins and teachers
CREATE POLICY "Enable update for authenticated users"
    ON public.classes
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    )
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    );

-- Policy 4: DELETE - Only administrators
CREATE POLICY "Enable delete for authenticated users"
    ON public.classes
    FOR DELETE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator'
    );

-- Grant necessary permissions
GRANT SELECT ON public.classes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.classes TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Enable read access for authenticated users" ON public.classes IS
    'Admins/teachers see all, students see enrolled classes, everyone sees active classes';

COMMENT ON POLICY "Enable insert for authenticated users" ON public.classes IS
    'Only administrators and teachers can create classes';

COMMENT ON POLICY "Enable update for authenticated users" ON public.classes IS
    'Only administrators and teachers can update classes';

COMMENT ON POLICY "Enable delete for authenticated users" ON public.classes IS
    'Only administrators can delete classes';

COMMENT ON TABLE public.classes IS 'Classes/Turmas table with proper RLS policies for security';
