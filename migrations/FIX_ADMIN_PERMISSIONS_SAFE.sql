-- =====================================================
-- FIX ADMIN PERMISSIONS - SAFE VERSION
-- =====================================================
-- Garante que administradores tenham acesso total ao sistema
-- Apenas aplica policies em tabelas que EXISTEM

-- Função helper para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função helper para verificar se usuário está autenticado
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CLASSES TABLE - Admin tem acesso total
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "classes_admin_all" ON classes';
    EXECUTE 'DROP POLICY IF EXISTS "classes_select_all" ON classes';

    EXECUTE 'CREATE POLICY "classes_admin_all" ON classes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "classes_select_all" ON classes FOR SELECT TO authenticated USING (is_authenticated())';

    EXECUTE 'ALTER TABLE classes ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Classes policies created';
  END IF;
END $$;

-- =====================================================
-- USERS TABLE - Admin pode gerenciar todos
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "users_admin_all" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "users_select_own" ON users';
    EXECUTE 'DROP POLICY IF EXISTS "users_update_own" ON users';

    EXECUTE 'CREATE POLICY "users_admin_all" ON users FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "users_select_own" ON users FOR SELECT TO authenticated USING (id = auth.uid() OR is_admin())';
    EXECUTE 'CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (id = auth.uid() OR is_admin()) WITH CHECK (id = auth.uid() OR is_admin())';

    EXECUTE 'ALTER TABLE users ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Users policies created';
  END IF;
END $$;

-- =====================================================
-- STUDENT_CLASSES TABLE - Admin tem acesso total
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_classes' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "student_classes_admin_all" ON student_classes';
    EXECUTE 'DROP POLICY IF EXISTS "student_classes_select_all" ON student_classes';

    EXECUTE 'CREATE POLICY "student_classes_admin_all" ON student_classes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "student_classes_select_all" ON student_classes FOR SELECT TO authenticated USING (is_authenticated())';

    EXECUTE 'ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Student_classes policies created';
  END IF;
END $$;

-- =====================================================
-- CLASS_FEATURE_PERMISSIONS TABLE - Admin tem acesso total
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_feature_permissions' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "class_feature_permissions_admin_all" ON class_feature_permissions';
    EXECUTE 'DROP POLICY IF EXISTS "class_feature_permissions_select_all" ON class_feature_permissions';

    EXECUTE 'CREATE POLICY "class_feature_permissions_admin_all" ON class_feature_permissions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "class_feature_permissions_select_all" ON class_feature_permissions FOR SELECT TO authenticated USING (is_authenticated())';

    EXECUTE 'ALTER TABLE class_feature_permissions ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Class_feature_permissions policies created';
  END IF;
END $$;

-- =====================================================
-- STUDENTS TABLE - Admin tem acesso total
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "students_admin_all" ON students';
    EXECUTE 'DROP POLICY IF EXISTS "students_select_all" ON students';

    EXECUTE 'CREATE POLICY "students_admin_all" ON students FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "students_select_all" ON students FOR SELECT TO authenticated USING (is_authenticated())';

    EXECUTE 'ALTER TABLE students ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Students policies created';
  END IF;
END $$;

-- =====================================================
-- TEACHERS TABLE - Admin tem acesso total
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "teachers_admin_all" ON teachers';
    EXECUTE 'DROP POLICY IF EXISTS "teachers_select_all" ON teachers';

    EXECUTE 'CREATE POLICY "teachers_admin_all" ON teachers FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "teachers_select_all" ON teachers FOR SELECT TO authenticated USING (is_authenticated())';

    EXECUTE 'ALTER TABLE teachers ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Teachers policies created';
  END IF;
END $$;

-- =====================================================
-- SUBJECTS TABLE - Admin tem acesso total
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "subjects_admin_all" ON subjects';
    EXECUTE 'DROP POLICY IF EXISTS "subjects_select_all" ON subjects';

    EXECUTE 'CREATE POLICY "subjects_admin_all" ON subjects FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "subjects_select_all" ON subjects FOR SELECT TO authenticated USING (is_authenticated())';

    EXECUTE 'ALTER TABLE subjects ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Subjects policies created';
  END IF;
END $$;

-- =====================================================
-- FLASHCARDS TABLE - Admin tem acesso total
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcards' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "flashcards_admin_all" ON flashcards';
    EXECUTE 'DROP POLICY IF EXISTS "flashcards_select_all" ON flashcards';

    EXECUTE 'CREATE POLICY "flashcards_admin_all" ON flashcards FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "flashcards_select_all" ON flashcards FOR SELECT TO authenticated USING (is_authenticated())';

    EXECUTE 'ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Flashcards policies created';
  END IF;
END $$;

-- =====================================================
-- VIDEO_COURSES TABLE - Admin tem acesso total
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_courses' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "video_courses_admin_all" ON video_courses';
    EXECUTE 'DROP POLICY IF EXISTS "video_courses_select_all" ON video_courses';

    EXECUTE 'CREATE POLICY "video_courses_admin_all" ON video_courses FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "video_courses_select_all" ON video_courses FOR SELECT TO authenticated USING (is_authenticated())';

    EXECUTE 'ALTER TABLE video_courses ENABLE ROW LEVEL SECURITY';
    RAISE NOTICE '✅ Video_courses policies created';
  END IF;
END $$;

-- =====================================================
-- Mensagem de sucesso
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ ✅ ✅ Admin permissions configured successfully! ✅ ✅ ✅';
  RAISE NOTICE '✅ Administrators have full access to all existing tables';
  RAISE NOTICE '✅ Helper functions created: is_admin(), is_authenticated()';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Execute este SQL no Supabase SQL Editor';
  RAISE NOTICE '👉 Depois faça logout e login novamente';
END $$;
