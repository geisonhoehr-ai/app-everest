-- =====================================================
-- VERIFICAR E CORRIGIR PERFIL DE ADMINISTRADOR
-- =====================================================

-- 1. Primeiro, vamos ver o usuário atual
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at
FROM users
WHERE email = 'admin@teste.com';

-- 2. Corrigir o role para administrator (caso não esteja)
UPDATE users
SET
  role = 'administrator',
  is_active = true
WHERE email = 'admin@teste.com';

-- 3. Verificar se foi atualizado
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  'ADMIN ATUALIZADO COM SUCESSO!' as status
FROM users
WHERE email = 'admin@teste.com';

-- 4. Testar a função is_admin() com o usuário atual
SELECT
  email,
  role,
  is_active,
  CASE
    WHEN role = 'administrator' AND is_active = true THEN 'SIM - É ADMIN'
    ELSE 'NÃO - NÃO É ADMIN'
  END as eh_admin
FROM users
WHERE email = 'admin@teste.com';
