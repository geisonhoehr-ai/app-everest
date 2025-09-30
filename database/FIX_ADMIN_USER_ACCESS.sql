-- =====================================================
-- CORREÇÃO DE POLÍTICAS RLS PARA ADMINISTRADORES
-- =====================================================
-- Execute este arquivo no Supabase SQL Editor para permitir que administradores vejam todos os usuários

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Teachers can view their students" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable user registration" ON public.users;

-- 1. Criar política específica para administradores verem todos os usuários
CREATE POLICY "Administrators can view all users"
ON public.users
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'administrator'
  )
);

-- 2. Criar política para administradores gerenciarem todos os usuários
CREATE POLICY "Administrators can manage all users"
ON public.users
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'administrator'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'administrator'
  )
);

-- 3. Política para professores verem alunos de suas turmas
CREATE POLICY "Teachers can view their students"
ON public.users
FOR SELECT
TO public
USING (
  (
    -- Professor vê seus alunos
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'teacher'
    )
    AND
    EXISTS (
      SELECT 1
      FROM student_classes sc
      JOIN classes c ON sc.class_id = c.id
      WHERE sc.user_id = users.id
      AND c.teacher_id = auth.uid()
    )
  )
  OR
  -- Ou está vendo seu próprio perfil
  (auth.uid() = users.id)
);

-- 4. Política para usuários verem seu próprio perfil
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO public
USING (auth.uid() = users.id);

-- 5. Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO public
USING (auth.uid() = users.id)
WITH CHECK (auth.uid() = users.id);

-- 6. Política para permitir registro de novos usuários
CREATE POLICY "Enable user registration"
ON public.users
FOR INSERT
TO public
WITH CHECK (auth.uid() = users.id);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Execute estas queries para verificar se funcionou:

-- 1. Ver todas as políticas da tabela users
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Testar se consegue ver todos os usuários (quando logado como admin)
SELECT id, first_name, last_name, email, role, is_active 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
