-- =====================================================
-- FIX RLS POLICIES - VERSÃO FINAL
-- =====================================================
-- Corrige policies para funcionar tanto na aplicação quanto no dashboard

-- TABELA USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_all_access" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;

-- Política 1: Acesso total para service_role (Supabase Dashboard)
CREATE POLICY "users_all_access"
ON users
FOR ALL
USING (true);

-- TABELA CLASSES
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_all_access" ON classes;
DROP POLICY IF EXISTS "classes_admin_all" ON classes;
DROP POLICY IF EXISTS "classes_select_all" ON classes;

CREATE POLICY "classes_all_access"
ON classes
FOR ALL
USING (true);

-- TABELA STUDENT_CLASSES
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_classes_all_access" ON student_classes;
DROP POLICY IF EXISTS "student_classes_admin_all" ON student_classes;
DROP POLICY IF EXISTS "student_classes_select_all" ON student_classes;

CREATE POLICY "student_classes_all_access"
ON student_classes
FOR ALL
USING (true);

-- TABELA CLASS_FEATURE_PERMISSIONS
ALTER TABLE class_feature_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_feature_permissions_all_access" ON class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_admin_all" ON class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_select_all" ON class_feature_permissions;

CREATE POLICY "class_feature_permissions_all_access"
ON class_feature_permissions
FOR ALL
USING (true);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies configuradas com sucesso!';
  RAISE NOTICE '✅ Todas as tabelas agora permitem acesso total';
  RAISE NOTICE '⚠️ IMPORTANTE: Adicione políticas mais restritivas depois para segurança';
END $$;
