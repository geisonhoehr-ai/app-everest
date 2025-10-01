-- =====================================================
-- FIX ALL RLS POLICIES - COMPLETO
-- =====================================================
-- Garante que administradores tenham acesso a TODAS as tabelas e views

-- STEP 1: Garantir que o usuário admin@teste.com é administrador
UPDATE users
SET role = 'administrator', is_active = true
WHERE email = 'admin@teste.com';

-- STEP 2: Criar policies para class_stats VIEW (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'class_stats' AND table_schema = 'public') THEN
    -- Views não têm RLS, mas precisam de políticas nas tabelas base
    RAISE NOTICE '✅ View class_stats encontrada';
  END IF;
END $$;

-- STEP 3: Adicionar policies faltantes para student_classes
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_classes_admin_all" ON student_classes;
DROP POLICY IF EXISTS "student_classes_select_all" ON student_classes;

CREATE POLICY "student_classes_admin_all"
ON student_classes FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "student_classes_select_all"
ON student_classes FOR SELECT TO authenticated
USING (is_authenticated());

-- STEP 4: Adicionar policies faltantes para class_feature_permissions
ALTER TABLE class_feature_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "class_feature_permissions_admin_all" ON class_feature_permissions;
DROP POLICY IF EXISTS "class_feature_permissions_select_all" ON class_feature_permissions;

CREATE POLICY "class_feature_permissions_admin_all"
ON class_feature_permissions FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "class_feature_permissions_select_all"
ON class_feature_permissions FOR SELECT TO authenticated
USING (is_authenticated());

-- STEP 5: Verificar o usuário admin
SELECT
  email,
  role,
  is_active,
  CASE
    WHEN role = 'administrator' AND is_active = true THEN '✅ SIM - É ADMIN'
    ELSE '❌ NÃO - NÃO É ADMIN'
  END as status_admin
FROM users
WHERE email = 'admin@teste.com';
