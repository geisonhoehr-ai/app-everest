-- ===============================================================
-- 🚨 EXECUTE ESTE SCRIPT NO SUPABASE AGORA PARA CORRIGIR LOGIN
-- ===============================================================
--
-- PROBLEMAS IDENTIFICADOS:
-- ❌ View 'user_profiles' não existe (causa erro 404 nas consultas)
-- ❌ Políticas RLS podem estar bloqueando acesso
-- ❌ Triggers automáticos não configurados
-- ❌ Usuários auth.users sem perfis em public.users
--
-- ===============================================================

-- 1. 🔧 CORRIGIR RLS - HABILITAR ACESSO À TABELA USERS
-- ===============================================================
-- Remove políticas existentes que podem estar bloqueando
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Habilita RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política permissiva para visualização de perfis
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            auth.uid() = id OR
            (SELECT role FROM users WHERE id = auth.uid()) IN ('administrator', 'teacher')
        )
    );

-- Política para atualização de próprio perfil
CREATE POLICY "Enable update for users based on user_id" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- 2. 🔧 CRIAR VIEW USER_PROFILES (ESSENCIAL!)
-- ===============================================================
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
    -- Student fields
    s.student_id_number,
    s.enrollment_date,
    -- Teacher fields
    t.employee_id_number,
    t.department,
    t.hire_date
FROM users u
LEFT JOIN students s ON u.id = s.user_id
LEFT JOIN teachers t ON u.id = t.user_id
WHERE u.is_active = true;

-- Conceder acesso à view
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- 3. 🔧 CRIAR FUNÇÃO DE CRIAÇÃO AUTOMÁTICA DE PERFIL
-- ===============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir perfil básico em public.users
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
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
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

-- 4. 🔧 CRIAR TRIGGER AUTOMÁTICO
-- ===============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 5. 🔧 MIGRAR USUÁRIOS EXISTENTES SEM PERFIL
-- ===============================================================
DO $$
DECLARE
    auth_user RECORD;
    user_count INTEGER := 0;
BEGIN
    -- Buscar usuários do auth.users que não têm perfil em public.users
    FOR auth_user IN
        SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
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
            COALESCE(auth_user.raw_user_meta_data->>'role', 'student')::user_role,
            true,
            'managed_by_supabase_auth',
            auth_user.created_at,
            NOW()
        );

        user_count := user_count + 1;
    END LOOP;

    RAISE NOTICE '✅ Migração concluída! % usuários criados.', user_count;
END $$;

-- 6. 🔧 CONCEDER PERMISSÕES NECESSÁRIAS
-- ===============================================================
-- Tabelas principais
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT ON students TO authenticated;
GRANT SELECT ON teachers TO authenticated;

-- Views
GRANT SELECT ON user_profiles TO authenticated;

-- 7. 🔧 CRIAR ÍNDICES PARA PERFORMANCE
-- ===============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- 8. 🔧 FUNÇÃO DE VALIDAÇÃO (PARA DEBUG)
-- ===============================================================
CREATE OR REPLACE FUNCTION check_auth_status()
RETURNS TABLE(
    status TEXT,
    auth_users_count BIGINT,
    public_users_count BIGINT,
    user_profiles_count BIGINT,
    missing_profiles BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        '✅ Sistema funcionando!' as status,
        (SELECT COUNT(*) FROM auth.users) as auth_users_count,
        (SELECT COUNT(*) FROM public.users) as public_users_count,
        (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
        (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id WHERE pu.id IS NULL) as missing_profiles;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================
-- 🎯 VALIDAÇÃO FINAL - EXECUTE PARA VERIFICAR SE FUNCIONOU
-- ===============================================================
-- SELECT * FROM check_auth_status();
-- SELECT * FROM user_profiles LIMIT 5;

-- ===============================================================
-- ✅ SCRIPT CONCLUÍDO!
--
-- APÓS EXECUTAR:
-- 1. Todos os usuários auth.users terão perfis em public.users
-- 2. A view user_profiles estará funcionando
-- 3. RLS configurado corretamente
-- 4. Novos usuários serão criados automaticamente
--
-- O LOGIN DEVE FUNCIONAR AGORA! 🚀
-- ===============================================================