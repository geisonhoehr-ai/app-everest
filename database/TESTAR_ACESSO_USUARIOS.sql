-- ========================================
-- TESTAR ACESSO À TABELA USERS
-- ========================================
-- Execute este script para diagnosticar o problema

-- TESTE 1: Verificar quantos usuários existem
SELECT
    '🔍 TESTE 1: Total de usuários' as teste,
    COUNT(*) as total
FROM public.users;

-- TESTE 2: Listar todos os usuários
SELECT
    '📋 TESTE 2: Lista de usuários' as teste,
    id,
    email,
    first_name,
    last_name,
    role,
    is_active
FROM public.users
ORDER BY created_at DESC;

-- TESTE 3: Verificar apenas estudantes
SELECT
    '🎓 TESTE 3: Apenas estudantes' as teste,
    COUNT(*) as total_estudantes
FROM public.users
WHERE role = 'student';

-- TESTE 4: Listar estudantes
SELECT
    '📝 TESTE 4: Lista de estudantes' as teste,
    id,
    email,
    first_name,
    last_name,
    is_active
FROM public.users
WHERE role = 'student'
ORDER BY first_name, last_name;

-- TESTE 5: Verificar políticas RLS ativas
SELECT
    '🔐 TESTE 5: Políticas RLS' as teste,
    policyname,
    cmd as operacao,
    qual as condicao
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- TESTE 6: Verificar se RLS está habilitado
SELECT
    '⚙️ TESTE 6: Status RLS' as teste,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'users' AND schemaname = 'public';

-- TESTE 7: Verificar permissões
SELECT
    '🔑 TESTE 7: Permissões' as teste,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- ========================================
-- RESULTADOS ESPERADOS:
-- ========================================
-- TESTE 1: Deve mostrar número total de usuários (ex: 5, 10, etc)
-- TESTE 2: Deve listar TODOS os usuários cadastrados
-- TESTE 3: Deve mostrar quantos estudantes existem
-- TESTE 4: Deve listar todos os estudantes
-- TESTE 5: Deve mostrar 3 políticas:
--   - Administrators can update all users
--   - Users can update own profile
--   - Users can view based on role
-- TESTE 6: rls_habilitado deve ser TRUE
-- TESTE 7: Deve mostrar permissões para 'authenticated'
-- ========================================
