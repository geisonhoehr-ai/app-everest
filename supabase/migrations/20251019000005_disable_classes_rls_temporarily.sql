-- =====================================================
-- TEMPORARILY DISABLE RLS ON CLASSES TABLE
-- =====================================================
-- This migration temporarily disables RLS on the classes table
-- to restore the previous behavior where all authenticated users
-- could access classes data.
--
-- We will re-enable it properly after investigating the RLS issue.

-- Disable RLS on classes table
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Administrators and teachers can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators and teachers can update classes" ON public.classes;
DROP POLICY IF EXISTS "Administrators can delete classes" ON public.classes;

COMMENT ON TABLE public.classes IS 'Classes/Turmas table - RLS temporarily disabled for debugging';
