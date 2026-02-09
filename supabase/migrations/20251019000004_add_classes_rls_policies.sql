-- =====================================================
-- RLS POLICIES FOR CLASSES TABLE
-- =====================================================
-- This migration adds Row Level Security policies for the classes table
-- to allow administrators and teachers to view and manage classes.

-- Enable RLS on classes table if not already enabled
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Administrators and teachers can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can update classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators can delete classes" ON public.classes;

-- Policy: Administrators and teachers can view all classes
CREATE POLICY "Administrators and teachers can view all classes"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- Policy: Students can view classes they are enrolled in
CREATE POLICY "Students can view their own classes"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.student_classes
            WHERE student_classes.class_id = classes.id
            AND student_classes.user_id = auth.uid()
        )
    );

-- Policy: Administrators and teachers can insert classes
CREATE POLICY "Administrators and teachers can insert classes"
    ON public.classes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- Policy: Administrators and teachers can update classes
CREATE POLICY "Administrators and teachers can update classes"
    ON public.classes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('administrator', 'teacher')
        )
    );

-- Policy: Only administrators can delete classes
CREATE POLICY "Administrators can delete classes"
    ON public.classes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
        )
    );

-- Grant appropriate permissions
GRANT SELECT ON public.classes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.classes TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "Administrators and teachers can view all classes" ON public.classes IS
    'Administrators and teachers can view all classes in the system';

COMMENT ON POLICY "Students can view their own classes" ON public.classes IS
    'Students can only view classes they are enrolled in';

COMMENT ON POLICY "Administrators and teachers can insert classes" ON public.classes IS
    'Only administrators and teachers can create new classes';

COMMENT ON POLICY "Administrators and teachers can update classes" ON public.classes IS
    'Only administrators and teachers can update class information';

COMMENT ON POLICY "Administrators can delete classes" ON public.classes IS
    'Only administrators can delete classes';
