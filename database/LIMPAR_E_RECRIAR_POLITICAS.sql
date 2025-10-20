-- ========================================
-- FORÇAR LIMPEZA E RECRIAÇÃO DAS POLÍTICAS
-- ========================================
-- Este script FORÇA a remoção de TODAS as políticas antigas
-- e recria apenas as corretas

-- PASSO 1: Desabilitar RLS temporariamente para limpeza
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover TODAS as políticas (forçado)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- PASSO 3: Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar políticas corretas (SEM recursão infinita)
CREATE POLICY "Users can view based on role"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR
        (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('administrator', 'teacher')
    );

CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Administrators can update all users"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'administrator')
    WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'administrator');

-- PASSO 5: Garantir permissões
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- PASSO 6: Verificação
SELECT
    '✅ Políticas criadas com sucesso!' as status,
    COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public';

-- PASSO 7: Listar políticas criadas
SELECT
    policyname,
    cmd as operation,
    CASE
        WHEN cmd = 'SELECT' THEN '👁️ Visualização'
        WHEN cmd = 'UPDATE' THEN '✏️ Atualização'
        WHEN cmd = 'INSERT' THEN '➕ Inserção'
        WHEN cmd = 'DELETE' THEN '🗑️ Exclusão'
    END as tipo
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
