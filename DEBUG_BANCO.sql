-- 1. VERIFICAR USUÁRIO ADMIN
SELECT id, email, role, is_active FROM users WHERE email = 'admin@teste.com';

-- 2. VERIFICAR POLICIES DA TABELA USERS
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'users';

-- 3. VERIFICAR POLICIES DA TABELA CLASSES
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'classes';

-- 4. VERIFICAR SE FUNÇÕES EXISTEM
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name IN ('is_admin', 'is_authenticated');

-- 5. TESTAR AUTENTICAÇÃO ATUAL
SELECT auth.uid() as user_id,
CASE WHEN auth.uid() IS NOT NULL THEN 'Autenticado' ELSE 'Não autenticado' END as status;
