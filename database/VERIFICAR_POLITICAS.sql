-- ========================================
-- VERIFICAR POLÍTICAS ATUAIS NA TABELA USERS
-- ========================================
-- Execute este script para ver TODAS as políticas ativas

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ========================================
-- RESULTADO ESPERADO:
-- Você deve ver APENAS estas 3 políticas:
-- 1. Administrators can update all users
-- 2. Users can update own profile
-- 3. Users can view based on role
--
-- Se você vir MAIS de 3 políticas, há conflito!
-- ========================================
