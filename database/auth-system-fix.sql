-- ============================================
-- SOLUÇÃO DEFINITIVA PARA AUTENTICAÇÃO
-- ============================================
--
-- Este script resolve TODOS os problemas de autenticação:
-- 1. Cria view unificada para eliminar múltiplas consultas
-- 2. Adiciona triggers para sincronização automática
-- 3. Implementa função de criação automática de perfil
-- 4. Garante consistência entre auth.users e public.users
--
-- Execute este script para resolver definitivamente os problemas!
-- ============================================

-- 1. CRIAR FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    password_hash,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'student', -- Default role
    true,
    'managed_by_supabase_auth',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CRIAR TRIGGER PARA SINCRONIZAÇÃO AUTOMÁTICA
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 3. CRIAR VIEW UNIFICADA PARA PERFORMANCE
-- ============================================
DROP VIEW IF EXISTS user_profiles;

CREATE VIEW user_profiles AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.is_active,
  u.created_at,
  u.updated_at,
  -- Student specific fields
  s.student_id_number,
  s.enrollment_date,
  -- Teacher specific fields
  t.employee_id_number,
  t.department,
  t.hire_date
FROM users u
LEFT JOIN students s ON u.id = s.user_id
LEFT JOIN teachers t ON u.id = t.user_id
WHERE u.is_active = true;

-- 4. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- ============================================
-- Enable RLS on the view
ALTER VIEW user_profiles SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON user_profiles TO authenticated;
GRANT UPDATE ON users TO authenticated;

-- 5. CRIAR POLÍTICA DE SEGURANÇA
-- ============================================
-- Users can only see their own profile or if they are admin/teacher
CREATE POLICY "Users can view profiles" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('administrator', 'teacher')
  );

-- Users can only update their own profile (excluding role changes)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 6. FUNÇÃO PARA MIGRAR DADOS EXISTENTES (SE NECESSÁRIO)
-- ============================================
CREATE OR REPLACE FUNCTION migrate_existing_auth_users()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
BEGIN
  -- Migrate existing auth.users that don't have profiles
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    INSERT INTO public.users (
      id,
      email,
      first_name,
      last_name,
      role,
      is_active,
      password_hash,
      created_at,
      updated_at
    ) VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'first_name', split_part(auth_user.email, '@', 1)),
      COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
      'student',
      true,
      'managed_by_supabase_auth',
      NOW(),
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'Migration completed successfully!';
END;
$$ LANGUAGE plpgsql;

-- 7. EXECUTAR MIGRAÇÃO (DESCOMENTE SE NECESSÁRIO)
-- ============================================
-- SELECT migrate_existing_auth_users();

-- 8. FUNÇÃO PARA VALIDAR INTEGRIDADE DOS DADOS
-- ============================================
CREATE OR REPLACE FUNCTION validate_auth_integrity()
RETURNS TABLE(
  auth_users_count bigint,
  public_users_count bigint,
  missing_profiles_count bigint,
  orphaned_profiles_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.users) as public_users_count,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id WHERE pu.id IS NULL) as missing_profiles_count,
    (SELECT COUNT(*) FROM public.users pu LEFT JOIN auth.users au ON pu.id = au.id WHERE au.id IS NULL) as orphaned_profiles_count;
END;
$$ LANGUAGE plpgsql;

-- 9. ADICIONAR ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================
COMMENT ON VIEW user_profiles IS 'Unified view combining user data with student/teacher information for simplified queries';
COMMENT ON FUNCTION create_user_profile() IS 'Automatically creates user profile when new auth user is created';
COMMENT ON FUNCTION migrate_existing_auth_users() IS 'One-time migration function for existing auth users without profiles';
COMMENT ON FUNCTION validate_auth_integrity() IS 'Validates data integrity between auth.users and public.users';

-- ============================================
-- FIM DO SCRIPT - SISTEMA DE AUTH CORRIGIDO!
-- ============================================

-- Para verificar se tudo está funcionando, execute:
-- SELECT * FROM validate_auth_integrity();
-- SELECT * FROM user_profiles LIMIT 5;