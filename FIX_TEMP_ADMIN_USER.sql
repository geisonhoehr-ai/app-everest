-- =====================================================
-- CORRIGIR USUÁRIO ADMIN TEMPORÁRIO
-- =====================================================
-- Este script corrige o perfil do usuário temp_1759013059578_admin@teste.com
-- para ter o role de administrator

-- 1. Verificar o usuário atual temp
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  'ANTES DA CORREÇÃO' as status
FROM users
WHERE email LIKE '%admin@teste.com';

-- 2. Atualizar TODOS os usuários admin@teste.com para administrator
UPDATE users
SET
  role = 'administrator',
  is_active = true,
  first_name = COALESCE(first_name, 'Admin'),
  last_name = COALESCE(last_name, 'Teste')
WHERE email LIKE '%admin@teste.com';

-- 3. Verificar se foi atualizado
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  'DEPOIS DA CORREÇÃO - ADMIN ATIVO!' as status
FROM users
WHERE email LIKE '%admin@teste.com';

-- 4. Verificar se o usuário é realmente admin
SELECT
  u.email,
  u.role,
  u.is_active,
  CASE
    WHEN u.role = 'administrator' AND u.is_active = true THEN '✅ SIM - É ADMIN ATIVO'
    WHEN u.role = 'administrator' AND u.is_active = false THEN '⚠️ É ADMIN MAS ESTÁ INATIVO'
    ELSE '❌ NÃO É ADMIN'
  END as status_admin
FROM users u
WHERE u.email LIKE '%admin@teste.com';

-- 5. Verificar se há conflitos com outros usuários admin
SELECT
  COUNT(*) as total_admins,
  'Total de usuários administradores no sistema' as descricao
FROM users
WHERE role = 'administrator';

SELECT
  email,
  role,
  is_active,
  created_at
FROM users
WHERE role = 'administrator'
ORDER BY created_at DESC;
