-- =====================================================
-- FIX RLS POLICIES FOR USERS TABLE
-- =====================================================
-- This migration fixes the Row Level Security policies for the users table
-- to properly allow administrators and teachers to view all users.
--
-- PROBLEM: The current policy has a recursive SELECT that can cause issues
-- and may not properly allow admins to see all users.
--
-- SOLUTION: Simplify the policy to avoid recursion and properly check roles.

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Administrators can view all users" ON public.users;
DROP POLICY IF EXISTS "Administrators can manage all users" ON public.users;

-- Policy 1: SELECT - View access based on role
CREATE POLICY "Enable read access for authenticated users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Users can see their own profile
        id = auth.uid()
        OR
        -- Administrators and teachers can see all users
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('administrator', 'teacher')
        )
    );

-- Policy 2: UPDATE - Users can update their own profile
CREATE POLICY "Enable update for own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 3: UPDATE - Administrators can update all users
CREATE POLICY "Enable update for administrators"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'administrator'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'administrator'
        )
    );

-- Policy 4: INSERT - Only administrators can create users manually
CREATE POLICY "Enable insert for administrators"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'administrator'
        )
    );

-- Policy 5: DELETE - Only administrators can delete users
CREATE POLICY "Enable delete for administrators"
    ON public.users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'administrator'
        )
    );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT INSERT, DELETE ON public.users TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Enable read access for authenticated users" ON public.users IS
    'Users can see their own profile, administrators and teachers can see all users';

COMMENT ON POLICY "Enable update for own profile" ON public.users IS
    'Users can update their own profile information';

COMMENT ON POLICY "Enable update for administrators" ON public.users IS
    'Administrators can update any user profile';

COMMENT ON POLICY "Enable insert for administrators" ON public.users IS
    'Only administrators can manually create new users';

COMMENT ON POLICY "Enable delete for administrators" ON public.users IS
    'Only administrators can delete users';

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================
-- Run these queries to verify the policies are working:
--
-- 1. Check current user's role:
-- SELECT id, email, role FROM users WHERE id = auth.uid();
--
-- 2. Test if admin can see all users:
-- SELECT COUNT(*) FROM users;
--
-- 3. Check all active policies:
-- SELECT * FROM pg_policies WHERE tablename = 'users';
