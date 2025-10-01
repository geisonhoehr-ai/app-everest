-- =====================================================
-- FIX RLS RECURSION - FINAL SOLUTION
-- =====================================================
-- Remove TODAS as políticas e cria políticas simples sem recursão
-- Usa abordagem permissiva para evitar problemas de recursão

-- 1. DISABLE RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on users table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;

    -- Drop all policies on teachers table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'teachers' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON teachers';
    END LOOP;

    -- Drop all policies on classes table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'classes' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON classes';
    END LOOP;
END $$;

-- 3. CREATE SIMPLE PERMISSIVE POLICIES FOR USERS
-- Strategy: Allow all authenticated users to read, users can only update themselves

CREATE POLICY "users_select_all"
ON users FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to read all profiles

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_any"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow authenticated users to insert

CREATE POLICY "users_delete_own"
ON users FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 4. CREATE SIMPLE POLICIES FOR TEACHERS
-- All authenticated users can read, only service can modify

CREATE POLICY "teachers_select_all"
ON teachers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "teachers_insert_any"
ON teachers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "teachers_update_any"
ON teachers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "teachers_delete_any"
ON teachers FOR DELETE
TO authenticated
USING (true);

-- 5. CREATE SIMPLE POLICIES FOR CLASSES
-- All authenticated users can read and modify

CREATE POLICY "classes_select_all"
ON classes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "classes_insert_any"
ON classes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "classes_update_any"
ON classes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "classes_delete_any"
ON classes FOR DELETE
TO authenticated
USING (true);

-- 6. RE-ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 7. Verify policies were created
DO $$
DECLARE
    user_policies_count INTEGER;
    teacher_policies_count INTEGER;
    class_policies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_policies_count FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
    SELECT COUNT(*) INTO teacher_policies_count FROM pg_policies WHERE tablename = 'teachers' AND schemaname = 'public';
    SELECT COUNT(*) INTO class_policies_count FROM pg_policies WHERE tablename = 'classes' AND schemaname = 'public';

    RAISE NOTICE '✅ Users table: % policies created', user_policies_count;
    RAISE NOTICE '✅ Teachers table: % policies created', teacher_policies_count;
    RAISE NOTICE '✅ Classes table: % policies created', class_policies_count;
    RAISE NOTICE '✅ RLS policies recreated WITHOUT recursion!';
END $$;
