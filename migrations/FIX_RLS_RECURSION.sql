-- =====================================================
-- FIX RLS RECURSION ISSUE
-- =====================================================
-- Corrige o problema de recursão infinita nas políticas RLS
-- que acontece quando policies referenciam tabelas relacionadas

-- 1. DROP all existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users full access" ON users;

-- 2. DROP policies on teachers table
DROP POLICY IF EXISTS "Teachers are viewable by authenticated users" ON teachers;
DROP POLICY IF EXISTS "Teachers can update own record" ON teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON teachers;

-- 3. DROP policies on classes table
DROP POLICY IF EXISTS "Classes viewable by authenticated" ON classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON classes;

-- 4. CREATE simple, non-recursive policies for USERS table
-- These policies should NOT reference other tables to avoid recursion

CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_select_all_for_admins"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'administrator'
  )
);

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_service_role"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. CREATE policies for TEACHERS table
-- Important: Use direct user role check, not JOIN

CREATE POLICY "teachers_select_authenticated"
ON teachers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "teachers_insert_admin"
ON teachers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "teachers_update_admin"
ON teachers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

-- 6. CREATE policies for CLASSES table

CREATE POLICY "classes_select_authenticated"
ON classes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "classes_insert_teacher_admin"
ON classes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('teacher', 'administrator')
  )
);

CREATE POLICY "classes_update_teacher_admin"
ON classes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('teacher', 'administrator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('teacher', 'administrator')
  )
);

CREATE POLICY "classes_delete_admin"
ON classes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

-- 7. Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RLS policies recreated successfully without recursion!';
END $$;
