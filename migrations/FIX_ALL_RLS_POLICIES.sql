-- =====================================================
-- FIX ALL RLS POLICIES - COMPLETE SOLUTION
-- =====================================================
-- Adiciona políticas RLS permissivas para TODAS as tabelas relacionadas

-- 1. STUDENTS table policies
DROP POLICY IF EXISTS "students_select_all" ON students;
DROP POLICY IF EXISTS "students_insert_any" ON students;
DROP POLICY IF EXISTS "students_update_any" ON students;
DROP POLICY IF EXISTS "students_delete_any" ON students;

CREATE POLICY "students_select_all"
ON students FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "students_insert_any"
ON students FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "students_update_any"
ON students FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "students_delete_any"
ON students FOR DELETE
TO authenticated
USING (true);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 2. STUDENT_CLASSES table policies
DROP POLICY IF EXISTS "student_classes_select_all" ON student_classes;
DROP POLICY IF EXISTS "student_classes_insert_any" ON student_classes;
DROP POLICY IF EXISTS "student_classes_update_any" ON student_classes;
DROP POLICY IF EXISTS "student_classes_delete_any" ON student_classes;

CREATE POLICY "student_classes_select_all"
ON student_classes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "student_classes_insert_any"
ON student_classes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "student_classes_update_any"
ON student_classes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "student_classes_delete_any"
ON student_classes FOR DELETE
TO authenticated
USING (true);

ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;

-- 3. CLASS_FEATURE_PERMISSIONS table policies
DROP POLICY IF EXISTS "class_feature_permissions_select_all" ON class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_insert_any" ON class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_update_any" ON class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_delete_any" ON class_feature_permissions;

CREATE POLICY "class_feature_permissions_select_all"
ON class_feature_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "class_feature_permissions_insert_any"
ON class_feature_permissions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "class_feature_permissions_update_any"
ON class_feature_permissions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "class_feature_permissions_delete_any"
ON class_feature_permissions FOR DELETE
TO authenticated
USING (true);

ALTER TABLE class_feature_permissions ENABLE ROW LEVEL SECURITY;

-- 4. TRIAL_ALLOWED_CONTENT table policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trial_allowed_content' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "trial_allowed_content_select_all" ON trial_allowed_content';
    EXECUTE 'DROP POLICY IF EXISTS "trial_allowed_content_insert_any" ON trial_allowed_content';
    EXECUTE 'DROP POLICY IF EXISTS "trial_allowed_content_update_any" ON trial_allowed_content';
    EXECUTE 'DROP POLICY IF EXISTS "trial_allowed_content_delete_any" ON trial_allowed_content';

    EXECUTE 'CREATE POLICY "trial_allowed_content_select_all" ON trial_allowed_content FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "trial_allowed_content_insert_any" ON trial_allowed_content FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "trial_allowed_content_update_any" ON trial_allowed_content FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "trial_allowed_content_delete_any" ON trial_allowed_content FOR DELETE TO authenticated USING (true)';

    EXECUTE 'ALTER TABLE trial_allowed_content ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 5. Grant permissions on all tables to authenticated role
GRANT ALL ON users TO authenticated;
GRANT ALL ON students TO authenticated;
GRANT ALL ON teachers TO authenticated;
GRANT ALL ON classes TO authenticated;
GRANT ALL ON student_classes TO authenticated;
GRANT ALL ON class_feature_permissions TO authenticated;

-- 6. Recreate user_profiles view to ensure it works
DROP VIEW IF EXISTS user_profiles CASCADE;

CREATE OR REPLACE VIEW user_profiles AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.is_active,
  u.created_at,
  u.updated_at,
  s.student_id_number,
  s.enrollment_date,
  t.employee_id_number,
  t.department,
  t.hire_date
FROM users u
LEFT JOIN students s ON u.id = s.user_id
LEFT JOIN teachers t ON u.id = t.user_id;

GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All RLS policies created successfully!';
  RAISE NOTICE '✅ Permissions granted to authenticated users';
  RAISE NOTICE '✅ View user_profiles recreated';
END $$;
