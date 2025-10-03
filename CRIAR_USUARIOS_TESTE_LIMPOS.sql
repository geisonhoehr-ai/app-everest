-- =====================================================
-- LIMPAR E CRIAR USUÁRIOS DE TESTE LIMPOS
-- =====================================================
-- Este script remove todos os usuários de teste antigos e cria 3 novos:
-- 1. aluno@everest.com (password: aluno123)
-- 2. professor@everest.com (password: professor123)
-- 3. admin@everest.com (password: admin123)

-- =====================================================
-- PASSO 1: DESABILITAR RLS TEMPORARIAMENTE (PARA LIMPEZA)
-- =====================================================

-- Primeiro, vamos ver todos os usuários atuais
SELECT
  id,
  email,
  role,
  is_active,
  created_at,
  '📋 USUÁRIOS ANTES DA LIMPEZA' as status
FROM users
ORDER BY created_at DESC;

-- =====================================================
-- PASSO 2: DELETAR USUÁRIOS DE TESTE ANTIGOS
-- =====================================================

-- Deletar usuários temporários e de teste antigos
DELETE FROM users
WHERE email LIKE '%@teste.com'
   OR email LIKE 'temp_%'
   OR email LIKE '%admin@everest.com'
   OR email LIKE '%professor@everest.com'
   OR email LIKE '%aluno@everest.com';

-- Verificar quantos foram deletados
SELECT
  COUNT(*) as usuarios_restantes,
  '🗑️ USUÁRIOS APÓS LIMPEZA' as status
FROM users;

-- =====================================================
-- PASSO 3: CRIAR USUÁRIOS DE TESTE NA TABELA USERS
-- =====================================================

-- IMPORTANTE: Os IDs devem coincidir com os da tabela auth.users
-- Você precisará criar os usuários no Supabase Auth primeiro, depois pegar os IDs

-- Por enquanto, vamos usar IDs fictícios que você substituirá depois
-- Formato: gen_random_uuid() gera UUIDs automaticamente

-- 1. Criar Aluno
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'aluno@everest.com',
  'Aluno',
  'Teste',
  'student',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email)
DO UPDATE SET
  role = 'student',
  is_active = true,
  first_name = 'Aluno',
  last_name = 'Teste';

-- 2. Criar Professor
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'professor@everest.com',
  'Professor',
  'Teste',
  'teacher',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email)
DO UPDATE SET
  role = 'teacher',
  is_active = true,
  first_name = 'Professor',
  last_name = 'Teste';

-- 3. Criar Admin
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@everest.com',
  'Admin',
  'Teste',
  'administrator',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email)
DO UPDATE SET
  role = 'administrator',
  is_active = true,
  first_name = 'Admin',
  last_name = 'Teste';

-- =====================================================
-- PASSO 4: VERIFICAR OS NOVOS USUÁRIOS
-- =====================================================

SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  CASE role
    WHEN 'student' THEN '👨‍🎓 ALUNO'
    WHEN 'teacher' THEN '👨‍🏫 PROFESSOR'
    WHEN 'administrator' THEN '👑 ADMINISTRADOR'
  END as tipo_usuario,
  '✅ NOVOS USUÁRIOS CRIADOS' as status
FROM users
WHERE email IN ('aluno@everest.com', 'professor@everest.com', 'admin@everest.com')
ORDER BY
  CASE role
    WHEN 'administrator' THEN 1
    WHEN 'teacher' THEN 2
    WHEN 'student' THEN 3
  END;

-- =====================================================
-- PASSO 5: MOSTRAR INFORMAÇÕES DE LOGIN
-- =====================================================

SELECT
  '📧 CREDENCIAIS DE TESTE' as titulo,
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separador;

SELECT
  email,
  CASE role
    WHEN 'student' THEN '👨‍🎓 Aluno'
    WHEN 'teacher' THEN '👨‍🏫 Professor'
    WHEN 'administrator' THEN '👑 Admin'
  END as perfil,
  CASE email
    WHEN 'aluno@everest.com' THEN 'aluno123'
    WHEN 'professor@everest.com' THEN 'professor123'
    WHEN 'admin@everest.com' THEN 'admin123'
  END as senha_sugerida,
  is_active as ativo
FROM users
WHERE email IN ('aluno@everest.com', 'professor@everest.com', 'admin@everest.com')
ORDER BY
  CASE role
    WHEN 'administrator' THEN 1
    WHEN 'teacher' THEN 2
    WHEN 'student' THEN 3
  END;
