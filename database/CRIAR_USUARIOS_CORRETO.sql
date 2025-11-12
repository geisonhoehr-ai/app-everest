-- ========================================
-- CRIAR USUÁRIOS DE TESTE DA FORMA CORRETA
-- ========================================
-- Como public.users tem FK para auth.users, precisamos:
-- 1. Criar usuários no auth.users PRIMEIRO
-- 2. O trigger automático criará em public.users

-- ⚠️ IMPORTANTE: Este script só funciona se você tiver permissões de SUPER USER
-- Caso contrário, você precisa criar usuários via interface do Supabase Auth

-- OPÇÃO 1: Verificar se há usuários sem perfil em public.users
-- (usuários que existem em auth.users mas não em public.users)
SELECT
    '🔍 Usuários sem perfil:' as info,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- OPÇÃO 2: Sincronizar usuários existentes de auth.users para public.users
-- (criar perfis para usuários que já existem no auth mas não tem perfil)
INSERT INTO public.users (id, email, first_name, last_name, role, is_active, created_at, updated_at)
SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)) as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'student') as role,
    true as is_active,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- VERIFICAR RESULTADO
SELECT
    '✅ Sincronização concluída!' as status,
    COUNT(*) as total_usuarios
FROM public.users;

-- LISTAR TODOS OS ESTUDANTES DISPONÍVEIS
SELECT
    '📋 Estudantes disponíveis:' as info,
    id,
    email,
    first_name,
    last_name,
    is_active
FROM public.users
WHERE role = 'student'
ORDER BY first_name, last_name;
