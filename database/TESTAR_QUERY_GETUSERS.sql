-- ========================================
-- SIMULAR A QUERY QUE O getUsers() FAZ
-- ========================================
-- Esta é exatamente a query que a função getUsers() executa
-- Vamos testá-la aqui para ver se retorna os usuários

-- TESTE 1: Query básica (o que getUsers() deveria fazer)
SELECT * FROM public.users
ORDER BY created_at DESC;

-- TESTE 2: Verificar se as políticas RLS estão permitindo
-- (simular como se você estivesse autenticado)
SELECT
    '🔍 TESTE: Buscar todos os usuários' as teste,
    *
FROM public.users
ORDER BY created_at DESC;

-- TESTE 3: Buscar apenas estudantes (o que o dropdown precisa)
SELECT
    '🎓 TESTE: Apenas estudantes' as teste,
    id,
    email,
    first_name,
    last_name,
    role,
    is_active
FROM public.users
WHERE role = 'student'
ORDER BY created_at DESC;

-- TESTE 4: Verificar se você consegue ver os 2 estudantes
SELECT
    '✅ RESULTADO:' as info,
    COUNT(*) as total_estudantes
FROM public.users
WHERE role = 'student';

-- TESTE 5: Atualizar os nomes dos estudantes (estão vazios)
UPDATE public.users
SET
    first_name = CASE
        WHEN email = 'geisonhoehr@gmail.com' THEN 'Geison'
        WHEN email = 'aluno@teste.com' THEN 'Aluno Teste'
        ELSE first_name
    END,
    last_name = CASE
        WHEN email = 'geisonhoehr@gmail.com' THEN 'Hoehr'
        WHEN email = 'aluno@teste.com' THEN 'Silva'
        ELSE last_name
    END,
    updated_at = NOW()
WHERE email IN ('geisonhoehr@gmail.com', 'aluno@teste.com')
    AND (first_name = '' OR first_name IS NULL);

-- TESTE 6: Verificar resultado após atualização
SELECT
    '📝 Estudantes atualizados:' as info,
    id,
    email,
    first_name,
    last_name,
    role,
    is_active
FROM public.users
WHERE role = 'student'
ORDER BY first_name;
