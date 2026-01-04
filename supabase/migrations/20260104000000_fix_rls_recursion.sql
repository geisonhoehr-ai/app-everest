-- =====================================================
-- FIX RLS RECURSION IN USERS TABLE
-- =====================================================
-- Date: 2026-01-04
-- Objective: Fix infinite recursion in RLS policies by using a SECURITY DEFINER function
-- Problem: The "Administrators can view all users" policy queries the users table itself, 
-- causing infinite recursion and timeouts.

-- 1. Create a helper function to check user role securely
-- This function runs with SECURITY DEFINER privileges, bypassing RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = auth.uid();
$$;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Administrators can view all users" ON public.users;

-- 3. Create optimized non-recursive policy for SELECT
CREATE POLICY "Enable read access for authenticated users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- User is viewing their own profile
        id = auth.uid()
        OR
        -- User is an administrator or teacher (using the secure function to avoid recursion)
        public.get_auth_user_role() IN ('administrator', 'teacher')
    );

-- 4. Ensure other admin policies also use the secure function if they exist
-- (Re-creating them to be safe)

DROP POLICY IF EXISTS "Enable update for administrators" ON public.users;
CREATE POLICY "Enable update for administrators"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        public.get_auth_user_role() = 'administrator'
    )
    WITH CHECK (
        public.get_auth_user_role() = 'administrator'
    );

DROP POLICY IF EXISTS "Enable insert for administrators" ON public.users;
CREATE POLICY "Enable insert for administrators"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_auth_user_role() = 'administrator'
    );

DROP POLICY IF EXISTS "Enable delete for administrators" ON public.users;
CREATE POLICY "Enable delete for administrators"
    ON public.users
    FOR DELETE
    TO authenticated
    USING (
        public.get_auth_user_role() = 'administrator'
    );

COMMENT ON FUNCTION public.get_auth_user_role IS 'Helper function to safely retrieve user role without triggering RLS recursion';
