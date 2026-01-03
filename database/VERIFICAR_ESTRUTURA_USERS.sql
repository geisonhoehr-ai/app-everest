-- ========================================
-- VERIFICAR ESTRUTURA DA TABELA USERS
-- ========================================

-- TESTE 1: Ver todas as constraints da tabela users
SELECT
    '🔍 TESTE 1: Constraints' as teste,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
ORDER BY contype, conname;

-- TESTE 2: Ver foreign keys
SELECT
    '🔑 TESTE 2: Foreign Keys' as teste,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users'
    AND tc.table_schema = 'public';

-- TESTE 3: Verificar se users.id referencia auth.users.id
SELECT
    '📋 TESTE 3: Estrutura' as teste,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
ORDER BY ordinal_position;

-- TESTE 4: Contar usuários em auth.users
SELECT
    '👥 TESTE 4: Usuários Auth' as teste,
    COUNT(*) as total_auth_users
FROM auth.users;

-- TESTE 5: Contar usuários em public.users
SELECT
    '📊 TESTE 5: Usuários Public' as teste,
    COUNT(*) as total_public_users
FROM public.users;

-- TESTE 6: Ver usuários que existem em auth mas NÃO em public
SELECT
    '⚠️ TESTE 6: Usuários sem perfil' as teste,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
