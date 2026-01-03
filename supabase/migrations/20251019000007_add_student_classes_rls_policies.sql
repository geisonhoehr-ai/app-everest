-- =====================================================
-- RLS POLICIES FOR STUDENT_CLASSES TABLE
-- =====================================================
-- This migration adds Row Level Security policies for the student_classes table
-- to allow proper access control for class enrollment data.

-- Enable RLS on student_classes table
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.student_classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.student_classes;

-- Policy 1: SELECT - Users can view enrollments based on their role
CREATE POLICY "Enable read access for authenticated users"
    ON public.student_classes
    FOR SELECT
    TO authenticated
    USING (
        -- Administrators and teachers can see all enrollments
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
        OR
        -- Students can see their own enrollments
        user_id = auth.uid()
    );

-- Policy 2: INSERT - Only admins and teachers can enroll students
CREATE POLICY "Enable insert for authenticated users"
    ON public.student_classes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    );

-- Policy 3: UPDATE - Only admins and teachers can update enrollments
CREATE POLICY "Enable update for authenticated users"
    ON public.student_classes
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    )
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid()) IN ('administrator', 'teacher')
    );

-- Policy 4: DELETE - Only administrators can remove enrollments
CREATE POLICY "Enable delete for authenticated users"
    ON public.student_classes
    FOR DELETE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrator'
    );

-- Grant necessary permissions
GRANT SELECT ON public.student_classes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.student_classes TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Enable read access for authenticated users" ON public.student_classes IS
    'Admins/teachers see all enrollments, students see only their own';

COMMENT ON POLICY "Enable insert for authenticated users" ON public.student_classes IS
    'Only administrators and teachers can enroll students in classes';

COMMENT ON POLICY "Enable update for authenticated users" ON public.student_classes IS
    'Only administrators and teachers can update student enrollments';

COMMENT ON POLICY "Enable delete for authenticated users" ON public.student_classes IS
    'Only administrators can remove student enrollments';

COMMENT ON TABLE public.student_classes IS 'Student class enrollments with proper RLS policies for security';
