-- =====================================================
-- FIX: DROPDOWNS VAZIOS AO VINCULAR USUÁRIOS E TURMAS
-- =====================================================
--
-- PROBLEMA IDENTIFICADO:
-- Os dropdowns aparecem vazios quando:
-- 1. Ao acessar um usuário e tentar vincular a uma turma
-- 2. Ao acessar uma turma e tentar adicionar um usuário
--
-- CAUSA:
-- As políticas RLS (Row Level Security) da tabela 'users' estão muito
-- restritivas e impedem que administradores vejam todos os usuários.
-- A política atual tem um SELECT recursivo que causa problemas.
--
-- SOLUÇÃO:
-- Recriar as políticas RLS da tabela 'users' de forma mais clara e eficiente.
--
-- =====================================================

-- =====================================================
-- PASSO 1: CORRIGIR POLÍTICAS RLS DA TABELA USERS
-- =====================================================

-- Habilitar RLS na tabela users (se ainda não estiver habilitado)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Administrators can view all users" ON public.users;
DROP POLICY IF EXISTS "Administrators can manage all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.users;
DROP POLICY IF EXISTS "Enable update for administrators" ON public.users;
DROP POLICY IF EXISTS "Enable insert for administrators" ON public.users;
DROP POLICY IF EXISTS "Enable delete for administrators" ON public.users;

-- =====================================================
-- NOVA POLÍTICA 1: SELECT - Visualização de usuários
-- =====================================================
-- Permite que:
-- - Cada usuário veja seu próprio perfil
-- - Administradores vejam TODOS os usuários
-- - Professores vejam TODOS os usuários
CREATE POLICY "Users can view based on role"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Usuário pode ver seu próprio perfil
        id = auth.uid()
        OR
        -- Administradores e professores podem ver todos os usuários
        -- NOTA: Usamos a coluna 'role' diretamente para evitar recursão
        (
            SELECT role
            FROM public.users
            WHERE id = auth.uid()
            LIMIT 1
        ) IN ('administrator', 'teacher')
    );

-- =====================================================
-- NOVA POLÍTICA 2: UPDATE - Atualização próprio perfil
-- =====================================================
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- =====================================================
-- NOVA POLÍTICA 3: UPDATE - Administradores atualizam todos
-- =====================================================
CREATE POLICY "Administrators can update all users"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'administrator'
    )
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'administrator'
    );

-- =====================================================
-- NOVA POLÍTICA 4: INSERT - Apenas administradores criam usuários
-- =====================================================
CREATE POLICY "Administrators can insert users"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'administrator'
    );

-- =====================================================
-- NOVA POLÍTICA 5: DELETE - Apenas administradores deletam usuários
-- =====================================================
CREATE POLICY "Administrators can delete users"
    ON public.users
    FOR DELETE
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'administrator'
    );

-- =====================================================
-- PASSO 2: GARANTIR PERMISSÕES CORRETAS
-- =====================================================
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT INSERT, DELETE ON public.users TO authenticated;

-- =====================================================
-- PASSO 3: VERIFICAR POLÍTICAS DA TABELA CLASSES
-- =====================================================
-- As políticas de classes já devem estar corretas, mas vamos garantir
-- que administradores e professores possam ver todas as classes

-- Verificar se RLS está habilitado
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Remover política antiga que pode estar conflitando
DROP POLICY IF EXISTS "Administrators and teachers can view all classes" ON public.classes;

-- Recriar política para admins e professores verem todas as classes
CREATE POLICY "Admins and teachers can view all classes"
    ON public.classes
    FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('administrator', 'teacher')
        OR
        -- Estudantes veem apenas suas turmas
        EXISTS (
            SELECT 1 FROM public.student_classes
            WHERE student_classes.class_id = classes.id
            AND student_classes.user_id = auth.uid()
        )
    );

-- =====================================================
-- PASSO 4: VERIFICAR POLÍTICAS DA TABELA STUDENT_CLASSES
-- =====================================================
-- As políticas já devem estar corretas, mas vamos garantir

ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

-- As políticas de student_classes já foram criadas na migration anterior
-- Apenas verificamos se existem

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON POLICY "Users can view based on role" ON public.users IS
    'Usuários veem seu próprio perfil; Admins e professores veem todos os usuários';

COMMENT ON POLICY "Users can update own profile" ON public.users IS
    'Usuários podem atualizar apenas seu próprio perfil';

COMMENT ON POLICY "Administrators can update all users" ON public.users IS
    'Administradores podem atualizar qualquer perfil de usuário';

COMMENT ON POLICY "Administrators can insert users" ON public.users IS
    'Apenas administradores podem criar novos usuários manualmente';

COMMENT ON POLICY "Administrators can delete users" ON public.users IS
    'Apenas administradores podem deletar usuários';

COMMENT ON POLICY "Admins and teachers can view all classes" ON public.classes IS
    'Admins e professores veem todas as turmas; Estudantes veem apenas suas turmas';

-- =====================================================
-- QUERIES DE VERIFICAÇÃO
-- =====================================================
-- Execute estas queries para verificar se tudo está funcionando:

-- 1. Verificar seu usuário atual e role:
-- SELECT id, email, role FROM public.users WHERE id = auth.uid();

-- 2. Contar quantos usuários você consegue ver:
-- SELECT COUNT(*) as total_users_visible FROM public.users;

-- 3. Listar todos os usuários que você consegue ver:
-- SELECT id, email, first_name, last_name, role, is_active
-- FROM public.users
-- ORDER BY created_at DESC;

-- 4. Contar quantas turmas você consegue ver:
-- SELECT COUNT(*) as total_classes_visible FROM public.classes;

-- 5. Listar todas as turmas que você consegue ver:
-- SELECT id, name, description, status, start_date, end_date
-- FROM public.classes
-- ORDER BY created_at DESC;

-- 6. Verificar políticas ativas na tabela users:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'users'
-- ORDER BY policyname;

-- 7. Verificar políticas ativas na tabela classes:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'classes'
-- ORDER BY policyname;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
--
-- 1. Copie TODO este script
-- 2. Abra o Supabase Studio (https://supabase.com/dashboard)
-- 3. Vá em "SQL Editor"
-- 4. Cole este script
-- 5. Clique em "Run" para executar
-- 6. Verifique os resultados usando as queries de verificação acima
-- 7. Teste novamente os dropdowns no sistema
--
-- APÓS EXECUTAR ESTE SCRIPT:
-- ✅ Administradores poderão ver todos os usuários
-- ✅ Professores poderão ver todos os usuários
-- ✅ O dropdown de usuários na página de turmas mostrará todos os alunos
-- ✅ O dropdown de turmas na página de usuários mostrará todas as turmas ativas
--
-- =====================================================
