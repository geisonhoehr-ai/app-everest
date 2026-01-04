-- =====================================================
-- FIX TEST USERS AUTHENTICATION
-- =====================================================
-- Data: 2026-01-02
-- Objetivo: Corrigir autenticação dos usuários de teste
-- Problema: Usuários criados anteriormente não conseguem fazer login
-- Solução: Recriar usuários com todos os campos necessários
-- =====================================================


-- 1. GARANTIR RESTRIÇÕES ÚNICAS (NECESSÁRIO PARA ON CONFLICT)
-- =====================================================
DO $$
BEGIN
    -- Check and add constraint for students table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_user_id_key') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
             ALTER TABLE public.students ADD CONSTRAINT students_user_id_key UNIQUE (user_id);
        END IF;
    END IF;

    -- Check and add constraint for teachers table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_user_id_key') THEN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teachers') THEN
            ALTER TABLE public.teachers ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);
        END IF;
    END IF;
END $$;

-- 2. DELETAR USUÁRIOS EXISTENTES
-- =====================================================
DELETE FROM auth.users WHERE email IN ('aluno@teste.com', 'professor@teste.com', 'admin@teste.com');


-- 2. CRIAR USUÁRIOS COM TODOS OS CAMPOS NECESSÁRIOS
-- =====================================================
DO $$
DECLARE
  aluno_id uuid := gen_random_uuid();
  professor_id uuid := gen_random_uuid();
  admin_id uuid := gen_random_uuid();
BEGIN
  -- Inserir no auth.users com todos os campos necessários
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES
    -- ALUNO
    (
      aluno_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'aluno@teste.com',
      crypt('senha123', gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    -- PROFESSOR
    (
      professor_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'professor@teste.com',
      crypt('senha123', gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    -- ADMIN
    (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@teste.com',
      crypt('senha123', gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

  -- Inserir perfis públicos
  INSERT INTO public.users (id, first_name, last_name, email, role, is_active)
  VALUES
    (aluno_id, 'Aluno', 'Teste', 'aluno@teste.com', 'student', true),
    (professor_id, 'Professor', 'Teste', 'professor@teste.com', 'teacher', true),
    (admin_id, 'Admin', 'Teste', 'admin@teste.com', 'administrator', true)
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

  -- Inserir registro de aluno
  INSERT INTO public.students (user_id, student_id_number, enrollment_date)
  VALUES (aluno_id, 'ST2025001', now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Inserir registro de professor
  INSERT INTO public.teachers (user_id, employee_id_number, hire_date, department)
  VALUES (professor_id, 'TCH2025001', now(), 'Ciências Humanas')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE '✅ Usuários de teste criados com sucesso:';
  RAISE NOTICE '   - aluno@teste.com (ID: %)', aluno_id;
  RAISE NOTICE '   - professor@teste.com (ID: %)', professor_id;
  RAISE NOTICE '   - admin@teste.com (ID: %)', admin_id;
  RAISE NOTICE '   Senha para todos: senha123';
END $$;

-- =====================================================
-- 3. VERIFICAR CRIAÇÃO
-- =====================================================
SELECT 
  u.email,
  u.role as auth_role,
  p.role as profile_role,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.created_at
FROM auth.users u
LEFT JOIN public.users p ON p.id = u.id
WHERE u.email IN ('aluno@teste.com', 'professor@teste.com', 'admin@teste.com')
ORDER BY u.email;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
